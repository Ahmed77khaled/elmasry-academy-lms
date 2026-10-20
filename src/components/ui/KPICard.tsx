import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent: 'emerald' | 'amber' | 'rose' | 'violet' | 'blue';
  trend?: 'up' | 'down' | 'neutral';
}

const ACCENTS: Record<KPICardProps['accent'], { bg: string; icon: string; value: string }> = {
  emerald: { bg: 'from-emerald-brand/15 to-transparent', icon: 'text-emerald-light', value: 'text-emerald-light' },
  amber: { bg: 'from-amber-500/15 to-transparent', icon: 'text-amber-400', value: 'text-amber-400' },
  rose: { bg: 'from-rose-500/15 to-transparent', icon: 'text-rose-400', value: 'text-rose-400' },
  violet: { bg: 'from-violet-500/15 to-transparent', icon: 'text-violet-400', value: 'text-violet-400' },
  blue: { bg: 'from-azure-brand/15 to-transparent', icon: 'text-azure-brand', value: 'text-azure-brand' },
};

export function KPICard({ label, value, subtitle, icon: Icon, accent, trend }: KPICardProps) {
  const a = ACCENTS[accent];
  return (
    <div className={`card-surface p-4 lg:p-5 bg-gradient-to-b ${a.bg} relative overflow-hidden hover:border-obsidian-400/50 transition-all`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-obsidian-200 text-xs lg:text-sm font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg bg-obsidian-700/60 flex items-center justify-center shrink-0 ${a.icon}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`font-num font-bold text-xl lg:text-2xl ${a.value}`}>{value}</p>
      <div className="flex items-center gap-1.5 mt-2">
        {trend === 'up' && <TrendingUp size={12} className="text-emerald-light" />}
        {trend === 'down' && <TrendingDown size={12} className="text-rose-400" />}
        <p className="text-obsidian-300 text-xs">{subtitle}</p>
      </div>
    </div>
  );
}
