// Pure pricing/validation helpers shared by cart, checkout and tests.
// The database (place_order) recomputes everything authoritatively.

export const EG_PHONE_REGEX = /^01[0125][0-9]{8}$/;

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Convert Arabic-Indic digits, strip spaces/dashes and +20/0020 prefixes. */
export function normalizeEgyptPhone(input: string): string {
  let s = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\s\-()]/g, "");
  if (s.startsWith("+20")) s = "0" + s.slice(3);
  else if (s.startsWith("0020")) s = "0" + s.slice(4);
  else if (s.startsWith("20") && s.length === 12) s = "0" + s.slice(2);
  return s;
}

export function isValidEgyptPhone(input: string): boolean {
  return EG_PHONE_REGEX.test(normalizeEgyptPhone(input));
}

/**
 * Shipping fee for an order. Returns null when the zone fee isn't configured yet
 * (to be confirmed by phone). Free when subtotal reaches the configured threshold.
 */
export function computeShipping(
  subtotal: number,
  zoneFee: number | null,
  freeThreshold: number | null,
): number | null {
  if (freeThreshold != null && subtotal >= freeThreshold) return 0;
  return zoneFee;
}

export function computeSubtotal(lines: { price: number | null; quantity: number }[]): number {
  return lines.reduce((sum, l) => sum + (l.price ?? 0) * l.quantity, 0);
}

export function formatEGP(value: number, lang: "ar" | "en" = "ar"): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value);
}

/** wa.me link from a stored Egyptian number (01xxxxxxxxx or 201xxxxxxxxx). */
export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  if (!number) return null;
  let digits = number.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "2" + digits;
  if (digits.length < 11) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
