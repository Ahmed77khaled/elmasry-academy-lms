import React, { createContext, useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { createAuthRequestEpoch } from '@/context/authRequestEpoch.mjs';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  roleKey: string | null;
  isOwner: boolean;
  permissions: string[];
  authorizationReady: boolean;
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
  const requestEpoch = useRef(createAuthRequestEpoch());

  useEffect(() => {
    let mounted = true;
    const epoch = requestEpoch.current;

    const isCurrentRequest = (requestId: number) => mounted && epoch.isCurrent(requestId);

    function clearAuthorizationState(adminStatus = false) {
      setIsAdmin(adminStatus);
      setRoleKey(null);
      setIsOwner(false);
      setPermissions([]);
      setAuthorizationReady(false);
    }

    async function verifyAdmin(): Promise<boolean> {
      try {
        const { data, error } = await supabase.rpc('is_admin');
        return !error && data === true;
      } catch {
        return false;
      }
    }

    async function loadAuthorization(requestId: number) {
      try {
        const { data, error } = await supabase.rpc('get_my_authorization');
        if (!isCurrentRequest(requestId)) return;
        if (error) {
          clearAuthorizationState(true);
          return;
        }
        const authorization = Array.isArray(data) ? data[0] : data;
        setAuthorizationReady(true);
        setRoleKey(typeof authorization?.role_key === 'string' ? authorization.role_key : null);
        setIsOwner(authorization?.is_owner === true);
        setPermissions(Array.isArray(authorization?.permissions) ? authorization.permissions : []);
      } catch {
        if (isCurrentRequest(requestId)) clearAuthorizationState(true);
      }
    }

    async function initAuth() {
      const requestId = epoch.begin();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isCurrentRequest(requestId)) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const adminStatus = await verifyAdmin();
          if (!isCurrentRequest(requestId)) return;
          setIsAdmin(adminStatus);
          if (adminStatus) await loadAuthorization(requestId);
          else clearAuthorizationState(false);
        } else {
          clearAuthorizationState(false);
        }
      } catch {
        if (isCurrentRequest(requestId)) clearAuthorizationState(false);
      } finally {
        if (isCurrentRequest(requestId)) setLoading(false);
      }
    }

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const requestId = epoch.begin();
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        clearAuthorizationState(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      clearAuthorizationState(false);
      window.setTimeout(() => {
        void (async () => {
          if (!isCurrentRequest(requestId)) return;
          try {
            const adminStatus = await verifyAdmin();
            if (!isCurrentRequest(requestId)) return;
            setIsAdmin(adminStatus);
            if (adminStatus) await loadAuthorization(requestId);
            else clearAuthorizationState(false);
          } catch {
            if (isCurrentRequest(requestId)) clearAuthorizationState(false);
          } finally {
            if (isCurrentRequest(requestId)) setLoading(false);
          }
        })();
      }, 0);
    });

    return () => {
      mounted = false;
      epoch.invalidate();
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      // Keep authentication responsive if the optional security notification is unavailable.
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
    const requestId = requestEpoch.current.begin();
    setAuthorizationReady(false);
    setLoading(true);
    try {
      const { data: adminStatus, error: adminError } = await supabase.rpc('is_admin');
      if (!requestEpoch.current.isCurrent(requestId)) return;
      if (adminError || adminStatus !== true) {
        setIsAdmin(false);
        setRoleKey(null);
        setIsOwner(false);
        setPermissions([]);
        return;
      }
      setIsAdmin(true);
      const { data, error } = await supabase.rpc('get_my_authorization');
      if (!requestEpoch.current.isCurrent(requestId)) return;
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
      if (requestEpoch.current.isCurrent(requestId)) {
        setIsAdmin(false);
        setRoleKey(null);
        setIsOwner(false);
        setPermissions([]);
        setAuthorizationReady(false);
      }
    } finally {
      if (requestEpoch.current.isCurrent(requestId)) setLoading(false);
    }
  };

  const signOut = async () => {
    const requestId = requestEpoch.current.begin();
    setLoading(true);
    clearAuthorizationForSignOut();
    try {
      await supabase.auth.signOut();
    } catch {
      console.warn('The session could not be ended cleanly.');
    } finally {
      if (requestEpoch.current.isCurrent(requestId)) {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setRoleKey(null);
        setIsOwner(false);
        setPermissions([]);
        setAuthorizationReady(false);
        setLoading(false);
      }
    }
  };

  function clearAuthorizationForSignOut() {
    setIsAdmin(false);
    setRoleKey(null);
    setIsOwner(false);
    setPermissions([]);
    setAuthorizationReady(false);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, roleKey, isOwner, permissions, authorizationReady, refreshAuthorization, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
