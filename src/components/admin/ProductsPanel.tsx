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

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

export function ProductsPanel() {
  const qc = useQueryClient();
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
  };

  const addProduct = async () => {
    const slug = `product-${Date.now().toString(36)}`;
    const { error } = await supabase.from("products").insert({ slug, name_ar: "منتج جديد", active: false, sort_order: (products.data?.length ?? 0) + 1 });
    if (error) return toast.error("تعذر إضافة المنتج");
    refresh();
  };

  if (products.isLoading) return <LoadingState />;
  if (products.isError) return <ErrorState />;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        أي نص يبدأ بـ <code>[مؤقت]</code> لا يظهر للعملاء. المنتج لا يمكن طلبه إلا بعد إدخال السعر والمخزون.
      </p>
      {products.data?.map((p) => (
        <ProductEditor key={p.id} product={p} wholesale={wholesale.data ?? []} onSaved={refresh} />
      ))}
      <Button variant="outline" onClick={addProduct}><Plus /> إضافة منتج</Button>
    </div>
  );
}

type WP = { variant_id: string; price: number; min_quantity: number };

function ProductEditor({ product, wholesale, onSaved }: { product: Product; wholesale: WP[]; onSaved: () => void }) {
  const [p, setP] = useState(product);
  const [benefits, setBenefits] = useState(product.benefits.join("\n"));
  const [images, setImages] = useState(product.images.join("\n"));
  const [saving, setSaving] = useState(false);
  useEffect(() => setP(product), [product]);

  const set = (k: keyof Product) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP({ ...p, [k]: e.target.value });

  const save = async () => {
    if (!/^[a-z0-9-]+$/.test(p.slug)) return toast.error("الرابط (slug) حروف إنجليزية صغيرة وأرقام وشرطة فقط");
    if (p.name_ar.trim().length < 2) return toast.error("اكتب اسم المنتج");
    const imgs = images.split("\n").map((s) => s.trim()).filter(Boolean);
    if (imgs.some((u) => !/^https:\/\//.test(u))) return toast.error("روابط الصور لازم تبدأ بـ https://");
    setSaving(true);
    const { error } = await supabase.from("products").update({
      slug: p.slug, name_ar: p.name_ar, name_en: p.name_en, short_ar: p.short_ar, description_ar: p.description_ar,
      scent: p.scent, ingredients: p.ingredients, usage_instructions: p.usage_instructions, active: p.active,
      benefits: benefits.split("\n").map((s) => s.trim()).filter(Boolean), images: imgs,
    }).eq("id", p.id);
    setSaving(false);
    if (error) return toast.error("تعذر الحفظ: " + error.message);
    toast.success("تم حفظ المنتج");
    onSaved();
  };

  const remove = async () => {
    if (!confirm("حذف المنتج نهائياً؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error("تعذر الحذف");
    onSaved();
  };

  const addVariant = async () => {
    const { error } = await supabase.from("product_variants").insert({ product_id: p.id, size_label: "حجم جديد", sort_order: p.product_variants.length + 1 });
    if (error) return toast.error("تعذر الإضافة");
    onSaved();
  };

  return (
    <div className="border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{p.name_ar}</h3>
        <label className="flex items-center gap-2 text-sm">ظاهر في المتجر <Switch checked={p.active} onCheckedChange={(v) => setP({ ...p, active: v })} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
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
      <div className="mt-4 flex gap-2">
        <Button onClick={save} disabled={saving}><Save /> حفظ المنتج</Button>
        <Button variant="ghost" onClick={remove} className="text-destructive"><Trash2 /> حذف</Button>
      </div>

      <h4 className="mt-8 mb-3 font-medium">الأحجام والأسعار والمخزون</h4>
      <div className="space-y-2">
        {p.product_variants.sort((a, b) => a.sort_order - b.sort_order).map((v) => (
          <VariantRow key={v.id} variant={v} wholesale={wholesale.find((w) => w.variant_id === v.id)} onSaved={onSaved} />
        ))}
      </div>
      <Button variant="outline" size="sm" className="mt-3" onClick={addVariant}><Plus /> إضافة حجم</Button>
    </div>
  );
}

function VariantRow({ variant, wholesale, onSaved }: { variant: Variant; wholesale?: WP; onSaved: () => void }) {
  const [label, setLabel] = useState(variant.size_label);
  const [price, setPrice] = useState(variant.price?.toString() ?? "");
  const [stock, setStock] = useState(String(variant.stock));
  const [active, setActive] = useState(variant.active);
  const [wPrice, setWPrice] = useState(wholesale?.price.toString() ?? "");
  const [wMin, setWMin] = useState(String(wholesale?.min_quantity ?? 1));

  const save = async () => {
    const pr = numOrNull(price), st = Number(stock), wp = numOrNull(wPrice), wm = Number(wMin);
    if (!label.trim()) return toast.error("اكتب الحجم");
    if ((pr != null && (isNaN(pr) || pr < 0)) || isNaN(st) || st < 0 || !Number.isInteger(st)) return toast.error("السعر أو المخزون غير صحيح");
    if (wp != null && (isNaN(wp) || wp < 0 || !Number.isInteger(wm) || wm < 1)) return toast.error("سعر الجملة غير صحيح");
    const { error } = await supabase.from("product_variants").update({ size_label: label.trim(), price: pr, stock: st, active }).eq("id", variant.id);
    if (error) return toast.error("تعذر الحفظ");
    const w = wp == null
      ? await supabase.from("wholesale_prices").delete().eq("variant_id", variant.id)
      : await supabase.from("wholesale_prices").upsert({ variant_id: variant.id, price: wp, min_quantity: wm });
    if (w.error) return toast.error("تعذر حفظ سعر الجملة");
    toast.success("تم الحفظ");
    onSaved();
  };
  const remove = async () => {
    if (!confirm("حذف هذا الحجم؟")) return;
    const { error } = await supabase.from("product_variants").delete().eq("id", variant.id);
    if (error) return toast.error("تعذر الحذف");
    onSaved();
  };

  return (
    <div className="grid items-end gap-2 border p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
      <FormField label="الحجم"><input className="field h-9" value={label} onChange={(e) => setLabel(e.target.value)} /></FormField>
      <FormField label="السعر (ج.م)"><input className="field h-9" inputMode="decimal" placeholder="غير محدد" value={price} onChange={(e) => setPrice(e.target.value)} /></FormField>
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
