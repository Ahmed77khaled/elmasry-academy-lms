import { withSupabase } from "npm:@supabase/server@1.9.2";
import {
  buildSafeGroupMessage,
  constantTimeEqual,
  retryDecision,
  sendTelegramNotification,
} from "../_shared/telegram-dispatch.mjs";

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const groupChatId = Deno.env.get("TELEGRAM_ADMIN_GROUP_CHAT_ID");
const dispatchSecret = Deno.env.get("TELEGRAM_DISPATCH_SECRET");
const MAX_ATTEMPTS = 8;

type DispatchClaim = {
  notification_id: string;
  event_id: string;
  event_type: string;
  outcome: "success" | "denied" | "failure";
  occurred_at: string;
  attempt_count: number;
  lease_until: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export default {
  fetch: withSupabase({ auth: "secret" }, async (request, context) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
  if (!dispatchSecret || new TextEncoder().encode(dispatchSecret).length < 32) {
    return jsonResponse({ error: "Dispatcher is not configured." }, 503);
  }

  const suppliedSecret = request.headers.get("x-telegram-dispatch-secret") ?? "";
  if (!constantTimeEqual(suppliedSecret, dispatchSecret)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  if (!botToken || !groupChatId) {
    return jsonResponse({ error: "Telegram group delivery is not configured." }, 503);
  }

  const supabase = context.supabaseAdmin;
  const { data, error } = await supabase.rpc("claim_telegram_notifications", {
    p_limit: 10,
    p_lease_seconds: 120,
  });
  if (error) {
    console.error("Telegram dispatcher could not claim its batch.");
    return jsonResponse({ error: "Unable to claim notification batch." }, 500);
  }

  const claims = (data ?? []) as DispatchClaim[];
  let groupLanguage: "ar" | "en" = "ar";
  if (claims.length > 0) {
    const { data: settings, error: settingsError } = await supabase
      .from("platform_notification_settings")
      .select("group_language")
      .eq("singleton_id", 1)
      .maybeSingle();
    if (settingsError) {
      console.error("Telegram notification language could not be loaded; using Arabic default.");
    } else if (settings?.group_language === "en") {
      groupLanguage = "en";
    }
  }

  let sent = 0;
  let retrying = 0;
  let deadLettered = 0;
  let staleClaims = 0;

  for (const claim of claims) {
    const message = buildSafeGroupMessage(claim, groupLanguage);
    const delivery = await sendTelegramNotification({ token: botToken, chatId: groupChatId, text: message });
    const retry = delivery.ok
      ? null
      : retryDecision(claim.attempt_count, { retryAfterSeconds: delivery.retryAfterSeconds, maxAttempts: MAX_ATTEMPTS });
    const leaseFilter = supabase
      .from("telegram_notification_outbox")
      .update(delivery.ok
        ? { status: "sent", sent_at: new Date().toISOString(), lease_until: null, last_failure_category: null }
        : {
          status: retry!.status,
          next_attempt_at: retry!.nextAttemptAt,
          lease_until: null,
          last_failure_category: delivery.category ?? "unknown",
        })
      .eq("notification_id", claim.notification_id)
      .eq("status", "processing")
      .eq("lease_until", claim.lease_until)
      .select("notification_id")
      .maybeSingle();

    const { data: updated, error: updateError } = await leaseFilter;
    if (updateError || !updated) {
      staleClaims += 1;
      console.error("Telegram outbox completion was not recorded for a claimed item.");
      continue;
    }

    if (delivery.ok) sent += 1;
    else if (claim.attempt_count >= MAX_ATTEMPTS) deadLettered += 1;
    else retrying += 1;
  }

  return jsonResponse({ processed: claims.length, sent, retrying, deadLettered, staleClaims });
  }),
};
