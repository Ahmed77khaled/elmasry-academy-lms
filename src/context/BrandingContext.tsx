import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface BrandingContextValue {
  logoUrl: string | null;
  refreshLogo: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const refreshLogo = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_academy_logo');
    if (error || typeof data !== 'string' || !data) {
      setLogoUrl(null);
      return;
    }
    const { data: publicUrl } = supabase.storage.from('academy-branding').getPublicUrl(data);
    setLogoUrl(publicUrl.publicUrl);
  }, []);

  useEffect(() => { void refreshLogo(); }, [refreshLogo]);

  return (
    <BrandingContext.Provider value={{ logoUrl, refreshLogo }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const value = useContext(BrandingContext);
  if (!value) throw new Error('useBranding must be used within BrandingProvider.');
  return value;
}
