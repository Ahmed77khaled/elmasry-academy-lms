import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { getBearerToken, getSupabaseKey, handleOptions, jsonResponse } from "../_shared/http.ts";
import { buildAdminInviteEmailData } from "../_shared/admin-invite-email.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const publishableKey = getSupabaseKey("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEYS");
const secretKey = getSupabaseKey("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEYS");

Deno.serve(async (request: Request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
  if (!supabaseUrl || !publishableKey || !secretKey) {
    return jsonResponse({ error: "Server authentication is not configured." }, 500);
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) return jsonResponse({ error: "Sign in is required." }, 401);

  const callerClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: userResult, error: userError } = await callerClient.auth.getUser(accessToken);
  if (userError || !userResult.user) return jsonResponse({ error: "The session is invalid or expired." }, 401);

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data: authorizationData, error: authorizationError } =
    await callerClient.rpc("get_my_authorization");
  const authorization = Array.isArray(authorizationData)
    ? authorizationData[0]
    : authorizationData;
  const permissions = Array.isArray(authorization?.permissions)
    ? authorization.permissions
    : [];
  if (authorizationError) {
    console.error("Unable to verify administrator inviter permissions.");
    return jsonResponse({ error: "Could not verify administrator permissions." }, 503);
  }
  if (authorization?.is_owner !== true || !permissions.includes("admins.invite")) {
    return jsonResponse({ error: "Only the platform owner can invite administrators." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "A valid JSON request is required." }, 400);
  }

  const emailValue = (body as { email?: unknown } | null)?.email;
  const roleKeyValue = (body as { roleKey?: unknown } | null)?.roleKey;
  if (typeof emailValue !== "string") return jsonResponse({ error: "Enter a valid work email." }, 400);
  if (typeof roleKeyValue !== "string" || !/^[a-z][a-z0-9_]{1,49}$/.test(roleKeyValue)) {
    return jsonResponse({ error: "Choose a valid administrator role." }, 400);
  }
  const email = emailValue.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Enter a valid work email." }, 400);
  }

  const { data: role, error: roleLookupError } = await adminClient
    .from("admin_roles")
    .select("role_key, display_name, is_assignable")
    .eq("role_key", roleKeyValue)
    .maybeSingle();
  if (roleLookupError) {
    console.error("Unable to validate the requested administrator role.");
    return jsonResponse({ error: "Administrator roles are not available yet." }, 503);
  }
  if (!role || role.is_assignable !== true) {
    return jsonResponse({ error: "That administrator role cannot be assigned." }, 400);
  }

  const { data: assignedPermissions, error: assignedPermissionsError } = await adminClient
    .from("admin_role_permissions")
    .select("permission_key")
    .eq("role_key", roleKeyValue)
    .order("permission_key");
  if (assignedPermissionsError) {
    console.error("Unable to read permissions for the requested administrator role.");
    return jsonResponse({ error: "Could not prepare the role details for this invitation." }, 503);
  }

  const permissionKeys = (assignedPermissions ?? []).map((item) => item.permission_key);
  const { data: permissionCatalog, error: permissionCatalogError } = permissionKeys.length
    ? await adminClient
      .from("permission_catalog")
      .select("permission_key, description")
      .in("permission_key", permissionKeys)
    : { data: [], error: null };
  if (permissionCatalogError || !permissionCatalog) {
    console.error("Unable to load descriptions for the requested administrator role permissions.");
    return jsonResponse({ error: "Could not prepare the role details for this invitation." }, 503);
  }
  const inviteEmailData = buildAdminInviteEmailData(
    roleKeyValue,
    role.display_name,
    [...permissionCatalog].sort((left, right) => left.permission_key.localeCompare(right.permission_key)),
    typeof userResult.user.user_metadata?.full_name === "string"
      ? userResult.user.user_metadata.full_name
      : "",
  );

  // Do not let a rollback delete an Auth account that existed before this invite.
  let existingAuthUser = false;
  for (let page = 1; page <= 100; page += 1) {
    const { data: usersPage, error: usersError } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (usersError) {
      console.error("Unable to check whether the invite email already has an Auth account.");
      return jsonResponse({ error: "Could not validate the invite recipient." }, 503);
    }
    const users = usersPage.users ?? [];
    if (users.some((user) => user.email?.toLowerCase() === email)) {
      existingAuthUser = true;
      break;
    }
    if (users.length < 1000) break;
  }
  if (existingAuthUser) {
    return jsonResponse({ error: "An Auth account already uses this email. Ask the platform owner to manage its administrator access." }, 409);
  }

  let invitedUserId: string | undefined;
  let inviteActionLink: string | undefined;

  // 1. Try sending the invitation email via GoTrue
  const { data: inviteResult, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: inviteEmailData,
  });

  if (!inviteError && inviteResult.user?.id) {
    invitedUserId = inviteResult.user.id;
  } else {
    // 2. If SMTP delivery failed (e.g. Resend unverified domain 550 or SMTP down),
    // generate the invitation link directly without depending on external SMTP delivery.
    console.warn("inviteUserByEmail failed, falling back to generateLink:", inviteError?.message);
    const origin = request.headers.get("origin") || "https://preview.elmasry-academy-lms.pages.dev";
    const { data: linkResult, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email: email,
      options: {
        data: inviteEmailData,
        redirectTo: `${origin}/`,
      },
    });

    if (linkError || !linkResult.user?.id) {
      console.error("generateLink fallback also failed:", linkError?.message);
      return jsonResponse({ error: inviteError?.message ?? linkError?.message ?? "The invitation could not be sent." }, 400);
    }

    invitedUserId = linkResult.user.id;
    inviteActionLink = linkResult.properties?.action_link;
  }

  const { error: insertError } = await adminClient.from("admins").insert({
    auth_user_id: invitedUserId,
    role: roleKeyValue,
    is_active: true,
    is_owner: false,
  });

  if (insertError) {
    // Avoid leaving an Auth account without its matching application administrator record.
    const { data: matchingAdmin } = await adminClient
      .from("admins")
      .select("admin_id")
      .eq("auth_user_id", invitedUserId)
      .maybeSingle();
    if (!matchingAdmin && insertError.code !== "23505") {
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(invitedUserId);
      if (rollbackError) console.error("Admin invitation rollback failed.");
    }
    console.error("Unable to add the invited user to the admins table.");
    return jsonResponse({ error: "The invitation could not be completed. Check the email and try again." }, 500);
  }

  const { error: auditError } = await adminClient.from("admin_audit_log").insert({
    actor_auth_user_id: userResult.user.id,
    target_auth_user_id: invitedUserId,
    action: "admin_invited",
    after_state: { role: roleKeyValue },
  });
  if (auditError) {
    console.error("Unable to append the administrator invitation audit event.");
    const { error: deleteAdminError } = await adminClient
      .from("admins")
      .delete()
      .eq("auth_user_id", invitedUserId);
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(invitedUserId);
    if (deleteAdminError || deleteAuthError) {
      console.error("Administrator invitation compensation failed.");
      return jsonResponse({ error: "The invite was sent, but its final setup failed. Contact the platform owner." }, 500);
    }
    return jsonResponse({ error: "The invitation could not be completed. Try again." }, 500);
  }

  return jsonResponse({
    ok: true,
    message: inviteActionLink
      ? "تم إنشاء حساب المدير بنجاح وتجهيز رابط الدعوة المباشر."
      : "تم إرسال الدعوة إلى البريد الإلكتروني. سيُعيّن المدير كلمة مروره من الرابط المرسل إليه.",
    inviteLink: inviteActionLink ?? null,
  });
});
