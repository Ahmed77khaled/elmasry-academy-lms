import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface BrandingContextValue {
  logoUrl: string | null;
  refreshLogo: () => Promise<void>;
}

export const BrandingContext = createContext<BrandingContextValue | null>(null);

const BRANDING_UNAVAILABLE_KEY = 'elmasry_branding_rpc_unavailable';

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const refreshLogo = useCallback(async (force = false) => {
    try {
      if (!force && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(BRANDING_UNAVAILABLE_KEY) === '1') {
        return;
      }
      const { data, error } = await supabase.rpc('get_academy_logo');
      if (error) {
        if ((error.code === 'PGRST202' || /get_academy_logo/i.test(error.message ?? '')) && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(BRANDING_UNAVAILABLE_KEY, '1');
        }
        setLogoUrl(null);
        return;
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(BRANDING_UNAVAILABLE_KEY);
      }
      if (typeof data !== 'string' || !data) {
        setLogoUrl(null);
        return;
      }
      const { data: publicUrl } = supabase.storage.from('academy-branding').getPublicUrl(data);
      setLogoUrl(publicUrl.publicUrl);
    } catch {
      setLogoUrl(null);
    }
  }, []);

  useEffect(() => { void refreshLogo(); }, [refreshLogo]);

  return (
    <BrandingContext.Provider value={{ logoUrl, refreshLogo: () => refreshLogo(true) }}>
      {children}
    </BrandingContext.Provider>
  );
}
