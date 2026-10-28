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
import { publicStoreMetadata } from "@/lib/store.functions";
import { fragranceKey, fragranceOptions, selectFragranceVariant } from "@/lib/variants";
import { mediaUrl } from "@/lib/media";
import { savedFaqs } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/products/$slug")({
  loader: ({params}) => publicStoreMetadata({data:{slug:params.slug}}),
  head: ({loaderData}) => ({
    meta: [
      ...(loaderData?.product?.images[0]?.startsWith("https://") ? [{property:"og:image",content:loaderData.product.images[0]},{name:"twitter:image",content:loaderData.product.images[0]}] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { title: `${loaderData?.product?.name_ar || "المنتج"} | ${loaderData?.settings?.brand_name || "KLEANTOP"}` },
      { name: "description", content: "تفاصيل منتجات كلين توب: الروائح والأحجام والأسعار بالجنيه المصري وطريقة الاستخدام والشحن." },
      { property: "og:title", content: loaderData?.product?.name_ar || "منتجات كلين توب" },
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
    if (product && !product.product_variants.some(v => v.id === variantId)) { setVariantId(product.product_variants.find(v => v.stock > 0 && v.price != null)?.id ?? product.product_variants[0]?.id ?? null); setImgIdx(0); setQty(1); }
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

  const variant = product.product_variants.find((v) => v.id === variantId);
  const images = variant?.images.length ? variant.images.map(src => mediaUrl(src) ?? productImages(product)[0] ?? "") : productImages(product);
  const fragrances = fragranceOptions(product.product_variants);
  const currentFragrance = variant ? fragranceKey(variant) : "";
  const sizeVariants = product.product_variants.filter(v => fragranceKey(v) === currentFragrance);
  const chooseVariant = (id: string | undefined) => {setVariantId(id ?? null);setImgIdx(0);setQty(1);};
  const name = lang === "en" && product.name_en ? product.name_en : product.name_ar;
  const canBuy = !!variant && variant.price != null && variant.stock > 0;
  const wa = whatsappLink(s?.whatsapp, `${t("استفسار عن", "Inquiry about")} ${product.name_ar}${variant ? ` - ${variant.size_label}` : ""}`);
  const paidZones = (zones ?? []).filter((z) => z.fee != null);

  const addToCart = (goToCart: boolean) => {
    if (!variant || !canBuy) return;
    const inCart = cart.lines.find(l => l.variantId === variant.id)?.quantity ?? 0;
    const qtyOk = Math.min(qty, variant.stock - inCart, MAX_QTY - inCart);
    if (qtyOk < 1) return void toast.error(t("الكمية المتاحة موجودة بالفعل في السلة", "Available quantity is already in your cart"));
    cart.add(variant.id, qtyOk);
    toast.success(t("اتضاف للسلة", "Added to cart"));
    if (goToCart) navigate({ to: "/cart" });
  };

  const details = [
    { k: "scent", label: t("الرائحة", "Scent"), v: product.scent },
    { k: "ingredients", label: t("المكونات", "Ingredients"), v: product.ingredients },
    { k: "usage", label: t("طريقة الاستخدام", "How to use"), v: product.usage_instructions },
  ].filter((d) => !isPlaceholder(d.v));

  const faqs = savedFaqs(s?.faqs,lang).length ? savedFaqs(s?.faqs,lang) : [
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
            <img src={images[imgIdx] ?? images[0]} alt={name} width={1024} height={1024} className="size-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <Button variant="ghost"
                  key={src}
                  onClick={() => setImgIdx(i)}
                  className={`aspect-square overflow-hidden border ${i === imgIdx ? "border-foreground" : ""}`}
                  aria-label={`${t("صورة", "Image")} ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                </Button>
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

          {fragrances.some(Boolean) && <fieldset className="mt-8"><legend className="mb-3 text-sm font-medium">{t("الرائحة", "Fragrance")}</legend><div className="flex flex-wrap gap-2">{fragrances.map(f => <Button key={f} variant={f===currentFragrance ? "default" : "outline"} aria-pressed={f===currentFragrance} onClick={() => chooseVariant(selectFragranceVariant(product.product_variants, f, variant?.size_label)?.id)}>{f || t("بدون رائحة محددة", "Unspecified fragrance")}</Button>)}</div></fieldset>}
          {sizeVariants.length > 0 && <fieldset className="mt-8"><legend className="mb-3 text-sm font-medium">{t("الحجم", "Size")}</legend><div className="flex flex-wrap gap-2">{sizeVariants.map(v => <Button key={v.id} variant={v.id===variantId ? "default" : "outline"} aria-pressed={v.id===variantId} onClick={() => chooseVariant(v.id)}>{v.size_label}</Button>)}</div></fieldset>}
          {variant?.sku && <p className="mt-4 text-xs text-muted-foreground">{t("كود المنتج", "SKU")}: <span dir="ltr">{variant.sku}</span></p>}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center border">
              <Button variant="ghost" className="grid h-full w-12 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t("تقليل", "Decrease")}>
                <Minus className="size-4" />
              </Button>
              <span className="w-10 text-center" aria-live="polite">{qty}</span>
              <Button variant="ghost" className="grid h-full w-12 place-items-center" onClick={() => setQty((q) => Math.min(MAX_QTY, variant?.stock ?? 1, q + 1))} aria-label={t("زيادة", "Increase")}>
                <Plus className="size-4" />
              </Button>
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
