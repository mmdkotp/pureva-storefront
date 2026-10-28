import { effectivePrice } from './pricing';

export type CatalogVariant = { id: string; size_label: string; fragrance: string | null; fragrance_en?: string | null; price: number | null; sale_price?: number | null; stock: number; active: boolean };
export const fragranceKey = (v: CatalogVariant) => v.fragrance?.trim() || '';
export function fragranceOptions(variants: CatalogVariant[]): string[] {
  return [...new Set(variants.filter(v => v.active).map(fragranceKey))];
}
export function selectFragranceVariant(variants: CatalogVariant[], fragrance: string, preferredSize?: string): CatalogVariant | undefined {
  const rows = variants.filter(v => v.active && fragranceKey(v) === fragrance);
  return rows.find(v => v.size_label === preferredSize) ?? rows.find(v => v.stock > 0 && effectivePrice(v) != null) ?? rows[0];
}
export function catalogMatches(product: { name_ar: string; name_en: string | null; scent?: string | null; category_id: string | null; product_variants: CatalogVariant[] }, search: string, categoryName = ''): boolean {
  const normalize = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا');
  const haystack = normalize([product.name_ar, product.name_en, product.scent, categoryName, ...product.product_variants.filter(v => v.active).flatMap(v => [v.fragrance, v.fragrance_en, v.size_label])].filter(Boolean).join(' '));
  return normalize(search).trim().split(/\s+/).every(term => haystack.includes(term));
}
export function catalogSummary(variants: CatalogVariant[]) {
  const active = variants.filter(v => v.active);
  const prices = active.map(effectivePrice).filter((p): p is number => p != null);
  return { startingPrice: prices.length ? Math.min(...prices) : null, available: active.some(v => v.stock > 0 && effectivePrice(v) != null) };
}