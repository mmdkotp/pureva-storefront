import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState, ErrorState, EmptyState } from "@/components/site/States";
import { whatsappLink } from "@/lib/pricing";

const STATUS: Record<string, string> = { new: "جديد", in_progress: "قيد المتابعة", closed: "مغلق" };

export function InquiriesPanel() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<"all" | "wholesale" | "contact">("all");
  const q = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) return toast.error("تعذر التحديث");
    qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
  };

  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState />;
  const list = (q.data ?? []).filter((i) => kind === "all" || i.kind === kind);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["all", "wholesale", "contact"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`border px-3 py-1.5 text-sm ${kind === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {k === "all" ? "الكل" : k === "wholesale" ? "طلبات الجملة" : "رسائل العملاء"}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title="لا توجد رسائل" />
      ) : (
        <div className="divide-y border bg-card">
          {list.map((i) => {
            const wa = whatsappLink(i.phone);
            return (
              <div key={i.id} className="flex flex-wrap justify-between gap-4 p-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">
                    <span className="me-2 border px-1.5 py-0.5 text-xs">{i.kind === "wholesale" ? "جملة" : "رسالة"}</span>
                    {i.business_name ? `${i.business_name} — ` : ""}{i.name}
                  </p>
                  <p dir="ltr" className="text-start">{i.phone}{i.city ? ` · ${i.city}` : ""}</p>
                  {i.business_type && <p>النشاط: {i.business_type}</p>}
                  {i.quantities && <p>الكميات: {i.quantities}</p>}
                  {i.message && <p className="whitespace-pre-line text-muted-foreground">{i.message}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString("ar-EG")}</p>
                </div>
                <div className="flex items-start gap-2">
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="border px-3 py-1.5">واتساب</a>}
                  <select className="field h-9 w-36" value={i.status} onChange={(e) => setStatus(i.id, e.target.value)}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
