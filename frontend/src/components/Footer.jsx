import { Facebook, Instagram, Mail, Phone, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useStoreSettings } from "../context/StoreSettingsContext.jsx";

export default function Footer() {
  const { t } = useTranslation();
  const { settings } = useStoreSettings();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" to="/">
            <span className="brand-mark">
              <Sparkles size={18} />
            </span>
            <span>{settings.store_name || "ECOM 3D"}</span>
          </Link>
          <p>{t("seo.defaultDescription")}</p>
          <p className="footer-contact">
            {settings.address}
          </p>
        </div>

        <div className="footer-links">
          <Link to="/shop">{t("nav.shop")}</Link>
          <a href="/#featured">{t("nav.featured")}</a>
          <Link to="/about">{t("nav.about")}</Link>
          <Link to="/delivery">{t("info.deliveryPage.eyebrow")}</Link>
          <Link to="/returns">{t("info.returns.eyebrow")}</Link>
          <Link to="/contact">{t("nav.contact")}</Link>
          <Link to="/cart">{t("nav.cart")}</Link>
          <Link to="/checkout">{t("seo.checkoutTitle")}</Link>
        </div>

        <div className="social-row">
          <a href={`mailto:${settings.email}`} aria-label={t("admin.email")}>
            <Mail size={18} />
          </a>
          <a href={`tel:${settings.phone}`} aria-label={t("auth.phone")}>
            <Phone size={18} />
          </a>
          <a href={settings.instagram} aria-label="Instagram">
            <Instagram size={18} />
          </a>
          <a href={settings.facebook} aria-label="Facebook">
            <Facebook size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
