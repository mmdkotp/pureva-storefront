import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { LoadingState } from "@/components/site/States";
import { supabase } from "@/integrations/supabase/client";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { ProductsPanel } from "@/components/admin/ProductsPanel";
import { ShippingPanel } from "@/components/admin/ShippingPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { InquiriesPanel } from "@/components/admin/InquiriesPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { title: "لوحة التحكم — كلين توب" },
      { name: "description", content: "إدارة متجر كلين توب." },
      { property: "og:title", content: "لوحة التحكم — كلين توب" },
      { property: "og:description", content: "إدارة المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const role = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/" className="text-lg"><Logo compact /></Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-primary-foreground/60 sm:inline" dir="ltr">{user.email}</span>
            <Button variant="heroOutline" size="sm" onClick={signOut}><LogOut /> خروج</Button>
          </div>
        </div>
      </header>
      <div className="container-page py-8">
        {role.isLoading ? (
          <LoadingState />
        ) : !role.data ? (
          <div className="border bg-card p-10 text-center">
            <p className="text-lg font-medium">غير مصرح لك بالدخول للوحة التحكم</p>
            <p className="mt-2 text-sm text-muted-foreground">هذا الحساب ليس له صلاحية مدير.</p>
          </div>
        ) : (
          <Tabs defaultValue="orders" dir="rtl">
            <TabsList className="mb-6 flex h-auto flex-wrap justify-start">
              <TabsTrigger value="orders">الطلبات</TabsTrigger>
              <TabsTrigger value="products">المنتجات والمخزون</TabsTrigger>
              <TabsTrigger value="shipping">الشحن</TabsTrigger>
              <TabsTrigger value="inquiries">الاستفسارات والجملة</TabsTrigger>
              <TabsTrigger value="settings">إعدادات المتجر</TabsTrigger>
            </TabsList>
            <TabsContent value="orders"><OrdersPanel /></TabsContent>
            <TabsContent value="products"><ProductsPanel /></TabsContent>
            <TabsContent value="shipping"><ShippingPanel /></TabsContent>
            <TabsContent value="inquiries"><InquiriesPanel /></TabsContent>
            <TabsContent value="settings"><SettingsPanel /></TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
