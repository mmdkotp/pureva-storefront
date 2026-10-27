import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export const categoriesQuery = queryOptions({ queryKey: ['categories'], refetchInterval: 15000, queryFn: async () => {
  const { data, error } = await supabase.from('categories').select('*').eq('active', true).order('sort_order');
  if (error) throw error;
  return data;
} });
export function homeSections(value: Json | undefined): { key: string; enabled: boolean }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(v => v && typeof v === 'object' && !Array.isArray(v) && typeof v['key'] === 'string' ? [{ key: v['key'], enabled: v['enabled'] !== false }] : []);
}
export function savedFaqs(value: Json | undefined, lang: 'ar' | 'en'): { q: string; a: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(v => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return [];
    const q = lang === 'en' && v['q_en'] ? v['q_en'] : v['q'];
    const a = lang === 'en' && v['a_en'] ? v['a_en'] : v['a'];
    return typeof q === 'string' && typeof a === 'string' && q.trim() && a.trim() ? [{ q, a }] : [];
  });
}