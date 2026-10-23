import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { getBearerToken, getSupabaseKey, handleOptions, jsonResponse } from "../_shared/http.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const publishableKey = getSupabaseKey("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEYS");
const secretKey = getSupabaseKey("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEYS");

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) return null;
  try {
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
  } catch {
    return null;
  }
}

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function classifyTelegramFailure(status: number, description: string): string {
  const normalizedDescription = description.toLowerCase();
  if (status === 401) return "invalid_or_revoked_bot_token";
  if (status === 429) return "rate_limited";
  if (normalizedDescription.includes("chat not found")) return "chat_id_not_found";
  if (
    normalizedDescription.includes("bot was blocked") ||
    normalizedDescription.includes("bot can't initiate") ||
    normalizedDescription.includes("bot cannot initiate")
  ) return "bot_not_started_or_blocked";
  if (status === 403) return "telegram_forbidden";
  return `telegram_http_${status}`;
}

export function buildPrivateAlertMessage(email: string, ipAddress: string, localTime: string): string {
  return [
    "تنبيه أمني: تسجيل دخول ناجح إلى أكاديمية المصري",
    `الحساب: ${email}`,
    `عنوان IP: ${ipAddress}`,
    `الوقت: ${localTime} (القاهرة)`,
  ].join("\n");
}

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
  const [{ data: userResult, error: userError }, { data: isAdmin, error: adminCheckError }] = await Promise.all([
    callerClient.auth.getUser(accessToken),
    callerClient.rpc("is_admin"),
  ]);
  if (userError || !userResult.user) return jsonResponse({ error: "The session is invalid or expired." }, 401);
  if (adminCheckError || isAdmin !== true) return jsonResponse({ error: "Administrator access is required." }, 403);

  const claims = decodeJwtPayload(accessToken);
  const sessionId = claims?.session_id;
  if (claims?.sub !== userResult.user.id || typeof sessionId !== "string" || sessionId.length > 100) {
    return jsonResponse({ error: "The authenticated session could not be verified." }, 401);
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const sessionHash = await sha256(sessionId);
  const retentionCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { error: cleanupError } = await adminClient
    .from("login_alert_dedupe")
    .delete()
    .lt("created_at", retentionCutoff);
  if (cleanupError) {
    console.error("Unable to clean old login-alert dedupe records.");
    return jsonResponse({ error: "Login alert could not be processed." }, 500);
  }

  // 1. Transactionally record audit event and enqueue to group notification outbox
  const { data: eventId, error: enqueueError } = await adminClient.rpc(
    "enqueue_admin_login_notification",
    { p_admin_user_id: userResult.user.id, p_session_hash: sessionHash },
  );
  if (enqueueError) {
    console.error("Unable to enqueue the administrator login event.");
    return jsonResponse({ error: "Login alert could not be processed." }, 500);
  }

  // If already claimed (duplicate session), return early without sending duplicate alerts
  if (!eventId) {
    return jsonResponse({ ok: true, queued: false, duplicate: true });
  }

  // 2. Preserve legacy private Telegram notification if configured
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (botToken && chatId) {
    const ipAddress = request.headers.get("cf-connecting-ip")?.trim() || "غير متاح";
    const email = userResult.user.email ?? "بريد غير متاح";
    const localTime = new Intl.DateTimeFormat("ar-EG", {
      timeZone: "Africa/Cairo",
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date());
    const message = buildPrivateAlertMessage(email, ipAddress, localTime);

    try {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(8000),
        redirect: "error",
      });

      if (!telegramResponse.ok) {
        let description = "";
        try {
          const errorBody = await telegramResponse.json() as { description?: unknown };
          if (typeof errorBody.description === "string") description = errorBody.description;
        } catch {
          // ignore parsing error
        }
        console.error("Legacy private telegram alert delivery failed.", {
          status: telegramResponse.status,
          reason: classifyTelegramFailure(telegramResponse.status, description),
        });
      }
    } catch (err) {
      console.error("Legacy private telegram alert delivery failed due to network or timeout.", err);
    }
  }

  return jsonResponse({ ok: true, queued: true, duplicate: false });
});
