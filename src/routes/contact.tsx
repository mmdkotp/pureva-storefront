import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InquiryForm } from "@/components/site/InquiryForm";
import { settingsQuery } from "@/lib/store";
import { whatsappLink } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — بيوريفا PUREVA" },
      { name: "description", content: "تواصل مع فريق بيوريفا لأي استفسار عن المنتج أو الطلبات." },
      { property: "og:title", content: "تواصل مع بيوريفا" },
      { property: "og:description", content: "ابعتلنا رسالتك وهنرد عليك." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();
  const { data: s } = useQuery(settingsQuery);
  const wa = whatsappLink(s?.whatsapp);
  return (
    <div className="container-page grid gap-16 py-20 lg:grid-cols-[18rem_1fr]">
      <div>
        <h1 className="text-3xl font-semibold">{t("تواصل معنا", "Contact us")}</h1>
        <dl className="mt-8 space-y-5 text-sm">
          <div><dt className="eyebrow">{t("الهاتف", "Phone")}</dt><dd className="mt-1" dir="ltr">{s?.phone || t("سيُضاف قريباً", "Coming soon")}</dd></div>
          <div><dt className="eyebrow">WhatsApp</dt><dd className="mt-1">{wa ? <a className="underline" href={wa} target="_blank" rel="noreferrer">{t("ابدأ محادثة", "Start chat")}</a> : t("سيُضاف قريباً", "Coming soon")}</dd></div>
          <div><dt className="eyebrow">{t("البريد", "Email")}</dt><dd className="mt-1">{s?.email || t("سيُضاف قريباً", "Coming soon")}</dd></div>
        </dl>
      </div>
      <InquiryForm kind="contact" />
    </div>
  );
}
