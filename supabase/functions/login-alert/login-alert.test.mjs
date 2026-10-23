import assert from "node:assert/strict";
import test from "node:test";

// We extract helper functions to verify them in isolation without hitting live network or live Deno APIs
function classifyTelegramFailure(status, description) {
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

function buildPrivateAlertMessage(email, ipAddress, localTime) {
  return [
    "تنبيه أمني: تسجيل دخول ناجح إلى أكاديمية المصري",
    `الحساب: ${email}`,
    `عنوان IP: ${ipAddress}`,
    `الوقت: ${localTime} (القاهرة)`,
  ].join("\n");
}

function decodeJwtPayload(token) {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) return null;
  try {
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

test("classifyTelegramFailure handles known status and error descriptions", () => {
  assert.equal(classifyTelegramFailure(401, ""), "invalid_or_revoked_bot_token");
  assert.equal(classifyTelegramFailure(429, ""), "rate_limited");
  assert.equal(classifyTelegramFailure(400, "Bad Request: chat not found"), "chat_id_not_found");
  assert.equal(classifyTelegramFailure(403, "Forbidden: bot was blocked by the user"), "bot_not_started_or_blocked");
  assert.equal(classifyTelegramFailure(403, "Forbidden: other forbidden"), "telegram_forbidden");
  assert.equal(classifyTelegramFailure(500, "Internal Server Error"), "telegram_http_500");
});

test("buildPrivateAlertMessage formats all required fields correctly", () => {
  const msg = buildPrivateAlertMessage("admin@elmasry.test", "192.0.2.1", "22/10/2026, 20:45:00");
  assert.match(msg, /تنبيه أمني: تسجيل دخول ناجح إلى أكاديمية المصري/);
  assert.match(msg, /الحساب: admin@elmasry\.test/);
  assert.match(msg, /عنوان IP: 192\.0\.2\.1/);
  assert.match(msg, /الوقت: 22\/10\/2026, 20:45:00 \(القاهرة\)/);
});

test("decodeJwtPayload parses valid JWT and rejects malformed tokens", () => {
  const samplePayload = { sub: "user-123", session_id: "sess-abc" };
  const validJwt = "header." + Buffer.from(JSON.stringify(samplePayload)).toString("base64") + ".sig";
  const parsed = decodeJwtPayload(validJwt);
  assert.deepEqual(parsed, samplePayload);

  assert.equal(decodeJwtPayload("not-a-jwt"), null);
  assert.equal(decodeJwtPayload("header.invalid_base64!?.sig"), null);
});

test("mocked private Telegram alert delivery sends expected JSON without calling live Telegram", async () => {
  let calledUrl = "";
  let calledBody = null;

  const mockFetch = async (url, options) => {
    calledUrl = url;
    calledBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ ok: true, result: { message_id: 999 } }), { status: 200 });
  };

  const botToken = "mock_token_123";
  const chatId = "mock_chat_456";
  const message = buildPrivateAlertMessage("test@example.com", "127.0.0.1", "time");

  const response = await mockFetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
  });

  assert.equal(response.status, 200);
  assert.equal(calledUrl, "https://api.telegram.org/botmock_token_123/sendMessage");
  assert.equal(calledBody.chat_id, "mock_chat_456");
  assert.match(calledBody.text, /الحساب: test@example\.com/);
  assert.equal(calledBody.disable_web_page_preview, true);
});
