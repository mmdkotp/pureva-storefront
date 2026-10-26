import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/site/InquiryForm';
import { LoadingState, ErrorState } from '@/components/site/States';
import { ImageManager } from './ImageManager';
import type { Tables } from '@/integrations/supabase/types';
type Category = Tables<'categories'>;

export function CategoriesPanel() {
  const qc = useQueryClient();
  const rows = useQuery({ queryKey: ['admin-categories'], queryFn: async () => { const { data, error } = await supabase.from('categories').select('*').order('sort_order').order('name_ar'); if (error) throw error; return data; } });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['admin-categories'] }); void qc.invalidateQueries({ queryKey: ['categories'] }); void qc.invalidateQueries({ queryKey: ['products'] }); };
  const reorder = async (index: number, delta: number) => {
    const list = [...(rows.data ?? [])]; const j = index + delta; if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    for (const [i, c] of list.entries()) { const { error } = await supabase.from('categories').update({ sort_order: i }).eq('id', c.id); if (error) return void toast.error('تعذر ترتيب الأقسام'); }
    refresh();
  };
  if (rows.isLoading) return <LoadingState />; if (rows.isError) return <ErrorState />;
  return <div className="space-y-5">{rows.data?.map((c, i) => <div key={c.id} className="border bg-card p-5"><div className="mb-4 flex gap-2"><Button variant="ghost" size="icon" disabled={i === 0} title="للأعلى" onClick={() => void reorder(i, -1)}><ArrowUp /></Button><Button variant="ghost" size="icon" disabled={i === (rows.data?.length ?? 0) - 1} title="للأسفل" onClick={() => void reorder(i, 1)}><ArrowDown /></Button></div><CategoryEditor category={c} onSaved={refresh} /></div>)}
    <Button variant="outline" onClick={async () => { const { error } = await supabase.from('categories').insert({ name_ar: 'قسم جديد', active: false, sort_order: rows.data?.length ?? 0 }); if (error) toast.error('تعذر الإضافة'); else refresh(); }}><Plus />إضافة قسم</Button>
  </div>;
}
function CategoryEditor({ category, onSaved }: { category: Category; onSaved: () => void }) {
  const [c, setC] = useState(category); const [busy, setBusy] = useState(false);
  const save = async () => { if (c.name_ar.trim().length < 2) return void toast.error('اكتب اسم القسم'); setBusy(true); const { error } = await supabase.from('categories').update({ name_ar: c.name_ar.trim(), name_en: c.name_en, description_ar: c.description_ar, description_en: c.description_en, image_url: c.image_url, active: c.active }).eq('id', c.id); setBusy(false); if (error) toast.error('تعذر الحفظ'); else { toast.success('تم حفظ القسم'); onSaved(); } };
  return <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2">{(['name_ar', 'name_en', 'description_ar', 'description_en'] as const).map((k, i) => <FormField key={k} label={['الاسم بالعربي', 'الاسم بالإنجليزي', 'الوصف بالعربي', 'الوصف بالإنجليزي'][i]}><input className="field" value={c[k] ?? ''} onChange={e => setC({ ...c, [k]: e.target.value })} /></FormField>)}</div><ImageManager single value={c.image_url ? [c.image_url] : []} onChange={imgs => setC({ ...c, image_url: imgs[0] ?? null })} /><label className="flex items-center gap-2 text-sm">ظاهر في المتجر<Switch checked={c.active} onCheckedChange={active => setC({ ...c, active })} /></label><div className="flex gap-2"><Button onClick={save} disabled={busy}><Save />حفظ</Button><Button variant="ghost" onClick={async () => { if (!confirm('حذف القسم؟ تبقى المنتجات دون قسم.')) return; const { error } = await supabase.from('categories').delete().eq('id', c.id); if (error) toast.error('تعذر الحذف'); else onSaved(); }}><Trash2 />حذف</Button></div></div>;
}