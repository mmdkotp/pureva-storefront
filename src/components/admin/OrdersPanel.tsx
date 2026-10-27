import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState, ErrorState, EmptyState } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { Printer, Save } from "lucide-react";
import { formatEGP } from "@/lib/pricing";

export const ORDER_STATUS: Record<string, string> = {
  new: "بانتظار التأكيد",
  preparing: "جاري التجهيز",
  confirmed: "تم التأكيد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export function OrdersPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [packing, setPacking] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = async (id: string, status: string) => {
    if (status === "cancelled" && !confirm("إلغاء الطلب؟ تتم إعادة المخزون حسب إعدادات المتجر، ولا يمكن إعادة فتح الطلب الملغي.")) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return void toast.error("تعذر تحديث الحالة");
    toast.success("تم تحديث الحالة");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["inventory"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["customers-orders"] });
  };

  if (orders.isLoading) return <LoadingState />;
  if (orders.isError) return <ErrorState />;
  const list = (orders.data ?? []).filter((o) => (filter === "all" || o.status === filter) && `${o.order_number} ${o.customer_name} ${o.phone}`.toLowerCase().includes(search.toLowerCase()) && (!date || o.created_at.startsWith(date)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 print:hidden"><input className="field max-w-sm" placeholder="بحث برقم الطلب أو الهاتف أو الاسم" value={search} onChange={e => {setSearch(e.target.value);setPage(0);}} /><input aria-label="تاريخ الطلب" className="field w-48" type="date" value={date} onChange={e=>{setDate(e.target.value);setPage(0);}} /></div>
      <div className="flex flex-wrap gap-2">
        {["all", ...Object.keys(ORDER_STATUS)].map((s) => (
          <Button variant={filter === s ? "default" : "outline"} key={s} onClick={() => {setFilter(s);setPage(0);}} className={`border px-3 py-1.5 text-sm ${filter === s ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {s === "all" ? "الكل" : ORDER_STATUS[s]} ({s === "all" ? orders.data?.length : orders.data?.filter((o) => o.status === s).length})
          </Button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title="لا توجد طلبات" />
      ) : (
        <div className="divide-y border bg-card">
          {list.slice(page*20,page*20+20).map((o) => (
            <div key={o.id} className={`p-4 ${printId && printId !== o.id ? "print:hidden" : ""}`}><div className="hidden print:block"><h2 className="text-2xl">KLEANTOP · {packing ? "إذن تعبئة" : "فاتورة طلب"}</h2></div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" className="h-auto flex-col items-start whitespace-normal text-start" onClick={() => {setOpen(open === o.id ? null : o.id);setNote(o.internal_notes ?? "");}}>
                  <p className="font-mono text-sm" dir="ltr">{o.order_number}</p>
                  <p className="text-sm">{o.customer_name} · <span dir="ltr">{o.phone}</span> · {o.city}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ar-EG")}</p>
                </Button>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatEGP(o.total)}</span>
                  <select disabled={o.status === "cancelled"} className="field h-9 w-36 print:hidden" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                    {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              {open === o.id && (
                <div className="mt-4 space-y-2 bg-secondary p-4 text-sm">
                  <div className="flex flex-wrap gap-2 print:hidden"><Button variant="outline" onClick={() => {setPrintId(o.id);setPacking(false);setTimeout(()=>window.print(),100);}}><Printer />طباعة فاتورة</Button><Button variant="outline" onClick={() => {setPrintId(o.id);setPacking(true);setTimeout(()=>window.print(),100);}}><Printer />إذن تعبئة</Button></div>
                  <p><strong>العنوان:</strong> {o.address}</p>
                  {o.notes && <p><strong>ملاحظات:</strong> {o.notes}</p>}
                  <ul className="divide-y border-y">
                    {o.order_items.map((i) => (
                      <li key={i.id} className="flex justify-between py-2">
                        <span>{i.product_name} · {i.size_label} × {i.quantity}</span>
                        {!packing && <span>{formatEGP(i.unit_price * i.quantity)}{i.discount_amount>0 && ` · خصم ${formatEGP(i.discount_amount)}`}</span>}
                      </li>
                    ))}
                  </ul>
                  <p className={packing ? "print:hidden" : ""}>الخصم: {formatEGP(o.discount)} · الكوبون: {o.coupon_code ?? "—"} · الإجمالي: {formatEGP(o.total)}</p>
                  <div className="space-y-2 print:hidden"><label className="block">ملاحظات داخلية خاصة<textarea className="field h-20 py-2" value={note} onChange={e=>setNote(e.target.value)} /></label><Button disabled={busy} onClick={async()=>{setBusy(true);const {error}=await supabase.from("orders").update({internal_notes:note}).eq("id",o.id);setBusy(false);if(error)toast.error("تعذر حفظ الملاحظات");else toast.success("تم حفظ الملاحظات");}}><Save />حفظ الملاحظات</Button></div>
                  <p>الفرعي: {formatEGP(o.subtotal)} · الشحن: {o.shipping_fee == null ? "لم يُحدد" : formatEGP(o.shipping_fee)} · الدفع: عند الاستلام</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-4 print:hidden"><Button variant="outline" disabled={page===0} onClick={()=>setPage(page-1)}>السابق</Button><span>{page+1}</span><Button variant="outline" disabled={(page+1)*20>=list.length} onClick={()=>setPage(page+1)}>التالي</Button></div>
    </div>
  );
}
