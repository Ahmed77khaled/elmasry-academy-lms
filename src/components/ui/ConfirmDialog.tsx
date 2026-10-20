import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  loading = false,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-rose-500/15' : 'bg-amber-500/15'}`}>
            <AlertTriangle size={20} className={danger ? 'text-rose-400' : 'text-amber-400'} />
          </div>
          <p className="text-obsidian-100 text-sm leading-relaxed pt-1.5">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-lg text-sm transition-all active:scale-95 disabled:opacity-50 ${danger ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
          >
            {loading ? 'جاري...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
