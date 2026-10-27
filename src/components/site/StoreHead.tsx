import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { settingsQuery } from '@/lib/store';
import { mediaUrl } from '@/lib/media';

export function StoreHead() {
  const { data:s }=useQuery(settingsQuery);
  useEffect(()=>{if(!s)return;const href=mediaUrl(s.favicon_url);if(href){let el=document.querySelector<HTMLLinkElement>('link[rel="icon"]');if(!el){el=document.createElement('link');el.rel='icon';document.head.append(el);}el.href=href;el.removeAttribute('type');}},[s?.favicon_url]);
  return null;
}