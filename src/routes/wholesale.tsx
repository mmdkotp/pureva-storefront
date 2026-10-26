import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InquiryForm } from "@/components/site/InquiryForm";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, settingsQuery } from "@/lib/store";
import { formatEGP, whatsappLink } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/wholesale")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { title: "الجملة والتجار — كلين توب | KLEANTOP Wholesale" },
      { name: "description", content: "للمحلات والموزعين: قدّم طلب شراء كلين توب بالجملة وتواصل معنا على واتساب." },
      { property: "og:title", content: "كلين توب للجملة والتجار" },
      { property: "og:description", content: "قدّم طلب جملة لسائل غسيل الأطباق كلين توب." },
    ],
  }),
  component: Wholesale,
});

function Wholesale() {
  const { t, lang } = useI18n();
  const { data: s } = useQuery(settingsQuery);
  const { data: products } = useQuery(productsQuery);
  const { data: prices } = useQuery({
    queryKey: ["wholesale-prices"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_wholesale_prices");
      if (error) throw error;
      return data;
    },
  });
  const wa = whatsappLink(s?.whatsapp, "مرحباً، عندي استفسار عن أسعار الجملة لكلين توب");
  const variants = (products ?? []).flatMap((p) => p.product_variants.map((v) => ({ ...v, productName: p.name_ar })));
  const rows = (prices ?? []).flatMap((pr) => {
    const v = variants.find((x) => x.id === pr.variant_id);
    return v ? [{ ...pr, label: `${v.productName} — ${v.size_label}` }] : [];
  });

  return (
    <>
      <section className="bg-night py-20 text-primary-foreground">
        <div className="container-page">
          <p className="eyebrow text-silver">{t("للمحلات والموزعين", "Shops & distributors")}</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold md:text-5xl">{t("كلين توب للجملة والتجار", "KLEANTOP Wholesale")}</h1>
          <p className="mt-5 max-w-xl text-primary-foreground/60">
            {t("ابعتلنا بيانات نشاطك والكميات اللي محتاجها، وفريق المبيعات هيتواصل معاك بالأسعار والشروط.", "Share your business details and quantities; our sales team will reply with pricing and terms.")}
          </p>
          {wa && (
            <Button variant="hero" size="lg" className="mt-8" asChild>
              <a href={wa} target="_blank" rel="noreferrer"><MessageCircle /> {t("كلمنا على واتساب", "Chat on WhatsApp")}</a>
            </Button>
          )}
        </div>
      </section>

      <div className="container-page grid gap-16 py-20 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="mb-8 text-2xl font-semibold">{t("طلب جملة", "Wholesale inquiry")}</h2>
          <InquiryForm kind="wholesale" />
        </section>
        <aside>
          <h2 className="text-lg font-semibold">{t("أسعار الجملة", "Wholesale prices")}</h2>
          {rows.length ? (
            <ul className="mt-4 divide-y border-y text-sm">
              {rows.map((r) => (
                <li key={r.variant_id} className="py-3">
                  <p>{r.label}</p>
                  <p className="mt-1 font-medium">
                    {formatEGP(r.price, lang)} · {t("حد أدنى", "Min")} {r.min_quantity}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("أسعار الجملة بتتبعت بعد مراجعة طلبك.", "Wholesale prices are shared after reviewing your request.")}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
