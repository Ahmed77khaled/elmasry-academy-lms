export function logPrivateTelegramNetworkFailure() {
  // Some runtimes include the full request URL, including the bot token, in fetch errors.
  console.error("Legacy private Telegram alert delivery failed due to network or timeout.");
}
