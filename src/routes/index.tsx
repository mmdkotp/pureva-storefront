import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { mediaUrl } from "@/lib/media";
import { categoriesQuery, homeSections, savedFaqs } from "@/lib/catalog";
import { useQuery } from "@tanstack/react-query";
import { Truck, Banknote, MessageCircle, Flag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/site/States";
import { Logo } from "@/components/site/Logo";
import { productsQuery, settingsQuery } from "@/lib/store";
import { whatsappLink } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n";
import heroImage from "@/assets/hero-kleantop.jpg";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({ category: typeof search["category"] === "string" ? search["category"] : undefined }),
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { title: "KLEANTOP كلين توب — سائل غسيل أطباق | نضافة تفرق، ولمعة تدوم" },
      { name: "description", content: "اطلب سائل غسيل الأطباق كلين توب أونلاين مع توصيل داخل مصر والدفع عند الاستلام." },
      { property: "og:title", content: "KLEANTOP كلين توب — سائل غسيل أطباق" },
      { property: "og:description", content: "نضافة تفرق، ولمعة تدوم. اطلب كلين توب أونلاين." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, lang } = useI18n();
  const categories = useQuery(categoriesQuery);
  const { category: categoryParam } = Route.useSearch();
  const [category, setCategory] = useState(categoryParam ?? "");
  useEffect(()=>setCategory(categoryParam ?? ""),[categoryParam]);
  const [search, setSearch] = useState("");
  const settings = useQuery(settingsQuery);
  const products = useQuery(productsQuery);
  const s = settings.data;
  const sections = homeSections(s?.home_sections);
  const list = (products.data ?? []).filter(p => (!category || p.category_id===category) && `${p.name_ar} ${p.name_en ?? ""}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>Number(b.featured)-Number(a.featured));
  const layout = (key: string) => { const i = sections.findIndex(x=>x.key===key); return {order: i < 0 ? 99 : i, display: i >= 0 && !sections[i]?.enabled ? "none" : undefined}; };
  const first = products.data?.[0];
  const benefits = (products.data ?? []).flatMap((p) => p.benefits).filter(Boolean);
  const wa = whatsappLink(s?.whatsapp);

  const why = [
    { icon: Flag, title: t("علامة مصرية", "Egyptian brand"), text: t("منتج مصري بمعايير تغليف وتجربة متميزة.", "An Egyptian product with a premium experience.") },
    { icon: Truck, title: t("توصيل لباب البيت", "Home delivery"), text: t("نوصلك في المحافظات المتاحة للشحن.", "Delivery to our active service areas.") },
    ...(s?.cod_enabled
      ? [{ icon: Banknote, title: t("الدفع عند الاستلام", "Cash on delivery"), text: t("ادفع لما الطلب يوصلك.", "Pay when your order arrives.") }]
      : []),
    { icon: MessageCircle, title: t("تواصل مباشر", "Direct support"), text: t("فريقنا يرد على استفساراتك بنفسه.", "Talk to our team directly.") },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section style={layout("hero")} className="relative overflow-hidden bg-primary text-primary-foreground">
        <img
          src={mediaUrl(s?.hero_image_url) || heroImage}
          alt={t("عبوة كلين توب لغسيل الأطباق", "KLEANTOP dishwashing liquid bottle")}
          width={1600}
          height={1008}
          className="absolute inset-0 size-full object-cover object-[75%_center] opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-transparent max-md:bg-primary/70" />
        <div className="container-page relative flex min-h-[620px] md:min-h-[80vh] md:max-h-[860px] flex-col justify-center py-20">
          <div className="max-w-xl rtl:ms-auto">
            <Logo className="text-3xl md:text-4xl" />
            <h1 className="mt-10 text-4xl font-semibold leading-tight md:text-6xl">
              {(lang === "en" ? s?.hero_title_en : s?.hero_title) || t("سائل غسيل أطباق كلين توب", "KLEANTOP Dishwashing Liquid")}
            </h1>
            <p className="mt-5 text-lg text-primary-foreground/70 md:text-xl">
              {(lang === "en" ? s?.hero_subtitle_en : s?.hero_subtitle) || "نضافة تفرق، ولمعة تدوم"}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                {first ? (
                  <Link to="/products/$slug" params={{ slug: first.slug }}>{t("اطلب دلوقتي", "Order now")}</Link>
                ) : (
                  <a href="#products">{t("اطلب دلوقتي", "Order now")}</a>
                )}
              </Button>
              <Button variant="heroOutline" size="lg" asChild>
                <Link to="/wholesale">{t("طلبات الجملة", "Wholesale")}</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="h-px bg-silver-gradient opacity-60" />
      </section>

      {/* Products */}
      <section style={layout("products")} id="products" className="container-page py-24">
        <div className="mb-12 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t("منتجاتنا", "Our products")}</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">{t("اختار الحجم المناسب", "Choose your size")}</h2>
          </div>
        </div>
        <div className="mb-8 flex flex-wrap gap-3"><input className="field max-w-xs" aria-label={t("بحث المنتجات","Search products")} placeholder={t("بحث المنتجات","Search products")} value={search} onChange={e=>setSearch(e.target.value)} /><select className="field w-48" aria-label={t("القسم","Category")} value={category} onChange={e=>setCategory(e.target.value)}><option value="">{t("كل الأقسام","All categories")}</option>{categories.data?.map(c=><option key={c.id} value={c.id}>{lang==="en" && c.name_en ? c.name_en : c.name_ar}</option>)}</select></div>
        {products.isLoading ? (
          <LoadingState />
        ) : products.isError ? (
          <ErrorState />
        ) : !list.length ? (
          <EmptyState title={t("المنتجات هتتضاف قريباً", "Products coming soon")} />
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Verified benefits only (entered by admin) */}
      {benefits.length > 0 && (
        <section style={layout("benefits")} className="border-y bg-secondary py-20">
          <div className="container-page">
            <p className="eyebrow">{t("مميزات المنتج", "Product benefits")}</p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <Check className="mt-1 size-4 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Why KLEANTOP */}
      <section style={layout("why")} className="bg-night py-24 text-primary-foreground">
        <div className="container-page">
          <p className="eyebrow text-silver">KLEANTOP</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">{t("ليه تختار كلين توب؟", "Why KLEANTOP?")}</h2>
          <div className="mt-14 grid gap-px bg-primary-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
            {why.map((w) => (
              <div key={w.title} className="bg-primary p-8">
                <w.icon className="size-6 text-silver" strokeWidth={1.4} />
                <h3 className="mt-6 text-lg font-medium">{w.title}</h3>
                <p className="mt-2 text-sm text-primary-foreground/60">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wholesale */}
      <section style={layout("wholesale")} className="container-page py-24">
        <div className="grid items-center gap-10 border p-10 md:grid-cols-[1.4fr_1fr] md:p-16">
          <div>
            <p className="eyebrow">{t("للمحلات والموزعين", "For shops & distributors")}</p>
            <h2 className="mt-3 text-3xl font-semibold">{t("عايز تبيع كلين توب في محلك؟", "Want to stock KLEANTOP?")}</h2>
            <p className="mt-4 text-muted-foreground">
              {t("ابعتلنا بيانات نشاطك والكميات المطلوبة وفريقنا هيتواصل معاك بعروض الجملة.", "Send us your business details and quantities and our team will reach out.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button size="lg" asChild>
              <Link to="/wholesale">{t("قدّم طلب جملة", "Wholesale inquiry")}</Link>
            </Button>
            {wa && (
              <Button size="lg" variant="outline" asChild>
                <a href={wa} target="_blank" rel="noreferrer">{t("واتساب", "WhatsApp")}</a>
              </Button>
            )}
          </div>
        </div>
      </section>
      {(lang === "en" ? s?.about_en : s?.about_ar) && <section style={layout("about")} className="container-page py-20"><h2 className="text-3xl font-semibold">{t("عن العلامة","About")}</h2><p className="mt-6 max-w-3xl whitespace-pre-line leading-relaxed">{lang === "en" ? s?.about_en : s?.about_ar}</p></section>}
      {savedFaqs(s?.faqs,lang).length>0 && <section style={layout("faq")} className="container-page py-20"><h2 className="text-3xl font-semibold">{t("أسئلة شائعة","FAQ")}</h2><div className="mt-8 divide-y">{savedFaqs(s?.faqs,lang).map((f,i)=><details key={i} className="py-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-3 whitespace-pre-line">{f.a}</p></details>)}</div></section>}
    </div>
  );
}
