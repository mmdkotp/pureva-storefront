import { describe, expect, it } from "vitest";
import {
  computeShipping,
  computeSubtotal,
  isValidEgyptPhone,
  normalizeEgyptPhone,
  whatsappLink,
} from "@/lib/pricing";

describe("pricing rules", () => {
  it("charges the zone fee below the free-shipping threshold", () => {
    expect(computeShipping(200, 50, 500)).toBe(50);
  });
  it("ships free once subtotal reaches the threshold", () => {
    expect(computeShipping(500, 50, 500)).toBe(0);
  });
  it("leaves the fee unconfirmed when the zone has no fee set", () => {
    expect(computeShipping(100, null, null)).toBeNull();
  });
  it("sums line totals", () => {
    expect(
      computeSubtotal([
        { price: 45, quantity: 2 },
        { price: 10, quantity: 3 },
      ]),
    ).toBe(120);
  });
});

describe("Egyptian phone numbers", () => {
  it("accepts 010/011/012/015 mobiles", () => {
    expect(isValidEgyptPhone("01012345678")).toBe(true);
    expect(isValidEgyptPhone("01512345678")).toBe(true);
  });
  it("rejects other prefixes and lengths", () => {
    expect(isValidEgyptPhone("01312345678")).toBe(false);
    expect(isValidEgyptPhone("0101234567")).toBe(false);
  });
  it("normalizes Arabic digits and +20", () => {
    expect(normalizeEgyptPhone("+20 101 234 5678")).toBe("01012345678");
    expect(normalizeEgyptPhone("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678");
  });
  it("builds wa.me links with the 20 country code", () => {
    expect(whatsappLink("01012345678")).toBe("https://wa.me/201012345678");
  });
});
