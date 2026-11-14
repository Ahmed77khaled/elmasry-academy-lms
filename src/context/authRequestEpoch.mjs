/**
 * Identifies the latest asynchronous auth/authorization request.
 * A result may update state only while its request id remains current.
 */
export function createAuthRequestEpoch() {
  let current = 0;

  return {
    begin() {
      current += 1;
      return current;
    },
    isCurrent(requestId) {
      return requestId === current;
    },
    invalidate() {
      current += 1;
    },
  };
}
