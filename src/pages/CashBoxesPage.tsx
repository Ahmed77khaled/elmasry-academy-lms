import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
import { useState } from 'react';
import { Plus, ArrowRightLeft, Archive } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { Alert } from '@/components/ui/Alert';
import { CashBoxForm, TransferForm } from '@/components/forms/CashBoxForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatEGP } from '@/lib/format';
import type { CashBoxBalance } from '@/types/database';
import { useAuth } from '@/context/useAuth';

const TYPE_LABELS: Record<string, string> = {
  'Main': 'رئيسية', 'Branch': 'فرع', 'Online': 'أونلاين', 'Bank': 'بنك', 'Petty Cash': 'فرعية',
};

const TYPE_VARIANTS: Record<string, 'emerald' | 'blue' | 'amber' | 'violet' | 'gray'> = {
  'Main': 'emerald', 'Branch': 'blue', 'Online': 'amber', 'Bank': 'violet', 'Petty Cash': 'gray',
};

export function CashBoxesPage() {
  const { permissions } = useAuth();
  const canCreateCashBox = permissions.includes('finance.cash_boxes.create');
  const canArchiveCashBox = permissions.includes('finance.cash_boxes.archive');
  const canTransferFunds = permissions.includes('finance.transfers.create');
  const [formOpen, setFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<CashBoxBalance | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const { data: boxes, loading, refetch } = useQuery<CashBoxBalance[]>(async () => {
    const { data, error } = await supabase.rpc('rbac_list_cash_boxes');
    return { data: data as CashBoxBalance[] | null, error: error?.message ?? null };
  });

  const handleArchive = async () => {
    if (!archiveTarget || !canArchiveCashBox) return;
    setArchiving(true);
    setArchiveError(null);
    try {
      const { data, error } = await supabase.rpc('rbac_archive_cash_box', {
        p_cash_box_id: archiveTarget.cash_box_id,
      });

      if (error) {
        setArchiveError(error.message || translate("تعذر أرشفة الخزنة. حاول مرة أخرى."));
        return;
      }

      if (data !== true) {
        setArchiveError(translate("لم يتم العثور على الخزنة أو لا تملك صلاحية أرشفتها."));
        return;
      }

      setArchiveTarget(null);
      refetch();
    } catch {
      setArchiveError(translate("تعذر الاتصال بالخادم لإتمام الأرشفة. تحقق من اتصالك وحاول مرة أخرى."));
    } finally {
      setArchiving(false);
    }
  };

  if (loading) return <PageLoader />;

  const activeBoxes = boxes?.filter((b) => b.is_active) ?? [];
  const archivedBoxes = boxes?.filter((b) => !b.is_active) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">{translate("الخزن وصناديق المال")}</h2>
          <p className="text-obsidian-300 text-sm mt-1">{translate("إدارة كل صناديق المال والأرصدة")}</p>
        </div>
        <div className="flex gap-2">
          {canTransferFunds && <button onClick={() => setTransferOpen(true)} className="btn-secondary" disabled={activeBoxes.length < 2}>
            <ArrowRightLeft size={18} />
            {translate("تحويل أموال")}</button>}
          {canCreateCashBox && <button onClick={() => setFormOpen(true)} className="btn-primary">
            <Plus size={18} />
            {translate("إنشاء خزنة")}</button>}
        </div>
      </div>

      {activeBoxes.length === 0 && archivedBoxes.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            message={translate("لا توجد خزن منشأة — اضغط على زر إنشاء خزنة للبدء")}
            action={canCreateCashBox ? <button onClick={() => setFormOpen(true)} className="btn-primary"><Plus size={16} /> {translate("إنشاء خزنة")}</button> : undefined}
          />
        </div>
      ) : (
        <>
          {/* Active boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeBoxes.map((box) => (
              <div key={box.cash_box_id} className="card-surface p-5 hover:border-obsidian-400/50 transition-all">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-white font-bold text-base">{box.name}</h3>
                    <p className="text-obsidian-300 text-xs mt-1">{box.owner ?? '—'}</p>
                  </div>
                  <Badge variant={TYPE_VARIANTS[box.type] ?? 'gray'}>
                    {translate(TYPE_LABELS[box.type] ?? box.type)}
                  </Badge>
                </div>

                <div className="bg-obsidian-700/40 rounded-xl p-4 mb-4 text-center">
                  <p className="text-obsidian-300 text-xs mb-1">{translate("الرصيد الفعلي المتوفر")}</p>
                  <p className={`font-num font-bold text-2xl ${box.current_balance < 0 ? 'text-rose-400' : 'text-emerald-light'}`}>
                    {formatEGP(box.current_balance)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-obsidian-700/30 rounded-lg p-2.5">
                    <p className="text-obsidian-300 mb-0.5">{translate("رصيد بداية المدة")}</p>
                    <p className="text-obsidian-100 font-num font-semibold">{formatEGP(box.opening_balance)}</p>
                  </div>
                  <div className="bg-obsidian-700/30 rounded-lg p-2.5">
                    <p className="text-obsidian-300 mb-0.5">{translate("المقبوضات الواردة")}</p>
                    <p className="text-emerald-light font-num font-semibold">{formatEGP(box.total_payments_in)}</p>
                  </div>
                  <div className="bg-obsidian-700/30 rounded-lg p-2.5">
                    <p className="text-obsidian-300 mb-0.5">{translate("المصروفات الصادرة")}</p>
                    <p className="text-rose-400 font-num font-semibold">{formatEGP(box.total_expenses_out)}</p>
                  </div>
                  <div className="bg-obsidian-700/30 rounded-lg p-2.5">
                    <p className="text-obsidian-300 mb-0.5">{translate("صافي حركات التحويل")}</p>
                    <p className="text-azure-brand font-num font-semibold">
                      {formatEGP(box.total_transfers_in - box.total_transfers_out)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-obsidian-500/20">
                  <button
                    onClick={() => setTransferOpen(true)}
                    className="btn-secondary flex-1 text-xs py-1.5"
                    disabled={activeBoxes.length < 2}
                  >
                    <ArrowRightLeft size={14} /> {translate("تحويل أموال")}</button>
                  {canArchiveCashBox && <button
                    onClick={() => setArchiveTarget(box)}
                    className="btn-ghost text-xs py-1.5 text-obsidian-300 hover:text-amber-400"
                    title={translate("أرشفة الخزنة")}
                  >
                    <Archive size={14} /> {translate("أرشفة")}</button>}
                </div>
              </div>
            ))}
          </div>

          {/* Archived boxes */}
          {archivedBoxes.length > 0 && (
            <div className="space-y-3 mt-8">
              <h3 className="text-obsidian-300 text-sm font-semibold">{translate("الخزن المؤرشفة")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {archivedBoxes.map((box) => (
                  <div key={box.cash_box_id} className="card-surface p-4 opacity-50 hover:opacity-80 transition-opacity">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium text-sm">{box.name}</h4>
                      <Badge variant="gray">{translate("مؤرشفة")}</Badge>
                    </div>
                    <p className="text-obsidian-300 text-xs font-num">
                      {translate("الرصيد:")}{' '}{formatEGP(box.current_balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <CashBoxForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} />
      <TransferForm open={transferOpen} onClose={() => setTransferOpen(false)} onSaved={refetch} cashBoxes={activeBoxes} />
      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => {
          if (!archiving) {
            setArchiveTarget(null);
            setArchiveError(null);
          }
        }}
        onConfirm={handleArchive}
        title={translate("أرشفة الخزنة")}
        message={translateTemplate('هل أنت متأكد من أرشفة خزنة "{box}"؟ لن تظهر في خيارات الدفع أو الصرف ولكن ستبقى كل معاملاتها التاريخية محفوظة.', { box: archiveTarget?.name ?? '' })}
        confirmLabel={translate("أرشفة")}
        loading={archiving}
        danger={false}
      >
        {archiveError && <Alert variant="error">{archiveError}</Alert>}
      </ConfirmDialog>
    </div>
  );
}
