import { Loader2, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "جاري التحميل..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message = "تعذر تحميل البيانات. حاول تاني." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-destructive" role="alert">
      <AlertCircle className="size-5" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed py-16 text-center">
      <p className="text-lg font-medium">{title}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
