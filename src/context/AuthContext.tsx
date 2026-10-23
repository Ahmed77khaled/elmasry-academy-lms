import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [roleKey, setRoleKey] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [authorizationReady, setAuthorizationReady] = useState(false);

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
          setAuthorizationReady(false);
          setRoleKey(null);
          setIsOwner(false);
          setPermissions([]);
          return;
        }
        const authorization = Array.isArray(data) ? data[0] : data;
        setAuthorizationReady(true);
        setRoleKey(typeof authorization?.role_key === 'string' ? authorization.role_key : null);
        setIsOwner(authorization?.is_owner === true);
        setPermissions(Array.isArray(authorization?.permissions) ? authorization.permissions : []);
      } catch {
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
          setAuthorizationReady(false);
        }
      } catch {
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
        setRoleKey(null);
        setIsOwner(false);
        setPermissions([]);
        setAuthorizationReady(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setAuthorizationReady(false);
      setRoleKey(null);
      setIsOwner(false);
      setPermissions([]);
      window.setTimeout(() => {
        void (async () => {
          const adminStatus = await verifyAdmin(session.user.id);
          if (!mounted) return;
          setIsAdmin(adminStatus);
          if (adminStatus) await loadAuthorization();
          else {
            setRoleKey(null);
            setIsOwner(false);
            setPermissions([]);
            setAuthorizationReady(false);
          }
          if (mounted) setLoading(false);
        })();
      }, 0);
    });

    return () => {
      mounted = false;
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setRoleKey(null);
    setIsOwner(false);
    setPermissions([]);
    setAuthorizationReady(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, roleKey, isOwner, permissions, authorizationReady, refreshAuthorization, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
