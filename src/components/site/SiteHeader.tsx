import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/store";
import { categoriesQuery } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const { count, ready } = useCart();
  const { t, toggle, lang } = useI18n();
  const products = useQuery(productsQuery);
  const categories = useQuery(categoriesQuery);
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("الرئيسية", "Home") },
    { to: "/products/$slug", params: { slug: products.data?.[0]?.slug ?? "pureva-dishwashing-liquid" }, label: t("المنتج", "Product") },
    { to: "/wholesale", label: t("الجملة والتجار", "Wholesale") },
    { to: "/contact", label: t("تواصل معنا", "Contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Button variant="ghost" size="icon"
          className="md:hidden"
          aria-label={t("القائمة", "Menu")}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
        <Link to="/" className="text-lg" aria-label="KLEANTOP">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              params={("params" in l ? l.params : {}) as never}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon"
            onClick={toggle}
            className="text-xs tracking-widest text-muted-foreground hover:text-foreground"
            aria-label="Switch language"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </Button>
          <Link to="/cart" className="relative" aria-label={t("السلة", "Cart")}>
            <ShoppingBag className="size-5" />
            {ready && count > 0 && (
              <span className="absolute -top-2 -end-2 grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      {!!categories.data?.length && <nav className="container-page flex flex-wrap gap-x-5 gap-y-2 border-t py-2 text-xs">{categories.data.map(c=><Link key={c.id} to="/" search={{ category: c.id }}>{lang==="en" && c.name_en ? c.name_en : c.name_ar}</Link>)}</nav>}
      {open && (
        <nav className="border-t md:hidden">
          <div className="container-page flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                params={("params" in l ? l.params : {}) as never}
                onClick={() => setOpen(false)}
                className="py-3 text-sm"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
