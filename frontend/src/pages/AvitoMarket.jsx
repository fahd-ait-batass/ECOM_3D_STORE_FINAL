import {
  BarChart3,
  Database,
  ExternalLink,
  MapPin,
  Radio,
  RefreshCw,
  SearchX,
  Tags,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getAvitoListings, getImageUrl, handleImageError } from "../api/client.js";
import Seo from "../components/Seo.jsx";

function formatMarketPrice(value, language) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return `${new Intl.NumberFormat(language, {
    maximumFractionDigits: 0,
  }).format(Number(value))} DH`;
}

function formatScrapedDate(value, language) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AvitoMarket() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const language = i18n.resolvedLanguage || i18n.language || "fr";

  const loadListings = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getAvitoListings());
    } catch (requestError) {
      setError(requestError.message || t("avitoMarket.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const stats = data?.stats || {};
  const listings = data?.results || [];
  const statCards = useMemo(
    () => [
      { label: t("avitoMarket.total"), value: data?.total_listings ?? 0, icon: Tags },
      { label: t("avitoMarket.demoCount"), value: data?.demo_count ?? 0, icon: Database },
      { label: t("avitoMarket.liveCount"), value: data?.live_count ?? 0, icon: Radio },
      {
        label: t("avitoMarket.average"),
        value: formatMarketPrice(stats.average_price, language),
        icon: BarChart3,
      },
      {
        label: t("avitoMarket.minimum"),
        value: formatMarketPrice(stats.minimum_price, language),
        icon: BarChart3,
      },
      {
        label: t("avitoMarket.maximum"),
        value: formatMarketPrice(stats.maximum_price, language),
        icon: BarChart3,
      },
    ],
    [data?.demo_count, data?.live_count, data?.total_listings, language, stats, t],
  );

  return (
    <section className="page-section container avito-market-page">
      <Seo title={t("avitoMarket.title")} description={t("avitoMarket.subtitle")} />

      <header className="avito-market-hero">
        <div>
          <p className="avito-market-kicker">
            <BarChart3 size={17} />
            {t("avitoMarket.eyebrow")}
          </p>
          <h1>{t("avitoMarket.title")}</h1>
          <p>{t("avitoMarket.subtitle")}</p>
        </div>
        <div className="avito-market-source">
          <span>{t("avitoMarket.lastScrape")}</span>
          <strong>{formatScrapedDate(stats.last_scraping_date, language)}</strong>
        </div>
      </header>

      <div className="avito-stats-grid" aria-label={t("avitoMarket.statsLabel")}>
        {statCards.map(({ label, value, icon: Icon }) => (
          <article className="avito-stat-card" key={label}>
            <span><Icon size={20} /></span>
            <div>
              <small>{label}</small>
              <strong>{loading ? "..." : value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="avito-demo-notice">
        <Database size={20} />
        <p>{t("avitoMarket.presentationNote")}</p>
      </div>

      <div className="avito-market-toolbar">
        <div>
          <h2>{t("avitoMarket.publicListings")}</h2>
          <p>{t("avitoMarket.responsibleNote")}</p>
        </div>
        <button type="button" onClick={loadListings} disabled={loading}>
          <RefreshCw size={17} className={loading ? "is-spinning" : ""} />
          {t("common.refresh")}
        </button>
      </div>

      {error ? (
        <div className="avito-market-state error">
          <SearchX size={32} />
          <h2>{t("avitoMarket.errorTitle")}</h2>
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="avito-listing-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article className="avito-listing-card" key={index}>
              <div className="avito-listing-image skeleton" />
              <div className="avito-listing-copy">
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-line short" />
              </div>
            </article>
          ))}
        </div>
      ) : listings.length ? (
        <div className="avito-listing-grid">
          {listings.map((listing) => (
            <article className="avito-listing-card" key={listing.id}>
              <div className="avito-listing-image">
                {listing.image_url ? (
                  <img
                    src={getImageUrl(listing.image_url)}
                    alt={listing.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                ) : (
                  <Tags size={34} />
                )}
              </div>
              <div className="avito-listing-copy">
                <div className="avito-listing-badges">
                  <span className="avito-source-chip">{listing.source}</span>
                  {listing.is_demo && (
                    <span className="avito-demo-chip">{t("avitoMarket.demoBadge")}</span>
                  )}
                </div>
                <h2>{listing.title}</h2>
                <strong className="avito-listing-price">
                  {listing.price_text || formatMarketPrice(listing.price_value, language)}
                </strong>
                <p>
                  <MapPin size={15} />
                  {listing.city || t("avitoMarket.cityUnavailable")}
                </p>
                <small>
                  {t("avitoMarket.scrapedOn", {
                    date: formatScrapedDate(listing.scraped_at, language),
                  })}
                </small>
                <a href={listing.listing_url} target="_blank" rel="noreferrer">
                  {t("avitoMarket.viewListing")}
                  <ExternalLink size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="avito-market-state">
          <SearchX size={32} />
          <h2>{t("avitoMarket.emptyTitle")}</h2>
          <p>{t("avitoMarket.emptyText")}</p>
        </div>
      )}
    </section>
  );
}
