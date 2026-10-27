import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const publicStoreMetadata = createServerFn({ method: 'GET' }).inputValidator((input: { slug?: string }) => input).handler(async ({ data }) => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']; const url = process.env['SUPABASE_URL'];
  if (!key || !url) return null;
  const client = createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_') && h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
  const { data: s } = await client.from('store_settings').select('brand_name,brand_name_ar,seo_title,seo_description,hero_title,hero_subtitle,hero_image_url,favicon_url').eq('id',1).single();
  const p = data.slug ? await client.from('products').select('name_ar,description_ar,images').eq('slug',data.slug).eq('active',true).eq('archived',false).maybeSingle() : null;
  return { settings:s, product:p?.data ?? null };
});