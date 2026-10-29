import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState, EmptyState } from "@/components/site/States";
import { useCartDetails } from "@/lib/use-cart-details";
import { computeSubtotal, formatEGP } from "@/lib/pricing";
import { settingsQuery } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { title: "سلة المشتريات | KLEANTOP كلين توب" },
      { name: "description", content: "راجع منتجات كلين توب في سلتك وعدّل الكميات قبل إتمام الطلب." },
      { property: "og:title", content: "سلة المشتريات — كلين توب" },
      { property: "og:description", content: "راجع سلتك وأكمل طلبك." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, lang } = useI18n();
  const { cart, lines, isLoading, isError } = useCartDetails();
  const { data: s } = useQuery(settingsQuery);
  const subtotal = computeSubtotal(lines);
  const unavailable = lines.some((l) => l.price == null || l.stock < l.quantity);

  return (
    <div className="container-page py-12 md:py-20">
      <h1 className="text-3xl font-semibold">{t("سلة المشتريات", "Your cart")}</h1>
      <div className="mt-10">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState />
        ) : lines.length === 0 ? (
          <EmptyState title={t("السلة فاضية", "Your cart is empty")}>
            <Button asChild><Link to="/">{t("تسوّق الآن", "Shop now")}</Link></Button>
          </EmptyState>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
            <ul className="divide-y border-y">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-4 py-6">
                  <img src={l.image} alt="" loading="lazy" className="size-24 shrink-0 border object-cover" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link to="/products/$slug" params={{ slug: l.slug }} className="font-medium">
                          {lang === "en" && l.productNameEn ? l.productNameEn : l.productName}
                        </Link>
                        <p className="text-sm text-muted-foreground">{l.sizeLabel}</p>
                      </div>
                      <p className="font-medium">
                        {l.price != null ? formatEGP(l.price * l.quantity, lang) : "—"}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex h-9 items-center border">
                        <Button variant="ghost" disabled={l.quantity <= 1} className="h-full w-9 p-0" onClick={() => cart.setQuantity(l.variantId, l.quantity - 1)} aria-label={t("تقليل", "Decrease")}>
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm">{l.quantity}</span>
                        <Button variant="ghost" disabled={l.quantity >= l.stock} className="h-full w-9 p-0" onClick={() => cart.setQuantity(l.variantId, l.quantity + 1)} aria-label={t("زيادة", "Increase")}>
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <Button variant="ghost" onClick={() => cart.remove(l.variantId)} className="gap-1 text-sm text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-4" /> {t("حذف", "Remove")}
                      </Button>
                    </div>
                    {l.price == null && <p className="text-xs text-destructive">{t("السعر لم يُحدد بعد", "Price not set yet")}</p>}
                    {l.price != null && l.stock < l.quantity && (
                      <p className="text-xs text-destructive">{t(`المتاح في المخزون: ${l.stock}`, `Only ${l.stock} in stock`)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <aside className="h-fit border bg-secondary p-6">
              <div className="flex justify-between">
                <span>{t("الإجمالي الفرعي", "Subtotal")}</span>
                <span className="font-medium">{formatEGP(subtotal, lang)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("رسوم الشحن بتتحسب حسب المدينة في الخطوة الجاية.", "Shipping is calculated by city at checkout.")}
                {s?.free_shipping_threshold != null && ` ${t("شحن مجاني للطلبات من", "Free shipping over")} ${formatEGP(s.free_shipping_threshold, lang)}.`}
              </p>
              <Button asChild={!unavailable} disabled={unavailable} size="lg" className="mt-6 w-full">
                {unavailable ? <span>{t("عدّل السلة للمتابعة", "Fix cart to continue")}</span> : <Link to="/checkout">{t("إتمام الطلب", "Checkout")}</Link>}
              </Button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
