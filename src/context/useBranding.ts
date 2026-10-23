import { useContext } from 'react';
import { BrandingContext } from '@/context/BrandingContext';

export function useBranding() {
  const value = useContext(BrandingContext);
  if (!value) throw new Error('useBranding must be used within BrandingProvider.');
  return value;
}
