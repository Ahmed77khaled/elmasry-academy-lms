import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
import { useState } from 'react';
import { Users, BookOpen, ClipboardList, TrendingUp, Receipt, Wallet, AlertCircle, RefreshCw, Printer } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { formatEGP, formatNumber, formatDate } from '@/lib/format';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { ReceiptModal } from '@/components/modals/ReceiptModal';
import type { DashboardMetrics } from '@/types/database';
import { useAuth } from '@/context/AuthContext';

interface PaymentRow {
  payment_id: string;
  amount: number;
  payment_date: string;
  method: string;
  receipt_ref: string | null;
  voided_at: string | null;
  notes?: string | null;
  enrollments?: {
    students?: { name: string; phone?: string | null } | null;
    courses?: { course_name: string } | null;
  } | null;
  cash_boxes?: { name: string } | null;
}

const METHOD_LABELS: Record<string, string> = {
  'Cash': 'كاش',
  'Bank Transfer': 'تحويل بنكي',
  'Vodafone Cash': 'فودافون كاش',
  'InstaPay': 'إنستاباي',
};

export function DashboardPage() {
  const { permissions } = useAuth();
  const canReadFinance = permissions.includes('dashboard.finance.read');
  const canReadOperational = permissions.includes('dashboard.operational.read');
  const [receiptTarget, setReceiptTarget] = useState<{
    payment_id: string;
    student_name: string;
    student_phone?: string | null;
    course_name: string;
    amount: number;
    payment_date: string;
    method: string;
    receipt_ref?: string | null;
    cash_box_name?: string | null;
    notes?: string | null;
  } | null>(null);

  const { data: metrics, loading: metricsLoading, refetch: refetchMetrics } = useQuery<DashboardMetrics>(async () => {
    const [operationalResult, financeResult] = await Promise.all([
      canReadOperational
        ? supabase.rpc('rbac_operational_dashboard_metrics')
        : Promise.resolve({ data: [], error: null }),
      canReadFinance ? supabase.rpc('rbac_finance_dashboard_metrics') : Promise.resolve({ data: [], error: null }),
    ]);
    const error = operationalResult.error ?? financeResult.error;
    if (error) return { data: null, error: error.message };
    return { data: { ...(operationalResult.data?.[0] ?? {}), ...(financeResult.data?.[0] ?? {}) } as DashboardMetrics, error: null };
  }, [canReadFinance, canReadOperational]);

  const { data: payments, loading: paymentsLoading, refetch: refetchPayments } = useQuery<PaymentRow[]>(async () => {
    if (!canReadFinance) return { data: [], error: null };
    const { data, error } = await supabase.rpc('rbac_list_payments', { p_limit: 10, p_offset: 0 });
    const rows = ((data ?? []) as (PaymentRow & { student_name: string; student_phone: string | null; course_name: string; cash_box_name: string | null })[]).filter((payment) => payment.voided_at == null).map((payment) => ({
      ...payment,
      enrollments: { students: { name: payment.student_name, phone: payment.student_phone }, courses: { course_name: payment.course_name } },
      cash_boxes: { name: payment.cash_box_name },
    }));
    return { data: rows as unknown as PaymentRow[], error: error?.message ?? null };
  }, [canReadFinance]);

  const handleRefresh = () => {
    refetchMetrics();
    refetchPayments();
  };

  const handleOpenReceipt = (p: PaymentRow) => {
    setReceiptTarget({
      payment_id: p.payment_id,
      student_name: p.enrollments?.students?.name ?? translate("طالب بالأكاديمية"),
      student_phone: p.enrollments?.students?.phone,
      course_name: p.enrollments?.courses?.course_name ?? translate("كورس تدريبي"),
      amount: p.amount,
      payment_date: p.payment_date,
      method: p.method,
      receipt_ref: p.receipt_ref,
      cash_box_name: p.cash_boxes?.name,
      notes: p.notes,
    });
  };

  const m = metrics;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white font-arabic">{canReadFinance ? translate("لوحة المؤشرات المالية والتشغيلية") : translate("لوحة المؤشرات التشغيلية")}</h1>
          <p className="text-obsidian-300 text-sm mt-1">
            {canReadFinance ? translate("ملخص الأداء المالي والتشغيلي للأكاديمية") : translate("ملخص أداء الأكاديمية والدورات والتسجيلات")}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-secondary flex items-center gap-2"
          disabled={metricsLoading || paymentsLoading}
        >
          <RefreshCw size={16} className={metricsLoading || paymentsLoading ? 'animate-spin' : ''} />
          {translate("تحديث البيانات")}</button>
      </div>

      {/* 7 KPI Cards (Zero client calculation — all from dashboard_metrics view) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KPICard
          label={translate("إجمالي الطلاب")}
          value={formatNumber(m?.total_students ?? 0)}
          subtitle={m?.new_students_this_month ? translateTemplate('تم تسجيل {count} طالب جديد هذا الشهر', { count: m.new_students_this_month }) : translate("إجمالي الطلاب المقيدين")}
          icon={Users}
          accent="emerald"
        />
        <KPICard
          label={translate("الدورات النشطة")}
          value={formatNumber(m?.active_courses ?? 0)}
          subtitle={translate("الدورات التدريبية المتاحة حاليًا")}
          icon={BookOpen}
          accent="blue"
        />
        <KPICard
          label={translate("الطلاب المنتظمون")}
          value={formatNumber(m?.active_enrollments ?? 0)}
          subtitle={translate("تسجيلات نشطة في الدورات")}
          icon={ClipboardList}
          accent="violet"
        />
        {canReadFinance && <KPICard
          label={translate("المبالغ المحصّلة هذا الشهر")}
          value={formatEGP(m?.revenue_this_month ?? 0)}
          subtitle={translate("مدفوعات مسجلة في الخزن خلال الشهر")}
          icon={TrendingUp}
          accent="emerald"
          trend="up"
        />}
        {canReadFinance && <KPICard
          label={translate("مصروفات الشهر")}
          value={formatEGP(m?.expenses_this_month ?? 0)}
          subtitle={translate("المصروفات المسجلة خلال الشهر")}
          icon={Receipt}
          accent="rose"
          trend="down"
        />}
        {canReadFinance && <KPICard
          label={translate("صافي نتيجة الشهر")}
          value={formatEGP(m?.net_profit_this_month ?? 0)}
          subtitle={translate("الإيرادات مطروحًا منها المصروفات")}
          icon={Wallet}
          accent={(m?.net_profit_this_month ?? 0) >= 0 ? 'emerald' : 'rose'}
          trend={(m?.net_profit_this_month ?? 0) >= 0 ? 'up' : 'down'}
        />}
        {canReadFinance && <KPICard
          label={translate("المبالغ المستحقة")}
          value={formatEGP(m?.total_pending_balance ?? 0)}
          subtitle={translate("المبالغ المتبقية على تسجيلات الطلاب")}
          icon={AlertCircle}
          accent="amber"
        />}
      </div>

      {/* All-time summary */}
      {canReadFinance && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <div className="card-surface p-4">
          <p className="text-obsidian-300 text-xs mb-1">{translate("إجمالي الإيرادات حتى الآن")}</p>
          <p className="font-num font-bold text-lg text-emerald-light">{formatEGP(m?.total_revenue_all_time ?? 0)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-obsidian-300 text-xs mb-1">{translate("إجمالي المصروفات حتى الآن")}</p>
          <p className="font-num font-bold text-lg text-rose-400">{formatEGP(m?.total_expenses_all_time ?? 0)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-obsidian-300 text-xs mb-1">{translate("صافي النتيجة حتى الآن")}</p>
          <p className={`font-num font-bold text-lg ${(m?.net_profit_all_time ?? 0) >= 0 ? 'text-emerald-light' : 'text-rose-400'}`}>
            {formatEGP(m?.net_profit_all_time ?? 0)}
          </p>
        </div>
      </div>}

      {/* Recent payments */}
      {canReadFinance && <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-obsidian-500/40">
          <h3 className="text-white font-bold text-base">{translate("أحدث الدفعات")}</h3>
          <span className="text-obsidian-300 text-xs">{translate("آخر 10 معاملات")}</span>
        </div>
        {paymentsLoading ? (
          <PageLoader />
        ) : !payments || payments.length === 0 ? (
          <EmptyState message={translate("لا توجد دفعات مسجلة بعد — سجّل أول دفعة من شاشة الدفعات")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                  <th className="text-right font-medium px-4 py-3">{translate("الطالب")}</th>
                  <th className="text-right font-medium px-4 py-3">{translate("الدورة")}</th>
                  <th className="text-right font-medium px-4 py-3 hidden md:table-cell">{translate("التاريخ")}</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">{translate("الخزنة")}</th>
                  <th className="text-right font-medium px-4 py-3">{translate("المبلغ")}</th>
                  <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">{translate("طريقة الدفع")}</th>
                  <th className="text-right font-medium px-4 py-3">{translate("إيصال")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.payment_id} className="border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      {p.enrollments?.students?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-obsidian-200">
                      {p.enrollments?.courses?.course_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-obsidian-300 font-num hidden md:table-cell">
                      {formatDate(p.payment_date)}
                    </td>
                    <td className="px-4 py-3 text-obsidian-200 hidden lg:table-cell">
                      {p.cash_boxes?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-num font-semibold text-emerald-light">
                      {formatEGP(p.amount)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="blue">{translate(METHOD_LABELS[p.method] ?? p.method)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenReceipt(p)}
                        className="btn-ghost p-1.5 text-obsidian-200 hover:text-emerald-light"
                        title={translate("طباعة إيصال السداد")}
                      >
                        <Printer size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {canReadFinance && <ReceiptModal
        open={!!receiptTarget}
        onClose={() => setReceiptTarget(null)}
        payment={receiptTarget}
      />}
    </div>
  );
}
