import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingState, ErrorState } from "@/components/site/States";
import { FormField } from "@/components/site/InquiryForm";
import { settingsQuery } from "@/lib/store";
import { isValidEgyptPhone } from "@/lib/pricing";

type S = NonNullable<Awaited<ReturnType<typeof settingsQuery.queryFn & {}>>>;

const textFields: { k: keyof S; label: string; ltr?: boolean; area?: boolean }[] = [
  { k: "hero_title", label: "عنوان الصفحة الرئيسية" },
  { k: "hero_subtitle", label: "النص تحت العنوان" },
  { k: "hero_image_url", label: "رابط صورة البانر (https، اختياري)", ltr: true },
  { k: "phone", label: "رقم الهاتف", ltr: true },
  { k: "whatsapp", label: "رقم واتساب (01xxxxxxxxx)", ltr: true },
  { k: "email", label: "البريد الإلكتروني", ltr: true },
  { k: "address", label: "العنوان" },
  { k: "facebook_url", label: "رابط فيسبوك", ltr: true },
  { k: "instagram_url", label: "رابط إنستجرام", ltr: true },
  { k: "tiktok_url", label: "رابط تيك توك", ltr: true },
  { k: "shipping_policy", label: "سياسة الشحن", area: true },
  { k: "returns_policy", label: "سياسة الاسترجاع", area: true },
  { k: "privacy_policy", label: "سياسة الخصوصية", area: true },
];

export function SettingsPanel() {
  const qc = useQueryClient();
  const settings = useQuery(settingsQuery);
  const [s, setS] = useState<S | null>(null);
  const [threshold, setThreshold] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.data) {
      setS(settings.data);
      setThreshold(settings.data.free_shipping_threshold?.toString() ?? "");
    }
  }, [settings.data]);

  if (settings.isLoading || !s) return settings.isError ? <ErrorState /> : <LoadingState />;

  const save = async () => {
    const th = threshold.trim() === "" ? null : Number(threshold);
    if (th != null && (isNaN(th) || th < 0)) return toast.error("حد الشحن المجاني غير صحيح");
    if (s.whatsapp && !isValidEgyptPhone(s.whatsapp)) return toast.error("رقم واتساب غير صحيح");
    for (const k of ["hero_image_url", "facebook_url", "instagram_url", "tiktok_url"] as const) {
      if (s[k] && !/^https:\/\//.test(s[k]!)) return toast.error("الروابط لازم تبدأ بـ https://");
    }
    setSaving(true);
    const { id: _id, updated_at: _u, ...rest } = s;
    const clean = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v]));
    const { error } = await supabase.from("store_settings").update({ ...clean, free_shipping_threshold: th }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error("تعذر الحفظ");
    toast.success("تم حفظ الإعدادات");
    qc.invalidateQueries({ queryKey: ["settings"] });
  };

  return (
    <div className="space-y-6 border bg-card p-6">
      <div className="flex flex-wrap gap-8">
        <label className="flex items-center gap-3 text-sm">الدفع عند الاستلام <Switch checked={s.cod_enabled} onCheckedChange={(v) => setS({ ...s, cod_enabled: v })} /></label>
        <label className="flex items-center gap-3 text-sm">إظهار أسعار الجملة للزوار <Switch checked={s.show_wholesale_prices} onCheckedChange={(v) => setS({ ...s, show_wholesale_prices: v })} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="حد الشحن المجاني (ج.م، اتركه فارغاً لإلغائه)">
          <input className="field" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </FormField>
        {textFields.map((f) => (
          <div key={f.k} className={f.area ? "md:col-span-2" : ""}>
            <FormField label={f.label}>
              {f.area ? (
                <textarea className="field h-28 py-2" value={(s[f.k] as string) ?? ""} onChange={(e) => setS({ ...s, [f.k]: e.target.value })} />
              ) : (
                <input className="field" dir={f.ltr ? "ltr" : undefined} value={(s[f.k] as string) ?? ""} onChange={(e) => setS({ ...s, [f.k]: e.target.value })} />
              )}
            </FormField>
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving}><Save /> حفظ الإعدادات</Button>
    </div>
  );
}
