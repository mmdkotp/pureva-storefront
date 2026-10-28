import { Link } from "@tanstack/react-router";
import { effectivePrice, formatEGP } from "@/lib/pricing";
import { productImages, type Product } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { catalogSummary, fragranceOptions } from "@/lib/variants";
import { mediaUrl } from "@/lib/media";

export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useI18n();
  const img = mediaUrl(product.product_variants.find(v => v.images?.length)?.images[0]) || productImages(product)[0];
  const summary = catalogSummary(product.product_variants);
  const fragrances = fragranceOptions(product.product_variants).filter(Boolean);
  const name = lang === "en" && product.name_en ? product.name_en : product.name_ar;

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group block border bg-card transition-shadow hover:shadow-soft"
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={img}
          alt={name}
          loading="lazy"
          width={1024}
          height={1024}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="text-lg font-medium">{name}</h3>
        <p className="mt-4 font-medium">{summary.startingPrice == null ? t("السعر يُعلن قريباً", "Price soon") : `${t("يبدأ من", "From")} ${formatEGP(summary.startingPrice, lang)}`}</p>
        <p className={`mt-2 text-sm ${summary.available ? 'text-success' : 'text-muted-foreground'}`}>{summary.available ? t("متوفر", "In stock") : t("غير متوفر للطلب حالياً", "Currently unavailable")}</p>
        {fragrances.length > 0 && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{fragrances.join(" · ")}</p>}
        <span className="mt-5 inline-block border-b border-foreground pb-0.5 text-sm">
          {t("اطلب دلوقتي", "Order now")}
        </span>
      </div>
    </Link>
  );
}
