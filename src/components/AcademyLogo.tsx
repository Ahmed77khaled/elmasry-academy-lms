import { translate } from '@/lib/translations';
import { useState } from 'react';
import { useBranding } from '@/context/useBranding';

interface AcademyLogoProps {
  imageClassName?: string;
  fallbackClassName?: string;
}

export function AcademyLogo({ imageClassName = 'h-full w-full object-contain', fallbackClassName = 'font-bold' }: AcademyLogoProps) {
  const { logoUrl } = useBranding();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!logoUrl || failedUrl === logoUrl) return <span className={fallbackClassName}>{translate("م")}</span>;
  return <img src={logoUrl} alt={translate("شعار أكاديمية المصري")} className={imageClassName} onError={() => setFailedUrl(logoUrl)} />;
}
