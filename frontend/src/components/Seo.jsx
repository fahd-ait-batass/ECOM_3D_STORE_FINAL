import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

const SITE_NAME = "ECOM 3D STORE";
const SITE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:5173";
const DEFAULT_DESCRIPTION =
  "Premium dark luxury e-commerce store for futuristic products, powered by React, Vite, Django, and REST.";

function getBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_URL;
}

function absoluteUrl(value) {
  if (!value) {
    return `${getBaseUrl()}/images/hero-luxury.png`;
  }
  try {
    return new URL(value, getBaseUrl()).toString();
  } catch {
    return `${getBaseUrl()}/images/hero-luxury.png`;
  }
}

export default function Seo({
  title = SITE_NAME,
  description,
  image = "/images/hero-luxury.png",
  type = "website",
  jsonLd,
}) {
  const { t } = useTranslation();
  const pageDescription = description || t("seo.defaultDescription", { defaultValue: DEFAULT_DESCRIPTION });
  const pageTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const url = typeof window !== "undefined" ? window.location.href : SITE_URL;
  const pageImage = absoluteUrl(image);
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: getBaseUrl(),
      logo: absoluteUrl("/images/hero-luxury.png"),
    },
    ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
  ];

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={pageImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      {schemas.map((schema, index) => (
        <script type="application/ld+json" key={index}>
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
