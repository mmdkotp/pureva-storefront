import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingState, ErrorState } from "@/components/site/States";

type Zone = { id: string; city: string; fee: number | null; active: boolean; sort_order: number; delivery_info: string | null };

export function ShippingPanel() {
  const qc = useQueryClient();
  const zones = useQuery({
    queryKey: ["admin-zones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipping_zones").select("*").order("sort_order");
      if (error) throw error;
      return data as Zone[];
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-zones"] });
    qc.invalidateQueries({ queryKey: ["zones"] });
  };
  const [newCity, setNewCity] = useState("");

  const add = async () => {
    if (newCity.trim().length < 2) return void toast.error("اكتب اسم المدينة");
    const { error } = await supabase.from("shipping_zones").insert({ city: newCity.trim(), sort_order: (zones.data?.length ?? 0) + 1 });
    if (error) return void toast.error(error.code === "23505" ? "المدينة موجودة بالفعل" : "تعذر الإضافة");
    setNewCity("");
    refresh();
  };

  if (zones.isLoading) return <LoadingState />;
  if (zones.isError) return <ErrorState />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">اترك رسوم الشحن فارغة لو هتتحدد مع العميل عند التأكيد. حد الشحن المجاني من تبويب الإعدادات.</p>
      <div className="divide-y border bg-card">
        {zones.data?.map((z) => <ZoneRow key={z.id} zone={z} onSaved={refresh} />)}
      </div>
      <div className="flex gap-2">
        <input className="field max-w-xs" placeholder="مدينة / محافظة جديدة" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
        <Button variant="outline" onClick={add}><Plus /> إضافة</Button>
      </div>
    </div>
  );
}

function ZoneRow({ zone, onSaved }: { zone: Zone; onSaved: () => void }) {
  const [city, setCity] = useState(zone.city);
  const [fee, setFee] = useState(zone.fee?.toString() ?? "");
  const [delivery, setDelivery] = useState(zone.delivery_info ?? "");
  const [active, setActive] = useState(zone.active);
  const save = async () => {
    const f = fee.trim() === "" ? null : Number(fee);
    if (f != null && (isNaN(f) || f < 0)) return void toast.error("رسوم غير صحيحة");
    const { error } = await supabase.from("shipping_zones").update({ city: city.trim(), fee: f, active, delivery_info: delivery }).eq("id", zone.id);
    if (error) return void toast.error("تعذر الحفظ");
    toast.success("تم الحفظ");
    onSaved();
  };
  const remove = async () => {
    if (!confirm("حذف المنطقة؟")) return;
    const { error } = await supabase.from("shipping_zones").delete().eq("id", zone.id);
    if (error) return void toast.error("تعذر الحذف");
    onSaved();
  };
  return (
    <div className="flex flex-wrap items-center gap-3 p-3">
      <input className="field h-9 w-48" value={city} onChange={(e) => setCity(e.target.value)} />
      <input className="field h-9 w-32" inputMode="decimal" placeholder="الرسوم (ج.م)" value={fee} onChange={(e) => setFee(e.target.value)} />
      <input className="field h-9 w-48" placeholder="مدة التوصيل المتوقعة" value={delivery} onChange={e=>setDelivery(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">متاح <Switch checked={active} onCheckedChange={setActive} /></label>
      <Button size="sm" onClick={save}><Save /> حفظ</Button>
      <Button size="sm" variant="ghost" onClick={remove} aria-label="حذف"><Trash2 /></Button>
    </div>
  );
}
