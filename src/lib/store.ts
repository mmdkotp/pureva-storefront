import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mediaUrl } from "@/lib/media";
import productFallback from "@/assets/product-kleantop.jpg";

export type Variant = {
  id: string;
  product_id: string;
  size_label: string;
  price: number | null;
  sale_price: number | null;
  low_stock_threshold: number;
  stock: number;
  active: boolean;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  featured: boolean;
  best_selling: boolean;
  archived: boolean;
  description_en: string | null;
  slug: string;
  name_ar: string;
  name_en: string | null;
  short_ar: string | null;
  description_ar: string | null;
  scent: string | null;
  ingredients: string | null;
  usage_instructions: string | null;
  benefits: string[];
  images: string[];
  active: boolean;
  sort_order: number;
  product_variants: Variant[];
};

export const PRODUCT_FALLBACK_IMAGE = productFallback;

export const productImages = (p: Pick<Product, "images">) =>
  p.images.length ? p.images.map(v => mediaUrl(v) ?? PRODUCT_FALLBACK_IMAGE) : [PRODUCT_FALLBACK_IMAGE];

/** Placeholder text seeded in the DB starts with [مؤقت]; hide it from shoppers. */
export const isPlaceholder = (v: string | null | undefined) => !v || v.trim().startsWith("[مؤقت]");

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  refetchInterval: 15000,
  queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data;
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  refetchInterval: 15000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("active", true)
      .eq("archived", false)
      .order("sort_order");
    if (error) throw error;
    return (data as unknown as Product[]).map((p) => ({
      ...p,
      product_variants: p.product_variants
        .filter((v) => v.active)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
  },
});

export const zonesQuery = queryOptions({
  queryKey: ["zones"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("shipping_zones")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const ORDER_ERRORS: Record<string, string> = {
  INVALID_COUPON: "الكوبون غير صالح أو انتهت صلاحيته أو عدد استخداماته.",
  COUPON_NOT_ELIGIBLE: "السلة لا تستوفي شروط الكوبون.",
  COD_DISABLED: "الدفع عند الاستلام غير متاح حالياً. تواصل معنا على واتساب لإتمام طلبك.",
  INVALID_NAME: "من فضلك اكتب اسمك بشكل صحيح.",
  INVALID_PHONE: "رقم الموبايل لازم يكون مصري ويبدأ بـ 010 أو 011 أو 012 أو 015.",
  INVALID_ADDRESS: "من فضلك اكتب العنوان بالتفصيل (10 حروف على الأقل).",
  INVALID_CITY: "المدينة المختارة غير متاحة للتوصيل حالياً.",
  EMPTY_CART: "السلة فاضية.",
  INVALID_QTY: "الكمية غير صحيحة.",
  UNAVAILABLE: "أحد المنتجات في السلة غير متاح أو لم يُحدد سعره بعد.",
  OUT_OF_STOCK: "الكمية المطلوبة من أحد المنتجات غير متوفرة في المخزون.",
};

export function orderErrorMessage(message: string | undefined): string {
  const code = Object.keys(ORDER_ERRORS).find((k) => message?.includes(k));
  return (code && ORDER_ERRORS[code]) || "حصلت مشكلة أثناء إرسال الطلب. حاول تاني بعد شوية.";
}
