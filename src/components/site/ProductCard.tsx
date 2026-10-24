import { Link } from "@tanstack/react-router";
import { formatEGP } from "@/lib/pricing";
import { productImages, type Product } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useI18n();
  const img = productImages(product)[0];
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
        <ul className="mt-4 divide-y text-sm">
          {product.product_variants.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{v.size_label}</span>
              <span className="font-medium">
                {v.price != null ? formatEGP(v.price, lang) : t("السعر يُعلن قريباً", "Price soon")}
              </span>
            </li>
          ))}
        </ul>
        <span className="mt-5 inline-block border-b border-foreground pb-0.5 text-sm">
          {t("اطلب دلوقتي", "Order now")}
        </span>
      </div>
    </Link>
  );
}
