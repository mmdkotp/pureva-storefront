import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState } from '@/components/site/States';
import { formatEGP } from '@/lib/pricing';
import { ORDER_STATUS } from './OrdersPanel';

export function CustomersPanel() {
  const [search, setSearch] = useState(''); const [selected, setSelected] = useState<string | null>(null); const [page, setPage] = useState(0);
  const rows = useQuery({ queryKey: ['customers-orders'], queryFn: async () => { const { data, error } = await supabase.from('orders').select('id,order_number,customer_name,phone,city,address,status,total,created_at').order('created_at', { ascending: false }); if (error) throw error; return data; } });
  if (rows.isLoading) return <LoadingState />; if (rows.isError) return <ErrorState />;
  const customers = Array.from(new Map(rows.data?.map(o => [o.phone, o])).values()).filter(c => `${c.phone} ${c.customer_name}`.includes(search));
  return <div className="space-y-5"><input className="field max-w-sm" placeholder="بحث بالاسم أو الهاتف" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /><div className="divide-y border bg-card">{customers.slice(page*20,page*20+20).map(c => { const orders = rows.data?.filter(o => o.phone === c.phone) ?? []; return <div key={c.phone} className="p-4"><Button variant="ghost" className="h-auto w-full flex-wrap justify-between whitespace-normal text-start" onClick={() => setSelected(selected === c.phone ? null : c.phone)}><span>{c.customer_name} · <span dir="ltr">{c.phone}</span> · {c.city}</span><span>{orders.length} طلب · مشتريات مكتملة {formatEGP(orders.filter(o => o.status === 'delivered').reduce((s,o) => s+o.total,0))}</span></Button>{selected === c.phone && <div className="mt-4 space-y-3 border-t pt-4"><p className="text-sm">{c.address}</p>{orders.map(o => <p key={o.id} className="flex flex-wrap justify-between gap-2 text-sm"><span dir="ltr">{o.order_number}</span><span>{ORDER_STATUS[o.status]} · {formatEGP(o.total)} · {new Date(o.created_at).toLocaleDateString('ar-EG')}</span></p>)}</div>}</div>; })}</div><div className="flex gap-4"><Button variant="outline" disabled={page===0} onClick={() => setPage(page-1)}>السابق</Button><Button variant="outline" disabled={(page+1)*20>=customers.length} onClick={() => setPage(page+1)}>التالي</Button></div></div>;
}