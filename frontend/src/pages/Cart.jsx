import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  formatStorePrice,
  getImageUrl,
  getStockLabel,
  getStockStatus,
  handleImageError,
} from "../api/client.js";
import Seo from "../components/Seo.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useStoreSettings } from "../context/StoreSettingsContext.jsx";

export default function Cart() {
  const { t } = useTranslation();
  const { cartMessage, items, removeFromCart, subtotal, updateQuantity } = useCart();
  const { settings } = useStoreSettings();
  const formatPrice = (value) => formatStorePrice(value, settings.currency);

  if (!items.length) {
    return (
      <section className="page-section container">
        <Seo
          title={t("seo.cartTitle")}
          description={t("seo.cartDescription")}
        />
        <div className="empty-state cart-empty">
          <ShoppingBag size={42} />
          <h1>{t("cart.emptyTitle")}</h1>
          <p>{t("cart.emptyText")}</p>
          <Link className="primary-btn" to="/#featured">
            {t("cart.explore")}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section container">
      <Seo
        title={t("seo.cartTitle")}
        description={t("seo.cartDescription")}
      />
      <div className="page-heading">
        <p className="eyebrow">
          <ShoppingBag size={15} />
          {t("cart.eyebrow")}
        </p>
        <h1>{t("cart.title")}</h1>
      </div>

      <div className="cart-layout">
        <div className="cart-list">
          {cartMessage && <p className="form-message cart-stock-message">{cartMessage}</p>}
          {items.map((item) => {
            const stockStatus = getStockStatus(item);
            const stockLimit = Number.parseInt(item.stock, 10);
            const canIncrease = !Number.isFinite(stockLimit) || item.quantity < stockLimit;

            return (
              <article className="cart-item" key={item.id}>
                <Link to={`/products/${item.slug}`} className="cart-thumb">
                  <img src={getImageUrl(item.image)} alt={item.name} onError={handleImageError} />
                </Link>
                <div className="cart-item-info">
                  <Link to={`/products/${item.slug}`}>{item.name}</Link>
                  <span>{formatPrice(item.price)}</span>
                  <small className={`stock-status ${stockStatus === "out_of_stock" ? "danger" : stockStatus === "low_stock" ? "warn" : ""}`}>
                    {getStockLabel(item, t)}
                  </small>
                  <div className="quantity-row small">
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={t("miniCart.decrease")}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={15} />
                    </button>
                    <strong>{item.quantity}</strong>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={t("miniCart.increase")}
                      disabled={!canIncrease}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
                <button
                  className="icon-btn remove-btn"
                  type="button"
                  aria-label={t("miniCart.remove", { name: item.name })}
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            );
          })}
        </div>

        <aside className="summary-panel">
          <h2>{t("cart.summary")}</h2>
          <div className="summary-row">
            <span>{t("common.subtotal")}</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>{t("cart.shipping")}</span>
            <strong>{t("cart.included")}</strong>
          </div>
          <div className="summary-row total">
            <span>{t("common.total")}</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <Link className="primary-btn full-btn" to="/checkout">
            {t("cart.checkout")}
            <ArrowRight size={18} />
          </Link>
        </aside>
      </div>
    </section>
  );
}
