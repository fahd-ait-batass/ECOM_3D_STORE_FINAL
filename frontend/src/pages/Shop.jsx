import { Filter, PackageOpen, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getCategories, getProductPage } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";
import Seo from "../components/Seo.jsx";

function ShopSkeleton() {
  return (
    <div className="product-grid">
      {Array.from({ length: 8 }).map((_, index) => (
        <article className="product-card skeleton-card" key={index}>
          <div className="skeleton skeleton-media" />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line tiny" />
        </article>
      ))}
    </div>
  );
}

export default function Shop() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    sort: "newest",
    min_price: "",
    max_price: "2600",
    page_size: 24,
  });

  const activeFilterCount = useMemo(
    () =>
      ["search", "category", "min_price", "max_price"].filter((key) => filters[key])
        .length,
    [filters],
  );

  useEffect(() => {
    let isMounted = true;
    getCategories().then((data) => {
      if (isMounted) {
        setCategories(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      const page = await getProductPage(filters);
      if (isMounted) {
        setProducts(page.results);
        setCount(page.count);
        setLoading(false);
      }
    }, 180);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const sortOptions = [
    { label: t("shop.sortOptions.newest"), value: "newest" },
    { label: t("shop.sortOptions.price_asc"), value: "price_asc" },
    { label: t("shop.sortOptions.price_desc"), value: "price_desc" },
    { label: t("shop.sortOptions.rating"), value: "rating" },
  ];

  return (
    <section className="page-section shop-page container">
      <Seo
        title={t("seo.shopTitle")}
        description={t("seo.shopDescription")}
      />
      <div className="shop-hero">
        <div>
          <p className="eyebrow">
            <SlidersHorizontal size={15} />
            {t("shop.eyebrow")}
          </p>
          <h1>{t("shop.title")}</h1>
          <p>{t("shop.description")}</p>
        </div>
        <div className="shop-orbit" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>

      <div className="shop-layout">
        <aside className="filter-panel">
          <div className="filter-head">
            <Filter size={18} />
            <strong>{t("shop.filters", { count: activeFilterCount })}</strong>
          </div>

          <label className="search-field">
            <Search size={18} />
            <input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder={t("shop.searchPlaceholder")}
            />
          </label>

          <label>
            {t("shop.category")}
            <select
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
            >
              <option value="">{t("shop.allCategories")}</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("shop.sort")}
            <select
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="price-filter">
            <label>
              {t("shop.minPrice")}
              <input
                type="number"
                min="0"
                value={filters.min_price}
                onChange={(event) => updateFilter("min_price", event.target.value)}
                placeholder="0"
              />
            </label>
            <label>
              {t("shop.maxPrice")}
              <input
                type="number"
                min="0"
                value={filters.max_price}
                onChange={(event) => updateFilter("max_price", event.target.value)}
                placeholder="2600"
              />
            </label>
          </div>

          <button
            className="ghost-btn full-btn"
            type="button"
            onClick={() =>
              setFilters({
                search: "",
                category: "",
                sort: "newest",
                min_price: "",
                max_price: "2600",
                page_size: 24,
              })
            }
          >
            {t("common.reset")}
          </button>
        </aside>

        <div className="shop-results">
          <div className="results-bar">
            <span>{t("common.countProducts", { count })}</span>
            <span>{t(`shop.sortOptions.${filters.sort}`)}</span>
          </div>

          {loading ? (
            <ShopSkeleton />
          ) : products.length ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id || product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state premium-empty">
              <PackageOpen size={38} />
              <h2>{t("shop.noMatchTitle")}</h2>
              <p>{t("shop.noMatchText")}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
