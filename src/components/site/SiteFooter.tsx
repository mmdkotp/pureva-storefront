import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { settingsQuery } from "@/lib/store";
import { whatsappLink } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { data: s } = useQuery(settingsQuery);
  const { t } = useI18n();
  const wa = whatsappLink(s?.whatsapp);
  const missing = t("سيُضاف قريباً", "Coming soon");

  return (
    <footer className="bg-night text-primary-foreground">
      <div className="container-page grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo className="text-2xl" />
          <p className="mt-6 max-w-sm text-sm text-primary-foreground/60">“نضافة تفرق، ولمعة تدوم”</p>
          <div className="mt-6 flex gap-4 text-primary-foreground/70">
            {s?.facebook_url && (
              <a href={s.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook">
                <Facebook className="size-5" />
              </a>
            )}
            {s?.instagram_url && (
              <a href={s.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram className="size-5" />
              </a>
            )}
            {s?.tiktok_url && (
              <a href={s.tiktok_url} target="_blank" rel="noreferrer" className="text-xs">
                TikTok
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <MessageCircle className="size-5" />
              </a>
            )}
          </div>
        </div>
        <div>
          <p className="eyebrow text-silver">{t("تواصل", "Contact")}</p>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> <span dir="ltr">{s?.phone || missing}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> {s?.email || missing}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4" /> {s?.address || missing}
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-silver">{t("روابط", "Links")}</p>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
            <li><Link to="/wholesale">{t("الجملة والتجار", "Wholesale")}</Link></li>
            <li><Link to="/policies">{t("الشحن والاسترجاع والخصوصية", "Policies")}</Link></li>
            <li><Link to="/contact">{t("تواصل معنا", "Contact us")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-page py-6 text-xs text-primary-foreground/40">
          © {new Date().getFullYear()} PUREVA — {t("منتج مصري", "Made in Egypt")}
        </div>
      </div>
    </footer>
  );
}
