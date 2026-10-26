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
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { title: "دخول الإدارة — كلين توب" },
      { name: "description", content: "تسجيل دخول لوحة تحكم متجر كلين توب." },
      { property: "og:title", content: "دخول الإدارة — كلين توب" },
      { property: "og:description", content: "لوحة تحكم المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return void setMsg({ type: "error", text: "بريد إلكتروني غير صحيح" });
    if (!password) return void setMsg({ type: "error", text: "اكتب كلمة المرور" });
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return void setMsg({ type: "error", text: "البريد أو كلمة المرور غير صحيحة" });
    navigate({ to: "/admin" });
  };

  return (
    <div className="container-page flex max-w-sm flex-col items-center py-20">
      <Logo className="text-2xl" />
      <h1 className="mt-8 text-xl font-semibold">دخول لوحة التحكم</h1>
      <form onSubmit={submit} noValidate className="mt-8 w-full space-y-4">
        <FormField label="البريد الإلكتروني">
          <input className="field" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </FormField>
        <FormField label="كلمة المرور">
          <input className="field" dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </FormField>
        {msg && <p role="alert" className={`text-sm ${msg.type === "error" ? "text-destructive" : "text-success"}`}>{msg.text}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          دخول
        </Button>
      </form>
    </div>
  );
}
