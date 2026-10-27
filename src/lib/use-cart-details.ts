import { mediaUrl } from "@/lib/media";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { effectivePrice } from "@/lib/pricing";
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/store";

export type CartDetailLine = {
  variantId: string;
  quantity: number;
  sizeLabel: string;
  price: number | null;
  stock: number;
  productName: string;
  productNameEn: string | null;
  slug: string;
  image: string;
};

/** Joins the local cart with live variant data (prices always come from the database). */
export function useCartDetails() {
  const cart = useCart();
  const ids = cart.lines.map((l) => l.variantId).sort();
  const query = useQuery({
    queryKey: ["cart-variants", ids],
    enabled: cart.ready && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, size_label, price, sale_price, stock, active, products(name_ar, name_en, slug, images, active, archived)")
        .in("id", ids);
      if (error) throw error;
      return data;
    },
  });

  const lines: CartDetailLine[] = cart.lines.flatMap((l) => {
    const v = query.data?.find((d) => d.id === l.variantId);
    if (!v || !v.active || !v.products || !v.products.active || v.products.archived) return [];
    return [
      {
        variantId: l.variantId,
        quantity: l.quantity,
        sizeLabel: v.size_label,
        price: effectivePrice(v),
        stock: v.stock,
        productName: v.products.name_ar,
        productNameEn: v.products.name_en,
        slug: v.products.slug,
        image: mediaUrl(v.products.images?.[0]) ?? PRODUCT_FALLBACK_IMAGE,
      },
    ];
  });

  return { cart, lines, isLoading: !cart.ready || (ids.length > 0 && query.isLoading), isError: query.isError };
}
