import { Modal } from '@/components/ui/Modal';
import { formatEGP, formatDate } from '@/lib/format';
import { Printer, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  payment: {
    payment_id: string;
    receipt_number?: number | null;
    student_name: string;
    student_phone?: string | null;
    course_name: string;
    amount: number;
    payment_date: string;
    method: string;
    receipt_ref?: string | null;
    cash_box_name?: string | null;
    notes?: string | null;
  } | null;
}

const METHOD_AR: Record<string, string> = {
  'Cash': 'كاش نقدياً',
  'Bank Transfer': 'تحويل بنكي',
  'Vodafone Cash': 'فودافون كاش',
  'InstaPay': 'إنستاباي / شبكة المدفوعات اللحظية',
};

export function ReceiptModal({ open, onClose, payment }: ReceiptModalProps) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={open} onClose={onClose} title="إيصال سداد رسوم تدريبية" subtitle="مستند مالي معتمد للطباعة" size="md">
      <div className="space-y-4">
        {/* Printable Voucher Paper */}
        <div
          id="printable-receipt"
          className="bg-white text-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 relative overflow-hidden"
          dir="rtl"
        >
          {/* Header watermark */}
          <div className="absolute top-2 left-2 opacity-10 text-emerald-600 font-extrabold text-7xl select-none pointer-events-none">
            مدفوع
          </div>

          {/* Top Brand Banner */}
          <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-4 mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 font-arabic">أكاديمية المصري</h2>
              <p className="text-xs text-gray-500 font-medium">نظام إدارة التدريب وهندسة النظم المعتمد</p>
            </div>
            <div className="text-left">
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                <CheckCircle2 size={13} /> إيصال تحصيل رسمي
              </span>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                رقم: {payment.receipt_number != null
                  ? `REC-${String(payment.receipt_number).padStart(8, '0')}`
                  : `REC-${payment.payment_id.slice(0, 8).toUpperCase()}`}
              </p>
            </div>
          </div>

          {/* Main Details Table */}
          {payment.receipt_ref && (
            <p className="text-xs text-gray-500 mb-3">
              مرجع التحويل الخارجي: <span className="font-mono">{payment.receipt_ref}</span>
            </p>
          )}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500 font-medium">اسم الطالب:</span>
              <span className="font-bold text-gray-900">{payment.student_name}</span>
            </div>

            {payment.student_phone && (
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium">رقم الهاتف:</span>
                <span className="font-semibold text-gray-800 font-mono">{payment.student_phone}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500 font-medium">الكورس المسجل:</span>
              <span className="font-bold text-emerald-700">{payment.course_name}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500 font-medium">تاريخ السداد:</span>
              <span className="font-semibold text-gray-800 font-mono">{formatDate(payment.payment_date)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500 font-medium">طريقة الدفع:</span>
              <span className="font-semibold text-gray-800">{METHOD_AR[payment.method] || payment.method}</span>
            </div>

            {payment.cash_box_name && (
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium">الخزنة المستلمة:</span>
                <span className="font-semibold text-gray-800">{payment.cash_box_name}</span>
              </div>
            )}

            {payment.notes && (
              <div className="py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium block text-xs mb-0.5">ملاحظات:</span>
                <span className="text-gray-700 text-xs">{payment.notes}</span>
              </div>
            )}

            {/* Total Paid Highlight */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-800 font-bold">المبلغ المحصل والمدفوع:</p>
                <p className="text-xs text-emerald-600">تم القيد في الخزينة بنجاح</p>
              </div>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                {formatEGP(payment.amount)}
              </p>
            </div>
          </div>

          {/* Footer & Stamps */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-end justify-between text-xs text-gray-500">
            <div>
              <p className="font-bold text-gray-700">توقيع المسؤول المالي / الخزينة:</p>
              <p className="mt-2 text-emerald-800 font-semibold font-arabic">م/ أحمد الفلاح 👨‍💻</p>
            </div>
            <div className="text-left font-mono text-[11px] text-gray-400">
              <p>Elmasry Academy LMS</p>
              <p>System Admin Certified</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            إغلاق
          </button>
          <button type="button" onClick={handlePrint} className="btn-primary flex items-center gap-2">
            <Printer size={18} />
            طباعة الإيصال فوراً
          </button>
        </div>
      </div>
    </Modal>
  );
}
