export interface AuthRequestEpoch {
  begin(): number;
  isCurrent(requestId: number): boolean;
  invalidate(): void;
}

export function createAuthRequestEpoch(): AuthRequestEpoch;
