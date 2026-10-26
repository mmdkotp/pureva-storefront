import { cn } from "@/lib/utils";

/** KLEANTOP wordmark: wide-set custom lettering with a silver "V" and the Arabic name beneath. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col items-center leading-none", className)} dir="ltr">
      <span className="font-wordmark font-bold tracking-[0.32em] ps-[0.32em]">
        PURE<span className="silver-text">V</span>A
      </span>
      {!compact && (
        <span className="mt-1.5 flex items-center gap-2 text-[0.55em] font-medium tracking-normal opacity-70">
          <span className="h-px w-4 bg-current opacity-50" />
          كلين توب
          <span className="h-px w-4 bg-current opacity-50" />
        </span>
      )}
    </span>
  );
}
