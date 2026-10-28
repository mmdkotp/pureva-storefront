/**
 * KLEANTOP (كلين توب) — واجهة المتجر القابلة للتوسع
 * ملف واحد: index.tsx
 *
 * - بدون أي مكتبات إضافية (React فقط). الاتصال بـ Supabase عبر REST بالـ anon key فقط.
 * - لو متغيرات البيئة مش موجودة => يشتغل بوضع "بيانات تجريبية" وبيتكتب ده بوضوح على الشاشة.
 * - الطلبات الحقيقية بتتبعت عبر دالة RPC اسمها create_order (بتتحقق من المخزون والأسعار في السيرفر).
 * - مفيش أي مفتاح سري في الكود. المتغيرات المطلوبة:
 *     VITE_SUPABASE_URL
 *     VITE_SUPABASE_ANON_KEY
 *
 * لو الملف ده هو نقطة الدخول (entry)، فك التعليق عن سطور التشغيل في آخر الملف.
 */
import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";

/* ========================= الأنواع ========================= */
type Category = { id: string; slug: string; name_ar: string; sort_order?: number | null };
type Variant = {
  id: string;
  product_id: string;
  sku: string;
  fragrance: string | null;
  size_label: string;
  price: number;
  compare_at_price?: number | null;
  stock_qty: number;
  image_url?: string | null;
  is_active: boolean;
};
type Product = {
  id: string;
  category_id: string;
  name_ar: string;
  description_ar?: string | null;
  image_url?: string | null;
  is_featured?: boolean;
  is_active: boolean;
  product_variants: Variant[];
};
type CartItem = { variantId: string; qty: number };
type Line = { variant: Variant; product: Product; qty: number; total: number };
type Customer = { name: string; phone: string; address: string; governorate: string; notes: string };
type PlacedOrder = { ref: string; demo: boolean; total: number; customer: Customer; count: number };

/* ========================= الإعدادات ========================= */
const ENV = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
const SB_URL = (ENV.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const SB_KEY = ENV.VITE_SUPABASE_ANON_KEY ?? "";
const BACKEND_READY = Boolean(SB_URL && SB_KEY);

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية",
  "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "أسوان", "أسيوط",
  "بني سويف", "بورسعيد", "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر",
  "قنا", "شمال سيناء", "سوهاج",
];

const CATEGORY_EMOJI: Record<string, string> = {
  dishwashing: "🍋", floor: "🧴", fabric: "🌸", multipurpose: "✨", glass: "🪟", offers: "🎁",
};

/* ========================= بيانات تجريبية (Demo) ========================= */
function mk(pid: string, rows: [string | null, string, number, number, number?][]): Variant[] {
  return rows.map(([frag, size, price, stock, old], i) => ({
    id: `${pid}-v${i}`, product_id: pid, sku: `${pid}-${i}`.toUpperCase(), fragrance: frag,
    size_label: size, price, compare_at_price: old ?? null, stock_qty: stock, is_active: true,
  }));
}
const DEMO_CATEGORIES: Category[] = [
  { id: "c1", slug: "dishwashing", name_ar: "سائل مواعين", sort_order: 1 },
  { id: "c2", slug: "floor", name_ar: "مطهر أرضيات", sort_order: 2 },
  { id: "c3", slug: "fabric", name_ar: "معطر ملابس", sort_order: 3 },
  { id: "c4", slug: "multipurpose", name_ar: "منظف متعدد الاستخدامات", sort_order: 4 },
  { id: "c5", slug: "glass", name_ar: "منظف زجاج", sort_order: 5 },
  { id: "c6", slug: "offers", name_ar: "العروض والباقات", sort_order: 6 },
];
const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1", category_id: "c1", name_ar: "كلين توب سائل مواعين", is_featured: true, is_active: true,
    description_ar: "رغوة غزيرة بتشيل الدهون من أول مرة وبتحافظ على إيديكي. رائحة منعشة بتدوم.",
    product_variants: [
      ...mk("p1a", [["ليمون", "500 مل", 35, 40], ["ليمون", "1 لتر", 60, 25, 68], ["ليمون", "2 لتر", 105, 10]]),
      ...mk("p1b", [["تفاح", "500 مل", 35, 30], ["تفاح", "1 لتر", 60, 0]]),
      ...mk("p1c", [["فراولة", "500 مل", 35, 12], ["فراولة", "1 لتر", 60, 9]]),
      ...mk("p1d", [["نعناع", "1 لتر", 60, 20]]),
      ...mk("p1e", [["برتقال", "1 لتر", 60, 18]]),
    ].map((v, i) => ({ ...v, id: `p1-v${i}`, product_id: "p1" })),
  },
  {
    id: "p2", category_id: "c2", name_ar: "كلين توب مطهر أرضيات", is_featured: true, is_active: true,
    description_ar: "بيقتل الجراثيم ويسيب الأرضية لامعة ورائحتها فايحة لساعات.",
    product_variants: mk("p2", [
      ["لافندر", "1 لتر", 55, 30], ["لافندر", "2 لتر", 98, 15], ["لافندر", "5 لتر", 220, 6],
      ["صنوبر", "1 لتر", 55, 22], ["صنوبر", "2 لتر", 98, 0],
      ["ليمون", "1 لتر", 55, 14], ["ليمون", "5 لتر", 220, 4],
    ]),
  },
  {
    id: "p3", category_id: "c3", name_ar: "كلين توب معطر ملابس", is_featured: true, is_active: true,
    description_ar: "عطر هادي بيفضل على هدومك طول اليوم. مناسب للاستخدام اليومي.",
    product_variants: mk("p3", [
      ["فريش لينن", "500 مل", 70, 25], ["فريش لينن", "1 لتر", 125, 10],
      ["مسك", "500 مل", 70, 18], ["ياسمين", "500 مل", 70, 11],
    ]),
  },
  {
    id: "p4", category_id: "c4", name_ar: "كلين توب منظف متعدد الاستخدامات", is_active: true,
    description_ar: "للمطبخ والحمام والأسطح. تنضيف سريع من غير مجهود.",
    product_variants: mk("p4", [[null, "1 لتر", 50, 35], [null, "2 لتر", 90, 20]]),
  },
  {
    id: "p5", category_id: "c5", name_ar: "كلين توب منظف زجاج", is_active: true,
    description_ar: "بيلمّع الزجاج والمرايا من غير آثار أو تلميع زيادة.",
    product_variants: mk("p5", [[null, "500 مل", 40, 28], [null, "1 لتر", 72, 14]]),
  },
  {
    id: "p6", category_id: "c6", name_ar: "باقة البيت الكاملة", is_featured: true, is_active: true,
    description_ar: "سائل مواعين + مطهر أرضيات + معطر ملابس بسعر أوفر.",
    product_variants: mk("p6", [[null, "باقة 3 قطع", 230, 8, 270]]),
  },
];

/* ========================= طبقة البيانات ========================= */
async function sb<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.message || j.hint || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function useCatalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    if (!BACKEND_READY) {
      setCategories(DEMO_CATEGORIES); setProducts(DEMO_PRODUCTS); setLoading(false); return;
    }
    try {
      const [cats, prods] = await Promise.all([
        sb<Category[]>("categories?select=*&is_active=eq.true&order=sort_order.asc"),
        sb<Product[]>("products?select=*,product_variants(*)&is_active=eq.true&order=created_at.desc"),
      ]);
      setCategories(cats);
      setProducts(prods.map(p => ({ ...p, product_variants: (p.product_variants ?? []).filter(v => v.is_active) })));
    } catch (e: any) {
      setError(e?.message ?? "تعذّر تحميل المنتجات");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { categories, products, loading, error, reload: load };
}

/* ========================= أدوات مساعدة ========================= */
const money = (n: number) => `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n)} ج.م`;
const num = (n: number) => new Intl.NumberFormat("ar-EG").format(n);
const norm = (s: string) =>
  s.toLowerCase().replace(/[\u064B-\u065F\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").trim();
const inStock = (v: Variant) => v.is_active && v.stock_qty > 0;
const minPrice = (p: Product) => {
  const vs = p.product_variants.filter(v => v.is_active);
  return vs.length ? Math.min(...vs.map(v => v.price)) : 0;
};
const productAvailable = (p: Product) => p.product_variants.some(inStock);
const emojiFor = (c?: Category) => (c && CATEGORY_EMOJI[c.slug]) || "🧼";
const isPhone = (s: string) => /^01[0125]\d{8}$/.test(s.replace(/[\s-]/g, ""));
const toEnDigits = (s: string) => s.replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/* ========================= السلة ========================= */
type CartAction =
  | { type: "add"; variantId: string; qty: number; max: number }
  | { type: "set"; variantId: string; qty: number; max: number }
  | { type: "remove"; variantId: string }
  | { type: "clear" };

function cartReducer(state: CartItem[], a: CartAction): CartItem[] {
  switch (a.type) {
    case "add": {
      const found = state.find(i => i.variantId === a.variantId);
      if (found) return state.map(i => i.variantId === a.variantId ? { ...i, qty: Math.min(i.qty + a.qty, a.max) } : i);
      return [...state, { variantId: a.variantId, qty: Math.min(a.qty, a.max) }];
    }
    case "set":
      return a.qty <= 0 ? state.filter(i => i.variantId !== a.variantId)
        : state.map(i => i.variantId === a.variantId ? { ...i, qty: Math.min(a.qty, a.max) } : i);
    case "remove": return state.filter(i => i.variantId !== a.variantId);
    case "clear": return [];
  }
}
const CART_KEY = "kleantop_cart_v2";
function loadCart(): CartItem[] {
  try { const r = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); return Array.isArray(r) ? r : []; } catch { return []; }
}

/* ========================= Router بسيط (hash) ========================= */
function useHash() {
  const [h, setH] = useState(() => window.location.hash.slice(1) || "/");
  useEffect(() => {
    const on = () => { setH(window.location.hash.slice(1) || "/"); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return h;
}
const go = (path: string) => { window.location.hash = path; };

/* ========================= التنسيق ========================= */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
.kt{--g:#1f8f4e;--g-d:#14683a;--g-l:#e8f6ee;--ink:#14231b;--mut:#5d6f64;--bd:#dbe7df;--bg:#f7fbf8;--red:#c0392b;--amb:#b7791f;
 font-family:'Cairo',system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh;direction:rtl;line-height:1.6}
.kt *{box-sizing:border-box}
.kt button{font-family:inherit;cursor:pointer}
.kt a{color:inherit;text-decoration:none}
.kt .wrap{max-width:1100px;margin:0 auto;padding:0 16px}
.kt header.top{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid var(--bd)}
.kt .bar{display:flex;align-items:center;justify-content:space-between;height:60px}
.kt .logo{font-weight:800;font-size:22px;color:var(--g-d);display:flex;gap:8px;align-items:center}
.kt .cartbtn{position:relative;background:var(--g-l);border:1px solid var(--bd);border-radius:12px;padding:8px 14px;font-weight:700;color:var(--g-d)}
.kt .badge{position:absolute;top:-6px;left:-6px;background:var(--g);color:#fff;border-radius:99px;min-width:20px;height:20px;font-size:12px;display:grid;place-items:center;padding:0 5px}
.kt .demo{background:#fff7e0;border-bottom:1px solid #f0dca0;color:#7a5a00;font-size:13px;text-align:center;padding:6px 12px}
.kt .hero{background:linear-gradient(135deg,var(--g-d),var(--g));color:#fff;padding:40px 0;border-radius:0 0 28px 28px}
.kt .hero h1{margin:0 0 8px;font-size:clamp(26px,6vw,40px);font-weight:800}
.kt .hero p{margin:0 0 18px;opacity:.95;max-width:520px}
.kt .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:12px;padding:12px 20px;font-weight:700;font-size:16px;background:var(--g);color:#fff;min-height:44px}
.kt .btn:hover{background:var(--g-d)}
.kt .btn:disabled{background:#b9c7be;cursor:not-allowed}
.kt .btn.ghost{background:#fff;color:var(--g-d);border:1px solid var(--bd)}
.kt .btn.light{background:#fff;color:var(--g-d)}
.kt .btn.block{width:100%}
.kt .search{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--bd);font:inherit;font-size:16px;background:#fff}
.kt .chips{display:flex;gap:8px;overflow-x:auto;padding:12px 0;scrollbar-width:thin}
.kt .chip{white-space:nowrap;border:1px solid var(--bd);background:#fff;border-radius:99px;padding:8px 16px;font-weight:600;font-size:15px;min-height:40px}
.kt .chip[aria-pressed=true]{background:var(--g);color:#fff;border-color:var(--g)}
.kt h2.sec{font-size:22px;margin:24px 0 12px;font-weight:800}
.kt .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
@media(min-width:700px){.kt .grid{grid-template-columns:repeat(3,1fr);gap:16px}}
@media(min-width:960px){.kt .grid{grid-template-columns:repeat(4,1fr)}}
.kt .card{background:#fff;border:1px solid var(--bd);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;transition:box-shadow .15s}
.kt .card:hover{box-shadow:0 6px 18px rgba(20,104,58,.12)}
.kt .ph{aspect-ratio:1/1;background:linear-gradient(160deg,var(--g-l),#fff);display:grid;place-items:center;font-size:56px;position:relative;overflow:hidden}
.kt .ph img{width:100%;height:100%;object-fit:cover}
.kt .tag{position:absolute;top:8px;right:8px;font-size:12px;font-weight:700;border-radius:8px;padding:2px 8px;background:var(--g);color:#fff}
.kt .tag.out{background:var(--red)}
.kt .cb{padding:12px;display:flex;flex-direction:column;gap:4px;flex:1}
.kt .cn{font-weight:700;font-size:15px;line-height:1.4}
.kt .cc{font-size:12px;color:var(--mut)}
.kt .pr{font-weight:800;color:var(--g-d);margin-top:auto}
.kt .av{font-size:12px;font-weight:600}
.kt .ok{color:var(--g)} .kt .no{color:var(--red)} .kt .low{color:var(--amb)}
.kt .panel{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:16px}
.kt .pd{display:grid;gap:20px;margin-top:16px}
@media(min-width:800px){.kt .pd{grid-template-columns:1fr 1fr}}
.kt .opts{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px}
.kt .opt{border:1.5px solid var(--bd);background:#fff;border-radius:12px;padding:8px 14px;font-weight:600;min-height:44px}
.kt .opt[aria-pressed=true]{border-color:var(--g);background:var(--g-l);color:var(--g-d)}
.kt .opt:disabled{opacity:.45;text-decoration:line-through}
.kt .price{font-size:30px;font-weight:800;color:var(--g-d)}
.kt .old{color:var(--mut);text-decoration:line-through;font-size:16px;margin-inline-start:8px;font-weight:400}
.kt .qty{display:inline-flex;align-items:center;border:1px solid var(--bd);border-radius:12px;background:#fff}
.kt .qty button{width:44px;height:44px;border:0;background:transparent;font-size:20px;font-weight:700}
.kt .qty span{min-width:36px;text-align:center;font-weight:700}
.kt .row{display:flex;gap:12px;align-items:center}
.kt .line{display:grid;grid-template-columns:64px 1fr;gap:12px;padding:12px 0;border-bottom:1px solid var(--bd)}
.kt .line .ph{font-size:28px;border-radius:12px}
.kt .sum{display:flex;justify-content:space-between;padding:6px 0}
.kt .sum.t{font-size:20px;font-weight:800;border-top:1px solid var(--bd);margin-top:8px;padding-top:12px}
.kt label{display:block;font-weight:700;margin:12px 0 4px}
.kt input.f,.kt select.f,.kt textarea.f{width:100%;padding:12px;border-radius:12px;border:1px solid var(--bd);font:inherit;font-size:16px;background:#fff}
.kt .f:focus,.kt .search:focus,.kt button:focus-visible{outline:3px solid #8fd3ad;outline-offset:1px}
.kt .err{color:var(--red);font-size:13px;margin-top:4px}
.kt .alert{border-radius:12px;padding:12px;margin:12px 0;font-weight:600}
.kt .alert.bad{background:#fdecea;color:var(--red);border:1px solid #f4c2bd}
.kt .alert.warn{background:#fff7e0;color:#7a5a00;border:1px solid #f0dca0}
.kt .alert.good{background:var(--g-l);color:var(--g-d);border:1px solid #bfe3cf}
.kt .crumb{margin:14px 0 0;font-size:14px;color:var(--mut)}
.kt .crumb a{color:var(--g-d);font-weight:700;cursor:pointer}
.kt footer{margin-top:40px;padding:24px 0;text-align:center;color:var(--mut);font-size:14px;border-top:1px solid var(--bd)}
.kt .center{text-align:center;padding:40px 0}
.kt .link{background:none;border:0;color:var(--red);font-weight:600;padding:4px 0}
`;

/* ========================= عناصر مشتركة ========================= */
function Img({ src, emoji, alt }: { src?: string | null; emoji: string; alt: string }) {
  const [bad, setBad] = useState(false);
  return (
    <div className="ph" aria-label={alt}>
      {src && !bad ? <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} /> : <span aria-hidden>{emoji}</span>}
    </div>
  );
}
function Qty({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="qty" role="group" aria-label="الكمية">
      <button type="button" aria-label="تقليل الكمية" onClick={() => onChange(value - 1)}>−</button>
      <span aria-live="polite">{num(value)}</span>
      <button type="button" aria-label="زيادة الكمية" disabled={value >= max} onClick={() => onChange(Math.min(value + 1, max))}>+</button>
    </div>
  );
}

/* ========================= الصفحات ========================= */
function ProductCard({ p, cat }: { p: Product; cat?: Category }) {
  const avail = productAvailable(p);
  const hasDiscount = p.product_variants.some(v => v.compare_at_price && v.compare_at_price > v.price);
  const first = p.product_variants.find(v => v.image_url)?.image_url ?? p.image_url;
  return (
    <article className="card" onClick={() => go(`/product/${p.id}`)} tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter") go(`/product/${p.id}`); }} aria-label={p.name_ar}>
      <div style={{ position: "relative" }}>
        <Img src={first} emoji={emojiFor(cat)} alt={p.name_ar} />
        {!avail ? <span className="tag out">نفد</span> : hasDiscount ? <span className="tag">خصم</span> : null}
      </div>
      <div className="cb">
        <div className="cc">{cat?.name_ar}</div>
        <div className="cn">{p.name_ar}</div>
        <div className="pr">يبدأ من {money(minPrice(p))}</div>
        <div className={`av ${avail ? "ok" : "no"}`}>{avail ? "متوفر" : "غير متوفر حاليًا"}</div>
      </div>
    </article>
  );
}

function Home({ cats, products }: { cats: Category[]; products: Product[] }) {
  const [catId, setCatId] = useState<string>("all");
  const [q, setQ] = useState("");
  const catMap = useMemo(() => new Map(cats.map(c => [c.id, c])), [cats]);

  const filtered = useMemo(() => {
    const nq = norm(q);
    return products.filter(p => {
      if (catId !== "all" && p.category_id !== catId) return false;
      if (!nq) return true;
      const hay = norm([
        p.name_ar, catMap.get(p.category_id)?.name_ar ?? "",
        ...p.product_variants.map(v => v.fragrance ?? ""),
      ].join(" "));
      return nq.split(/\s+/).every(w => hay.includes(w));
    });
  }, [products, catId, q, catMap]);

  const featured = products.filter(p => p.is_featured).slice(0, 4);
  const searching = q.trim() !== "" || catId !== "all";

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <h1>كلين توب… نضافة بتبان وريحة بتدوم</h1>
          <p>منتجات تنظيف مصرية بجودة عالية وأسعار مناسبة. اختار الريحة والحجم اللي يناسبك والدفع عند الاستلام.</p>
          <a className="btn light" href="#catalog" onClick={e => { e.preventDefault(); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>
            تسوّق دلوقتي
          </a>
        </div>
      </section>

      <div className="wrap" id="catalog">
        <div style={{ marginTop: 20 }}>
          <input className="search" type="search" placeholder="ابحث بالاسم أو القسم أو الريحة (ليمون، لافندر…)"
            value={q} onChange={e => setQ(e.target.value)} aria-label="بحث في المنتجات" />
        </div>
        <div className="chips" role="toolbar" aria-label="الأقسام">
          <button className="chip" aria-pressed={catId === "all"} onClick={() => setCatId("all")}>الكل</button>
          {cats.map(c => (
            <button key={c.id} className="chip" aria-pressed={catId === c.id} onClick={() => setCatId(c.id)}>{c.name_ar}</button>
          ))}
        </div>

        {!searching && featured.length > 0 && (
          <>
            <h2 className="sec">الأكثر طلبًا</h2>
            <div className="grid">{featured.map(p => <ProductCard key={p.id} p={p} cat={catMap.get(p.category_id)} />)}</div>
          </>
        )}

        <h2 className="sec">{searching ? `النتائج (${num(filtered.length)})` : "كل المنتجات"}</h2>
        {filtered.length === 0 ? (
          <div className="panel center">مفيش منتجات مطابقة للبحث. جرّب كلمة تانية أو قسم تاني.</div>
        ) : (
          <div className="grid">{filtered.map(p => <ProductCard key={p.id} p={p} cat={catMap.get(p.category_id)} />)}</div>
        )}
      </div>
    </>
  );
}

function ProductPage({ id, products, cats, dispatch }: {
  id: string; products: Product[]; cats: Category[]; dispatch: React.Dispatch<CartAction>;
}) {
  const p = products.find(x => x.id === id);
  const variants = useMemo(() => (p?.product_variants ?? []).filter(v => v.is_active), [p]);
  const fragrances = useMemo(() => Array.from(new Set(variants.map(v => v.fragrance).filter(Boolean))) as string[], [variants]);

  const firstAvail = variants.find(inStock) ?? variants[0];
  const [frag, setFrag] = useState<string | null>(firstAvail?.fragrance ?? null);
  const [size, setSize] = useState<string | null>(firstAvail?.size_label ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setFrag(firstAvail?.fragrance ?? null); setSize(firstAvail?.size_label ?? null); setQty(1); setAdded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!p) return <div className="wrap center">المنتج غير موجود. <a href="#/" style={{ color: "var(--g-d)", fontWeight: 700 }}>الرجوع للمتجر</a></div>;

  const sizesForFrag = variants.filter(v => (v.fragrance ?? null) === frag);
  const selected = variants.find(v => (v.fragrance ?? null) === frag && v.size_label === size);
  const cat = cats.find(c => c.id === p.category_id);
  const max = selected ? Math.max(selected.stock_qty, 0) : 0;
  const canBuy = !!selected && inStock(selected);

  const pickFrag = (f: string) => {
    setFrag(f);
    const vs = variants.filter(v => v.fragrance === f);
    const keep = vs.find(v => v.size_label === size) ?? vs.find(inStock) ?? vs[0];
    setSize(keep?.size_label ?? null); setQty(1); setAdded(false);
  };

  return (
    <div className="wrap">
      <div className="crumb"><a href="#/">المتجر</a> / {cat?.name_ar} / {p.name_ar}</div>
      <div className="pd">
        <Img src={selected?.image_url ?? p.image_url} emoji={emojiFor(cat)} alt={p.name_ar} />
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26 }}>{p.name_ar}</h1>
          <div className="cc">{cat?.name_ar}</div>
          <p style={{ color: "var(--mut)" }}>{p.description_ar}</p>

          {fragrances.length > 0 && (
            <>
              <strong>الريحة</strong>
              <div className="opts" role="group" aria-label="اختيار الريحة">
                {fragrances.map(f => {
                  const any = variants.some(v => v.fragrance === f && inStock(v));
                  return <button key={f} className="opt" aria-pressed={frag === f} onClick={() => pickFrag(f)} title={any ? "" : "غير متوفر"}>{f}{any ? "" : " (نفد)"}</button>;
                })}
              </div>
            </>
          )}

          <strong>الحجم</strong>
          <div className="opts" role="group" aria-label="اختيار الحجم">
            {sizesForFrag.map(v => (
              <button key={v.id} className="opt" aria-pressed={size === v.size_label} disabled={!inStock(v)}
                onClick={() => { setSize(v.size_label); setQty(1); setAdded(false); }}>
                {v.size_label} — {money(v.price)}
              </button>
            ))}
          </div>

          {selected ? (
            <>
              <div className="price">
                {money(selected.price)}
                {selected.compare_at_price && selected.compare_at_price > selected.price && <span className="old">{money(selected.compare_at_price)}</span>}
              </div>
              <div className={`av ${!canBuy ? "no" : selected.stock_qty <= 5 ? "low" : "ok"}`} style={{ margin: "4px 0 14px" }}>
                {!canBuy ? "غير متوفر حاليًا" : selected.stock_qty <= 5 ? `باقي ${num(selected.stock_qty)} فقط` : "متوفر"}
              </div>
              <div className="row" style={{ flexWrap: "wrap" }}>
                <Qty value={qty} max={Math.max(max, 1)} onChange={n => setQty(Math.max(1, n))} />
                <button className="btn" disabled={!canBuy} style={{ flex: 1, minWidth: 160 }}
                  onClick={() => { dispatch({ type: "add", variantId: selected.id, qty, max }); setAdded(true); }}>
                  أضف للسلة — {money(selected.price * qty)}
                </button>
              </div>
              {added && (
                <div className="alert good">
                  تمت الإضافة للسلة. <a href="#/cart" style={{ textDecoration: "underline" }}>عرض السلة</a>
                </div>
              )}
              <div className="cc" style={{ marginTop: 8 }}>كود المنتج: {selected.sku}</div>
            </>
          ) : (
            <div className="alert warn">الاختيار ده غير متاح. اختار ريحة أو حجم تاني.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CartPage({ lines, subtotal, dispatch }: { lines: Line[]; subtotal: number; dispatch: React.Dispatch<CartAction> }) {
  if (lines.length === 0) {
    return <div className="wrap center"><h2>السلة فاضية</h2><a className="btn" href="#/">ابدأ التسوق</a></div>;
  }
  const problem = lines.some(l => !inStock(l.variant));
  return (
    <div className="wrap" style={{ marginTop: 16 }}>
      <h1 style={{ fontSize: 24 }}>سلة المشتريات</h1>
      <div className="panel">
        {lines.map(l => (
          <div className="line" key={l.variant.id}>
            <Img src={l.variant.image_url ?? l.product.image_url} emoji="🧼" alt={l.product.name_ar} />
            <div>
              <div className="cn">{l.product.name_ar}</div>
              <div className="cc">{[l.variant.fragrance, l.variant.size_label].filter(Boolean).join(" • ")}</div>
              <div className="row" style={{ justifyContent: "space-between", marginTop: 8, flexWrap: "wrap" }}>
                <Qty value={l.qty} max={l.variant.stock_qty}
                  onChange={n => dispatch({ type: "set", variantId: l.variant.id, qty: n, max: l.variant.stock_qty })} />
                <strong>{money(l.total)}</strong>
              </div>
              {!inStock(l.variant) && <div className="err">المنتج ده نفد، احذفه علشان تكمل.</div>}
              <button className="link" onClick={() => dispatch({ type: "remove", variantId: l.variant.id })}>حذف</button>
            </div>
          </div>
        ))}
        <div className="sum t"><span>الإجمالي</span><span>{money(subtotal)}</span></div>
        <div className="cc">الشحن بيتحدد عند التأكيد. الدفع عند الاستلام.</div>
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <a className="btn ghost" href="#/">كمّل تسوق</a>
        <button className="btn" style={{ flex: 1 }} disabled={problem} onClick={() => go("/checkout")}>إتمام الطلب</button>
      </div>
    </div>
  );
}

function Checkout({ lines, subtotal, onPlaced }: { lines: Line[]; subtotal: number; onPlaced: (o: PlacedOrder) => void }) {
  const [c, setC] = useState<Customer>({ name: "", phone: "", address: "", governorate: "", notes: "" });
  const [errs, setErrs] = useState<Partial<Record<keyof Customer, string>>>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

  if (lines.length === 0) return <div className="wrap center"><h2>السلة فاضية</h2><a className="btn" href="#/">الرجوع للمتجر</a></div>;

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setC(prev => ({ ...prev, [k]: e.target.value }));

  const validate = () => {
    const e: typeof errs = {};
    if (c.name.trim().length < 3) e.name = "اكتب الاسم بالكامل";
    if (!isPhone(toEnDigits(c.phone))) e.phone = "اكتب رقم موبايل مصري صحيح (مثال: 01012345678)";
    if (c.address.trim().length < 10) e.address = "اكتب العنوان بالتفصيل (الشارع، رقم العمارة، علامة مميزة)";
    if (!c.governorate) e.governorate = "اختار المحافظة";
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFail(null);
    if (!validate()) return;
    const stockIssue = lines.find(l => !inStock(l.variant) || l.qty > l.variant.stock_qty);
    if (stockIssue) { setFail(`الكمية المطلوبة من "${stockIssue.product.name_ar}" غير متاحة. راجع السلة.`); return; }

    const customer: Customer = { ...c, phone: toEnDigits(c.phone).replace(/[\s-]/g, "") };
    const count = lines.reduce((s, l) => s + l.qty, 0);

    if (!BACKEND_READY) {
      // وضع تجريبي: مفيش حفظ حقيقي، وده بيتوضح للعميل في صفحة التأكيد.
      onPlaced({ ref: `DEMO-${Date.now().toString(36).toUpperCase()}`, demo: true, total: subtotal, customer, count });
      return;
    }
    setBusy(true);
    try {
      // الأسعار والمخزون بيتحققوا في السيرفر. الدالة المتوقعة: create_order(p_customer jsonb, p_items jsonb)
      const res = await sb<{ order_ref: string; total: number } | { order_ref: string; total: number }[]>("rpc/create_order", {
        method: "POST",
        body: JSON.stringify({
          p_customer: { name: customer.name.trim(), phone: customer.phone, address: customer.address.trim(), governorate: customer.governorate, notes: customer.notes.trim() },
          p_items: lines.map(l => ({ variant_id: l.variant.id, qty: l.qty })),
        }),
      });
      const row = Array.isArray(res) ? res[0] : res;
      if (!row?.order_ref) throw new Error("لم يتم استلام رقم الطلب من الخادم");
      onPlaced({ ref: row.order_ref, demo: false, total: Number(row.total ?? subtotal), customer, count });
    } catch (e: any) {
      setFail(`تعذّر تسجيل الطلب: ${e?.message ?? "خطأ غير معروف"}. لم يتم حفظ أي طلب، حاول مرة تانية.`);
    } finally { setBusy(false); }
  };

  return (
    <div className="wrap" style={{ marginTop: 16 }}>
      <h1 style={{ fontSize: 24 }}>إتمام الطلب</h1>
      {!BACKEND_READY && <div className="alert warn">وضع تجريبي: الطلب مش هيتحفظ فعليًا لأن قاعدة البيانات لسه متوصلتش.</div>}
      <form className="panel" onSubmit={submit} noValidate>
        <label htmlFor="n">الاسم بالكامل</label>
        <input id="n" className="f" value={c.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errs.name} />
        {errs.name && <div className="err">{errs.name}</div>}

        <label htmlFor="p">رقم الموبايل</label>
        <input id="p" className="f" inputMode="tel" dir="ltr" style={{ textAlign: "right" }} value={c.phone} onChange={set("phone")} autoComplete="tel" aria-invalid={!!errs.phone} />
        {errs.phone && <div className="err">{errs.phone}</div>}

        <label htmlFor="g">المحافظة</label>
        <select id="g" className="f" value={c.governorate} onChange={set("governorate")} aria-invalid={!!errs.governorate}>
          <option value="">اختار المحافظة</option>
          {GOVERNORATES.map(g => <option key={g}>{g}</option>)}
        </select>
        {errs.governorate && <div className="err">{errs.governorate}</div>}

        <label htmlFor="a">العنوان بالتفصيل</label>
        <textarea id="a" className="f" rows={3} value={c.address} onChange={set("address")} autoComplete="street-address" aria-invalid={!!errs.address} />
        {errs.address && <div className="err">{errs.address}</div>}

        <label htmlFor="o">ملاحظات (اختياري)</label>
        <textarea id="o" className="f" rows={2} value={c.notes} onChange={set("notes")} />

        <div style={{ marginTop: 16 }}>
          {lines.map(l => (
            <div className="sum" key={l.variant.id}>
              <span>{l.product.name_ar} ({[l.variant.fragrance, l.variant.size_label].filter(Boolean).join(" • ")}) × {num(l.qty)}</span>
              <span>{money(l.total)}</span>
            </div>
          ))}
          <div className="sum t"><span>الإجمالي</span><span>{money(subtotal)}</span></div>
          <div className="cc">طريقة الدفع: الدفع عند الاستلام</div>
        </div>

        {fail && <div className="alert bad" role="alert">{fail}</div>}
        <button className="btn block" type="submit" disabled={busy} style={{ marginTop: 12 }}>
          {busy ? "جارٍ إرسال الطلب…" : "تأكيد الطلب"}
        </button>
      </form>
    </div>
  );
}

function Confirmation({ order }: { order: PlacedOrder | null }) {
  if (!order) return <div className="wrap center"><h2>مفيش طلب لعرضه</h2><a className="btn" href="#/">الرجوع للمتجر</a></div>;
  return (
    <div className="wrap center">
      <div style={{ fontSize: 56 }} aria-hidden>{order.demo ? "🧪" : "✅"}</div>
      <h1>{order.demo ? "طلب تجريبي (لم يُحفظ)" : "تم استلام طلبك!"}</h1>
      <div className="panel" style={{ maxWidth: 480, margin: "16px auto", textAlign: "right" }}>
        <div className="sum"><span>رقم الطلب</span><strong dir="ltr">{order.ref}</strong></div>
        <div className="sum"><span>عدد القطع</span><strong>{num(order.count)}</strong></div>
        <div className="sum"><span>الإجمالي</span><strong>{money(order.total)}</strong></div>
        <div className="sum"><span>الدفع</span><strong>عند الاستلام</strong></div>
        <div className="sum"><span>التوصيل إلى</span><strong>{order.customer.governorate}</strong></div>
      </div>
      {order.demo
        ? <div className="alert warn" style={{ maxWidth: 480, margin: "0 auto 16px" }}>ده وضع تجريبي: الطلب ده ماتسجلش في أي قاعدة بيانات ومش هيتم تنفيذه.</div>
        : <p>هنتواصل معاك على {order.customer.phone} لتأكيد الطلب.</p>}
      <a className="btn" href="#/">رجوع للمتجر</a>
    </div>
  );
}

/* ========================= التطبيق ========================= */
export default function App() {
  const hash = useHash();
  const { categories, products, loading, error, reload } = useCatalog();
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const [order, setOrder] = useState<PlacedOrder | null>(null);

  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ } }, [cart]);

  const lines: Line[] = useMemo(() => {
    const vmap = new Map<string, { v: Variant; p: Product }>();
    products.forEach(p => p.product_variants.forEach(v => vmap.set(v.id, { v, p })));
    const out: Line[] = [];
    cart.forEach(i => {
      const hit = vmap.get(i.variantId);
      if (!hit) return;
      const qty = Math.max(1, Math.min(i.qty, Math.max(hit.v.stock_qty, 1)));
      out.push({ variant: hit.v, product: hit.p, qty, total: hit.v.price * qty });
    });
    return out;
  }, [cart, products]);

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const placed = (o: PlacedOrder) => { setOrder(o); dispatch({ type: "clear" }); go("/order"); };

  let page: React.ReactNode;
  if (loading) page = <div className="wrap center">جارٍ تحميل المنتجات…</div>;
  else if (error) page = (
    <div className="wrap center">
      <div className="alert bad">تعذّر تحميل المنتجات: {error}</div>
      <button className="btn" onClick={reload}>إعادة المحاولة</button>
    </div>
  );
  else if (hash.startsWith("/product/")) page = <ProductPage id={decodeURIComponent(hash.slice(9))} products={products} cats={categories} dispatch={dispatch} />;
  else if (hash === "/cart") page = <CartPage lines={lines} subtotal={subtotal} dispatch={dispatch} />;
  else if (hash === "/checkout") page = <Checkout lines={lines} subtotal={subtotal} onPlaced={placed} />;
  else if (hash === "/order") page = <Confirmation order={order} />;
  else page = <Home cats={categories} products={products} />;

  return (
    <div className="kt">
      <style>{CSS}</style>
      {!BACKEND_READY && <div className="demo">وضع تجريبي: بيانات المنتجات للعرض فقط ولا يتم حفظ الطلبات.</div>}
      <header className="top">
        <div className="wrap bar">
          <a className="logo" href="#/" aria-label="كلين توب - الرئيسية"><span aria-hidden>🌿</span> كلين توب</a>
          <button className="cartbtn" onClick={() => go("/cart")} aria-label={`السلة، ${count} منتج`}>
            🛒 السلة{count > 0 && <span className="badge">{num(count)}</span>}
          </button>
        </div>
      </header>
      <main>{page}</main>
      <footer><div className="wrap">© كلين توب — نضافة بتبان وريحة بتدوم</div></footer>
    </div>
  );
}

/* ====== لو الملف ده هو نقطة الدخول، فك التعليق عن الأسطر دي: ======
import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")!).render(<App />);
*/
