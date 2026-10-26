import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingState, ErrorState } from "@/components/site/States";
import { FormField } from "@/components/site/InquiryForm";
import type { Product, Variant } from "@/lib/store";

import { ImageManager } from "./ImageManager";

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

export function ProductsPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("sort");
  const [page, setPage] = useState(0);
  const categories = useQuery({ queryKey: ["admin-categories"], queryFn: async () => { const { data, error } = await supabase.from("categories").select("*").order("sort_order"); if (error) throw error; return data; } });
  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, product_variants(*)").order("sort_order");
      if (error) throw error;
      return data as unknown as Product[];
    },
  });
  const wholesale = useQuery({
    queryKey: ["admin-wholesale"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wholesale_prices").select("*");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-wholesale"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["cart-variants"] });
    qc.invalidateQueries({ queryKey: ["inventory"] });
  };

  const addProduct = async () => {
    const slug = `product-${Date.now().toString(36)}`;
    const { error } = await supabase.from("products").insert({ slug, name_ar: "منتج جديد", active: false, sort_order: (products.data?.length ?? 0) + 1 });
    if (error) return void toast.error("تعذر إضافة المنتج");
    refresh();
  };

  if (products.isLoading) return <LoadingState />;
  if (products.isError) return <ErrorState />;

  const list = (products.data ?? []).filter(p => `${p.name_ar} ${p.name_en ?? ""}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (filter === "active" ? p.active && !p.archived : filter === "archived" ? p.archived : !p.active))).sort((a,b) => sort === "name" ? a.name_ar.localeCompare(b.name_ar) : a.sort_order-b.sort_order);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3"><input className="field max-w-sm" placeholder="بحث بالاسم" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /><select className="field w-40" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="all">كل المنتجات</option><option value="active">المنشورة</option><option value="hidden">غير المنشورة</option><option value="archived">المؤرشفة</option></select><select className="field w-40" value={sort} onChange={e => setSort(e.target.value)}><option value="sort">ترتيب العرض</option><option value="name">الاسم</option></select></div>
      <p className="text-sm text-muted-foreground">
        أي نص يبدأ بـ <code>[مؤقت]</code> لا يظهر للعملاء. المنتج لا يمكن طلبه إلا بعد إدخال السعر والمخزون.
      </p>
      {list.slice(page*10,page*10+10).map((p) => (
        <ProductEditor key={p.id} product={p} wholesale={wholesale.data ?? []} categories={categories.data ?? []} onSaved={refresh} />
      ))}
      <div className="flex gap-3"><Button variant="outline" disabled={page===0} onClick={() => setPage(page-1)}>السابق</Button><Button variant="outline" disabled={(page+1)*10>=list.length} onClick={() => setPage(page+1)}>التالي</Button></div>
      <Button variant="outline" onClick={addProduct}><Plus /> إضافة منتج</Button>
    </div>
  );
}

type WP = { variant_id: string; price: number; min_quantity: number };

function ProductEditor({ product, wholesale, categories, onSaved }: { product: Product; wholesale: WP[]; categories: {id: string; name_ar: string}[]; onSaved: () => void }) {
  const [p, setP] = useState(product);
  const [benefits, setBenefits] = useState(product.benefits.join("\n"));
  const [images, setImages] = useState(product.images.join("\n"));
  const [saving, setSaving] = useState(false);
  useEffect(() => setP(product), [product]);

  const set = (k: keyof Product) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP({ ...p, [k]: e.target.value });

  const save = async () => {
    if (!/^[a-z0-9-]+$/.test(p.slug)) return void toast.error("الرابط (slug) حروف إنجليزية صغيرة وأرقام وشرطة فقط");
    if (p.name_ar.trim().length < 2) return void toast.error("اكتب اسم المنتج");
    const imgs = images.split("\n").map((s) => s.trim()).filter(Boolean);
    if (imgs.some((u) => !/^https:\/\//.test(u) && !/^media:[a-z0-9-]+\.(jpg|png|webp)$/.test(u))) return void toast.error("روابط الصور لازم تبدأ بـ https://");
    setSaving(true);
    const { error } = await supabase.from("products").update({
      slug: p.slug, name_ar: p.name_ar, name_en: p.name_en, short_ar: p.short_ar, description_ar: p.description_ar,
      category_id: p.category_id, archived: p.archived, featured: p.featured, best_selling: p.best_selling, description_en: p.description_en, sort_order: p.sort_order,
      scent: p.scent, ingredients: p.ingredients, usage_instructions: p.usage_instructions, active: p.active,
      benefits: benefits.split("\n").map((s) => s.trim()).filter(Boolean), images: imgs,
    }).eq("id", p.id);
    setSaving(false);
    if (error) return void toast.error("تعذر الحفظ: " + error.message);
    toast.success("تم حفظ المنتج");
    onSaved();
  };

  const remove = async () => {
    if (!confirm("حذف المنتج نهائياً؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return void toast.error("تعذر الحذف");
    onSaved();
  };

  const addVariant = async () => {
    const { error } = await supabase.from("product_variants").insert({ product_id: p.id, size_label: "حجم جديد", sort_order: p.product_variants.length + 1 });
    if (error) return void toast.error("تعذر الإضافة");
    onSaved();
  };

  return (
    <div className="border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{p.name_ar}</h3>
        <label className="flex items-center gap-2 text-sm">ظاهر في المتجر <Switch checked={p.active} onCheckedChange={(v) => setP({ ...p, active: v })} /></label>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-5 text-sm"><label className="flex gap-2">مميز<Switch checked={p.featured} onCheckedChange={v => setP({...p,featured:v})} /></label><label className="flex gap-2">الأكثر مبيعاً<Switch checked={p.best_selling} onCheckedChange={v => setP({...p,best_selling:v})} /></label><label className="flex gap-2">مؤرشف<Switch checked={p.archived} onCheckedChange={v => setP({...p,archived:v,active:v ? false : p.active})} /></label></div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="القسم"><select className="field" value={p.category_id ?? ""} onChange={e => setP({...p,category_id:e.target.value || null})}><option value="">دون قسم</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></FormField>
        <FormField label="ترتيب العرض"><input className="field" type="number" value={p.sort_order} onChange={e => setP({...p,sort_order:Number(e.target.value)})} /></FormField>
        <FormField label="الوصف بالإنجليزي"><textarea className="field h-20 py-2" value={p.description_en ?? ""} onChange={set("description_en")} /></FormField>
        <FormField label="الاسم بالعربي"><input className="field" value={p.name_ar} onChange={set("name_ar")} /></FormField>
        <FormField label="الاسم بالإنجليزي"><input className="field" dir="ltr" value={p.name_en ?? ""} onChange={set("name_en")} /></FormField>
        <FormField label="الرابط (slug)"><input className="field" dir="ltr" value={p.slug} onChange={set("slug")} /></FormField>
        <FormField label="الرائحة"><input className="field" value={p.scent ?? ""} onChange={set("scent")} /></FormField>
        <div className="md:col-span-2"><FormField label="الوصف"><textarea className="field h-20 py-2" value={p.description_ar ?? ""} onChange={set("description_ar")} /></FormField></div>
        <FormField label="المكونات (كما على العبوة)"><textarea className="field h-24 py-2" value={p.ingredients ?? ""} onChange={set("ingredients")} /></FormField>
        <FormField label="طريقة الاستخدام"><textarea className="field h-24 py-2" value={p.usage_instructions ?? ""} onChange={set("usage_instructions")} /></FormField>
        <FormField label="مميزات موثقة فقط (سطر لكل ميزة)"><textarea className="field h-24 py-2" value={benefits} onChange={(e) => setBenefits(e.target.value)} /></FormField>
        <FormField label="روابط الصور (سطر لكل صورة، https)"><textarea className="field h-24 py-2" dir="ltr" value={images} onChange={(e) => setImages(e.target.value)} /></FormField>
      </div>
      <div className="mt-4"><ImageManager value={images.split("\n").filter(Boolean)} onChange={imgs => setImages(imgs.join("\n"))} /></div>
      <div className="mt-4 flex gap-2">
        <Button onClick={save} disabled={saving}><Save /> حفظ المنتج</Button>
        <Button variant="ghost" onClick={remove} className="text-destructive"><Trash2 /> حذف</Button>
      </div>

      <h4 className="mt-8 mb-3 font-medium">الأحجام والأسعار والمخزون</h4>
      <div className="space-y-2">
        {[...p.product_variants].sort((a, b) => a.sort_order - b.sort_order).map((v) => (
          <VariantRow key={v.id} variant={v} wholesale={wholesale.find((w) => w.variant_id === v.id)} onSaved={onSaved} />
        ))}
      </div>
      <Button variant="outline" size="sm" className="mt-3" onClick={addVariant}><Plus /> إضافة حجم</Button>
    </div>
  );
}

function VariantRow({ variant, wholesale, onSaved }: { variant: Variant; wholesale?: WP | undefined; onSaved: () => void }) {
  const [label, setLabel] = useState(variant.size_label);
  const [price, setPrice] = useState(variant.price?.toString() ?? "");
  const [sale, setSale] = useState(variant.sale_price?.toString() ?? "");
  const [low, setLow] = useState(String(variant.low_stock_threshold));
  const [stock, setStock] = useState(String(variant.stock));
  const [active, setActive] = useState(variant.active);
  const [wPrice, setWPrice] = useState(wholesale?.price.toString() ?? "");
  const [wMin, setWMin] = useState(String(wholesale?.min_quantity ?? 1));

  const save = async () => {
    const sp = numOrNull(sale), lt = Number(low);
    if ((sp != null && (!Number.isFinite(sp) || sp < 0 || numOrNull(price) == null || sp > Number(price))) || !Number.isInteger(lt) || lt < 0) return void toast.error("راجع السعر المخفض وحد المخزون المنخفض");
    const pr = numOrNull(price), st = Number(stock), wp = numOrNull(wPrice), wm = Number(wMin);
    if (!label.trim()) return void toast.error("اكتب الحجم");
    if ((pr != null && (isNaN(pr) || pr < 0)) || isNaN(st) || st < 0 || !Number.isInteger(st)) return void toast.error("السعر أو المخزون غير صحيح");
    if (wp != null && (isNaN(wp) || wp < 0 || !Number.isInteger(wm) || wm < 1)) return void toast.error("سعر الجملة غير صحيح");
    const { error } = await supabase.from("product_variants").update({ size_label: label.trim(), price: pr, sale_price: sp, low_stock_threshold: lt, stock: st, active }).eq("id", variant.id);
    if (error) return void toast.error("تعذر الحفظ");
    const w = wp == null
      ? await supabase.from("wholesale_prices").delete().eq("variant_id", variant.id)
      : await supabase.from("wholesale_prices").upsert({ variant_id: variant.id, price: wp, min_quantity: wm });
    if (w.error) return void toast.error("تعذر حفظ سعر الجملة");
    toast.success("تم الحفظ");
    onSaved();
  };
  const remove = async () => {
    if (!confirm("حذف هذا الحجم؟")) return;
    const { error } = await supabase.from("product_variants").delete().eq("id", variant.id);
    if (error) return void toast.error("تعذر الحذف");
    onSaved();
  };

  return (
    <div className="grid items-end gap-2 border p-3 sm:grid-cols-2 lg:grid-cols-4">
      <FormField label="الحجم"><input className="field h-9" value={label} onChange={(e) => setLabel(e.target.value)} /></FormField>
      <FormField label="السعر (ج.م)"><input className="field h-9" inputMode="decimal" placeholder="غير محدد" value={price} onChange={(e) => setPrice(e.target.value)} /></FormField>
      <FormField label="السعر المخفض"><input className="field h-9" inputMode="decimal" value={sale} onChange={e => setSale(e.target.value)} /></FormField>
      <FormField label="تنبيه مخزون أقل من"><input className="field h-9" inputMode="numeric" value={low} onChange={e => setLow(e.target.value)} /></FormField>
      <FormField label="المخزون"><input className="field h-9" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} /></FormField>
      <FormField label="سعر الجملة"><input className="field h-9" inputMode="decimal" placeholder="—" value={wPrice} onChange={(e) => setWPrice(e.target.value)} /></FormField>
      <FormField label="حد أدنى جملة"><input className="field h-9" inputMode="numeric" value={wMin} onChange={(e) => setWMin(e.target.value)} /></FormField>
      <div className="flex items-center gap-2 pb-1">
        <Switch checked={active} onCheckedChange={setActive} aria-label="مفعل" />
        <Button size="sm" onClick={save}><Save /></Button>
        <Button size="sm" variant="ghost" onClick={remove} aria-label="حذف"><Trash2 /></Button>
      </div>
    </div>
  );
}
