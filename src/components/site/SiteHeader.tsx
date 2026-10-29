import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoriesQuery } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const { count, ready } = useCart();
  const { t, toggle, lang } = useI18n();
  const categories = useQuery(categoriesQuery);
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [desktopProductsOpen, setDesktopProductsOpen] = useState(false);
  const desktopMenu = useRef<HTMLDivElement>(null);
  const desktopTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!desktopProductsOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !desktopMenu.current?.contains(event.target)) setDesktopProductsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDesktopProductsOpen(false);
      desktopTrigger.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [desktopProductsOpen]);

  const productMenu = (
    <div ref={desktopMenu} className="relative" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setDesktopProductsOpen(false);
    }}>
        <Button ref={desktopTrigger} variant="ghost" aria-expanded={desktopProductsOpen} aria-controls="desktop-product-categories" onClick={() => setDesktopProductsOpen(value => !value)} className="h-auto gap-2 p-0 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground">
          {t("المنتجات", "Products")}<ChevronDown className="size-4" />
        </Button>
      {desktopProductsOpen && <nav id="desktop-product-categories" aria-label={t("أقسام المنتجات", "Product categories")} className="absolute start-0 top-full z-50 mt-4 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
        <Link to="/" search={{}} hash="products" onClick={() => setDesktopProductsOpen(false)} className="block rounded-sm px-2 py-2 hover:bg-accent focus-visible:bg-accent">{t("كل المنتجات", "All products")}</Link>
        {categories.data?.map(c => <Link key={c.id} to="/" search={{ category: c.id }} hash="products" onClick={() => setDesktopProductsOpen(false)} className="block rounded-sm px-2 py-2 hover:bg-accent focus-visible:bg-accent">{lang === "en" && c.name_en ? c.name_en : c.name_ar}</Link>)}
      </nav>}
    </div>
  );

  const links = [
    { to: "/", label: t("الرئيسية", "Home") },
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
          {links.map((l, index) => (
            <div key={l.to} className="flex items-center gap-8">
            <Link
              key={l.to}
              to={l.to}
              search={{}}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
            {index === 0 && productMenu}
            </div>
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
      {open && (
        <nav className="border-t md:hidden">
          <div className="container-page flex flex-col py-2">
            {links.map((l, index) => (
              <div key={l.to}>
              <Link
                key={l.to}
                to={l.to}
                search={{}}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm"
              >
                {l.label}
              </Link>
              {index === 0 && <>
                <Button variant="ghost" className="h-auto w-full justify-between px-0 py-3 font-normal" aria-expanded={productsOpen} aria-controls="mobile-product-categories" onClick={() => setProductsOpen(value => !value)}>
                  {t("المنتجات", "Products")}<ChevronDown className={`size-4 transition-transform ${productsOpen ? "rotate-180" : ""}`} />
                </Button>
                {productsOpen && <div id="mobile-product-categories" className="ms-3 border-s ps-4">
                  <Link to="/" search={{}} hash="products" onClick={() => setOpen(false)} className="block py-3 text-sm">{t("كل المنتجات", "All products")}</Link>
                  {categories.data?.map(c => <Link key={c.id} to="/" search={{ category: c.id }} hash="products" onClick={() => setOpen(false)} className="block py-3 text-sm text-muted-foreground">{lang === "en" && c.name_en ? c.name_en : c.name_ar}</Link>)}
                </div>}
              </>}
              </div>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
