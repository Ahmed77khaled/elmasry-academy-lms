import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSafeGroupMessage,
  constantTimeEqual,
  failureCategory,
  retryDecision,
  sendTelegramNotification,
} from "./telegram-dispatch.mjs";

test("group message contains only the approved event fields", () => {
  const message = buildSafeGroupMessage({
    event_id: "12345678-1234-1234-1234-123456789abc",
    event_type: "finance.transfer_created",
    outcome: "success",
    occurred_at: "2026-10-22T12:00:00.000Z",
    email: "private@example.com",
    ip: "192.0.2.1",
    amount: 999999,
    studentName: "Private Student",
    botToken: "must-not-appear",
  });

  assert.match(message, /Event: Cash-box transfer recorded/);
  assert.match(message, /Reference: 12345678/);
  for (const sensitive of ["private@example.com", "192.0.2.1", "999999", "Private Student", "must-not-appear"]) {
    assert.equal(message.includes(sensitive), false);
  }
});

test("message builder rejects an invalid event reference and timestamp", () => {
  assert.throws(() => buildSafeGroupMessage({ event_id: "bad", occurred_at: new Date().toISOString() }), TypeError);
  assert.throws(() => buildSafeGroupMessage({ event_id: "12345678-1234-1234-1234-123456789abc", occurred_at: "bad" }), TypeError);
});

test("retry decisions cap attempts and delay", () => {
  assert.deepEqual(retryDecision(8, { maxAttempts: 8, now: 0 }), { status: "dead_letter", nextAttemptAt: new Date(0).toISOString() });
  assert.equal(retryDecision(1, { now: 0 }).nextAttemptAt, new Date(60_000).toISOString());
  assert.equal(retryDecision(7, { maxAttempts: 8, now: 0 }).nextAttemptAt, new Date(3_600_000).toISOString());
  assert.equal(retryDecision(2, { retryAfterSeconds: 30, now: 0 }).nextAttemptAt, new Date(30_000).toISOString());
  assert.equal(retryDecision(2, { retryAfterSeconds: 90_000, now: 0 }).nextAttemptAt, new Date(3_600_000).toISOString());
});

test("failure categories never include provider response details", () => {
  assert.equal(failureCategory(429), "rate_limited");
  assert.equal(failureCategory(401), "configuration");
  assert.equal(failureCategory(null), "network");
});

test("dispatcher secret comparison validates exact value", () => {
  assert.equal(constantTimeEqual("a-secure-dispatch-secret", "a-secure-dispatch-secret"), true);
  assert.equal(constantTimeEqual("a-secure-dispatch-secret", "different-secret"), false);
});

test("Telegram sender uses injected fetch and never leaks provider body", async () => {
  let requestUrl = "";
  let requestBody = "";
  const result = await sendTelegramNotification({
    token: "dummy-test-token",
    chatId: "-1001234567890",
    text: "safe test message",
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestBody = options.body;
      return new Response(JSON.stringify({ ok: false, description: "dummy provider detail" }), { status: 403 });
    },
  });

  assert.match(requestUrl, /api\.telegram\.org/);
  assert.match(requestBody, /safe test message/);
  assert.deepEqual(result, { ok: false, category: "invalid_destination", retryAfterSeconds: undefined });
});

test("network failure is converted to a safe retry category", async () => {
  const result = await sendTelegramNotification({
    token: "dummy-test-token",
    chatId: "-1001234567890",
    text: "safe test message",
    fetchImpl: async () => { throw new Error("dummy network failure"); },
  });
  assert.deepEqual(result, { ok: false, category: "network" });
});
