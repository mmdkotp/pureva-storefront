import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/** The store's editable bilingual wordmark. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { data: s } = useQuery(settingsQuery);
  return (
    <span className={cn("inline-flex max-w-full flex-col items-center leading-none", className)} dir="ltr">
      {s?.logo_url ? <img src={mediaUrl(s.logo_url)} alt={s.brand_name} className="h-12 max-w-48 object-contain" /> : <span className="font-wordmark break-all font-bold">{s?.brand_name || "KLEANTOP"}</span>}
      {!compact && <span className="mt-1.5 flex items-center gap-2 text-[0.55em] font-medium opacity-70"><span className="h-px w-4 bg-current opacity-50" />{s?.brand_name_ar || "كلين توب"}<span className="h-px w-4 bg-current opacity-50" /></span>}
    </span>
  );
}
