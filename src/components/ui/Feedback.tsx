import { Inbox } from 'lucide-react';

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-obsidian-700 border border-obsidian-500/40 flex items-center justify-center mb-4">
        <Inbox size={28} className="text-obsidian-300" />
      </div>
      <p className="text-obsidian-200 text-sm max-w-md leading-relaxed">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-obsidian-500 border-t-emerald-brand ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size={32} />
    </div>
  );
}
