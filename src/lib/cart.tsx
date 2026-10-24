import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type CartLine = { variantId: string; quantity: number };

type Ctx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (variantId: string, quantity: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "pureva-cart";
export const MAX_QTY = 100;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(parsed)) {
        setLines(
          parsed.filter(
            (l): l is CartLine => typeof l?.variantId === "string" && Number.isInteger(l?.quantity),
          ),
        );
      }
    } catch {
      /* ignore corrupt cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = useCallback((variantId: string, quantity: number) => {
    setLines((prev) => {
      const found = prev.find((l) => l.variantId === variantId);
      if (found)
        return prev.map((l) =>
          l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l,
        );
      return [...prev, { variantId, quantity: Math.min(MAX_QTY, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.variantId === variantId ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : l,
      ),
    );
  }, []);

  const remove = useCallback(
    (variantId: string) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)),
    [],
  );
  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, ready, count, add, setQuantity, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
