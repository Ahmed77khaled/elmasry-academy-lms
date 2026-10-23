export type BadgeVariant = 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'gray';

const VARIANTS: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-brand/15 text-emerald-light border-emerald-brand/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  blue: 'bg-azure-brand/15 text-azure-brand border-azure-brand/30',
  gray: 'bg-obsidian-500/30 text-obsidian-200 border-obsidian-500/40',
};

export function Badge({
  variant = 'gray',
  children,
  className = '',
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
