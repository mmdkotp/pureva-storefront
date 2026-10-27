import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { settingsQuery } from '@/lib/store';
import { homeSections, savedFaqs } from '@/lib/catalog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/site/InquiryForm';
import { LoadingState, ErrorState } from '@/components/site/States';

export function ContentPanel() {
  const qc = useQueryClient(); const settings = useQuery(settingsQuery);
  const [sections, setSections] = useState<{key:string;enabled:boolean}[]>([]); const [faqs, setFaqs] = useState<{q:string;a:string;q_en:string;a_en:string}[]>([]); const [busy, setBusy] = useState(false);
  useEffect(() => { if (settings.data) { setSections(homeSections(settings.data.home_sections)); const ar = savedFaqs(settings.data.faqs,'ar'), en = savedFaqs(settings.data.faqs,'en'); setFaqs(ar.map((f,i) => ({...f,q_en:en[i]?.q ?? '',a_en:en[i]?.a ?? ''}))); } }, [settings.data]);
  if (settings.isLoading) return <LoadingState />; if (settings.isError) return <ErrorState />;
  const names: Record<string,string> = {hero:'البانر',products:'المنتجات',benefits:'المميزات',why:'لماذا كلين توب',wholesale:'الجملة',about:'عن العلامة',faq:'الأسئلة الشائعة'};
  const move = (i:number,d:number) => { const next=[...sections]; const a=next[i],b=next[i+d]; if (!a || !b) return; next[i]=b;next[i+d]=a;setSections(next); };
  return <div className="space-y-8"><section><h3 className="mb-4 text-xl font-semibold">أقسام الصفحة الرئيسية</h3><div className="divide-y border bg-card">{sections.map((s,i) => <div key={s.key} className="flex items-center justify-between gap-3 p-3"><label className="flex items-center gap-3 text-sm"><Switch checked={s.enabled} onCheckedChange={enabled => setSections(sections.map((x,j) => j===i ? {...x,enabled} : x))} />{names[s.key] ?? s.key}</label><div className="flex gap-1"><Button size="icon" variant="ghost" title="للأعلى" disabled={i===0} onClick={() => move(i,-1)}><ArrowUp /></Button><Button size="icon" variant="ghost" title="للأسفل" disabled={i===sections.length-1} onClick={() => move(i,1)}><ArrowDown /></Button></div></div>)}</div><div className="mt-3 flex gap-3">{['about','faq'].filter(k => !sections.some(s => s.key===k)).map(k => <Button key={k} variant="outline" onClick={() => setSections([...sections,{key:k,enabled:true}])}><Plus />{names[k]}</Button>)}</div></section>
    <section><h3 className="mb-4 text-xl font-semibold">الأسئلة الشائعة</h3><div className="space-y-5">{faqs.map((f,i) => <div key={i} className="border bg-card p-4"><div className="grid gap-3 md:grid-cols-2">{(['q','a','q_en','a_en'] as const).map((k,j) => <FormField key={k} label={['السؤال بالعربي','الإجابة بالعربي','السؤال بالإنجليزي','الإجابة بالإنجليزي'][j] ?? ''}><textarea className="field h-20 py-2" value={f[k]} onChange={e => setFaqs(faqs.map((x,n) => n===i ? {...x,[k]:e.target.value} : x))} /></FormField>)}</div><Button className="mt-3" variant="ghost" onClick={() => {if(confirm('حذف السؤال؟'))setFaqs(faqs.filter((_,n)=>n!==i));}}><Trash2 />حذف</Button></div>)}</div><Button className="mt-4" variant="outline" onClick={() => setFaqs([...faqs,{q:'',a:'',q_en:'',a_en:''}])}><Plus />إضافة سؤال</Button></section>
    <Button disabled={busy} onClick={async () => { if (faqs.some(f => !f.q.trim() || !f.a.trim())) return void toast.error('أكمل السؤال والإجابة');setBusy(true); const {error}=await supabase.from('store_settings').update({home_sections:sections,faqs}).eq('id',1);setBusy(false);if(error)toast.error('تعذر الحفظ');else {toast.success('تم حفظ المحتوى');void qc.invalidateQueries({queryKey:['settings']});} }}><Save />حفظ المحتوى</Button>
  </div>;
}