import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Percent,
  ShieldCheck,
  Tag,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  createOrder,
  formatStorePrice,
  getImageUrl,
  getStockLabel,
  getStockStatus,
  handleImageError,
  validateCoupon,
} from "../api/client.js";
import Seo from "../components/Seo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useStoreSettings } from "../context/StoreSettingsContext.jsx";

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  payment_method: "cash_on_delivery",
};

function formatApiMessage(value) {
  if (Array.isArray(value)) {
    return value.join(" ");
  }
  return value;
}

export default function Checkout() {
  const { t } = useTranslation();
  const { clearCart, items, subtotal } = useCart();
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);
  const [successItems, setSuccessItems] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [promoStatus, setPromoStatus] = useState("idle");
  const [promoMessage, setPromoMessage] = useState("");
  const formatPrice = useMemo(
    () => (value) => formatStorePrice(value, settings.currency),
    [settings.currency],
  );

  useEffect(() => {
    if (!user) {
      return;
    }
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    setForm((current) => ({
      ...current,
      full_name: current.full_name || fullName || user.username || "",
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
      city: current.city || user.city || "",
      address: current.address || user.address || "",
    }));
  }, [user]);

  const deliveryPrice = useMemo(() => {
    const delivery = Number.parseFloat(settings.delivery_price || 0);
    const freeThreshold = Number.parseFloat(settings.free_delivery_threshold || 0);
    return freeThreshold && subtotal >= freeThreshold ? 0 : delivery;
  }, [settings.delivery_price, settings.free_delivery_threshold, subtotal]);

  const discountAmount = Number.parseFloat(appliedCoupon?.discount_amount || 0);
  const grandTotal = Math.max(0, subtotal - discountAmount) + deliveryPrice;
  const freeDeliveryLeft = Math.max(
    0,
    Number.parseFloat(settings.free_delivery_threshold || 0) - subtotal,
  );

  const stockWarnings = useMemo(
    () =>
      items
        .map((item) => {
          const stock = Number.parseInt(item.stock, 10);
          if (Number.isFinite(stock) && stock <= 0) {
            return t("checkout.outOfStock", { name: item.name });
          }
          if (Number.isFinite(stock) && item.quantity > stock) {
            return t("checkout.onlyStockLeft", { name: item.name, count: stock });
          }
          return "";
        })
        .filter(Boolean),
    [items, t],
  );

  const canSubmit = useMemo(
    () =>
      items.length > 0 &&
      !stockWarnings.length &&
      ["full_name", "phone", "city", "address", "payment_method"].every((field) =>
        String(form[field] || "").trim(),
      ),
    [form, items.length, stockWarnings.length],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoStatus("error");
      setPromoMessage(t("checkout.enterPromo"));
      setAppliedCoupon(null);
      return;
    }

    setPromoStatus("loading");
    setPromoMessage("");
    try {
      const result = await validateCoupon({
        code,
        subtotal: subtotal.toFixed(2),
      });
      if (!result.valid) {
        setPromoStatus("error");
        setPromoMessage(result.message || t("checkout.promoInvalid"));
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(result);
      setPromoCode(result.code);
      setPromoStatus("success");
      setPromoMessage(result.message || t("checkout.promoApplied"));
    } catch (error) {
      setPromoStatus("error");
      setPromoMessage(error.message || t("checkout.promoError"));
      setAppliedCoupon(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoStatus("idle");
    setPromoMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const submittedItems = [...items];
      const payload = {
        ...form,
        coupon_code: appliedCoupon?.code || "",
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };
      const order = await createOrder(payload);
      setSuccessOrder(order);
      setSuccessItems(submittedItems);
      setStatus("success");
      clearCart();
    } catch (error) {
      setStatus("error");
      setMessage(
        formatApiMessage(
          error.body?.coupon_code ||
            error.body?.items ||
            error.body?.detail,
        ) ||
          t("checkout.orderError"),
      );
    }
  };

  if (status === "success") {
    const orderTotal = successOrder?.total_price || grandTotal;
    const orderDiscount = Number.parseFloat(successOrder?.discount_amount || 0);
    const orderNumber = successOrder?.order_number || `#${successOrder?.id}`;
    const whatsappNumber = String(settings.whatsapp || "").replace(/\D/g, "");
    const orderLines = successItems
      .map(
        (item) =>
          `${item.quantity} x ${item.name} - ${formatPrice(
            Number.parseFloat(item.price) * item.quantity,
          )}`,
      )
      .join("\n");
    const whatsappText = encodeURIComponent(
      t("checkout.whatsappMessage", {
        storeName: settings.store_name,
        orderNumber,
        fullName: form.full_name,
        phone: form.phone,
        email: form.email || t("checkout.notProvided"),
        city: form.city,
        address: form.address,
        products: orderLines,
        coupon: successOrder?.coupon_code || t("checkout.none"),
        discount: formatPrice(orderDiscount),
        delivery: formatPrice(successOrder?.delivery_price || deliveryPrice),
        total: formatPrice(orderTotal),
        payment: t(`payment.${successOrder?.payment_method || form.payment_method}`),
      }),
    );

    return (
      <section className="page-section container success-page">
        <Seo
          title={`${t("admin.order")} ${orderNumber}`}
          description={t("seo.successDescription")}
        />
        <div className="success-hero">
          <CheckCircle2 size={52} />
          <p className="eyebrow">{t("checkout.orderConfirmed")}</p>
          <h1>{t("checkout.successTitle", { orderNumber })}</h1>
          <p>{t("checkout.successText")}</p>
        </div>

        <div className="success-layout">
          <div className="summary-panel">
            <h2>{t("checkout.orderSummary")}</h2>
            <div className="checkout-items">
              {successItems.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <img src={getImageUrl(item.image)} alt={item.name} onError={handleImageError} />
                  <div>
                    <span>{item.name}</span>
                    <small>{t("common.qty", { count: item.quantity })}</small>
                  </div>
                  <strong>{formatPrice(Number.parseFloat(item.price) * item.quantity)}</strong>
                </div>
              ))}
            </div>
            {successOrder?.coupon_code && (
              <div className="summary-row">
                <span>{t("common.coupon")}</span>
                <strong>{successOrder.coupon_code}</strong>
              </div>
            )}
            <div className="summary-row">
              <span>{t("common.discount")}</span>
              <strong>{orderDiscount ? `-${formatPrice(orderDiscount)}` : formatPrice(0)}</strong>
            </div>
            <div className="summary-row total">
              <span>{t("common.total")}</span>
              <strong>{formatPrice(orderTotal)}</strong>
            </div>
          </div>

          <div className="summary-panel success-contact">
            <h2>{t("common.delivery")}</h2>
            <p>{form.full_name}</p>
            <p>{form.phone}</p>
            {form.email && <p>{form.email}</p>}
            <p>
              {form.city}, {form.address}
            </p>
            <div className="payment-chip">
              <WalletCards size={18} />
              {t(`payment.${successOrder?.payment_method || form.payment_method}`)}
            </div>
            <a
              className="primary-btn full-btn"
              href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />
              {t("checkout.openWhatsapp")}
            </a>
            <Link className="ghost-btn full-btn" to="/shop">
              {t("common.continueShopping")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="page-section container">
        <Seo title={t("seo.checkoutTitle")} description={t("seo.checkoutDescription")} />
        <div className="empty-state">
          <h1>{t("checkout.noItemsTitle")}</h1>
          <p>{t("checkout.noItemsText")}</p>
          <Link className="primary-btn" to="/">
            <ArrowLeft size={18} />
            {t("common.backHome")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section container">
      <Seo title={t("seo.checkoutTitle")} description={t("seo.checkoutDescription")} />
      <div className="page-heading">
        <p className="eyebrow">
          <ShieldCheck size={15} />
          {t("checkout.secure")}
        </p>
        <h1>{t("checkout.heading")}</h1>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            {t("checkout.fullName")}
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder={t("checkout.namePlaceholder")}
              required
            />
          </label>
          <label>
            {t("checkout.email")}
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("checkout.emailPlaceholder")}
            />
            <small className="form-hint">{t("checkout.emailHint")}</small>
          </label>
          <label>
            {t("checkout.phone")}
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder={t("checkout.phonePlaceholder")}
              required
            />
          </label>
          <label>
            {t("checkout.city")}
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder={t("checkout.cityPlaceholder")}
              required
            />
          </label>
          <label>
            {t("checkout.address")}
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder={t("checkout.addressPlaceholder")}
              required
            />
          </label>

          <div className="payment-methods" role="radiogroup" aria-label={t("checkout.paymentMethod")}>
            <label className={form.payment_method === "cash_on_delivery" ? "active" : ""}>
              <input
                type="radio"
                name="payment_method"
                value="cash_on_delivery"
                checked={form.payment_method === "cash_on_delivery"}
                onChange={handleChange}
              />
              <WalletCards size={18} />
              {t("payment.cash_on_delivery")}
            </label>
            <label className={form.payment_method === "whatsapp_order" ? "active" : ""}>
              <input
                type="radio"
                name="payment_method"
                value="whatsapp_order"
                checked={form.payment_method === "whatsapp_order"}
                onChange={handleChange}
              />
              <MessageCircle size={18} />
              {t("payment.whatsapp_order")}
            </label>
          </div>

          {status === "error" && <p className="form-error">{message}</p>}
          {stockWarnings.map((warning) => (
            <p className="form-error" key={warning}>
              {warning}
            </p>
          ))}

          <button className="primary-btn full-btn" type="submit" disabled={!canSubmit || status === "loading"}>
            {status === "loading" ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            {t("checkout.placeOrder")}
          </button>
        </form>

        <aside className="summary-panel">
          <h2>{t("checkout.finalReview")}</h2>
          <div className="checkout-items">
            {items.map((item) => (
              <div className="checkout-item" key={item.id}>
                <img src={getImageUrl(item.image)} alt={item.name} onError={handleImageError} />
                <div>
                  <span>{item.name}</span>
                  <small>{t("common.qty", { count: item.quantity })}</small>
                  <small className={`stock-status ${getStockStatus(item) === "out_of_stock" ? "danger" : getStockStatus(item) === "low_stock" ? "warn" : ""}`}>
                    {getStockLabel(item, t)}
                  </small>
                </div>
                <strong>{formatPrice(Number.parseFloat(item.price) * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="promo-panel">
            <div>
              <p className="eyebrow">
                <Percent size={15} />
                {t("checkout.promoCode")}
              </p>
              <h3>{t("checkout.unlockDiscount")}</h3>
            </div>
            <div className="promo-row">
              <input
                value={promoCode}
                onChange={(event) => {
                  setPromoCode(event.target.value);
                  if (appliedCoupon) {
                    setAppliedCoupon(null);
                    setPromoStatus("idle");
                    setPromoMessage("");
                  }
                }}
                placeholder={t("checkout.promoPlaceholder")}
                disabled={promoStatus === "loading"}
              />
              {appliedCoupon ? (
                <button className="ghost-btn" type="button" onClick={handleRemovePromo}>
                  <X size={16} />
                  {t("common.remove")}
                </button>
              ) : (
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoStatus === "loading"}
                >
                  <Tag size={16} />
                  {promoStatus === "loading" ? t("common.checking") : t("common.apply")}
                </button>
              )}
            </div>
            {promoMessage && (
              <p className={promoStatus === "error" ? "form-error" : "form-message"}>
                {promoMessage}
              </p>
            )}
          </div>

          <div className="summary-row total">
            <span>{t("common.subtotal")}</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>{t("common.discount")}</span>
            <strong>{discountAmount ? `-${formatPrice(discountAmount)}` : formatPrice(0)}</strong>
          </div>
          <div className="summary-row">
            <span>{t("common.delivery")}</span>
            <strong>{deliveryPrice ? formatPrice(deliveryPrice) : t("checkout.free")}</strong>
          </div>
          <p className="delivery-note">
            {deliveryPrice
              ? t("checkout.freeDeliveryAway", { amount: formatPrice(freeDeliveryLeft) })
              : t("checkout.freeDeliveryUnlocked")}
          </p>
          <div className="summary-row total">
            <span>{t("common.total")}</span>
            <strong>{formatPrice(grandTotal)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
