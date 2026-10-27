import { useState } from 'react';
import { Upload, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { mediaUrl } from '@/lib/media';
import { useI18n } from '@/lib/i18n';

export function ImageManager({ value, onChange, single = false }: { value: string[]; onChange: (images: string[]) => void; single?: boolean }) {
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  const upload = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[file.type];
        if (!ext || file.size > 5 * 1024 * 1024) throw new Error(t('الصورة JPG أو PNG أو WebP وبحد أقصى 5 ميجابايت', 'Use JPG, PNG or WebP up to 5 MB'));
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('store-media').upload(path, file, { contentType: file.type });
        if (error) throw error;
        added.push(`media:${path}`);
        if (single) break;
      }
      onChange(single ? added : [...value, ...added]);
      toast.success(t('تم رفع الصور، احفظ التغييرات', 'Uploaded; save your changes'));
    } catch (e) { toast.error(e instanceof Error ? e.message : t('تعذر رفع الصورة', 'Upload failed')); }
    finally { setBusy(false); }
  };
  const move = (i: number, d: number) => { const next = [...value]; const j = i + d; if (j < 0 || j >= next.length) return; const a = next[i], b = next[j]; if (!a || !b) return; next[i] = b; next[j] = a; onChange(next); };
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-3">{value.map((url, i) => <div key={`${url}-${i}`} className="w-28 border p-2">
      <img src={mediaUrl(url)} alt="" className="aspect-square w-full object-cover" />
      <div className="mt-2 flex justify-center">
        {!single && <><Button type="button" variant="ghost" size="icon" aria-label={t('للأعلى', 'Move up')} title={t('للأعلى', 'Move up')} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button><Button type="button" variant="ghost" size="icon" aria-label={t('للأسفل', 'Move down')} disabled={i === value.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button></>}
        <Button type="button" size="icon" variant="ghost" aria-label={t('إزالة الصورة', 'Remove image')} onClick={() => { if (confirm(t('إزالة الصورة؟', 'Remove image?'))) onChange(value.filter((_, idx) => idx !== i)); }}><Trash2 /></Button>
      </div>
    </div>)}</div>
    <label className="inline-flex cursor-pointer items-center gap-2 border px-4 py-2 text-sm"><Upload className="size-4" />{busy ? t('جاري الرفع…', 'Uploading…') : t('رفع صورة', 'Upload image')}<input type="file" accept="image/jpeg,image/png,image/webp" multiple={!single} disabled={busy} className="sr-only" onChange={e => void upload(e.target.files)} /></label>
  </div>;
}