import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/media/$')({
  server: { handlers: { GET: async ({ params }) => {
    const path = params._splat;
    if (!path || !/^[a-z0-9-]+\.(jpg|png|webp)$/.test(path)) return new Response('Not found', { status: 404 });
    // Only image files from the dedicated storefront-media bucket are public.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin.storage.from('store-media').download(path);
    if (error || !data) return new Response('Not found', { status: 404 });
    return new Response(data, { headers: { 'Content-Type': data.type, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
  } } },
});