import { AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';

type AlertVariant = 'error' | 'warning' | 'info' | 'success';

const VARIANTS: Record<AlertVariant, { container: string; icon: string; text: string }> = {
  error: { container: 'bg-rose-500/10 border-rose-500/30', icon: 'text-rose-400', text: 'text-rose-300' },
  warning: { container: 'bg-amber-500/10 border-amber-500/30', icon: 'text-amber-400', text: 'text-amber-300' },
  info: { container: 'bg-azure-brand/10 border-azure-brand/30', icon: 'text-azure-brand', text: 'text-blue-300' },
  success: { container: 'bg-emerald-brand/10 border-emerald-brand/30', icon: 'text-emerald-light', text: 'text-emerald-300' },
};

const ICONS: Record<AlertVariant, typeof Info> = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

export function Alert({
  variant = 'info',
  children,
  className = '',
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const v = VARIANTS[variant];
  const Icon = ICONS[variant];
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${v.container} ${className}`}>
      <Icon size={20} className={`${v.icon} shrink-0 mt-0.5`} />
      <div className={`text-sm leading-relaxed ${v.text}`}>{children}</div>
    </div>
  );
}
