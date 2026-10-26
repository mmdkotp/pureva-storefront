import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState } from "@/components/site/States";
import { FormField } from "@/components/site/InquiryForm";
import { supabase } from "@/integrations/supabase/client";
import { useCartDetails } from "@/lib/use-cart-details";
import { computeShipping, computeSubtotal, formatEGP, isValidEgyptPhone, normalizeEgyptPhone } from "@/lib/pricing";
import { orderErrorMessage, settingsQuery, zonesQuery } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { title: "إتمام الطلب | KLEANTOP كلين توب" },
      { name: "description", content: "أكمل بيانات التوصيل لطلب كلين توب والدفع عند الاستلام." },
      { property: "og:title", content: "إتمام الطلب — كلين توب" },
      { property: "og:description", content: "أكمل بيانات التوصيل." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "من فضلك اكتب الاسم بالكامل").max(100, "الاسم طويل جداً"),
  phone: z.string().refine(isValidEgyptPhone, "رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015"),
  city: z.string().min(1, "اختار المدينة"),
  address: z.string().trim().min(10, "اكتب العنوان بالتفصيل (الشارع، رقم العمارة، الدور)").max(500, "العنوان طويل جداً"),
  notes: z.string().max(500, "الملاحظات طويلة جداً").optional(),
});
type Form = z.infer<typeof schema>;

function CheckoutPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { cart, lines, isLoading } = useCartDetails();
  const settings = useQuery(settingsQuery);
  const zones = useQuery(zonesQuery);
  const [form, setForm] = useState<Form>({ name: "", phone: "", city: "", address: "", notes: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isLoading || settings.isLoading || zones.isLoading) return <LoadingState />;
  if (lines.length === 0)
    return (
      <div className="container-page py-20">
        <EmptyState title={t("السلة فاضية", "Your cart is empty")}>
          <Button asChild><Link to="/">{t("تسوّق الآن", "Shop now")}</Link></Button>
        </EmptyState>
      </div>
    );

  const s = settings.data;
  const zone = zones.data?.find((z) => z.city === form.city);
  const subtotal = computeSubtotal(lines);
  const shipping = zone ? computeShipping(subtotal, zone.fee, s?.free_shipping_threshold ?? null) : null;
  const total = subtotal + (shipping ?? 0);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: typeof errors = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as keyof Form] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { data, error } = await supabase.rpc("place_order", {
      _name: parsed.data.name,
      _phone: normalizeEgyptPhone(parsed.data.phone),
      _city: parsed.data.city,
      _address: parsed.data.address,
      _notes: parsed.data.notes || "",
      _items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
    });
    setSubmitting(false);
    if (error || !data) {
      setSubmitError(orderErrorMessage(error?.message));
      return;
    }
    const result = data as { order_number: string; total: number; shipping_fee: number | null };
    cart.clear();
    navigate({
      to: "/order-confirmed",
      search: { n: result.order_number, total: result.total, fee: result.shipping_fee ?? undefined },
    });
  };

  if (!s?.cod_enabled)
    return (
      <div className="container-page py-20">
        <EmptyState title={t("الطلب أونلاين غير متاح حالياً", "Online ordering is unavailable")}>
          <p className="text-muted-foreground">{t("تواصل معنا على واتساب لإتمام طلبك.", "Please contact us on WhatsApp.")}</p>
        </EmptyState>
      </div>
    );

  return (
    <div className="container-page py-12 md:py-20">
      <h1 className="text-3xl font-semibold">{t("إتمام الطلب", "Checkout")}</h1>
      <form onSubmit={submit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <FormField error={errors.name} label={t("الاسم بالكامل", "Full name")}>
            <input className="field" value={form.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} />
          </FormField>
          <FormField error={errors.phone} label={t("رقم الموبايل", "Mobile number")}>
            <input className="field text-start" dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" value={form.phone} onChange={set("phone")} autoComplete="tel" aria-invalid={!!errors.phone} />
          </FormField>
          <FormField error={errors.city} label={t("المدينة / المحافظة", "City")}>
            <select className="field" value={form.city} onChange={set("city")} aria-invalid={!!errors.city}>
              <option value="">{t("اختار المدينة", "Select city")}</option>
              {zones.data?.map((z) => (
                <option key={z.id} value={z.city}>{z.city}</option>
              ))}
            </select>
          </FormField>
          <FormField error={errors.address} label={t("العنوان بالتفصيل", "Full address")}>
            <textarea className="field h-24 py-2" value={form.address} onChange={set("address")} autoComplete="street-address" aria-invalid={!!errors.address} />
          </FormField>
          <FormField error={errors.notes} label={t("ملاحظات (اختياري)", "Notes (optional)")}>
            <textarea className="field h-20 py-2" value={form.notes} onChange={set("notes")} />
          </FormField>
        </div>

        <aside className="h-fit space-y-3 border bg-secondary p-6 text-sm">
          {lines.map((l) => (
            <div key={l.variantId} className="flex justify-between gap-2">
              <span>{l.productName} · {l.sizeLabel} × {l.quantity}</span>
              <span>{formatEGP((l.price ?? 0) * l.quantity, lang)}</span>
            </div>
          ))}
          <div className="border-t pt-3" />
          <div className="flex justify-between"><span>{t("الإجمالي الفرعي", "Subtotal")}</span><span>{formatEGP(subtotal, lang)}</span></div>
          <div className="flex justify-between">
            <span>{t("الشحن", "Shipping")}</span>
            <span>
              {!zone ? t("اختار المدينة", "Select city") : shipping == null ? t("يُحدد عند التأكيد", "Confirmed by phone") : shipping === 0 ? t("مجاني", "Free") : formatEGP(shipping, lang)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <span>{t("الإجمالي", "Total")}</span><span>{formatEGP(total, lang)}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("طريقة الدفع: الدفع عند الاستلام", "Payment: cash on delivery")}</p>
          {submitError && <p role="alert" className="border border-destructive/40 bg-background p-3 text-destructive">{submitError}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {submitting ? t("جاري إرسال الطلب...", "Placing order...") : t("تأكيد الطلب", "Place order")}
          </Button>
        </aside>
      </form>
    </div>
  );
}
