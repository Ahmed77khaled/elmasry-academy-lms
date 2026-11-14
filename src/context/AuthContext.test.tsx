// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
    functions: { invoke: vi.fn() },
  },
  signIn: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({ supabase: mocks.supabase }));
vi.mock('@/context/useAuth', () => ({ useAuth: () => ({ signIn: mocks.signIn }) }));
vi.mock('@/context/useLocale', () => ({ useLocale: () => ({ locale: 'ar' }) }));
vi.mock('@/components/AcademyLogo', () => ({ AcademyLogo: () => null }));
vi.mock('@/components/LanguageToggle', () => ({ LanguageToggle: () => null }));

import { AuthContext, AuthProvider } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';

function makeSession(id: string): Session {
  return {
    access_token: `token-${id}`,
    refresh_token: `refresh-${id}`,
    expires_in: 3600,
    token_type: 'bearer',
    user: { id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
  } as Session;
}

function Probe() {
  const auth = React.useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider is required');

  return (
    <div>
      <output data-testid="auth-state">
        {JSON.stringify({
          userId: auth.user?.id ?? null,
          loading: auth.loading,
          isAdmin: auth.isAdmin,
          roleKey: auth.roleKey,
          isOwner: auth.isOwner,
          permissions: auth.permissions,
          authorizationReady: auth.authorizationReady,
        })}
      </output>
      <button onClick={() => void auth.refreshAuthorization()}>refresh</button>
      <button onClick={() => void auth.signOut()}>sign out</button>
    </div>
  );
}

let authListener: ((event: AuthChangeEvent, session: Session | null) => void) | undefined;

function state() {
  return JSON.parse(screen.getByTestId('auth-state').textContent ?? '{}') as {
    userId: string | null;
    loading: boolean;
    isAdmin: boolean;
    roleKey: string | null;
    isOwner: boolean;
    permissions: string[];
    authorizationReady: boolean;
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

async function emitAuth(event: AuthChangeEvent, session: Session | null) {
  await act(async () => {
    authListener?.(event, session);
    await new Promise((resolve) => window.setTimeout(resolve, 5));
  });
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authListener = undefined;
    mocks.supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.supabase.auth.onAuthStateChange.mockImplementation((listener) => {
      authListener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    mocks.supabase.auth.signOut.mockResolvedValue({ error: null });
    mocks.supabase.rpc.mockImplementation(async (name: string) => {
      if (name === 'is_admin') return { data: false, error: null };
      return { data: null, error: null };
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('clears authorization when no session exists', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(state().loading).toBe(false));
    expect(state()).toMatchObject({
      userId: null,
      isAdmin: false,
      roleKey: null,
      permissions: [],
      authorizationReady: false,
    });
    expect(mocks.supabase.rpc).not.toHaveBeenCalled();
  });

  it('loads active-admin authorization before marking it ready', async () => {
    const session = makeSession('active-admin');
    mocks.supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.supabase.rpc.mockImplementation(async (name: string) => {
      if (name === 'is_admin') return { data: true, error: null };
      return {
        data: [{ role_key: 'finance_manager', is_owner: false, permissions: ['finance.payments.read'] }],
        error: null,
      };
    });

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(state().authorizationReady).toBe(true));
    expect(state()).toMatchObject({
      userId: 'active-admin',
      isAdmin: true,
      roleKey: 'finance_manager',
      isOwner: false,
      permissions: ['finance.payments.read'],
    });
  });

  it('does not fetch admin authorization for a normal user', async () => {
    const session = makeSession('normal-user');
    mocks.supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.supabase.rpc.mockResolvedValue({ data: false, error: null });

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(state().loading).toBe(false));
    expect(state()).toMatchObject({ userId: 'normal-user', isAdmin: false, permissions: [], authorizationReady: false });
    expect(mocks.supabase.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.supabase.rpc).toHaveBeenCalledWith('is_admin');
  });

  it('ignores a late authorization response after sign-out', async () => {
    const initialSession = makeSession('initial-admin');
    const pendingAdminCheck = deferred<{ data: boolean; error: null }>();
    mocks.supabase.auth.getSession.mockResolvedValue({ data: { session: initialSession }, error: null });
    mocks.supabase.rpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return pendingAdminCheck.promise;
      return Promise.resolve({ data: [], error: null });
    });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(mocks.supabase.rpc).toHaveBeenCalledWith('is_admin'));
    await emitAuth('SIGNED_OUT', null);

    await act(async () => {
      pendingAdminCheck.resolve({ data: true, error: null });
      await Promise.resolve();
    });
    await waitFor(() => expect(state().loading).toBe(false));
    expect(state()).toMatchObject({ userId: null, isAdmin: false, permissions: [], authorizationReady: false });
  });

  it('does not let an earlier account overwrite authorization after an account switch', async () => {
    const firstAdminCheck = deferred<{ data: boolean; error: null }>();
    const secondAdminCheck = deferred<{ data: boolean; error: null }>();
    let adminChecks = 0;
    mocks.supabase.rpc.mockImplementation((name: string) => {
      if (name === 'is_admin') {
        adminChecks += 1;
        return adminChecks === 1 ? firstAdminCheck.promise : secondAdminCheck.promise;
      }
      return Promise.resolve({
        data: [{ role_key: 'second_account', is_owner: false, permissions: ['account.second'] }],
        error: null,
      });
    });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(state().loading).toBe(false));

    await emitAuth('SIGNED_IN', makeSession('first-account'));
    await waitFor(() => expect(adminChecks).toBe(1));
    await emitAuth('SIGNED_IN', makeSession('second-account'));
    await waitFor(() => expect(adminChecks).toBe(2));

    await act(async () => {
      secondAdminCheck.resolve({ data: true, error: null });
      await Promise.resolve();
    });
    await waitFor(() => expect(state().authorizationReady).toBe(true));
    expect(state()).toMatchObject({ userId: 'second-account', roleKey: 'second_account' });

    await act(async () => {
      firstAdminCheck.resolve({ data: true, error: null });
      await Promise.resolve();
    });
    expect(state()).toMatchObject({ userId: 'second-account', roleKey: 'second_account', permissions: ['account.second'] });
  });

  it('replaces permissions after a token refresh', async () => {
    const session = makeSession('token-refresh-admin');
    let authorizationCalls = 0;
    mocks.supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.supabase.rpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: true, error: null });
      authorizationCalls += 1;
      const role = authorizationCalls === 1 ? 'old_role' : 'new_role';
      return Promise.resolve({
        data: [{ role_key: role, is_owner: false, permissions: [`${role}.permission`] }],
        error: null,
      });
    });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(state().authorizationReady).toBe(true));
    expect(state().permissions).toEqual(['old_role.permission']);

    await emitAuth('TOKEN_REFRESHED', { ...session, access_token: 'refreshed-token' });
    await waitFor(() => expect(state().roleKey).toBe('new_role'));
    expect(state()).toMatchObject({
      userId: 'token-refresh-admin',
      isAdmin: true,
      permissions: ['new_role.permission'],
      authorizationReady: true,
    });
  });

  it('clears local authorization even when the Supabase sign-out request rejects', async () => {
    const session = makeSession('sign-out-error-admin');
    mocks.supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.supabase.rpc.mockImplementation(async (name: string) => {
      if (name === 'is_admin') return { data: true, error: null };
      return { data: [{ role_key: 'owner', is_owner: true, permissions: ['all'] }], error: null };
    });
    mocks.supabase.auth.signOut.mockRejectedValue(new Error('network unavailable'));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(state().authorizationReady).toBe(true));
    act(() => screen.getByRole('button', { name: 'sign out' }).click());

    await waitFor(() => expect(state().loading).toBe(false));
    expect(state()).toMatchObject({ userId: null, isAdmin: false, permissions: [], authorizationReady: false });
    expect(warning).toHaveBeenCalledWith('The session could not be ended cleanly.');
  });

  it('keeps protected authorization unavailable when the permission RPC fails', async () => {
    const session = makeSession('admin-with-rpc-error');
    mocks.supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.supabase.rpc.mockImplementation(async (name: string) => {
      if (name === 'is_admin') return { data: true, error: null };
      return { data: null, error: new Error('permission request failed') };
    });

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(state().loading).toBe(false));
    expect(state()).toMatchObject({ isAdmin: true, permissions: [], authorizationReady: false });
  });

  it('blocks authorization while refresh is in flight and restores the new result', async () => {
    const session = makeSession('refreshing-admin');
    const refreshedAuthorization = deferred<{ data: unknown; error: null }>();
    let authorizationCalls = 0;
    mocks.supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.supabase.rpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: true, error: null });
      authorizationCalls += 1;
      if (authorizationCalls === 1) {
        return Promise.resolve({
          data: [{ role_key: 'old_role', is_owner: false, permissions: ['old.permission'] }],
          error: null,
        });
      }
      return refreshedAuthorization.promise;
    });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(state().authorizationReady).toBe(true));
    expect(state().permissions).toEqual(['old.permission']);

    act(() => screen.getByRole('button', { name: 'refresh' }).click());
    await waitFor(() => expect(state().loading).toBe(true));
    expect(state().authorizationReady).toBe(false);

    await act(async () => {
      refreshedAuthorization.resolve({
        data: [{ role_key: 'new_role', is_owner: true, permissions: ['new.permission'] }],
        error: null,
      });
      await Promise.resolve();
    });
    await waitFor(() => expect(state().authorizationReady).toBe(true));
    expect(state()).toMatchObject({ roleKey: 'new_role', isOwner: true, permissions: ['new.permission'] });
  });
});

describe('LoginPage sign-in recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a safe message for returned credential errors and re-enables submit', async () => {
    mocks.signIn.mockResolvedValue({ error: new Error('invalid credentials detail') });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'synthetic-password' } });
    fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول للنظام/ }));

    await waitFor(() => expect(screen.getByText(/بيانات الدخول غير صحيحة/)).toBeTruthy());
    expect((screen.getByRole('button', { name: /تسجيل الدخول للنظام/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/invalid credentials detail/)).toBeNull();
  });

  it('shows a generic retryable message when sign-in rejects', async () => {
    mocks.signIn.mockRejectedValue(new Error('private transport detail'));
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'synthetic-password' } });
    fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول للنظام/ }));

    await waitFor(() => expect(screen.getByText(/تعذر الاتصال بخدمة تسجيل الدخول/)).toBeTruthy());
    expect((screen.getByRole('button', { name: /تسجيل الدخول للنظام/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/private transport detail/)).toBeNull();
  });
});
