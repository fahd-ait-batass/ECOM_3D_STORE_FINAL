import { ArrowRight, Heart, ShoppingBag, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  formatStorePrice,
  getImageUrl,
  getStockLabel,
  getStockStatus,
  handleImageError,
  isOutOfStock,
} from "../api/client.js";
import Seo from "../components/Seo.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useStoreSettings } from "../context/StoreSettingsContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

function RatingStars({ rating }) {
  const displayRating = Number.parseFloat(rating || 0);
  const rounded = Math.round(displayRating);
  return (
    <span className="wishlist-rating">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={13} fill={index < rounded ? "currentColor" : "none"} />
      ))}
      {displayRating.toFixed(1)}
    </span>
  );
}

export default function Wishlist() {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { settings } = useStoreSettings();
  const { items, loading, removeFromWishlist } = useWishlist();
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const formatPrice = (value) => formatStorePrice(value, settings.currency);
  const products = items.map((item) => item.product).filter(Boolean);

  const flashMessage = (value) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2200);
  };

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      flashMessage(t("wishlist.removed"));
    } catch (error) {
      flashMessage(error.message || t("wishlist.error"));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="page-section wishlist-page container">
      <Seo
        title={t("seo.wishlistTitle")}
        description={t("seo.wishlistDescription")}
      />

      <div className="wishlist-hero">
        <p className="eyebrow">
          <Heart size={15} fill="currentColor" />
          {t("wishlist.eyebrow")}
        </p>
        <h1>{t("wishlist.title")}</h1>
        <p>{t("wishlist.intro")}</p>
      </div>

      <div className="admin-section-head wishlist-head">
        <h2>{t("wishlist.savedProducts")}</h2>
        <span>{loading ? t("common.loading") : t("common.countItems", { count: products.length })}</span>
      </div>

      {message && <p className="form-message wishlist-message">{message}</p>}

      {loading ? (
        <div className="wishlist-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <article className="wishlist-card" key={index}>
              <div className="skeleton wishlist-card-media" />
              <span className="skeleton skeleton-line short" />
              <span className="skeleton skeleton-line" />
            </article>
          ))}
        </div>
      ) : products.length ? (
        <div className="wishlist-grid">
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            const soldOut = isOutOfStock(product);
            return (
              <article className="wishlist-card" key={product.id}>
                <Link className="wishlist-card-media" to={`/products/${product.slug}`}>
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    onError={handleImageError}
                  />
                </Link>
                <div className="wishlist-card-copy">
                  <div className="wishlist-card-top">
                    <RatingStars rating={product.average_rating ?? product.rating} />
                    <span className={`stock-status ${stockStatus === "out_of_stock" ? "danger" : stockStatus === "low_stock" ? "warn" : ""}`}>
                      {getStockLabel(product, t)}
                    </span>
                  </div>
                  <Link className="product-name" to={`/products/${product.slug}`}>
                    {product.name}
                  </Link>
                  <div className="price-row">
                    <strong>{formatPrice(product.price)}</strong>
                    {product.old_price && <del>{formatPrice(product.old_price)}</del>}
                  </div>
                  {product.review_count > 0 && (
                    <small className="wishlist-review-count">
                      {t("wishlist.customerReviews", { count: product.review_count })}
                    </small>
                  )}
                </div>
                <div className="wishlist-actions">
                  <button
                    className="add-btn"
                    type="button"
                    disabled={soldOut}
                    onClick={() => addToCart(product)}
                  >
                    <ShoppingBag size={17} />
                    {soldOut ? t("wishlist.soldOut") : t("wishlist.addToCart")}
                  </button>
                  <Link className="ghost-btn" to={`/products/${product.slug}`}>
                    <ArrowRight size={17} />
                    {t("common.details")}
                  </Link>
                  <button
                    className="ghost-btn danger-ghost"
                    type="button"
                    disabled={removingId === product.id}
                    onClick={() => handleRemove(product.id)}
                  >
                    <Trash2 size={17} />
                    {t("common.remove")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state premium-empty wishlist-empty">
          <Heart size={42} />
          <h2>{t("wishlist.emptyTitle")}</h2>
          <p>{t("wishlist.emptyText")}</p>
          <Link className="primary-btn" to="/shop">
            {t("common.goToShop")}
          </Link>
        </div>
      )}
    </section>
  );
}
