import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { FormField } from "@/components/site/InquiryForm";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول الإدارة — بيوريفا" },
      { name: "description", content: "تسجيل دخول لوحة تحكم متجر بيوريفا." },
      { property: "og:title", content: "دخول الإدارة — بيوريفا" },
      { property: "og:description", content: "لوحة تحكم المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ type: "error", text: "بريد إلكتروني غير صحيح" });
    if (password.length < 8) return setMsg({ type: "error", text: "كلمة المرور 8 حروف على الأقل" });
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg({ type: "error", text: "البريد أو كلمة المرور غير صحيحة" });
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      setBusy(false);
      if (error) return setMsg({ type: "error", text: error.message });
      setMsg({ type: "info", text: "تم إنشاء الحساب. افتح بريدك واضغط على رابط التأكيد، ثم سجّل الدخول." });
      setMode("in");
    }
  };

  return (
    <div className="container-page flex max-w-sm flex-col items-center py-20">
      <Logo className="text-2xl" />
      <h1 className="mt-8 text-xl font-semibold">{mode === "in" ? "دخول لوحة التحكم" : "إنشاء حساب إدارة"}</h1>
      <form onSubmit={submit} noValidate className="mt-8 w-full space-y-4">
        <FormField label="البريد الإلكتروني">
          <input className="field" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </FormField>
        <FormField label="كلمة المرور">
          <input className="field" dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} />
        </FormField>
        {msg && <p role="alert" className={`text-sm ${msg.type === "error" ? "text-destructive" : "text-success"}`}>{msg.text}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {mode === "in" ? "دخول" : "إنشاء الحساب"}
        </Button>
      </form>
      <button className="mt-6 text-sm text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "أول مرة؟ أنشئ حساب الإدارة" : "عندك حساب؟ سجّل الدخول"}
      </button>
      <p className="mt-4 text-center text-xs text-muted-foreground">أول حساب يتم إنشاؤه يصبح مدير المتجر تلقائياً.</p>
    </div>
  );
}
