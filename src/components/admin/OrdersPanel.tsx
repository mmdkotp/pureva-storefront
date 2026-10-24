import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState, ErrorState, EmptyState } from "@/components/site/States";
import { formatEGP } from "@/lib/pricing";

export const ORDER_STATUS: Record<string, string> = {
  new: "جديد",
  confirmed: "تم التأكيد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export function OrdersPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error("تعذر تحديث الحالة");
    toast.success("تم تحديث الحالة");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  if (orders.isLoading) return <LoadingState />;
  if (orders.isError) return <ErrorState />;
  const list = (orders.data ?? []).filter((o) => filter === "all" || o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", ...Object.keys(ORDER_STATUS)].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`border px-3 py-1.5 text-sm ${filter === s ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {s === "all" ? "الكل" : ORDER_STATUS[s]} ({s === "all" ? orders.data?.length : orders.data?.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title="لا توجد طلبات" />
      ) : (
        <div className="divide-y border bg-card">
          {list.map((o) => (
            <div key={o.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button className="text-start" onClick={() => setOpen(open === o.id ? null : o.id)}>
                  <p className="font-mono text-sm" dir="ltr">{o.order_number}</p>
                  <p className="text-sm">{o.customer_name} · <span dir="ltr">{o.phone}</span> · {o.city}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ar-EG")}</p>
                </button>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatEGP(o.total)}</span>
                  <select className="field h-9 w-36" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                    {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              {open === o.id && (
                <div className="mt-4 space-y-2 bg-secondary p-4 text-sm">
                  <p><strong>العنوان:</strong> {o.address}</p>
                  {o.notes && <p><strong>ملاحظات:</strong> {o.notes}</p>}
                  <ul className="divide-y border-y">
                    {o.order_items.map((i) => (
                      <li key={i.id} className="flex justify-between py-2">
                        <span>{i.product_name} · {i.size_label} × {i.quantity}</span>
                        <span>{formatEGP(i.unit_price * i.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <p>الفرعي: {formatEGP(o.subtotal)} · الشحن: {o.shipping_fee == null ? "لم يُحدد" : formatEGP(o.shipping_fee)} · الدفع: عند الاستلام</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
