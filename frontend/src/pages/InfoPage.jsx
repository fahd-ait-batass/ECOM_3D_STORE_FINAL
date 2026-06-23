import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatStorePrice } from "../api/client.js";
import Seo from "../components/Seo.jsx";
import { useStoreSettings } from "../context/StoreSettingsContext.jsx";

const pageCopy = {
  about: {
    eyebrowKey: "info.about.eyebrow",
    icon: Sparkles,
  },
  contact: {
    eyebrowKey: "info.contact.eyebrow",
    icon: Mail,
  },
  delivery: {
    eyebrowKey: "info.deliveryPage.eyebrow",
    icon: Truck,
  },
  returns: {
    eyebrowKey: "info.returns.eyebrow",
    icon: RefreshCcw,
  },
};

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function cardMotion(index = 0) {
  return {
    initial: false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.34, delay: index * 0.05, ease: "easeOut" },
  };
}

export default function InfoPage({ type }) {
  const { t } = useTranslation();
  const { settings } = useStoreSettings();
  const [contactStatus, setContactStatus] = useState("idle");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const current = pageCopy[type] || pageCopy.about;
  const Icon = current.icon;
  const whatsappNumber = digitsOnly(settings.whatsapp);
  const deliveryPrice = formatStorePrice(settings.delivery_price, settings.currency);
  const freeThreshold = formatStorePrice(
    settings.free_delivery_threshold,
    settings.currency,
  );

  const hero = useMemo(() => {
    const storeName = settings.store_name || "ECOM 3D STORE";
    const copy = {
      about: {
        title: t("info.about.title", { storeName }),
        description: t("info.about.description"),
      },
      contact: {
        title: t("info.contact.title"),
        description: t("info.contact.description"),
      },
      delivery: {
        title: t("info.deliveryPage.title"),
        description: t("info.deliveryPage.description"),
      },
      returns: {
        title: t("info.returns.title"),
        description: t("info.returns.description"),
      },
    };
    return copy[type] || copy.about;
  }, [settings.store_name, t, type]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setContactStatus("sent");
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <section
      className={`page-section info-page container ${type === "contact" ? "contact-page" : ""}`}
    >
      <Seo title={hero.title} description={hero.description} />
      <div className="info-hero">
        <p className="eyebrow">
          <Icon size={15} />
          {t(current.eyebrowKey)}
        </p>
        <h1>{hero.title}</h1>
        <p>{hero.description}</p>
        <div className="info-metrics" aria-label={t("info.metricsLabel")}>
          <span>
            <strong>{settings.currency || "MAD"}</strong>
            {t("info.currency")}
          </span>
          <span>
            <strong>{deliveryPrice}</strong>
            {t("info.delivery")}
          </span>
          <span>
            <strong>{freeThreshold}</strong>
            {t("info.freeOver")}
          </span>
        </div>
      </div>

      {type === "contact" && (
        <div className="contact-layout">
          <div className="info-grid contact-cards">
            {[
              {
                icon: Mail,
                title: t("info.contact.email"),
                body: settings.email,
                href: `mailto:${settings.email}`,
              },
              {
                icon: MessageCircle,
                title: "WhatsApp",
                body: settings.whatsapp,
                href: `https://wa.me/${whatsappNumber}`,
              },
              {
                icon: MapPin,
                title: t("info.contact.address"),
                body: settings.address,
              },
            ].map((item, index) => {
              const ItemIcon = item.icon;
              const content = (
                <>
                  <ItemIcon size={24} />
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                </>
              );
              return item.href ? (
                <motion.a
                  className="info-card contact-card-link"
                  href={item.href}
                  key={item.title}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  {...cardMotion(index)}
                >
                  {content}
                </motion.a>
              ) : (
                <motion.article className="info-card" key={item.title} {...cardMotion(index)}>
                  {content}
                </motion.article>
              );
            })}
          </div>

          <motion.form className="contact-form" onSubmit={handleSubmit} {...cardMotion(2)}>
            <div className="admin-form-head">
              <h2>{t("info.contact.sendMessage")}</h2>
              <Mail size={18} />
            </div>
            <div className="form-pair">
              <label>
                {t("info.contact.name")}
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("info.contact.namePlaceholder")}
                  required
                />
              </label>
              <label>
                {t("info.contact.email")}
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("info.contact.emailPlaceholder")}
                  required
                />
              </label>
            </div>
            <label>
              {t("info.contact.phone")}
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t("info.contact.phonePlaceholder")}
              />
            </label>
            <label>
              {t("info.contact.message")}
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={t("info.contact.messagePlaceholder")}
                required
              />
            </label>
            {contactStatus === "sent" && (
              <p className="contact-success">
                <CheckCircle2 size={17} />
                {t("info.contact.success")}
              </p>
            )}
            <button className="primary-btn full-btn" type="submit">
              <MessageCircle size={18} />
              {t("info.contact.submit")}
            </button>
          </motion.form>

          <div className="contact-socials">
            <a href={settings.instagram} target="_blank" rel="noreferrer">
              <Instagram size={18} />
              Instagram
            </a>
            <a href={settings.facebook} target="_blank" rel="noreferrer">
              <Facebook size={18} />
              Facebook
            </a>
            <a href={`tel:${settings.phone}`}>
              <MessageCircle size={18} />
              {settings.phone}
            </a>
          </div>
        </div>
      )}

      {type === "about" && (
        <div className="info-grid">
          {[
            {
              icon: ShieldCheck,
              title: t("info.aboutCards.catalogTitle"),
              body: t("info.aboutCards.catalogText", { storeName: settings.store_name }),
            },
            {
              icon: WalletCards,
              title: t("info.aboutCards.checkoutTitle"),
              body: t("info.aboutCards.checkoutText", { currency: settings.currency || "USD" }),
            },
            {
              icon: PackageCheck,
              title: t("info.aboutCards.adminTitle"),
              body: t("info.aboutCards.adminText"),
            },
          ].map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <motion.article className="info-card" key={item.title} {...cardMotion(index)}>
                <ItemIcon size={24} />
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </motion.article>
            );
          })}
        </div>
      )}

      {type === "delivery" && (
        <div className="info-timeline">
          {[
            {
              icon: CheckCircle2,
              title: t("info.deliveryPage.confirmationTitle"),
              body: t("info.deliveryPage.confirmationText"),
            },
            {
              icon: PackageCheck,
              title: t("info.deliveryPage.preparationTitle"),
              body: t("info.deliveryPage.preparationText"),
            },
            {
              icon: Truck,
              title: t("info.deliveryPage.shippingTitle"),
              body: t("info.deliveryPage.shippingText", { deliveryPrice, freeThreshold }),
            },
            {
              icon: Clock3,
              title: t("info.deliveryPage.supportTitle"),
              body: t("info.deliveryPage.supportText", {
                phone: settings.phone,
                whatsapp: settings.whatsapp,
              }),
            },
          ].map((step, index) => {
            const StepIcon = step.icon;
            return (
              <motion.article className="timeline-card" key={step.title} {...cardMotion(index)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <StepIcon size={22} />
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.body}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {type === "returns" && (
        <div className="info-grid returns-grid">
          {[
            {
              icon: RefreshCcw,
              title: t("info.returns.conditionsTitle"),
              body: t("info.returns.conditionsText"),
            },
            {
              icon: PackageCheck,
              title: t("info.returns.exchangeTitle"),
              body: t("info.returns.exchangeText"),
            },
            {
              icon: ShieldCheck,
              title: t("info.returns.damagedTitle"),
              body: t("info.returns.damagedText"),
            },
            {
              icon: MessageCircle,
              title: t("info.returns.supportTitle"),
              body: t("info.returns.supportText", {
                email: settings.email,
                phone: settings.phone,
                whatsapp: settings.whatsapp,
              }),
            },
          ].map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <motion.article className="info-card" key={item.title} {...cardMotion(index)}>
                <ItemIcon size={24} />
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}
