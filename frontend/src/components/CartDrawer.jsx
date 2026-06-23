import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  formatStorePrice,
  getImageUrl,
  getStockLabel,
  getStockStatus,
  handleImageError,
} from "../api/client.js";
import { useCart } from "../context/CartContext.jsx";
import { useStoreSettings } from "../context/StoreSettingsContext.jsx";

export default function CartDrawer() {
  const { t } = useTranslation();
  const { settings } = useStoreSettings();
  const formatPrice = (value) => formatStorePrice(value, settings.currency);
  const {
    closeCart,
    cartMessage,
    isCartOpen,
    items,
    removeFromCart,
    subtotal,
    updateQuantity,
  } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.button
            className="cart-drawer-backdrop"
            type="button"
            aria-label={t("miniCart.close")}
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="cart-drawer"
            initial={{ x: "110%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "110%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            aria-label={t("miniCart.drawerLabel")}
          >
            <div className="drawer-head">
              <div>
                <p className="eyebrow">
                  <ShoppingBag size={15} />
                  {t("miniCart.eyebrow")}
                </p>
                <h2>{t("miniCart.title")}</h2>
              </div>
              <button className="icon-btn" type="button" aria-label={t("miniCart.close")} onClick={closeCart}>
                <X size={18} />
              </button>
            </div>

            {items.length ? (
              <>
                <div className="drawer-items">
                  {cartMessage && <p className="form-message cart-stock-message">{cartMessage}</p>}
                  {items.map((item) => {
                    const stockStatus = getStockStatus(item);
                    const stockLimit = Number.parseInt(item.stock, 10);
                    const canIncrease = !Number.isFinite(stockLimit) || item.quantity < stockLimit;

                    return (
                      <article className="drawer-item" key={item.id}>
                        <img src={getImageUrl(item.image)} alt={item.name} onError={handleImageError} />
                        <div>
                          <Link to={`/products/${item.slug}`} onClick={closeCart}>
                            {item.name}
                          </Link>
                          <span>{formatPrice(item.price)}</span>
                          <small className={`stock-status ${stockStatus === "out_of_stock" ? "danger" : stockStatus === "low_stock" ? "warn" : ""}`}>
                            {getStockLabel(item, t)}
                          </small>
                          <div className="drawer-qty">
                            <button
                              type="button"
                              aria-label={t("miniCart.decrease")}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus size={13} />
                            </button>
                            <strong>{item.quantity}</strong>
                            <button
                              type="button"
                              aria-label={t("miniCart.increase")}
                              disabled={!canIncrease}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                        <button
                          className="drawer-remove"
                          type="button"
                          aria-label={t("miniCart.remove", { name: item.name })}
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </article>
                    );
                  })}
                </div>
                <div className="drawer-total">
                  <span>{t("common.total")}</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <Link className="primary-btn full-btn" to="/checkout" onClick={closeCart}>
                  {t("miniCart.checkout")}
                  <ArrowRight size={18} />
                </Link>
              </>
            ) : (
              <div className="drawer-empty">
                <ShoppingBag size={38} />
                <h3>{t("miniCart.emptyTitle")}</h3>
                <p>{t("miniCart.emptyText")}</p>
                <Link className="primary-btn" to="/shop" onClick={closeCart}>
                  {t("common.shopNow")}
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
