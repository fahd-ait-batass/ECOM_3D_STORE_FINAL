import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import {
  formatStorePrice,
  getImageUrl,
  getStockLabel,
  getStockStatus,
  handleImageError,
  isOutOfStock,
} from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useStoreSettings } from "../context/StoreSettingsContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

export default function ProductCard({ compact = false, product }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { settings } = useStoreSettings();
  const { addToWishlist, isWishlisted, removeFromWishlist } = useWishlist();
  const [wishlistStatus, setWishlistStatus] = useState("idle");
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [wishlistTone, setWishlistTone] = useState("success");
  const formatPrice = (value) => formatStorePrice(value, settings.currency);
  const soldOut = isOutOfStock(product);
  const stockStatus = getStockStatus(product);
  const stockLabel = getStockLabel(product, t);
  const price = Number.parseFloat(product.price || 0);
  const oldPrice = Number.parseFloat(product.old_price || 0);
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const displayRating = Number.parseFloat(product.average_rating ?? product.rating ?? 0);
  const rating = Math.round(displayRating);
  const wished = isWishlisted(product.id);

  const flashWishlistMessage = (message, tone = "success") => {
    setWishlistTone(tone);
    setWishlistMessage(message);
    window.setTimeout(() => setWishlistMessage(""), 2200);
  };

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setWishlistStatus("loading");
    try {
      if (wished) {
        await removeFromWishlist(product.id);
        flashWishlistMessage(t("productCard.removedWishlist"));
      } else {
        await addToWishlist(product.id);
        flashWishlistMessage(t("productCard.savedWishlist"));
      }
      setWishlistStatus("success");
    } catch (error) {
      setWishlistStatus("error");
      flashWishlistMessage(error.message || t("productCard.wishlistError"), "error");
    } finally {
      setWishlistStatus("idle");
    }
  };

  return (
    <motion.article
      className={`product-card ${compact ? "compact-card" : ""}`}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
    >
      <div className="product-media">
        <Link to={`/products/${product.slug}`} aria-label={t("productCard.view", { name: product.name })}>
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            loading="lazy"
            onError={handleImageError}
          />
        </Link>
        {(!compact || discount === 0) && (
          <span className="product-badge">
            {compact
              ? t("common.new")
              : product.is_featured
                ? t("common.featured")
                : stockStatus === "low_stock"
                  ? t("productCard.lowStock")
                  : t("common.new")}
          </span>
        )}
        {discount > 0 && <span className="discount-badge">-{discount}%</span>}
        <button
          className={`wishlist-btn ${wished ? "active" : ""}`}
          type="button"
          aria-label={wished ? t("productCard.removeWishlist") : t("productCard.addWishlist")}
          aria-pressed={wished}
          disabled={wishlistStatus === "loading"}
          onClick={handleWishlistClick}
        >
          <Heart size={17} fill={wished ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="product-info">
        <div className="rating-row">
          <span>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={13}
                fill={index < rating ? "currentColor" : "none"}
              />
            ))}
            {!compact && displayRating.toFixed(1)}
          </span>
          <span>
            {compact
              ? `(${product.review_count || 0})`
              : product.review_count
                ? t("productCard.reviews", { count: product.review_count })
                : product.category?.name || t("productCard.categoryFallback")}
          </span>
        </div>
        <Link className="product-name" to={`/products/${product.slug}`}>
          {product.name}
        </Link>
        <div className="price-row">
          <strong>{formatPrice(product.price)}</strong>
          {product.old_price && <del>{formatPrice(product.old_price)}</del>}
        </div>
        {!compact && (
          <div className={`stock-status ${stockStatus === "out_of_stock" ? "danger" : stockStatus === "low_stock" ? "warn" : ""}`}>
            {stockLabel}
          </div>
        )}
        {wishlistMessage && (
          <p className={`product-card-feedback ${wishlistTone === "error" ? "error" : ""}`}>
            {wishlistMessage}
          </p>
        )}
      </div>

      <motion.button
        className="add-btn"
        type="button"
        disabled={soldOut}
        onClick={() => addToCart(product)}
        whileTap={{ scale: 0.96 }}
      >
        <ShoppingBag size={17} />
        <span>{soldOut ? t("productCard.soldOut") : t("productCard.addToCart")}</span>
      </motion.button>
    </motion.article>
  );
}
