import React, { createContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  subscribeAuthBridge,
  getAuthBridgeSnapshot,
  getContinuationMarker,
  saveContinuationMarker,
  clearContinuationMarker,
  cleanAuthUrl,
} from '@/lib/supabase';
import type { AuthFlowState } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  roleKey: string | null;
  isOwner: boolean;
  permissions: string[];
  authorizationReady: boolean;
  authFlow: AuthFlowState;
  clearAuthFlow: () => void;
  refreshAuthorization: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [roleKey, setRoleKey] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [authorizationReady, setAuthorizationReady] = useState(false);
  const [authFlow, setAuthFlow] = useState<AuthFlowState>(() => getAuthBridgeSnapshot().flowState);

  const clearAuthFlow = () => {
    clearContinuationMarker();
    cleanAuthUrl();
    setAuthFlow({
      mode: 'idle',
      flowType: null,
      userId: null,
      sessionId: null,
      email: null,
      error: null,
    });
  };

  useEffect(() => {
    let mounted = true;

    async function verifyAdmin(userId?: string): Promise<boolean> {
      if (!userId) return false;
      try {
        const { data, error } = await supabase.rpc('is_admin');
        return !error && data === true;
      } catch {
        return false;
      }
    }

    async function loadAuthorization() {
      try {
        const { data, error } = await supabase.rpc('get_my_authorization');
        if (error) {
          if (!mounted) return;
          setAuthorizationReady(false);
          setRoleKey(null);
          setIsOwner(false);
          setPermissions([]);
          return;
        }
        const authorization = Array.isArray(data) ? data[0] : data;
        if (!mounted) return;
        setAuthorizationReady(true);
        setRoleKey(typeof authorization?.role_key === 'string' ? authorization.role_key : null);
        setIsOwner(authorization?.is_owner === true);
        setPermissions(Array.isArray(authorization?.permissions) ? authorization.permissions : []);
      } catch {
        if (!mounted) return;
        setAuthorizationReady(false);
        setRoleKey(null);
        setIsOwner(false);
        setPermissions([]);
      }
    }

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        // Safe Reload Continuation: verify continuation marker against verified session claims
        const marker = getContinuationMarker();
        if (marker && session?.user) {
          const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
          if (!claimsError && claimsData?.claims) {
            const claims = claimsData.claims;
            const sub = claims.sub;
            const sessionId = String(claims.session_id || session.access_token || '');
            if (sub === marker.userId && sessionId === marker.sessionId) {
              setAuthFlow({
                mode: marker.mode === 'invite' ? 'verified_invitation' : 'verified_recovery',
                flowType: marker.mode,
                userId: sub,
                sessionId,
                email: session.user.email ?? null,
                error: null,
              });
            } else {
              clearContinuationMarker();
            }
          } else {
            clearContinuationMarker();
          }
        }

        if (session?.user) {
          const adminStatus = await verifyAdmin(session.user.id);
          if (mounted) {
            setIsAdmin(adminStatus);
            await loadAuthorization();
          }
        } else {
          setIsAdmin(false);
          setRoleKey(null);
          setIsOwner(false);
          setPermissions([]);
          setAuthorizationReady(true);
        }
      } catch {
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void initAuth();

    // Subscribe to Early Auth Event Bridge instead of registering a second late subscription
    const unsubscribe = subscribeAuthBridge((snapshot) => {
      if (!mounted) return;
      setSession(snapshot.session);
      setUser(snapshot.user);

      if (
        snapshot.flowState.mode === 'verified_recovery' ||
        snapshot.flowState.mode === 'verified_invitation'
      ) {
        // Asynchronously verify claims and bind verified flow
        void (async () => {
          try {
            const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
            if (claimsError || !claimsData?.claims) {
              if (!mounted) return;
              setAuthFlow({
                mode: 'callback_error',
                flowType: snapshot.flowState.flowType,
                userId: null,
                sessionId: null,
                email: null,
                error: claimsError?.message ?? 'Security verification of session claims failed.',
              });
              clearContinuationMarker();
              return;
            }

            const claims = claimsData.claims;
            const sub = claims.sub;
            const sessionId = String(claims.session_id || snapshot.session?.access_token || '');

            if (sub !== snapshot.session?.user?.id) {
              if (!mounted) return;
              setAuthFlow({
                mode: 'callback_error',
                flowType: snapshot.flowState.flowType,
                userId: null,
                sessionId: null,
                email: null,
                error: 'Session identity mismatch.',
              });
              clearContinuationMarker();
              return;
            }

            // Safe reload continuation marker
            saveContinuationMarker({
              mode: snapshot.flowState.flowType === 'invite' ? 'invite' : 'recovery',
              userId: sub,
              sessionId,
            });

            cleanAuthUrl();

            if (!mounted) return;
            setAuthFlow({
              mode: snapshot.flowState.mode,
              flowType: snapshot.flowState.flowType,
              userId: sub,
              sessionId,
              email: snapshot.session?.user?.email ?? null,
              error: null,
            });
          } catch (err) {
            if (!mounted) return;
            setAuthFlow({
              mode: 'callback_error',
              flowType: snapshot.flowState.flowType,
              userId: null,
              sessionId: null,
              email: null,
              error: err instanceof Error ? err.message : 'Security claims verification failed.',
            });
            clearContinuationMarker();
          }
        })();
      } else if (snapshot.flowState.mode === 'callback_error') {
        setAuthFlow(snapshot.flowState);
        clearContinuationMarker();
        cleanAuthUrl();
      } else if (snapshot.flowState.mode === 'idle') {
        if (!snapshot.session) {
          clearContinuationMarker();
          setAuthFlow(snapshot.flowState);
        }
      }

      // Authorization checks strictly outside event callback
      if (snapshot.session?.user) {
        setLoading(true);
        setAuthorizationReady(false);
        const userId = snapshot.session.user.id;
        window.setTimeout(() => {
          void (async () => {
            if (!mounted) return;
            const adminStatus = await verifyAdmin(userId);
            if (!mounted) return;
            setIsAdmin(adminStatus);
            if (adminStatus) {
              await loadAuthorization();
            } else {
              setRoleKey(null);
              setIsOwner(false);
              setPermissions([]);
              setAuthorizationReady(true);
            }
            if (mounted) setLoading(false);
          })();
        }, 0);
      } else {
        setIsAdmin(false);
        setRoleKey(null);
        setIsOwner(false);
        setPermissions([]);
        setAuthorizationReady(true);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      void (async () => {
        try {
          const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
          if (adminError || isAdmin !== true) return;
          const { error: alertError } = await supabase.functions.invoke('login-alert', { body: {} });
          if (alertError) console.warn('The login security alert could not be delivered.');
        } catch {
          console.warn('The login security alert could not be delivered.');
        }
      })();
    }

    return { error: error ? new Error(error.message) : null };
  };

  const refreshAuthorization = async () => {
    setAuthorizationReady(false);
    try {
      const { data: adminStatus, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || adminStatus !== true) {
        setIsAdmin(false);
        setRoleKey(null);
        setIsOwner(false);
        setPermissions([]);
        return;
      }
      setIsAdmin(true);
      const { data, error } = await supabase.rpc('get_my_authorization');
      if (error) {
        setRoleKey(null);
        setIsOwner(false);
        setPermissions([]);
        return;
      }
      const authorization = Array.isArray(data) ? data[0] : data;
      setRoleKey(typeof authorization?.role_key === 'string' ? authorization.role_key : null);
      setIsOwner(authorization?.is_owner === true);
      setPermissions(Array.isArray(authorization?.permissions) ? authorization.permissions : []);
      setAuthorizationReady(true);
    } catch {
      setRoleKey(null);
      setIsOwner(false);
      setPermissions([]);
    }
  };

  const signOut = async () => {
    try {
      // Local scope sign out (TASK 6)
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore network errors on logout to ensure UI resets
    } finally {
      clearContinuationMarker();
      setAuthFlow({
        mode: 'idle',
        flowType: null,
        userId: null,
        sessionId: null,
        email: null,
        error: null,
      });
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setRoleKey(null);
      setIsOwner(false);
      setPermissions([]);
      setAuthorizationReady(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        roleKey,
        isOwner,
        permissions,
        authorizationReady,
        authFlow,
        clearAuthFlow,
        refreshAuthorization,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
