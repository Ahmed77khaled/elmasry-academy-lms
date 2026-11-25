import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, LoadingSpinner } from '@/components/ui/Feedback';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { formatCurrency, formatEGP, formatDate, formatBalance } from '@/lib/format';
import { translate } from '@/lib/translations';
import { supabase } from '@/lib/supabase';
import type { CashBoxBalance, Currency } from '@/types/database';
import { ArrowDownLeft, ArrowUpRight, Search, Filter } from 'lucide-react';

export interface LedgerTransaction {
  id: string;
  date: string;
  createdAt: string;
  type: 'payment_in' | 'expense_out' | 'transfer_in' | 'transfer_out';
  typeLabel: string;
  amount: number;
  currency: Currency;
  party: string;
  description: string;
  methodOrNotes: string;
  isVoid: boolean;
}

interface CashBoxLedgerModalProps {
  open: boolean;
  onClose: () => void;
  box: CashBoxBalance | null;
}

export function CashBoxLedgerModal({ open, onClose, box }: CashBoxLedgerModalProps) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'payment_in' | 'expense_out' | 'transfer'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!open || !box) {
      setTransactions([]);
      setSearch('');
      setTypeFilter('all');
      setPage(1);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const loadLedgerData = async () => {
      try {
        const [paymentsRes, expensesRes, transfersRes] = await Promise.allSettled([
          supabase.rpc('rbac_list_payments_v2', { p_limit: 500, p_offset: 0 }),
          supabase.rpc('rbac_list_expenses', { p_limit: 500, p_offset: 0 }),
          supabase.rpc('rbac_list_transfers', { p_limit: 500, p_offset: 0 }),
        ]);

        const items: LedgerTransaction[] = [];
        const boxId = box.cash_box_id;

        // 1. Process Payments
        if (paymentsRes.status === 'fulfilled' && !paymentsRes.value.error && Array.isArray(paymentsRes.value.data)) {
          for (const p of paymentsRes.value.data) {
            if (p.cash_box_id === boxId) {
              items.push({
                id: `pay-${p.payment_id}`,
                date: p.payment_date,
                createdAt: p.created_at,
                type: 'payment_in',
                typeLabel: translate('إيراد / دفعة طالب'),
                amount: Number(p.amount) || 0,
                currency: p.currency === 'USD' ? 'USD' : 'EGP',
                party: p.student_name || p.name || translate('طالب بالأكاديمية'),
                description: p.course_name ? `${p.course_name} (${p.receipt_number || translate('بدون إيصال')})` : (p.receipt_number || ''),
                methodOrNotes: [p.method, p.receipt_ref, p.notes].filter(Boolean).join(' • '),
                isVoid: Boolean(p.voided_at),
              });
            }
          }
        }

        // 2. Process Expenses
        if (expensesRes.status === 'fulfilled' && !expensesRes.value.error && Array.isArray(expensesRes.value.data)) {
          for (const e of expensesRes.value.data) {
            if (e.cash_box_id === boxId) {
              items.push({
                id: `exp-${e.expense_id}`,
                date: e.expense_date,
                createdAt: e.created_at,
                type: 'expense_out',
                typeLabel: translate('مصروف'),
                amount: Number(e.amount) || 0,
                currency: 'EGP',
                party: e.category || translate('مصروفات'),
                description: e.description || e.course_name || '',
                methodOrNotes: e.notes || '',
                isVoid: Boolean(e.voided_at),
              });
            }
          }
        }

        // 3. Process Transfers
        if (transfersRes.status === 'fulfilled' && !transfersRes.value.error && Array.isArray(transfersRes.value.data)) {
          for (const t of transfersRes.value.data) {
            if (t.from_box_id === boxId) {
              items.push({
                id: `tf-out-${t.transfer_id}`,
                date: t.transfer_date,
                createdAt: t.created_at,
                type: 'transfer_out',
                typeLabel: translate('تحويل صادر'),
                amount: Number(t.amount) || 0,
                currency: 'EGP',
                party: t.to_box_name || translate('خزنة أخرى'),
                description: `${translate('تحويل إلى')} ${t.to_box_name || ''}`,
                methodOrNotes: t.notes || '',
                isVoid: false,
              });
            } else if (t.to_box_id === boxId) {
              items.push({
                id: `tf-in-${t.transfer_id}`,
                date: t.transfer_date,
                createdAt: t.created_at,
                type: 'transfer_in',
                typeLabel: translate('تحويل وارد'),
                amount: Number(t.amount) || 0,
                currency: 'EGP',
                party: t.from_box_name || translate('خزنة أخرى'),
                description: `${translate('تحويل من')} ${t.from_box_name || ''}`,
                methodOrNotes: t.notes || '',
                isVoid: false,
              });
            }
          }
        }

        // Sort descending by date and time
        items.sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (isMounted) {
          setTransactions(items);
        }
      } catch (err) {
        console.error('Failed to load cash box ledger:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLedgerData();

    return () => {
      isMounted = false;
    };
  }, [open, box]);

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter((item) => {
      // Type filter
      if (typeFilter === 'payment_in' && item.type !== 'payment_in') return false;
      if (typeFilter === 'expense_out' && item.type !== 'expense_out') return false;
      if (typeFilter === 'transfer' && item.type !== 'transfer_in' && item.type !== 'transfer_out') return false;

      // Search query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const combined = `${item.party} ${item.description} ${item.methodOrNotes} ${item.typeLabel}`.toLowerCase();
        if (!combined.includes(query)) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, search]);

  const total = filtered.length;
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  if (!box) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${translate('سجل حركات')} ${box.name}`}
      subtitle={`${translate('المسؤول')}: ${box.owner ?? '—'}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Cash Box Summary Mini Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-obsidian-700/50 border border-obsidian-500/30 rounded-xl p-3 text-center">
            <p className="text-obsidian-300 text-xs mb-1">{translate('الرصيد الفعلي المتوفر')}</p>
            <p className={`font-num font-bold text-lg ${box.current_balance < 0 ? 'text-rose-400' : 'text-emerald-light'}`}>
              {formatBalance(box.current_balance)}
            </p>
            {(box.current_balance_usd ?? 0) !== 0 && (
              <p className="font-num text-xs text-obsidian-200 mt-0.5">
                {formatBalance(box.current_balance_usd ?? 0, 'USD')}
              </p>
            )}
          </div>
          <div className="bg-obsidian-700/30 border border-obsidian-500/20 rounded-xl p-3 text-center">
            <p className="text-obsidian-300 text-xs mb-1">{translate('المقبوضات الواردة')}</p>
            <p className="text-emerald-light font-num font-bold text-base">
              {formatEGP(box.total_payments_in)}
            </p>
          </div>
          <div className="bg-obsidian-700/30 border border-obsidian-500/20 rounded-xl p-3 text-center">
            <p className="text-obsidian-300 text-xs mb-1">{translate('المصروفات الصادرة')}</p>
            <p className="text-rose-400 font-num font-bold text-base">
              {formatEGP(box.total_expenses_out)}
            </p>
          </div>
          <div className="bg-obsidian-700/30 border border-obsidian-500/20 rounded-xl p-3 text-center">
            <p className="text-obsidian-300 text-xs mb-1">{translate('صافي حركات التحويل')}</p>
            <p className="text-azure-light font-num font-bold text-base">
              {box.total_transfers_in - box.total_transfers_out === 0
                ? formatEGP(0)
                : box.total_transfers_in >= box.total_transfers_out
                ? `${translate('وارد')} ${formatEGP(box.total_transfers_in - box.total_transfers_out)}`
                : `${translate('صادر')} ${formatEGP(Math.abs(box.total_transfers_in - box.total_transfers_out))}`}
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-obsidian-700/30 p-2.5 rounded-xl border border-obsidian-500/20">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-obsidian-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={translate('بحث بالطرف، البيان، أو رقم الإيصال...')}
                className="input-base pr-9 py-1.5 text-xs w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-obsidian-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'all' | 'payment_in' | 'expense_out' | 'transfer');
                setPage(1);
              }}
              className="input-base py-1.5 text-xs w-auto"
            >
              <option value="all">{translate('كل الحركات')}</option>
              <option value="payment_in">{translate('مقبوضات واردة (إيرادات)')}</option>
              <option value="expense_out">{translate('مصروفات صادرة')}</option>
              <option value="transfer">{translate('تحويلات بين الخزن')}</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card-surface overflow-hidden border border-obsidian-500/30">
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <LoadingSpinner size={28} />
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-8">
              <EmptyState message={translate('لا توجد حركات مسجلة لهذه الخزنة تطابق الفلتر')} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="border-b border-obsidian-500/40 text-obsidian-300 font-semibold bg-obsidian-700/20">
                      <th className="py-2.5 px-3">{translate('التاريخ')}</th>
                      <th className="py-2.5 px-3">{translate('نوع الحركة')}</th>
                      <th className="py-2.5 px-3">{translate('الطرف / البيان')}</th>
                      <th className="py-2.5 px-3">{translate('المبلغ')}</th>
                      <th className="py-2.5 px-3">{translate('طريقة الدفع / الملاحظات')}</th>
                      <th className="py-2.5 px-3">{translate('الحالة')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-obsidian-500/20">
                    {paginated.map((item) => {
                      const isPositive = item.type === 'payment_in' || item.type === 'transfer_in';
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-obsidian-500/10 transition-colors ${
                            item.isVoid ? 'opacity-40 line-through' : ''
                          }`}
                        >
                          {/* Date */}
                          <td className="py-2.5 px-3 text-obsidian-300 whitespace-nowrap font-num">
                            {formatDate(item.date)}
                          </td>

                          {/* Type */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              {item.type === 'payment_in' && (
                                <Badge variant="emerald">
                                  <ArrowDownLeft size={12} className="inline ml-0.5" />
                                  {item.typeLabel}
                                </Badge>
                              )}
                              {item.type === 'expense_out' && (
                                <Badge variant="rose">
                                  <ArrowUpRight size={12} className="inline ml-0.5" />
                                  {item.typeLabel}
                                </Badge>
                              )}
                              {item.type === 'transfer_in' && (
                                <Badge variant="blue">
                                  <ArrowDownLeft size={12} className="inline ml-0.5" />
                                  {item.typeLabel}
                                </Badge>
                              )}
                              {item.type === 'transfer_out' && (
                                <Badge variant="amber">
                                  <ArrowUpRight size={12} className="inline ml-0.5" />
                                  {item.typeLabel}
                                </Badge>
                              )}
                            </span>
                          </td>

                          {/* Party / Description */}
                          <td className="py-2.5 px-3">
                            <p className="text-white font-medium">{item.party}</p>
                            {item.description && (
                              <p className="text-obsidian-300 text-[11px] mt-0.5">{item.description}</p>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-num font-bold text-sm">
                            <span
                              className={
                                item.isVoid
                                  ? 'text-obsidian-400'
                                  : isPositive
                                  ? 'text-emerald-light'
                                  : 'text-rose-400'
                              }
                            >
                              {formatCurrency(Math.abs(item.amount), item.currency)}
                            </span>
                          </td>

                          {/* Notes / Method */}
                          <td className="py-2.5 px-3 text-obsidian-300 max-w-[180px] truncate" title={item.methodOrNotes}>
                            {item.methodOrNotes || '—'}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {item.isVoid ? (
                              <Badge variant="gray">{translate('ملغاة')}</Badge>
                            ) : (
                              <Badge variant="emerald">{translate('نشطة')}</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <PaginationControls
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
              />
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
            {translate('إغلاق')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
