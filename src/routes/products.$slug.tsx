import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Minus, Plus, MessageCircle, Truck, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingState, ErrorState, EmptyState } from "@/components/site/States";
import { isPlaceholder, productImages, productsQuery, settingsQuery, zonesQuery } from "@/lib/store";
import { effectivePrice, formatEGP, whatsappLink } from "@/lib/pricing";
import { useCart, MAX_QTY } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/products/$slug")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary_large_image" },
      { title: "سائل غسيل الأطباق كلين توب — اطلب أونلاين | KLEANTOP" },
      { name: "description", content: "تفاصيل سائل غسيل الأطباق كلين توب: الأحجام والأسعار بالجنيه المصري وطريقة الاستخدام والشحن." },
      { property: "og:title", content: "سائل غسيل الأطباق كلين توب" },
      { property: "og:description", content: "الأحجام والأسعار وطريقة الطلب والتوصيل." },
      { property: "og:type", content: "product" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const products = useQuery(productsQuery);
  const { data: s } = useQuery(settingsQuery);
  const { data: zones } = useQuery(zonesQuery);
  const cart = useCart();
  const navigate = useNavigate();
  const product = products.data?.find((p) => p.slug === slug);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (product && !variantId) setVariantId(product.product_variants[0]?.id ?? null);
  }, [product, variantId]);

  if (products.isLoading) return <LoadingState />;
  if (products.isError) return <ErrorState />;
  if (!product)
    return (
      <div className="container-page py-20">
        <EmptyState title={t("المنتج غير موجود", "Product not found")}>
          <Link to="/" className="underline">{t("الرجوع للرئيسية", "Back home")}</Link>
        </EmptyState>
      </div>
    );

  const images = productImages(product);
  const variant = product.product_variants.find((v) => v.id === variantId);
  const name = lang === "en" && product.name_en ? product.name_en : product.name_ar;
  const canBuy = !!variant && variant.price != null && variant.stock > 0;
  const wa = whatsappLink(s?.whatsapp, `${t("استفسار عن", "Inquiry about")} ${product.name_ar}${variant ? ` - ${variant.size_label}` : ""}`);
  const paidZones = (zones ?? []).filter((z) => z.fee != null);

  const addToCart = (goToCart: boolean) => {
    if (!variant || !canBuy) return;
    const qtyOk = Math.min(qty, variant.stock);
    cart.add(variant.id, qtyOk);
    toast.success(t("اتضاف للسلة", "Added to cart"));
    if (goToCart) navigate({ to: "/cart" });
  };

  const details = [
    { k: "scent", label: t("الرائحة", "Scent"), v: product.scent },
    { k: "ingredients", label: t("المكونات", "Ingredients"), v: product.ingredients },
    { k: "usage", label: t("طريقة الاستخدام", "How to use"), v: product.usage_instructions },
  ].filter((d) => !isPlaceholder(d.v));

  const faqs = [
    { q: t("إزاي أطلب؟", "How do I order?"), a: t("اختار الحجم والكمية، ضيفهم للسلة، واكمل بياناتك في صفحة الطلب. هنتواصل معاك لتأكيد الطلب.", "Pick a size and quantity, add to cart and complete checkout. We'll call to confirm.") },
    { q: t("إيه طرق الدفع المتاحة؟", "Which payment methods?"), a: s?.cod_enabled ? t("الدفع نقداً عند الاستلام.", "Cash on delivery.") : t("تواصل معنا على واتساب لمعرفة طرق الدفع المتاحة حالياً.", "Contact us on WhatsApp for current payment options.") },
    { q: t("بتوصلوا فين؟", "Where do you deliver?"), a: zones?.length ? zones.map((z) => z.city).join("، ") : t("هيتم الإعلان عن مناطق التوصيل قريباً.", "Delivery areas will be announced soon.") },
    { q: t("أقدر أشتري جملة؟", "Can I buy wholesale?"), a: t("أيوه، قدّم طلبك من صفحة الجملة والتجار.", "Yes — use the wholesale page.") },
  ];

  return (
    <div className="container-page py-12 md:py-20">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link to="/">{t("الرئيسية", "Home")}</Link> / <span>{name}</span>
      </nav>
      <div className="grid gap-12 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden border bg-secondary">
            <img src={images[imgIdx]} alt={name} width={1024} height={1024} className="size-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setImgIdx(i)}
                  className={`aspect-square overflow-hidden border ${i === imgIdx ? "border-foreground" : ""}`}
                  aria-label={`${t("صورة", "Image")} ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="eyebrow">KLEANTOP</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{name}</h1>
          {!isPlaceholder(product.description_ar) && (
            <p className="mt-4 leading-relaxed text-muted-foreground">{lang === "en" && product.description_en ? product.description_en : product.description_ar}</p>
          )}

          <p className="mt-8 text-3xl font-medium">
            {variant?.sale_price != null && <del className="me-3 text-lg text-muted-foreground">{formatEGP(variant.price ?? 0, lang)}</del>}
            {variant?.price != null ? formatEGP(effectivePrice(variant) ?? 0, lang) : <span className="text-lg text-muted-foreground">{t("السعر يُعلن قريباً", "Price coming soon")}</span>}
          </p>

          {product.product_variants.length > 0 && (
            <fieldset className="mt-8">
              <legend className="mb-3 text-sm font-medium">{t("الحجم", "Size")}</legend>
              <div className="flex flex-wrap gap-2">
                {product.product_variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    aria-pressed={v.id === variantId}
                    className={`border px-4 py-2 text-sm transition-colors ${v.id === variantId ? "border-foreground bg-primary text-primary-foreground" : "hover:border-foreground"}`}
                  >
                    {v.size_label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center border">
              <button className="grid h-full w-12 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t("تقليل", "Decrease")}>
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center" aria-live="polite">{qty}</span>
              <button className="grid h-full w-12 place-items-center" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} aria-label={t("زيادة", "Increase")}>
                <Plus className="size-4" />
              </button>
            </div>
            <Button size="lg" className="flex-1" disabled={!canBuy} onClick={() => addToCart(true)}>
              {t("اطلب دلوقتي", "Order now")}
            </Button>
            <Button size="lg" variant="outline" disabled={!canBuy} onClick={() => addToCart(false)}>
              {t("أضف للسلة", "Add to cart")}
            </Button>
          </div>
          {variant && !canBuy && (
            <p className="mt-3 text-sm text-muted-foreground">
              {variant.price == null
                ? t("هذا الحجم سيتوفر للطلب بمجرد إعلان السعر.", "Available once the price is announced.")
                : t("نفدت الكمية حالياً.", "Currently out of stock.")}
            </p>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-4">
              <MessageCircle className="size-4" /> {t("استفسر على واتساب", "Ask on WhatsApp")}
            </a>
          )}

          <div className="mt-10 grid gap-4 border-y py-6 text-sm sm:grid-cols-2">
            <div className="flex gap-3">
              <Truck className="size-5 shrink-0" strokeWidth={1.4} />
              <div>
                <p className="font-medium">{t("الشحن", "Shipping")}</p>
                <p className="text-muted-foreground">
                  {paidZones.length
                    ? paidZones.map((z) => `${z.city}: ${formatEGP(z.fee ?? 0, lang)}`).join(" · ")
                    : t("رسوم الشحن بتتأكد معاك عند تأكيد الطلب.", "Shipping fee confirmed with your order.")}
                  {s?.free_shipping_threshold != null && ` — ${t("شحن مجاني للطلبات من", "Free over")} ${formatEGP(s.free_shipping_threshold, lang)}`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Banknote className="size-5 shrink-0" strokeWidth={1.4} />
              <div>
                <p className="font-medium">{t("الدفع", "Payment")}</p>
                <p className="text-muted-foreground">
                  {s?.cod_enabled ? t("الدفع عند الاستلام", "Cash on delivery") : t("تواصل معنا لطرق الدفع", "Contact us for payment options")}
                </p>
              </div>
            </div>
          </div>

          {details.length > 0 && (
            <Accordion type="multiple" className="mt-6">
              {details.map((d) => (
                <AccordionItem key={d.k} value={d.k}>
                  <AccordionTrigger>{d.label}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line text-muted-foreground">{d.v}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>

      <section className="mx-auto mt-24 max-w-3xl">
        <h2 className="text-2xl font-semibold">{t("أسئلة شائعة", "FAQ")}</h2>
        <Accordion type="single" collapsible className="mt-6">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger className="text-start">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
