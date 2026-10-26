import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState } from '@/components/site/States';

export function InventoryPanel() {
  const qc = useQueryClient(); const [search, setSearch] = useState(''); const [onlyLow, setOnlyLow] = useState(false); const [page, setPage] = useState(0);
  const variants = useQuery({ queryKey: ['inventory'], queryFn: async () => { const { data, error } = await supabase.from('product_variants').select('*, products(name_ar)').order('stock'); if (error) throw error; return data; } });
  const history = useQuery({ queryKey: ['inventory-history', page], queryFn: async () => { const { data, error, count } = await supabase.from('inventory_movements').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(page * 20, page * 20 + 19); if (error) throw error; return { data, count: count ?? 0 }; } });
  if (variants.isLoading) return <LoadingState />; if (variants.isError) return <ErrorState />;
  const refresh = () => { for (const key of ['inventory', 'inventory-history', 'admin-products', 'products', 'cart-variants']) void qc.invalidateQueries({ queryKey: [key] }); };
  const list = variants.data?.filter(v => `${v.products?.name_ar} ${v.size_label}`.includes(search) && (!onlyLow || v.stock <= v.low_stock_threshold));
  return <div className="space-y-6"><div className="flex flex-wrap items-center gap-4"><input className="field max-w-sm" placeholder="بحث بالمنتج أو الحجم" value={search} onChange={e => setSearch(e.target.value)} /><label className="flex gap-2 text-sm"><input type="checkbox" checked={onlyLow} onChange={e => setOnlyLow(e.target.checked)} />المخزون المنخفض فقط</label></div>
    <div className="divide-y border bg-card">{list?.map(v => <div key={v.id} className="flex flex-wrap items-center gap-5 p-4"><div className="min-w-44 flex-1"><p className="font-medium">{v.products?.name_ar} · {v.size_label}</p><p className={v.stock <= v.low_stock_threshold ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'}>{v.stock <= v.low_stock_threshold && <AlertTriangle className="me-1 inline size-4" />}{v.stock === 0 ? 'نفد المخزون' : `المتاح: ${v.stock}`}</p></div><StockAdjustment id={v.id} onSaved={refresh} /></div>)}</div>
    <h3 className="text-xl font-semibold">سجل حركة المخزون</h3>{history.isError ? <ErrorState /> : <div className="overflow-x-auto border bg-card"><table className="w-full min-w-[650px] text-start text-sm"><thead className="bg-secondary"><tr>{['المنتج', 'التغيير', 'بعد التعديل', 'السبب', 'التاريخ'].map(h => <th className="p-3 text-start" key={h}>{h}</th>)}</tr></thead><tbody>{history.data?.data.map(m => <tr className="border-t" key={m.id}><td className="p-3">{m.product_name} · {m.size_label}</td><td className="p-3" dir="ltr">{m.delta > 0 ? '+' : ''}{m.delta}</td><td className="p-3">{m.stock_after}</td><td className="p-3">{m.reason}</td><td className="p-3">{new Date(m.created_at).toLocaleString('ar-EG')}</td></tr>)}</tbody></table></div>}
    <div className="flex items-center gap-4"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>السابق</Button><span className="text-sm">{page + 1}</span><Button variant="outline" disabled={(page + 1) * 20 >= (history.data?.count ?? 0)} onClick={() => setPage(page + 1)}>التالي</Button></div>
  </div>;
}
function StockAdjustment({ id, onSaved }: { id: string; onSaved: () => void }) {
  const [delta, setDelta] = useState(''); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => { const n = Number(delta); if (!Number.isInteger(n) || n === 0 || reason.trim().length < 2) return void toast.error('أدخل عدد صحيح موجب أو سالب وسبب التعديل'); setBusy(true); const { error } = await supabase.rpc('adjust_stock', { _variant_id: id, _delta: n, _reason: reason }); setBusy(false); if (error) toast.error(error.message.includes('NEGATIVE_STOCK') ? 'لا يمكن أن يصبح المخزون سالباً' : 'تعذر تعديل المخزون'); else { toast.success('تم تعديل المخزون'); setDelta(''); setReason(''); onSaved(); } };
  return <div className="flex flex-wrap gap-2"><input className="field w-28" placeholder="+ / − كمية" aria-label="تغيير الكمية" value={delta} onChange={e => setDelta(e.target.value)} /><input className="field w-48" placeholder="سبب التعديل" value={reason} onChange={e => setReason(e.target.value)} /><Button disabled={busy} size="icon" title="حفظ تعديل المخزون" onClick={save}><Save /></Button></div>;
}