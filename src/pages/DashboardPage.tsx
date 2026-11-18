import { translate } from '@/lib/translations';
import { useState, useMemo } from 'react';
import { Users, BookOpen, TrendingUp, RefreshCw, Printer, Wallet, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatEGP, formatNumber, formatDate, formatBalance } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { ReceiptModal } from '@/components/modals/ReceiptModal';
import type { DashboardMetrics, Course, EnrollmentBalance, CashBoxBalance } from '@/types/database';
import { useAuth } from '@/context/useAuth';

export interface DashboardTransaction {
  id: string;
  type: 'payment' | 'expense' | 'transfer';
  typeLabel: string;
  date: string;
  createdAt: string;
  cashBoxName: string;
  party: string;
  description: string;
  amount: number;
  currency: 'EGP' | 'USD';
  methodOrNotes: string;
  receiptData?: {
    payment_id: string;
    receipt_number?: number | null;
    student_name: string;
    student_phone?: string | null;
    course_name: string;
    amount: number;
    currency: 'EGP' | 'USD';
    payment_date: string;
    method: string;
    receipt_ref?: string | null;
    cash_box_name?: string | null;
    notes?: string | null;
  };
}

const METHOD_LABELS: Record<string, string> = {
  'Cash': 'كاش',
  'Bank Transfer': 'تحويل بنكي',
  'Vodafone Cash': 'فودافون كاش',
  'InstaPay': 'إنستاباي',
};

const CATEGORY_LABELS: Record<string, string> = {
  'Rent': 'إيجار',
  'Salary': 'مرتبات',
  'Supplies': 'أدوات',
  'Hardware': 'أجهزة',
  'Marketing': 'إعلانات',
  'Utilities': 'كهرباء وإنترنت',
  'Other': 'أخرى',
};

export function DashboardPage() {
  const { permissions } = useAuth();
  const canReadFinance = permissions.includes('dashboard.finance.read');
  const canReadOperational = permissions.includes('dashboard.operational.read');
  const canReadCashBoxes = permissions.includes('finance.cash_boxes.read');
  const canViewBoxes = canReadCashBoxes || canReadFinance;

  const [receiptTarget, setReceiptTarget] = useState<{
    payment_id: string;
    receipt_number?: number | null;
    student_name: string;
    student_phone?: string | null;
    course_name: string;
    amount: number;
    currency: 'EGP' | 'USD';
    payment_date: string;
    method: string;
    receipt_ref?: string | null;
    cash_box_name?: string | null;
    notes?: string | null;
  } | null>(null);

  // Pagination for transactions table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. General Operational & Finance Dashboard Metrics
  const { data: metrics, loading: metricsLoading, refetch: refetchMetrics } = useQuery<DashboardMetrics>(async () => {
    const [operationalResult, financeResult, financeUsdResult] = await Promise.all([
      canReadOperational
        ? supabase.rpc('rbac_operational_dashboard_metrics')
        : Promise.resolve({ data: [], error: null }),
      canReadFinance ? supabase.rpc('rbac_finance_dashboard_metrics') : Promise.resolve({ data: [], error: null }),
      canReadFinance ? supabase.rpc('rbac_finance_dashboard_usd_v2') : Promise.resolve({ data: [], error: null }),
    ]);
    const error = operationalResult.error ?? financeResult.error ?? financeUsdResult.error;
    if (error) return { data: null, error: error.message };
    return { data: { ...(operationalResult.data?.[0] ?? {}), ...(financeResult.data?.[0] ?? {}), ...(financeUsdResult.data?.[0] ?? {}) } as DashboardMetrics, error: null };
  }, [canReadFinance, canReadOperational]);

  // 2. Active Courses and Enrollments breakdown
  const { data: coursesData, loading: coursesLoading, refetch: refetchCourses } = useQuery<{
    courses: Course[];
    enrollments: EnrollmentBalance[];
  }>(async () => {
    const [coursesRes, enrollmentsRes] = await Promise.allSettled([
      supabase.rpc('rbac_list_courses_v2', { p_limit: 500, p_offset: 0 }),
      supabase.rpc('rbac_list_enrollments_v2', { p_search: null, p_limit: 500, p_offset: 0 }),
    ]);

    const courses = coursesRes.status === 'fulfilled' && !coursesRes.value.error && Array.isArray(coursesRes.value.data)
      ? (coursesRes.value.data as Course[])
      : [];
    const enrollments = enrollmentsRes.status === 'fulfilled' && !enrollmentsRes.value.error && Array.isArray(enrollmentsRes.value.data)
      ? (enrollmentsRes.value.data as EnrollmentBalance[])
      : [];

    return { data: { courses, enrollments }, error: null };
  });

  // 3. Cash Boxes Balances
  const { data: cashBoxes, loading: boxesLoading, refetch: refetchBoxes } = useQuery<CashBoxBalance[]>(async () => {
    if (!canViewBoxes) return { data: [], error: null };
    const { data, error } = await supabase.rpc('rbac_list_cash_boxes_v2');
    return { data: (data as CashBoxBalance[] | null) ?? [], error: error?.message ?? null };
  }, [canViewBoxes]);

  // 4. Recent All Transactions (Payments, Expenses, Transfers)
  const { data: allTransactions, loading: transactionsLoading, refetch: refetchTransactions } = useQuery<DashboardTransaction[]>(async () => {
    if (!canReadFinance) return { data: [], error: null };

    const [paymentsRes, expensesRes, transfersRes] = await Promise.allSettled([
      supabase.rpc('rbac_list_payments_v2', { p_limit: 500, p_offset: 0 }),
      supabase.rpc('rbac_list_expenses', { p_limit: 500, p_offset: 0 }),
      supabase.rpc('rbac_list_transfers', { p_limit: 500, p_offset: 0 }),
    ]);

    const items: DashboardTransaction[] = [];

    // Payments
    if (paymentsRes.status === 'fulfilled' && !paymentsRes.value.error && Array.isArray(paymentsRes.value.data)) {
      for (const p of paymentsRes.value.data) {
        if (!p.voided_at) {
          items.push({
            id: `pay-${p.payment_id}`,
            type: 'payment',
            typeLabel: translate('إيراد'),
            date: p.payment_date,
            createdAt: p.created_at,
            cashBoxName: p.cash_box_name || '—',
            party: p.student_name || translate('طالب بالأكاديمية'),
            description: p.course_name ? `${p.course_name} (${p.receipt_number || translate('بدون إيصال')})` : (p.receipt_number || ''),
            amount: Number(p.amount) || 0,
            currency: (p.currency as 'EGP' | 'USD') || 'EGP',
            methodOrNotes: [METHOD_LABELS[p.method] ?? p.method, p.receipt_ref, p.notes].filter(Boolean).join(' • ') || '—',
            receiptData: {
              payment_id: p.payment_id,
              receipt_number: p.receipt_number,
              student_name: p.student_name || translate('طالب بالأكاديمية'),
              student_phone: p.student_phone,
              course_name: p.course_name || translate('كورس تدريبي'),
              amount: Number(p.amount) || 0,
              currency: (p.currency as 'EGP' | 'USD') || 'EGP',
              payment_date: p.payment_date,
              method: p.method,
              receipt_ref: p.receipt_ref,
              cash_box_name: p.cash_box_name,
              notes: p.notes,
            },
          });
        }
      }
    }

    // Expenses
    if (expensesRes.status === 'fulfilled' && !expensesRes.value.error && Array.isArray(expensesRes.value.data)) {
      for (const e of expensesRes.value.data) {
        if (!e.voided_at) {
          items.push({
            id: `exp-${e.expense_id}`,
            type: 'expense',
            typeLabel: translate('مصروف'),
            date: e.expense_date,
            createdAt: e.created_at,
            cashBoxName: e.cash_box_name || '—',
            party: CATEGORY_LABELS[e.category] ?? e.category ?? translate('مصروف'),
            description: e.description || e.course_name || '',
            amount: Number(e.amount) || 0,
            currency: 'EGP',
            methodOrNotes: e.notes || '—',
          });
        }
      }
    }

    // Transfers
    if (transfersRes.status === 'fulfilled' && !transfersRes.value.error && Array.isArray(transfersRes.value.data)) {
      for (const t of transfersRes.value.data) {
        items.push({
          id: `tf-${t.transfer_id}`,
          type: 'transfer',
          typeLabel: translate('تحويل'),
          date: t.transfer_date,
          createdAt: t.created_at,
          cashBoxName: `${t.from_box_name} ➔ ${t.to_box_name}`,
          party: translate('تحويل بين الخزن'),
          description: t.notes || `${translate('من')} ${t.from_box_name} ${translate('إلى')} ${t.to_box_name}`,
          amount: Number(t.amount) || 0,
          currency: 'EGP',
          methodOrNotes: t.notes || translate('تحويل داخلي'),
        });
      }
    }

    // Sort chronologically descending
    items.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { data: items, error: null };
  }, [canReadFinance]);

  // Computed: Active Courses
  const activeCourses = useMemo(() => {
    return coursesData?.courses?.filter((c) => c.availability_status === 'Active') ?? [];
  }, [coursesData]);

  // Computed: Students and Financials per Active Course (kept per currency)
  const courseStudentStats = useMemo(() => {
    const activeEnrolls = coursesData?.enrollments?.filter((e) => e.enrollment_status === 'Active') ?? [];
    return activeCourses.map((course) => {
      const courseEnrolls = activeEnrolls.filter((e) => e.course_id === course.course_id);
      let expectedEgp = 0;
      let expectedUsd = 0;
      let paidEgp = 0;
      let paidUsd = 0;
      let remainingEgp = 0;
      let remainingUsd = 0;

      for (const enrollment of courseEnrolls) {
        const isUsd = enrollment.agreed_currency === 'USD';
        const agreed = Number(enrollment.agreed_cost) || 0;
        const paid = Number(enrollment.total_paid) || 0;
        const remaining = Math.max(0, Number(enrollment.remaining_balance) || 0);
        if (isUsd) {
          expectedUsd += agreed;
          paidUsd += paid;
          remainingUsd += remaining;
        } else {
          expectedEgp += agreed;
          paidEgp += paid;
          remainingEgp += remaining;
        }
      }

      return {
        course_id: course.course_id,
        course_name: course.course_name,
        student_count: courseEnrolls.length,
        expectedEgp,
        expectedUsd,
        paidEgp,
        paidUsd,
        remainingEgp,
        remainingUsd,
      };
    });
  }, [activeCourses, coursesData]);

  // Computed: Total Financials Across All Active Courses (never mixes currencies)
  const activeCoursesFinancials = useMemo(() => {
    let expectedEgp = 0;
    let expectedUsd = 0;
    let paidEgp = 0;
    let paidUsd = 0;
    let remainingEgp = 0;
    let remainingUsd = 0;
    for (const stat of courseStudentStats) {
      expectedEgp += stat.expectedEgp;
      expectedUsd += stat.expectedUsd;
      paidEgp += stat.paidEgp;
      paidUsd += stat.paidUsd;
      remainingEgp += stat.remainingEgp;
      remainingUsd += stat.remainingUsd;
    }
    return { expectedEgp, expectedUsd, paidEgp, paidUsd, remainingEgp, remainingUsd };
  }, [courseStudentStats]);

  // Computed: Active Cash Boxes
  const activeBoxes = useMemo(() => {
    return cashBoxes?.filter((b) => b.is_active) ?? [];
  }, [cashBoxes]);

  // Computed: Paginated Transactions
  const totalTransactions = allTransactions?.length ?? 0;
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (allTransactions ?? []).slice(start, start + pageSize);
  }, [allTransactions, page, pageSize]);

  const handleRefresh = () => {
    refetchMetrics();
    refetchCourses();
    refetchBoxes();
    refetchTransactions();
  };

  const m = metrics;
  const isRefreshing = metricsLoading || coursesLoading || boxesLoading || transactionsLoading;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white font-arabic">
            {canReadFinance ? translate("لوحة المؤشرات المالية والتشغيلية") : translate("لوحة المؤشرات التشغيلية")}
          </h1>
          <p className="text-obsidian-300 text-sm mt-1">
            {canReadFinance ? translate("ملخص الأداء المالي والتشغيلي للأكاديمية") : translate("ملخص أداء الأكاديمية والدورات والتسجيلات")}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-secondary flex items-center gap-2"
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          {translate("تحديث البيانات")}
        </button>
      </div>

      {/* KPI Cards: Active Courses, Decomposed Students, and Active Course Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. إجمالي الطلاب مقسم حسب الكورسات النشطة */}
        <div className="card-surface p-4 lg:p-5 bg-gradient-to-b from-emerald-brand/15 to-transparent relative overflow-hidden hover:border-obsidian-400/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-obsidian-200 text-xs lg:text-sm font-medium">{translate("إجمالي الطلاب")}</p>
              <div className="w-9 h-9 rounded-lg bg-obsidian-700/60 flex items-center justify-center shrink-0 text-emerald-light">
                <Users size={18} />
              </div>
            </div>
            <p className="font-num font-bold text-2xl lg:text-3xl text-emerald-light">
              {formatNumber(m?.total_students ?? 0)} <span className="text-sm font-normal text-obsidian-300">{translate("طالب")}</span>
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-obsidian-500/25">
            <p className="text-obsidian-400 text-xs mb-2 font-medium">{translate("توزيع الطلاب على الكورسات النشطة:")}</p>
            {courseStudentStats.length === 0 ? (
              <p className="text-obsidian-400 text-xs">{translate("لا توجد كورسات نشطة حالياً")}</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {courseStudentStats.map((cs) => (
                  <div key={cs.course_id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-obsidian-700/40">
                    <span className="text-obsidian-200 truncate font-medium">{cs.course_name}</span>
                    <span className="font-num font-bold text-emerald-light shrink-0 mr-2">
                      {cs.student_count} {translate("طالب")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. الدورات النشطة */}
        <div className="card-surface p-4 lg:p-5 bg-gradient-to-b from-azure-brand/15 to-transparent relative overflow-hidden hover:border-obsidian-400/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-obsidian-200 text-xs lg:text-sm font-medium">{translate("الدورات النشطة")}</p>
              <div className="w-9 h-9 rounded-lg bg-obsidian-700/60 flex items-center justify-center shrink-0 text-azure-brand">
                <BookOpen size={18} />
              </div>
            </div>
            <p className="font-num font-bold text-2xl lg:text-3xl text-azure-brand">
              {formatNumber(activeCourses.length || m?.active_courses || 0)} <span className="text-sm font-normal text-obsidian-300">{translate("دورة")}</span>
            </p>
            <p className="text-obsidian-300 text-xs mt-2">{translate("الدورات التدريبية المتاحة والمفتوحة للدراسة حالياً")}</p>
          </div>

          {activeCourses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-obsidian-500/25">
              <div className="flex flex-wrap gap-1.5">
                {activeCourses.map((c) => (
                  <span key={c.course_id} className="bg-obsidian-700/70 text-obsidian-200 border border-obsidian-500/30 text-[11px] px-2 py-0.5 rounded-md truncate max-w-[180px]">
                    {c.course_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. المبلغ المحصل على مدار الكورس النشط (المبلغ الإجمالي – المدفوع – المتبقي) */}
        {canReadFinance && (
          <div className="card-surface p-4 lg:p-5 bg-gradient-to-b from-amber-500/15 to-transparent relative overflow-hidden hover:border-obsidian-400/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-obsidian-200 text-xs lg:text-sm font-medium">{translate("المبالغ المحصلة للكورسات النشطة")}</p>
                  <p className="text-obsidian-400 text-[11px] mt-0.5">{translate("على مدار الدورات التدريبية الحالية")}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-obsidian-700/60 flex items-center justify-center shrink-0 text-amber-400">
                  <TrendingUp size={18} />
                </div>
              </div>

              {/* Grid 3 metrics: الإجمالي – المدفوع – المتبقي */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-1">
                <div className="bg-obsidian-700/40 rounded-lg p-2 text-center">
                  <p className="text-obsidian-400 text-[11px] mb-1">{translate("المبلغ الإجمالي")}</p>
                  <p className="font-num font-bold text-xs lg:text-sm text-obsidian-100">
                    {formatEGP(activeCoursesFinancials.expectedEgp)}
                  </p>
                  {activeCoursesFinancials.expectedUsd > 0 && (
                    <p className="font-num text-[11px] text-obsidian-300 mt-0.5">
                      {formatCurrency(activeCoursesFinancials.expectedUsd, 'USD')}
                    </p>
                  )}
                </div>
                <div className="bg-obsidian-700/40 rounded-lg p-2 text-center">
                  <p className="text-emerald-400 text-[11px] mb-1">{translate("المدفوع")}</p>
                  <p className="font-num font-bold text-xs lg:text-sm text-emerald-light">
                    {formatEGP(activeCoursesFinancials.paidEgp)}
                  </p>
                  {activeCoursesFinancials.paidUsd > 0 && (
                    <p className="font-num text-[11px] text-emerald-light/80 mt-0.5">
                      {formatCurrency(activeCoursesFinancials.paidUsd, 'USD')}
                    </p>
                  )}
                </div>
                <div className="bg-obsidian-700/40 rounded-lg p-2 text-center">
                  <p className="text-amber-400 text-[11px] mb-1">{translate("المتبقي")}</p>
                  <p className="font-num font-bold text-xs lg:text-sm text-amber-400">
                    {formatEGP(activeCoursesFinancials.remainingEgp)}
                  </p>
                  {activeCoursesFinancials.remainingUsd > 0 && (
                    <p className="font-num text-[11px] text-amber-400/80 mt-0.5">
                      {formatCurrency(activeCoursesFinancials.remainingUsd, 'USD')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Course-by-course progress breakdown */}
            {courseStudentStats.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-obsidian-500/25 space-y-1 text-[11px]">
                {courseStudentStats.map((cs) => (
                  <div key={cs.course_id} className="flex justify-between items-center text-obsidian-300">
                    <span className="truncate">{cs.course_name}:</span>
                    <span className="font-num text-obsidian-200">
                      {formatEGP(cs.paidEgp)} / {formatEGP(cs.expectedEgp)}
                      {cs.expectedUsd > 0 && ` · ${formatCurrency(cs.paidUsd, 'USD')} / ${formatCurrency(cs.expectedUsd, 'USD')}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cash Box Balances */}
      {canViewBoxes && activeBoxes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Wallet size={18} className="text-emerald-light" />
              {translate("أرصدة الخزن الحالية")}
            </h3>
            <span className="text-obsidian-400 text-xs">
              {translate("الرصيد الفعلي المتوفر في كل خزنة")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBoxes.map((box) => (
              <div
                key={box.cash_box_id}
                className="card-surface p-5 bg-gradient-to-br from-obsidian-700/60 to-obsidian-800/80 border border-obsidian-500/30 hover:border-obsidian-400/50 transition-all rounded-2xl flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-white font-bold text-base">{box.name}</h4>
                    <p className="text-obsidian-300 text-xs mt-0.5">{box.owner || translate("مسؤول الخزنة")}</p>
                  </div>
                  <Badge variant={box.type === 'Main' ? 'emerald' : 'blue'}>
                    {box.type === 'Main' ? translate("خزنة رئيسية") : box.type}
                  </Badge>
                </div>

                <div className="bg-obsidian-900/50 rounded-xl p-3.5 border border-obsidian-500/20 my-2 text-center">
                  <p className="text-obsidian-400 text-xs mb-1">{translate("الرصيد الفعلي المتوفر")}</p>
                  <p className={`font-num font-bold text-2xl ${box.current_balance < 0 ? 'text-rose-400' : 'text-emerald-light'}`}>
                    {formatBalance(box.current_balance)}
                  </p>
                  {(box.current_balance_usd ?? 0) !== 0 && (
                    <p className="font-num text-sm text-obsidian-200 mt-0.5">
                      {formatBalance(box.current_balance_usd ?? 0, 'USD')}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-obsidian-500/20 text-center text-[11px]">
                  <div>
                    <span className="text-obsidian-400 block">{translate("الوارد")}</span>
                    <span className="text-emerald-light font-num font-semibold">{formatEGP(Math.abs(box.total_payments_in))}</span>
                  </div>
                  <div>
                    <span className="text-obsidian-400 block">{translate("المنصرف")}</span>
                    <span className="text-rose-400 font-num font-semibold">{formatEGP(Math.abs(box.total_expenses_out))}</span>
                  </div>
                  <div>
                    <span className="text-obsidian-400 block">{translate("التحويلات")}</span>
                    <span className="text-azure-brand font-num font-semibold">
                      {box.total_transfers_in - box.total_transfers_out === 0
                        ? formatEGP(0)
                        : box.total_transfers_in >= box.total_transfers_out
                        ? `${translate("وارد")} ${formatEGP(box.total_transfers_in - box.total_transfers_out)}`
                        : `${translate("صادر")} ${formatEGP(Math.abs(box.total_transfers_in - box.total_transfers_out))}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive Recent Transactions Table (إيرادات ومصروفات وتحويلات) */}
      {canReadFinance && (
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-obsidian-500/40">
            <div>
              <h3 className="text-white font-bold text-base">{translate("أحدث المعاملات بالكامل")}</h3>
              <p className="text-obsidian-400 text-xs mt-0.5">{translate("سجل مجمع لكل الإيرادات والمصروفات والتحويلات الأخيرة")}</p>
            </div>
            <span className="text-obsidian-300 text-xs font-num">{totalTransactions} {translate("معاملة")}</span>
          </div>

          {transactionsLoading ? (
            <PageLoader />
          ) : totalTransactions === 0 ? (
            <EmptyState message={translate("لا توجد معاملات مسجلة بعد في النظام")} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30 bg-obsidian-700/20">
                      <th className="text-right font-medium px-4 py-3">{translate("نوع العملية")}</th>
                      <th className="text-right font-medium px-4 py-3">{translate("التاريخ")}</th>
                      <th className="text-right font-medium px-4 py-3">{translate("الخزنة")}</th>
                      <th className="text-right font-medium px-4 py-3">{translate("الطرف / البيان")}</th>
                      <th className="text-right font-medium px-4 py-3">{translate("المبلغ")}</th>
                      <th className="text-right font-medium px-4 py-3 hidden md:table-cell">{translate("طريقة الدفع / البيان")}</th>
                      <th className="text-right font-medium px-4 py-3">{translate("إيصال")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors">
                        {/* 1. نوع العملية */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {tx.type === 'payment' && (
                            <Badge variant="emerald">
                              <ArrowDownLeft size={12} className="inline ml-0.5" />
                              {tx.typeLabel}
                            </Badge>
                          )}
                          {tx.type === 'expense' && (
                            <Badge variant="rose">
                              <ArrowUpRight size={12} className="inline ml-0.5" />
                              {tx.typeLabel}
                            </Badge>
                          )}
                          {tx.type === 'transfer' && (
                            <Badge variant="blue">
                              <ArrowRightLeft size={12} className="inline ml-0.5" />
                              {tx.typeLabel}
                            </Badge>
                          )}
                        </td>

                        {/* 2. التاريخ */}
                        <td className="px-4 py-3 text-obsidian-300 font-num text-xs whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>

                        {/* 3. الخزنة */}
                        <td className="px-4 py-3 text-obsidian-200 text-xs whitespace-nowrap">
                          {tx.cashBoxName}
                        </td>

                        {/* 4. الطرف / البيان */}
                        <td className="px-4 py-3">
                          <p className="text-white font-medium text-xs">{tx.party}</p>
                          {tx.description && (
                            <p className="text-obsidian-300 text-[11px] mt-0.5 truncate max-w-[220px]" title={tx.description}>
                              {tx.description}
                            </p>
                          )}
                        </td>

                        {/* 5. المبلغ */}
                        <td className="px-4 py-3 font-num font-bold whitespace-nowrap text-xs">
                          {tx.type === 'payment' && (
                            <span className="text-emerald-light">{formatCurrency(Math.abs(tx.amount), tx.currency)}</span>
                          )}
                          {tx.type === 'expense' && (
                            <span className="text-rose-400">{formatCurrency(Math.abs(tx.amount), 'EGP')}</span>
                          )}
                          {tx.type === 'transfer' && (
                            <span className="text-azure-brand">{formatCurrency(Math.abs(tx.amount), 'EGP')}</span>
                          )}
                        </td>

                        {/* 6. طريقة الدفع */}
                        <td className="px-4 py-3 hidden md:table-cell text-obsidian-300 text-xs max-w-[180px] truncate" title={tx.methodOrNotes}>
                          {tx.methodOrNotes}
                        </td>

                        {/* 7. إيصال */}
                        <td className="px-4 py-3">
                          {tx.receiptData ? (
                            <button
                              onClick={() => setReceiptTarget(tx.receiptData!)}
                              className="btn-ghost p-1.5 text-obsidian-200 hover:text-emerald-light"
                              title={translate("عرض وطباعة إيصال السداد")}
                            >
                              <Printer size={15} />
                            </button>
                          ) : (
                            <span className="text-obsidian-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Universal Pagination */}
              <PaginationControls
                page={page}
                pageSize={pageSize}
                total={totalTransactions}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {canReadFinance && (
        <ReceiptModal
          open={!!receiptTarget}
          onClose={() => setReceiptTarget(null)}
          payment={receiptTarget}
        />
      )}
    </div>
  );
}
