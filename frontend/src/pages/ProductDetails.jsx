import {
  ArrowLeft,
  BadgeCheck,
  Edit3,
  Heart,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  createProductReview,
  deleteReview,
  formatStorePrice,
  getImageUrl,
  getProduct,
  getProductReviewSummary,
  getProductReviews,
  getStockLabel,
  getStockStatus,
  handleImageError,
  isOutOfStock,
  updateReview,
} from "../api/client.js";
import Seo from "../components/Seo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useStoreSettings } from "../context/StoreSettingsContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { formatLocalizedDate } from "../i18n/formatters.js";

function getAbsoluteImage(image) {
  const src = getImageUrl(image);
  if (/^https?:/i.test(src)) {
    return src;
  }
  if (typeof window !== "undefined") {
    return new URL(src, window.location.origin).toString();
  }
  return src;
}

function RatingStars({ rating, size = 15 }) {
  const { t } = useTranslation();
  const rounded = Math.round(Number.parseFloat(rating || 0));
  return (
    <span className="review-stars" aria-label={t("productDetails.outOf5", { rating })}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={size} fill={index < rounded ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

export default function ProductDetails() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { settings } = useStoreSettings();
  const { addToWishlist, isWishlisted, removeFromWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [reviewStatus, setReviewStatus] = useState("idle");
  const [reviewMessage, setReviewMessage] = useState("");
  const [wishlistStatus, setWishlistStatus] = useState("idle");
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [wishlistTone, setWishlistTone] = useState("success");

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setLoading(true);
      const [productData, reviewData, summaryData] = await Promise.all([
        getProduct(slug),
        getProductReviews(slug).catch(() => []),
        getProductReviewSummary(slug).catch(() => null),
      ]);

      if (isMounted) {
        setProduct(productData);
        setReviews(reviewData);
        setReviewSummary(summaryData);
        setReviewForm(
          summaryData?.current_user_review
            ? {
                rating: summaryData.current_user_review.rating,
                title: summaryData.current_user_review.title || "",
                comment: summaryData.current_user_review.comment || "",
              }
            : { rating: 5, title: "", comment: "" },
        );
        setReviewStatus("idle");
        setReviewMessage("");
        setQuantity(1);
        setLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const total = useMemo(
    () => Number.parseFloat(product?.price || 0) * quantity,
    [product, quantity],
  );
  const formatPrice = (value) => formatStorePrice(value, settings.currency);
  const displayRating = Number.parseFloat(
    reviewSummary?.average_rating ?? product?.average_rating ?? product?.rating ?? 0,
  );
  const reviewCount = reviewSummary?.review_count ?? product?.review_count ?? 0;
  const wished = product ? isWishlisted(product.id) : false;
  const stockStatus = product ? getStockStatus(product) : "out_of_stock";
  const stockLabel = product ? getStockLabel(product, t) : t("stock.out_of_stock");
  const soldOut = product ? isOutOfStock(product) : true;

  const flashWishlistMessage = (message, tone = "success") => {
    setWishlistTone(tone);
    setWishlistMessage(message);
    window.setTimeout(() => setWishlistMessage(""), 2200);
  };

  const handleWishlistClick = async () => {
    if (!product) {
      return;
    }
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

  const reloadReviews = async () => {
    const [reviewData, summaryData] = await Promise.all([
      getProductReviews(slug),
      getProductReviewSummary(slug),
    ]);
    setReviews(reviewData);
    setReviewSummary(summaryData);
    setReviewForm(
      summaryData?.current_user_review
        ? {
            rating: summaryData.current_user_review.rating,
            title: summaryData.current_user_review.title || "",
            comment: summaryData.current_user_review.comment || "",
          }
        : { rating: 5, title: "", comment: "" },
    );
  };

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((current) => ({ ...current, [name]: value }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewStatus("loading");
    setReviewMessage("");
    try {
      const payload = {
        ...reviewForm,
        rating: Number.parseInt(reviewForm.rating, 10),
      };
      if (reviewSummary?.current_user_review) {
        await updateReview(reviewSummary.current_user_review.id, payload);
        setReviewMessage(t("productDetails.updated"));
      } else {
        await createProductReview(slug, payload);
        setReviewMessage(t("productDetails.submitted"));
      }
      setReviewStatus("success");
      await reloadReviews();
    } catch (error) {
      setReviewStatus("error");
      setReviewMessage(error.message || t("productDetails.saveError"));
    }
  };

  const handleReviewDelete = async () => {
    if (!reviewSummary?.current_user_review) {
      return;
    }
    setReviewStatus("loading");
    setReviewMessage("");
    try {
      await deleteReview(reviewSummary.current_user_review.id);
      setReviewStatus("success");
      setReviewMessage(t("productDetails.deleted"));
      await reloadReviews();
    } catch (error) {
      setReviewStatus("error");
      setReviewMessage(error.message || t("productDetails.deleteError"));
    }
  };

  if (loading) {
    return (
      <section className="page-section container">
        <div className="detail-grid">
          <div className="skeleton detail-skeleton" />
          <div className="detail-copy">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line tiny" />
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="page-section container">
        <div className="empty-state">
          <h2>{t("productDetails.unavailableTitle")}</h2>
          <p>{t("productDetails.unavailableText")}</p>
          <Link className="primary-btn" to="/">
            <ArrowLeft size={18} />
            {t("common.backHome")}
          </Link>
        </div>
      </section>
    );
  }

  const productImage = getImageUrl(product.image);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: getAbsoluteImage(product.image),
    brand: {
      "@type": "Brand",
      name: settings.store_name || "ECOM 3D STORE",
    },
    category: product.category?.name || t("productDetails.luxuryTech"),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: displayRating.toFixed(1),
      bestRating: "5",
      ratingCount: String(reviewCount || 1),
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: settings.currency || "USD",
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: typeof window !== "undefined" ? window.location.href : undefined,
    },
  };

  return (
    <section className="page-section container">
      <Seo
        title={product.name}
        description={product.description}
        image={productImage}
        type="product"
        jsonLd={productJsonLd}
      />
      <Link className="back-link" to="/">
        <ArrowLeft size={18} />
        {t("productDetails.backCollection")}
      </Link>

      <div className="detail-grid">
        <div className="detail-media">
          <img src={productImage} alt={product.name} onError={handleImageError} />
          <span className="product-badge detail-badge">
            {product.is_featured ? t("productDetails.featuredDrop") : t("productDetails.luxuryTech")}
          </span>
        </div>

        <div className="detail-copy">
          <p className="eyebrow">
            <Star size={15} fill="currentColor" />
            {reviewCount
              ? t("productDetails.ratedWithReviews", {
                  rating: displayRating.toFixed(1),
                  count: reviewCount,
                })
              : t("productDetails.rated", { rating: displayRating.toFixed(1) })}
          </p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>

          <div className="detail-price">
            <strong>{formatPrice(product.price)}</strong>
            {product.old_price && <del>{formatPrice(product.old_price)}</del>}
          </div>

          <div className="detail-meta">
            <span>{product.category?.name || t("productDetails.luxuryTech")}</span>
            <span className={`stock-status ${stockStatus === "out_of_stock" ? "danger" : stockStatus === "low_stock" ? "warn" : ""}`}>
              {stockLabel}
            </span>
          </div>

          <div className="quantity-row">
            <button
              className="icon-btn"
              type="button"
              aria-label={t("productDetails.decrease")}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            >
              <Minus size={17} />
            </button>
            <strong>{quantity}</strong>
            <button
              className="icon-btn"
              type="button"
              aria-label={t("productDetails.increase")}
              onClick={() =>
                setQuantity((current) => Math.min(product.stock || 99, current + 1))
              }
              disabled={soldOut || quantity >= product.stock}
            >
              <Plus size={17} />
            </button>
            <span>{formatPrice(total)}</span>
          </div>

          <div className="detail-actions-row">
            <button
              className="primary-btn detail-add"
              type="button"
              disabled={soldOut}
              onClick={() => {
                addToCart(product, quantity);
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1800);
              }}
            >
              <ShoppingBag size={18} />
              {added ? t("productDetails.added") : t("productDetails.addToCart")}
            </button>
            <button
              className={`ghost-btn detail-wishlist-btn ${wished ? "active" : ""}`}
              type="button"
              aria-pressed={wished}
              disabled={wishlistStatus === "loading"}
              onClick={handleWishlistClick}
            >
              <Heart size={18} fill={wished ? "currentColor" : "none"} />
              {wished ? t("productDetails.saved") : t("productDetails.wishlist")}
            </button>
          </div>
          {wishlistMessage && (
            <p className={wishlistTone === "error" ? "form-error" : "form-message"}>
              {wishlistMessage}
            </p>
          )}

          <div className="secure-note">
            <ShieldCheck size={18} />
            {t("productDetails.secureNote")}
          </div>
        </div>
      </div>

      <section className="reviews-section">
        <div className="reviews-head">
          <div>
            <p className="eyebrow">
              <MessageSquare size={15} />
              {t("productDetails.customerReviews")}
            </p>
            <h2>{t("productDetails.reviewsTitle")}</h2>
          </div>
          <div className="rating-summary-card">
            <strong>{displayRating.toFixed(1)}</strong>
            <RatingStars rating={displayRating} />
            <span>
              {reviewCount
                ? t("productDetails.approvedReviews", { count: reviewCount })
                : t("productDetails.noApproved")}
            </span>
          </div>
        </div>

        <div className="reviews-layout">
          <aside className="review-breakdown">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviewSummary?.breakdown?.[rating] || 0;
              const percent = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
              return (
                <div className="breakdown-row" key={rating}>
                  <span>{t("productDetails.star", { count: rating })}</span>
                  <div>
                    <i style={{ width: `${percent}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </aside>

          <div className="review-form-card">
            <h3>
              {reviewSummary?.current_user_review
                ? t("productDetails.yourReview")
                : t("productDetails.writeReview")}
            </h3>
            {!isAuthenticated ? (
              <p className="review-gate">{t("productDetails.loginGate")}</p>
            ) : reviewSummary?.can_review || reviewSummary?.current_user_review ? (
              <form className="review-form" onSubmit={handleReviewSubmit}>
                <label>
                  {t("productDetails.rating")}
                  <select name="rating" value={reviewForm.rating} onChange={handleReviewChange}>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {t("productDetails.stars", { count: rating })}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("productDetails.title")}
                  <input
                    name="title"
                    value={reviewForm.title}
                    onChange={handleReviewChange}
                    placeholder={t("productDetails.titlePlaceholder")}
                  />
                </label>
                <label>
                  {t("productDetails.comment")}
                  <textarea
                    name="comment"
                    value={reviewForm.comment}
                    onChange={handleReviewChange}
                    placeholder={t("productDetails.commentPlaceholder")}
                    required
                  />
                </label>
                {reviewMessage && (
                  <p className={reviewStatus === "error" ? "form-error" : "form-message"}>
                    {reviewMessage}
                  </p>
                )}
                <div className="review-actions">
                  <button className="primary-btn" type="submit" disabled={reviewStatus === "loading"}>
                    <Edit3 size={17} />
                    {reviewSummary?.current_user_review
                      ? t("productDetails.updateReview")
                      : t("productDetails.submitReview")}
                  </button>
                  {reviewSummary?.current_user_review && (
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={handleReviewDelete}
                      disabled={reviewStatus === "loading"}
                    >
                      <Trash2 size={17} />
                      {t("common.delete")}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <p className="review-gate">{reviewSummary?.message}</p>
            )}
          </div>
        </div>

        {reviews.length ? (
          <div className="reviews-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card-head">
                  <div>
                    <strong>{review.reviewer_name}</strong>
                    <small>{formatLocalizedDate(review.created_at, language)}</small>
                  </div>
                  <span className="verified-badge">
                    <BadgeCheck size={15} />
                    {t("productDetails.verifiedPurchase")}
                  </span>
                </div>
                <RatingStars rating={review.rating} />
                {review.title && <h3>{review.title}</h3>}
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state premium-empty reviews-empty">
            <MessageSquare size={38} />
            <h2>{t("productDetails.emptyReviewsTitle")}</h2>
            <p>{t("productDetails.emptyReviewsText")}</p>
          </div>
        )}
      </section>
    </section>
  );
}
