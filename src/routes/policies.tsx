import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "سياسات الشحن والاسترجاع والخصوصية — بيوريفا" },
      { name: "description", content: "سياسة الشحن والاسترجاع والخصوصية لمتجر بيوريفا." },
      { property: "og:title", content: "سياسات متجر بيوريفا" },
      { property: "og:description", content: "الشحن والاسترجاع والخصوصية." },
    ],
  }),
  component: Policies,
});

function Policies() {
  const { t } = useI18n();
  const { data: s } = useQuery(settingsQuery);
  const pending = t("سيتم نشر هذه السياسة قريباً.", "This policy will be published soon.");
  const sections = [
    { id: "shipping", title: t("سياسة الشحن", "Shipping policy"), body: s?.shipping_policy },
    { id: "returns", title: t("سياسة الاسترجاع والاستبدال", "Returns policy"), body: s?.returns_policy },
    { id: "privacy", title: t("سياسة الخصوصية", "Privacy policy"), body: s?.privacy_policy },
  ];
  return (
    <div className="container-page max-w-3xl py-20">
      <h1 className="text-3xl font-semibold">{t("السياسات", "Policies")}</h1>
      {sections.map((sec) => (
        <section key={sec.id} id={sec.id} className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold">{sec.title}</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{sec.body || pending}</p>
        </section>
      ))}
    </div>
  );
}
