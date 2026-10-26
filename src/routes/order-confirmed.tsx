import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { formatEGP } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: z.object({
    n: z.string().optional(),
    total: z.number().optional(),
    fee: z.number().optional(),
  }),
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { title: "تم استلام طلبك | KLEANTOP كلين توب" },
      { name: "description", content: "تم تسجيل طلبك من كلين توب وسيتم التواصل معك لتأكيده." },
      { property: "og:title", content: "تم استلام طلبك — كلين توب" },
      { property: "og:description", content: "شكراً لطلبك من كلين توب." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Confirmed,
});

function Confirmed() {
  const { n, total, fee } = Route.useSearch();
  const { t, lang } = useI18n();

  if (!n)
    return (
      <div className="container-page py-24 text-center">
        <p>{t("لا يوجد طلب لعرضه.", "No order to show.")}</p>
        <Button asChild className="mt-6"><Link to="/">{t("الرئيسية", "Home")}</Link></Button>
      </div>
    );

  return (
    <div className="container-page max-w-xl py-24 text-center">
      <CheckCircle2 className="mx-auto size-14 text-success" strokeWidth={1.2} />
      <h1 className="mt-6 text-3xl font-semibold">{t("تم استلام طلبك", "Order received")}</h1>
      <p className="mt-4 text-muted-foreground">
        {t("شكراً لاختيارك كلين توب. هنتواصل معاك على رقم الموبايل لتأكيد الطلب وموعد التوصيل.", "Thank you! We'll call you to confirm your order and delivery time.")}
      </p>
      <div className="mt-10 border p-6 text-sm">
        <p className="eyebrow">{t("رقم الطلب", "Order number")}</p>
        <p className="mt-2 font-mono text-2xl tracking-wider" dir="ltr">{n}</p>
        {total != null && (
          <p className="mt-4">
            {t("الإجمالي", "Total")}: <strong>{formatEGP(total, lang)}</strong>
            {fee == null && <span className="block text-xs text-muted-foreground">{t("(رسوم الشحن تُضاف عند التأكيد)", "(shipping confirmed by phone)")}</span>}
          </p>
        )}
      </div>
      <Button asChild size="lg" className="mt-10"><Link to="/">{t("الرجوع للرئيسية", "Back home")}</Link></Button>
    </div>
  );
}
