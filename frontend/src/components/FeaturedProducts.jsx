import { ArrowRight, PackageOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import ProductCard from "./ProductCard.jsx";

function ProductSkeleton() {
  const { t } = useTranslation();

  return (
    <article className="product-card skeleton-card" aria-label={t("featured.loadingProduct")}>
      <div className="skeleton skeleton-media" />
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line tiny" />
    </article>
  );
}

export default function FeaturedProducts({ products, loading, selectedCategory }) {
  const { t } = useTranslation();
  const visibleProducts = selectedCategory ? products : products.slice(0, 6);

  return (
    <section className="featured-section container" id="featured">
      <div className="section-heading reference-featured-heading">
        <h2>
          {selectedCategory ? t("featured.filteredTitle") : t("featured.referenceTitle")}
        </h2>
        <Link to="/shop">
          {t("featured.viewAll")}
          <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      ) : visibleProducts.length ? (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              compact
              key={product.id || product.slug}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <PackageOpen size={34} />
          <h3>{t("featured.emptyTitle")}</h3>
          <p>{t("featured.emptyText")}</p>
        </div>
      )}
    </section>
  );
}
