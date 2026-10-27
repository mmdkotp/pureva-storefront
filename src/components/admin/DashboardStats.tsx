import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatEGP } from '@/lib/pricing';
import { ErrorState } from '@/components/site/States';

export function DashboardStats() {
  const stats = useQuery({ queryKey: ['admin-stats'], refetchInterval: 15000, queryFn: async () => {
    const o = await supabase.from('orders').select('status,total');
    const p = await supabase.from('products').select('id', { count: 'exact', head: true });
    const v = await supabase.from('product_variants').select('stock,low_stock_threshold');
    if (o.error || p.error || v.error) throw o.error || p.error || v.error;
    return { orders: o.data.length, pending: o.data.filter(x => x.status === 'new').length, revenue: o.data.filter(x => x.status === 'delivered').reduce((s,x) => s+x.total,0), products: p.count ?? 0, low: v.data.filter(x => x.stock<=x.low_stock_threshold).length };
  } });
  if (stats.isError) return <ErrorState />;
  return <dl className="mb-8 grid grid-cols-2 gap-5 border-y py-6 lg:grid-cols-5">{[['الطلبات',stats.data?.orders],['بانتظار التأكيد',stats.data?.pending],['مبيعات مكتملة',stats.data ? formatEGP(stats.data.revenue) : undefined],['المنتجات',stats.data?.products],['مخزون منخفض',stats.data?.low]].map(([title,value]) => <div key={title}><dt className="text-xs text-muted-foreground">{title}</dt><dd className="mt-3 text-2xl font-semibold">{value ?? '—'}</dd></div>)}</dl>;
}