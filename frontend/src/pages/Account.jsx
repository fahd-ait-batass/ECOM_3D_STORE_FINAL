import { Clock3, Heart, LogOut, PackageCheck, Save, UserRoundPen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import {
  formatStorePrice,
  getImageUrl,
  getMyOrders,
  handleImageError,
} from "../api/client.js";
import Seo from "../components/Seo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useStoreSettings } from "../context/StoreSettingsContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { formatLocalizedDate } from "../i18n/formatters.js";

const trackingStepKeys = ["pending", "confirmed", "processing", "shipped", "delivered"];

const trackingIndex = trackingStepKeys.reduce(
  (steps, step, index) => ({ ...steps, [step]: index }),
  {},
);

function OrderTrackingTimeline({ order }) {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const trackingSteps = trackingStepKeys.map((key) => ({
    key,
    label: t(`account.${key}`),
  }));
  const updatedDate = formatLocalizedDate(
    order.updated_at || order.created_at,
    language,
    { dateStyle: "medium", timeStyle: "short" },
  );

  if (order.status === "cancelled") {
    return (
      <div className="order-tracking cancelled-tracking">
        <div>
          <strong>{t("account.cancelledTitle")}</strong>
          <span>{t("account.cancelledText")}</span>
        </div>
        <small>{t("account.updated", { date: updatedDate })}</small>
      </div>
    );
  }

  const currentIndex = trackingIndex[order.status] ?? 0;

  return (
    <div className="order-tracking">
      <div className="tracking-meta">
        <span>
          {t("account.currentStep")} <strong>{t(`orderStatus.${order.status}`)}</strong>
        </span>
        <small>{t("account.updated", { date: updatedDate })}</small>
      </div>
      {order.tracking_number && (
        <div className="tracking-number">
          {t("account.trackingNumber")}
          <strong>{order.tracking_number}</strong>
        </div>
      )}
      <div className="tracking-timeline" aria-label={t("account.timelineLabel")}>
        {trackingSteps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div
              className={`tracking-step ${isComplete ? "complete" : ""} ${
                isCurrent ? "current" : ""
              }`}
              key={step.key}
            >
              <span className="tracking-dot" />
              <small>{step.label}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Account() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const navigate = useNavigate();
  const { logout, updateProfile, user } = useAuth();
  const { settings } = useStoreSettings();
  const { count: wishlistCount } = useWishlist();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    address: "",
  });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const formatPrice = (value) => formatStorePrice(value, settings.currency);

  useEffect(() => {
    if (!user) {
      return;
    }
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      city: user.city || "",
      address: user.address || "",
    });
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    setOrdersLoading(true);

    getMyOrders()
      .then((data) => {
        if (isMounted) {
          setOrders(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOrders([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setOrdersLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const profileName = useMemo(() => {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
    return fullName || user?.username || t("account.customerFallback");
  }, [t, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await updateProfile(form);
      setStatus("success");
      setMessage(t("account.profileUpdated"));
    } catch (error) {
      setStatus("error");
      setMessage(error.message || t("account.profileError"));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <section className="page-section account-page container">
      <Seo
        title={t("seo.accountTitle")}
        description={t("seo.accountDescription")}
      />
      <div className="account-hero">
        <p className="eyebrow">
          <UserRoundPen size={15} />
          {t("account.eyebrow")}
        </p>
        <h1>{profileName}</h1>
        <p>{t("account.intro")}</p>
      </div>

      <div className="account-layout">
        <aside className="profile-card">
          <span>{t("account.signedInAs")}</span>
          <strong>{user?.username}</strong>
          <p>{user?.email || t("account.noEmail")}</p>
          <Link className="account-mini-link" to="/wishlist">
            <Heart size={17} fill={wishlistCount ? "currentColor" : "none"} />
            {wishlistCount
              ? t("account.savedProducts", { count: wishlistCount })
              : t("account.viewWishlist")}
          </Link>
          <button className="ghost-btn full-btn" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            {t("account.logout")}
          </button>
        </aside>

        <form className="account-form" onSubmit={handleSubmit}>
          <h2>{t("account.profileDetails")}</h2>
          <div className="form-pair">
            <label>
              {t("auth.firstName")}
              <input name="first_name" value={form.first_name} onChange={handleChange} />
            </label>
            <label>
              {t("auth.lastName")}
              <input name="last_name" value={form.last_name} onChange={handleChange} />
            </label>
          </div>
          <div className="form-pair">
            <label>
              {t("auth.phone")}
              <input name="phone" value={form.phone} onChange={handleChange} />
            </label>
            <label>
              {t("auth.city")}
              <input name="city" value={form.city} onChange={handleChange} />
            </label>
          </div>
          <label>
            {t("auth.address")}
            <textarea name="address" value={form.address} onChange={handleChange} />
          </label>
          {message && (
            <p className={status === "error" ? "form-error" : "form-message"}>{message}</p>
          )}
          <button className="primary-btn full-btn" type="submit" disabled={status === "loading"}>
            <Save size={18} />
            {status === "loading" ? t("common.saving") : t("account.saveProfile")}
          </button>
        </form>
      </div>

      <div className="orders-panel account-orders-panel">
        <div className="admin-section-head">
          <h2>{t("account.orderHistory")}</h2>
          <span>{ordersLoading ? t("common.loading") : t("common.countOrders", { count: orders.length })}</span>
        </div>

        {ordersLoading ? (
          <div className="order-history">
            {Array.from({ length: 2 }).map((_, index) => (
              <article className="order-card" key={index}>
                <span className="skeleton skeleton-line short" />
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-line tiny" />
              </article>
            ))}
          </div>
        ) : orders.length ? (
          <div className="order-history">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-head">
                  <div>
                    <strong>{order.order_number || `#${order.id}`}</strong>
                    <small>
                      <Clock3 size={14} />
                      {formatLocalizedDate(order.created_at, language, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </small>
                    {order.email && <small>{order.email}</small>}
                  </div>
                  <span className={`table-status status-${order.status}`}>
                    {t(`orderStatus.${order.status}`)}
                  </span>
                </div>

                <OrderTrackingTimeline order={order} />

                <div className="checkout-items">
                  {order.items.map((item) => (
                    <div className="checkout-item" key={item.id}>
                      <img
                        src={getImageUrl(item.product?.image)}
                        alt={item.product?.name}
                        onError={handleImageError}
                      />
                      <div>
                        <span>{item.product?.name}</span>
                        <small>{t("common.qty", { count: item.quantity })}</small>
                      </div>
                      <strong>{formatPrice(Number.parseFloat(item.price) * item.quantity)}</strong>
                    </div>
                  ))}
                </div>

                <div className="summary-row">
                  <span>{t(`payment.${order.payment_method}`)}</span>
                  <strong>{formatPrice(order.total_price)}</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state premium-empty">
            <PackageCheck size={38} />
            <h2>{t("account.noOrdersTitle")}</h2>
            <p>{t("account.noOrdersText")}</p>
            <Link className="primary-btn" to="/shop">
              {t("common.goToShop")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
