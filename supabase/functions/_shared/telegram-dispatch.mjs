const EVENT_LABELS = Object.freeze({
  en: Object.freeze({
    "auth.login_succeeded": "Successful administrator sign-in",
    "auth.failed_sign_in_threshold": "Repeated sign-in failures",
    "admin.invited": "Administrator invited",
    "admin.enabled": "Administrator access enabled",
    "admin.disabled": "Administrator access disabled",
    "admin.role_changed": "Administrator role changed",
    "admin.role_catalog_changed": "Administrator role definitions changed",
    "admin.owner_changed": "Platform owner changed",
    "admin.permissions_changed": "Administrator permissions changed",
    "branding.logo_changed": "Academy logo changed",
    "security.authorization_denied": "Privileged action denied",
    "finance.payment_voided": "Payment voided",
    "finance.expense_voided": "Expense voided",
    "finance.transfer_created": "Cash-box transfer recorded",
    "finance.cash_box_archived": "Cash box archived",
  }),
  ar: Object.freeze({
    "auth.login_succeeded": "تسجيل دخول مسؤول بنجاح",
    "auth.failed_sign_in_threshold": "تكرار محاولات الدخول الفاشلة",
    "admin.invited": "إرسال دعوة إلى مسؤول",
    "admin.enabled": "تفعيل حساب مسؤول",
    "admin.disabled": "تعطيل حساب مسؤول",
    "admin.role_changed": "تغيير دور مسؤول",
    "admin.role_catalog_changed": "تعديل تعريفات الأدوار",
    "admin.owner_changed": "تغيير مالك المنصة",
    "admin.permissions_changed": "تغيير صلاحيات مسؤول",
    "branding.logo_changed": "تغيير شعار الأكاديمية",
    "security.authorization_denied": "رفض إجراء يتطلب صلاحية",
    "finance.payment_voided": "إلغاء سند قبض",
    "finance.expense_voided": "إلغاء سند صرف",
    "finance.transfer_created": "تسجيل تحويل بين الخزائن",
    "finance.cash_box_archived": "أرشفة خزنة",
  }),
});

export function constantTimeEqual(left, right) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

export function buildSafeGroupMessage(event, language = "en") {
  if (!event || typeof event.event_id !== "string" || !/^[0-9a-f-]{36}$/i.test(event.event_id)) {
    throw new TypeError("A valid event reference is required.");
  }
  if (!Number.isFinite(Date.parse(event.occurred_at))) {
    throw new TypeError("A valid event timestamp is required.");
  }

  const selectedLanguage = language === "ar" ? "ar" : "en";
  const isArabic = selectedLanguage === "ar";
  let result;
  if (isArabic) {
    result = event.outcome === "success" ? "نجاح" : event.outcome === "denied" ? "مرفوض" : "فشل";
  } else {
    result = event.outcome === "success" ? "Success" : event.outcome === "denied" ? "Denied" : "Failure";
  }
  const occurredAt = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-GB", {
    timeZone: "Africa/Cairo",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(event.occurred_at));

  return [
    isArabic ? "تنبيه أمني — أكاديمية المصري" : "Elmasry Academy security notice",
    `${isArabic ? "الحدث" : "Event"}: ${EVENT_LABELS[selectedLanguage][event.event_type] ?? (isArabic ? "حدث أمني على المنصة" : "Platform security event")}`,
    `${isArabic ? "النتيجة" : "Result"}: ${result}`,
    `${isArabic ? "الوقت" : "Time"}: ${occurredAt} (${isArabic ? "القاهرة" : "Cairo"})`,
    `${isArabic ? "المرجع" : "Reference"}: ${event.event_id.slice(0, 8)}`,
  ].join("\n");
}

export function failureCategory(status) {
  if (status === 429) return "rate_limited";
  if (status === 400 || status === 403) return "invalid_destination";
  if (status === 401) return "configuration";
  if (status === null) return "network";
  return "telegram_api";
}

export function retryDecision(attemptCount, { retryAfterSeconds, maxAttempts = 8, now = Date.now() } = {}) {
  if (!Number.isInteger(attemptCount) || attemptCount < 1) {
    throw new RangeError("attemptCount must be a positive integer.");
  }
  if (attemptCount >= maxAttempts) return { status: "dead_letter", nextAttemptAt: new Date(now).toISOString() };

  const delaySeconds = Number.isInteger(retryAfterSeconds)
    ? Math.min(Math.max(retryAfterSeconds, 1), 3600)
    : Math.min(60 * (2 ** Math.max(attemptCount - 1, 0)), 3600);
  return { status: "retry", nextAttemptAt: new Date(now + delaySeconds * 1000).toISOString() };
}

export async function sendTelegramNotification({ token, chatId, text, fetchImpl = fetch, timeoutMs = 8_000 }) {
  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "error",
    });

    let body = {};
    try {
      body = await response.json();
    } catch {
      // Response bodies are never logged or persisted.
    }
    if (response.ok && body.ok === true) return { ok: true };

    return {
      ok: false,
      category: failureCategory(response.status),
      retryAfterSeconds: Number.isInteger(body.parameters?.retry_after)
        ? Math.min(Math.max(body.parameters.retry_after, 1), 3600)
        : undefined,
    };
  } catch {
    return { ok: false, category: "network" };
  }
}
