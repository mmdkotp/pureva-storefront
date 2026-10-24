import { useState, type ReactNode } from "react";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isValidEgyptPhone, normalizeEgyptPhone } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n";

const base = {
  name: z.string().trim().min(2, "من فضلك اكتب الاسم").max(100, "الاسم طويل جداً"),
  phone: z.string().refine(isValidEgyptPhone, "رقم موبايل مصري غير صحيح (مثال: 01012345678)"),
  city: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000, "الرسالة طويلة جداً").optional(),
};
const wholesaleSchema = z.object({
  ...base,
  business_name: z.string().trim().min(2, "اكتب اسم النشاط التجاري").max(150),
  business_type: z.string().trim().max(100).optional(),
  quantities: z.string().trim().min(1, "اكتب الكميات المطلوبة").max(500),
});
const contactSchema = z.object({ ...base, message: z.string().trim().min(5, "اكتب رسالتك").max(2000, "الرسالة طويلة جداً") });

type Values = Record<string, string>;

export function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function InquiryForm({ kind }: { kind: "wholesale" | "contact" }) {
  const { t } = useI18n();
  const [v, setV] = useState<Values>({});
  const [errors, setErrors] = useState<Values>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = (kind === "wholesale" ? wholesaleSchema : contactSchema).safeParse(v);
    if (!parsed.success) {
      const errs: Values = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setState("sending");
    const d = parsed.data as Values;
    const { error } = await supabase.from("inquiries").insert({
      kind,
      name: d.name,
      phone: normalizeEgyptPhone(d.phone),
      city: d.city || null,
      message: d.message || null,
      business_name: d.business_name || null,
      business_type: d.business_type || null,
      quantities: d.quantities || null,
    });
    setState(error ? "error" : "done");
    if (!error) setV({});
  };

  if (state === "done")
    return (
      <div className="border p-10 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" strokeWidth={1.3} />
        <p className="mt-4 text-lg font-medium">{t("تم إرسال طلبك بنجاح", "Sent successfully")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("فريقنا هيتواصل معاك في أقرب وقت.", "Our team will contact you soon.")}</p>
        <Button variant="outline" className="mt-6" onClick={() => setState("idle")}>{t("إرسال طلب آخر", "Send another")}</Button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      {kind === "wholesale" && (
        <FormField label={t("اسم النشاط التجاري", "Business name")} error={errors.business_name}>
          <input className="field" value={v.business_name ?? ""} onChange={set("business_name")} />
        </FormField>
      )}
      <FormField label={t("اسم المسؤول", "Contact name")} error={errors.name}>
        <input className="field" value={v.name ?? ""} onChange={set("name")} autoComplete="name" />
      </FormField>
      <FormField label={t("رقم الموبايل", "Mobile")} error={errors.phone}>
        <input className="field text-start" dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" value={v.phone ?? ""} onChange={set("phone")} />
      </FormField>
      <FormField label={t("المدينة", "City")} error={errors.city}>
        <input className="field" value={v.city ?? ""} onChange={set("city")} />
      </FormField>
      {kind === "wholesale" && (
        <>
          <FormField label={t("نوع النشاط", "Business type")} error={errors.business_type}>
            <select className="field" value={v.business_type ?? ""} onChange={set("business_type")}>
              <option value="">{t("اختار", "Select")}</option>
              <option value="سوبر ماركت">{t("سوبر ماركت", "Supermarket")}</option>
              <option value="محل بقالة">{t("محل بقالة", "Grocery")}</option>
              <option value="موزع">{t("موزع", "Distributor")}</option>
              <option value="مطعم / فندق">{t("مطعم / فندق", "Restaurant / hotel")}</option>
              <option value="أخرى">{t("أخرى", "Other")}</option>
            </select>
          </FormField>
          <FormField label={t("الكميات المطلوبة", "Requested quantities")} error={errors.quantities}>
            <input className="field" placeholder={t("مثال: 10 كراتين", "e.g. 10 cartons")} value={v.quantities ?? ""} onChange={set("quantities")} />
          </FormField>
        </>
      )}
      <div className="sm:col-span-2">
        <FormField label={kind === "contact" ? t("رسالتك", "Message") : t("تفاصيل إضافية (اختياري)", "Details (optional)")} error={errors.message}>
          <textarea className="field h-28 py-2" value={v.message ?? ""} onChange={set("message")} />
        </FormField>
      </div>
      {state === "error" && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">{t("تعذر الإرسال. تأكد من البيانات وحاول تاني.", "Couldn't send. Please try again.")}</p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={state === "sending"}>
          {state === "sending" && <Loader2 className="animate-spin" />}
          {t("إرسال", "Send")}
        </Button>
      </div>
    </form>
  );
}
