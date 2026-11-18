import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in cursor-pointer"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClass} bg-obsidian-600 border border-obsidian-500/50 rounded-2xl shadow-2xl my-8 animate-scale-in`}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-obsidian-500/40">
          <div className="min-w-0">
            <h3 id="modal-title" className="text-white font-bold text-lg">{title}</h3>
            {subtitle && <p className="text-obsidian-300 text-sm mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            title="إغلاق (Esc)"
            className="text-obsidian-300 hover:text-white hover:bg-obsidian-500/40 rounded-lg p-1.5 transition-all shrink-0 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
