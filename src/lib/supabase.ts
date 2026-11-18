import { createClient } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before starting the application.',
  );
}

export type AuthFlowMode =
  | 'idle'
  | 'processing'
  | 'verified_recovery'
  | 'verified_invitation'
  | 'callback_error';

export interface AuthFlowState {
  mode: AuthFlowMode;
  flowType: 'recovery' | 'invite' | null;
  userId: string | null;
  sessionId: string | null;
  email: string | null;
  error: string | null;
}

export interface AuthBridgeSnapshot {
  event: AuthChangeEvent | 'INITIAL' | null;
  session: Session | null;
  user: User | null;
  flowState: AuthFlowState;
}

interface InitialCallbackContext {
  type: 'invite' | 'recovery' | null;
  accessToken: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  hasCallback: boolean;
}

function captureInitialCallbackContext(): InitialCallbackContext {
  if (typeof window === 'undefined') {
    return {
      type: null,
      accessToken: null,
      error: null,
      errorCode: null,
      errorDescription: null,
      hasCallback: false,
    };
  }

  const hash = window.location.hash.replace(/^#/, '');
  const search = window.location.search;
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(search);

  const rawType = hashParams.get('type') || queryParams.get('type');
  const type = rawType === 'invite' || rawType === 'recovery' ? rawType : null;
  const accessToken = hashParams.get('access_token');
  const error = hashParams.get('error') || queryParams.get('error');
  const errorCode = hashParams.get('error_code') || queryParams.get('error_code');
  const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

  const hasCallback = Boolean(type || accessToken || error || errorCode);

  return {
    type,
    accessToken,
    error,
    errorCode,
    errorDescription,
    hasCallback,
  };
}

// 1. Capture initial callback context in memory before SDK initialization (never in storage).
const initialCallback = captureInitialCallbackContext();

// 2. Create Supabase client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// 3. Early Auth Event Bridge state.
let currentSnapshot: AuthBridgeSnapshot = {
  event: 'INITIAL',
  session: null,
  user: null,
  flowState: initialCallback.error || initialCallback.errorCode
    ? {
        mode: 'callback_error',
        flowType: initialCallback.type,
        userId: null,
        sessionId: null,
        email: null,
        error: initialCallback.errorDescription || initialCallback.error || 'The authentication link is invalid or has expired.',
      }
    : initialCallback.hasCallback && initialCallback.type
    ? {
        mode: 'processing',
        flowType: initialCallback.type,
        userId: null,
        sessionId: null,
        email: null,
        error: null,
      }
    : {
        mode: 'idle',
        flowType: null,
        userId: null,
        sessionId: null,
        email: null,
        error: null,
      },
};

const bridgeSubscribers = new Set<(snapshot: AuthBridgeSnapshot) => void>();

function notifySubscribers() {
  bridgeSubscribers.forEach((fn) => {
    try {
      fn(currentSnapshot);
    } catch {
      // Prevent subscriber errors from bubbling
    }
  });
}

// 4. Register one module-level onAuthStateChange listener immediately after client creation.
// Keep SDK event callback synchronous. No RPC, getClaims, getUser or token logging inside callback.
supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user ?? null;

  switch (event) {
    case 'PASSWORD_RECOVERY': {
      if (session?.user) {
        currentSnapshot = {
          event,
          session,
          user,
          flowState: {
            mode: 'verified_recovery',
            flowType: 'recovery',
            userId: session.user.id,
            sessionId: null,
            email: session.user.email ?? null,
            error: null,
          },
        };
      } else {
        currentSnapshot = {
          event,
          session: null,
          user: null,
          flowState: {
            mode: 'callback_error',
            flowType: 'recovery',
            userId: null,
            sessionId: null,
            email: null,
            error: 'Password recovery session could not be established.',
          },
        };
      }
      break;
    }

    case 'SIGNED_IN': {
      // Invitation verification requirements:
      // - Initial callback candidate with type=invite
      // - Valid callback access-token payload
      // - SDK-processed session whose access token exactly matches the captured callback access token
      if (
        initialCallback.type === 'invite' &&
        initialCallback.accessToken &&
        session?.access_token &&
        session.access_token === initialCallback.accessToken &&
        session.user
      ) {
        initialCallback.accessToken = null; // Single-use consumption
        currentSnapshot = {
          event,
          session,
          user,
          flowState: {
            mode: 'verified_invitation',
            flowType: 'invite',
            userId: session.user.id,
            sessionId: null,
            email: session.user.email ?? null,
            error: null,
          },
        };
      } else {
        // A generic SIGNED_IN event must never independently activate invitation mode.
        if (initialCallback.type === 'invite' && currentSnapshot.flowState.mode === 'processing') {
          currentSnapshot = {
            event,
            session,
            user,
            flowState: {
              mode: 'callback_error',
              flowType: 'invite',
              userId: null,
              sessionId: null,
              email: null,
              error: 'Invitation token verification failed or token did not match.',
            },
          };
        } else {
          currentSnapshot = {
            event,
            session,
            user,
            flowState: {
              mode: 'idle',
              flowType: null,
              userId: null,
              sessionId: null,
              email: null,
              error: null,
            },
          };
        }
      }
      break;
    }

    case 'INITIAL_SESSION': {
      // INITIAL_SESSION must never independently activate recovery or invitation mode.
      if (initialCallback.hasCallback && !session && currentSnapshot.flowState.mode === 'processing') {
        currentSnapshot = {
          event,
          session: null,
          user: null,
          flowState: {
            mode: 'callback_error',
            flowType: initialCallback.type,
            userId: null,
            sessionId: null,
            email: null,
            error: 'Authentication link missing valid session token or session expired.',
          },
        };
      } else {
        currentSnapshot = {
          event,
          session,
          user,
          flowState:
            currentSnapshot.flowState.mode === 'verified_recovery' ||
            currentSnapshot.flowState.mode === 'verified_invitation'
              ? currentSnapshot.flowState
              : {
                  mode: 'idle',
                  flowType: null,
                  userId: null,
                  sessionId: null,
                  email: null,
                  error: null,
                },
        };
      }
      break;
    }

    case 'SIGNED_OUT': {
      currentSnapshot = {
        event,
        session: null,
        user: null,
        flowState: {
          mode: 'idle',
          flowType: null,
          userId: null,
          sessionId: null,
          email: null,
          error: null,
        },
      };
      break;
    }

    case 'TOKEN_REFRESHED': {
      // TOKEN_REFRESHED must preserve a verified flow only while the authenticated session identity remains the same.
      // A changed user or session must invalidate the old flow.
      const isSameUser =
        Boolean(currentSnapshot.flowState.userId && session?.user?.id === currentSnapshot.flowState.userId);
      currentSnapshot = {
        event,
        session,
        user,
        flowState: isSameUser
          ? currentSnapshot.flowState
          : {
              mode: 'idle',
              flowType: null,
              userId: null,
              sessionId: null,
              email: null,
              error: null,
            },
      };
      break;
    }

    case 'USER_UPDATED': {
      currentSnapshot = {
        event,
        session,
        user,
        flowState: currentSnapshot.flowState,
      };
      break;
    }

    default: {
      currentSnapshot = {
        event,
        session,
        user,
        flowState: currentSnapshot.flowState,
      };
      break;
    }
  }

  notifySubscribers();
});

export function subscribeAuthBridge(subscriber: (snapshot: AuthBridgeSnapshot) => void): () => void {
  bridgeSubscribers.add(subscriber);
  subscriber(currentSnapshot);
  return () => {
    bridgeSubscribers.delete(subscriber);
  };
}

export function getAuthBridgeSnapshot(): AuthBridgeSnapshot {
  return currentSnapshot;
}

// 5. Continuation Marker Helpers (sessionStorage used only as non-authoritative continuation marker).
const CONTINUATION_MARKER_KEY = 'elmasry_lms:auth_flow_continuation';
const MAX_CONTINUATION_AGE_MS = 15 * 60 * 1000; // 15 minutes max age

export interface FlowContinuationMarker {
  mode: 'recovery' | 'invite';
  userId: string;
  sessionId: string;
  timestamp: number;
}

export function saveContinuationMarker(marker: {
  mode: 'recovery' | 'invite';
  userId: string;
  sessionId: string;
}): void {
  try {
    const payload: FlowContinuationMarker = {
      ...marker,
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(CONTINUATION_MARKER_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable
  }
}

export function getContinuationMarker(): FlowContinuationMarker | null {
  try {
    const raw = window.sessionStorage.getItem(CONTINUATION_MARKER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FlowContinuationMarker>;
    if (
      (parsed.mode === 'recovery' || parsed.mode === 'invite') &&
      typeof parsed.userId === 'string' &&
      typeof parsed.sessionId === 'string' &&
      typeof parsed.timestamp === 'number'
    ) {
      if (Date.now() - parsed.timestamp > MAX_CONTINUATION_AGE_MS) {
        clearContinuationMarker();
        return null;
      }
      return parsed as FlowContinuationMarker;
    }
    clearContinuationMarker();
    return null;
  } catch {
    clearContinuationMarker();
    return null;
  }
}

export function clearContinuationMarker(): void {
  try {
    window.sessionStorage.removeItem(CONTINUATION_MARKER_KEY);
  } catch {
    // Storage unavailable
  }
}

// 6. URL Hygiene: Remove authentication parameters while preserving unrelated query params and pathname.
export function cleanAuthUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    let modified = false;

    const authQueryParams = ['type', 'token_hash', 'error', 'error_code', 'error_description'];
    for (const param of authQueryParams) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        modified = true;
      }
    }

    if (url.hash) {
      const rawHash = url.hash.replace(/^#/, '');
      if (
        rawHash.includes('=') &&
        (rawHash.includes('access_token') || rawHash.includes('type=') || rawHash.includes('error='))
      ) {
        const hashParams = new URLSearchParams(rawHash);
        const authHashParams = [
          'access_token',
          'refresh_token',
          'expires_in',
          'token_type',
          'type',
          'error',
          'error_code',
          'error_description',
        ];
        for (const param of authHashParams) {
          if (hashParams.has(param)) {
            hashParams.delete(param);
            modified = true;
          }
        }
        const remaining = hashParams.toString();
        url.hash = remaining ? `#${remaining}` : '';
        modified = true;
      }
    }

    if (modified) {
      const newRelativePath =
        url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
      window.history.replaceState(window.history.state, '', newRelativePath);
    }
  } catch {
    // Fail-safe
  }
}

/** @deprecated Replaced by getContinuationMarker() */
export function getPendingPasswordSetup(): 'invite' | 'recovery' | null {
  const marker = getContinuationMarker();
  return marker ? marker.mode : null;
}

/** @deprecated Replaced by clearContinuationMarker() */
export function clearPendingPasswordSetup(): void {
  clearContinuationMarker();
}
