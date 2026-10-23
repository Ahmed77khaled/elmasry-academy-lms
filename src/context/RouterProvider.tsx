import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { RouterContext } from '@/context/RouterContext';
import type { Page, RouteState } from '@/context/RouterContext';

function parseHash(): RouteState {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('/');
  const page = (parts[1] as Page) || 'dashboard';
  const params: Record<string, string> = {};
  for (let i = 2; i < parts.length; i += 2) {
    if (parts[i] && parts[i + 1]) {
      params[parts[i]] = decodeURIComponent(parts[i + 1]);
    }
  }
  return { page, params };
}

function buildHash(page: Page, params?: Record<string, string>): string {
  let hash = `/${page}`;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      hash += `/${key}/${encodeURIComponent(value)}`;
    }
  }
  return hash;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<RouteState>(parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((page: Page, params?: Record<string, string>) => {
    window.location.hash = buildHash(page, params);
    window.scrollTo(0, 0);
  }, []);

  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}
