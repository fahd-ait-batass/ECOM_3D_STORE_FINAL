import {
  AlertTriangle,
  BarChart3,
  CircleDollarSign,
  Edit3,
  Eye,
  Layers3,
  Package,
  Percent,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  Star,
  TrendingUp,
  Trash2,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  deleteAdminCoupon,
  deleteAdminProduct,
  deleteAdminReview,
  formatStorePrice,
  getAdminCategories,
  getAdminCoupons,
  getAdminOrders,
  getAdminProducts,
  getAdminReviews,
  getAdminStockAlerts,
  getDashboardAnalytics,
  getDashboardSummary,
  getImageUrl,
  getStockLabel,
  getStockStatus,
  handleImageError,
  saveAdminCoupon,
  saveAdminProduct,
  updateAdminReview,
  updateOrderStatus,
} from "../api/client.js";
import Seo from "../components/Seo.jsx";
import { useStoreSettings } from "../context/StoreSettingsContext.jsx";
import { formatLocalizedDate, formatLocalizedNumber } from "../i18n/formatters.js";

const blankProduct = {
  id: null,
  name: "",
  slug: "",
  category_id: "",
  description: "",
  price: "",
  old_price: "",
  stock: 10,
  low_stock_threshold: 5,
  rating: 4.7,
  is_featured: false,
  is_active: true,
  image: null,
};

function toDateTimeInput(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function futureDateTimeInput(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateTimeInput(date);
}

const blankCoupon = {
  id: null,
  code: "",
  discount_type: "percentage",
  discount_value: "10.00",
  minimum_order_amount: "0.00",
  maximum_discount_amount: "",
  usage_limit: "",
  is_active: true,
  valid_from: futureDateTimeInput(0),
  valid_until: futureDateTimeInput(30),
};

const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const analyticsPeriods = ["7d", "30d", "90d", "12m"];
const statusColors = {
  pending: "#f2cf7b",
  confirmed: "#38bdf8",
  processing: "#a78bfa",
  shipped: "#22d3ee",
  delivered: "#34d399",
  cancelled: "#fb7185",
};

function formatPrice(value, currencyCode = "USD") {
  return formatStorePrice(value, currencyCode);
}

function formatNumber(value, language = "fr") {
  return formatLocalizedNumber(value, language);
}

function formatShortDate(value, language = "fr") {
  return value ? formatLocalizedDate(value, language) : "";
}

function AnalyticsTooltip({ active, payload, label, language = "fr" }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="analytics-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={item.dataKey || item.name} style={{ color: item.color }}>
          {item.name}:{" "}
          {typeof item.value === "number" ? formatNumber(item.value, language) : item.value}
        </span>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const { refreshSettings, saveSettings, settings } = useStoreSettings();
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [stockAlerts, setStockAlerts] = useState({
    out_of_stock_count: 0,
    low_stock_count: 0,
    total_stock_units: 0,
    results: [],
  });
  const [reviewFilter, setReviewFilter] = useState("all");
  const [orderUpdates, setOrderUpdates] = useState({});
  const [form, setForm] = useState(blankProduct);
  const [couponForm, setCouponForm] = useState(blankCoupon);
  const [settingsForm, setSettingsForm] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [couponSaving, setCouponSaving] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(null);
  const [orderSaving, setOrderSaving] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const activeCurrency = settingsForm?.currency || "USD";

  async function loadAnalytics(period = analyticsPeriod) {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const analyticsData = await getDashboardAnalytics({ period });
      setAnalytics(analyticsData);
    } catch (error) {
      setAnalyticsError(error.message || t("admin.noRevenue"));
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  const summaryCards = useMemo(
    () => [
      {
        label: t("admin.products"),
        value: summary?.total_products ?? 0,
        icon: Package,
      },
      {
        label: t("admin.orders"),
        value: summary?.total_orders ?? 0,
        icon: Layers3,
      },
      {
        label: t("admin.revenue"),
        value: formatPrice(summary?.revenue ?? 0, activeCurrency),
        icon: WalletCards,
      },
      {
        label: t("admin.pending"),
        value: summary?.pending_orders ?? 0,
        icon: RefreshCcw,
      },
    ],
    [summary, activeCurrency, t],
  );

  const stockCards = useMemo(
    () => [
      {
        label: t("admin.outOfStock"),
        value: stockAlerts.out_of_stock_count ?? 0,
        icon: AlertTriangle,
      },
      {
        label: t("admin.lowStock"),
        value: stockAlerts.low_stock_count ?? 0,
        icon: RefreshCcw,
      },
      {
        label: t("admin.stockUnits"),
        value: stockAlerts.total_stock_units ?? 0,
        icon: Package,
      },
    ],
    [stockAlerts, t],
  );

  const analyticsCards = useMemo(
    () => [
      {
        label: t("admin.revenue"),
        value: formatPrice(analytics?.kpis?.total_revenue ?? 0, activeCurrency),
        icon: CircleDollarSign,
      },
      {
        label: t("admin.orders"),
        value: formatNumber(analytics?.kpis?.total_orders ?? 0, language),
        icon: BarChart3,
      },
      {
        label: t("admin.avgOrder"),
        value: formatPrice(analytics?.kpis?.average_order_value ?? 0, activeCurrency),
        icon: TrendingUp,
      },
      {
        label: t("admin.customers"),
        value: formatNumber(analytics?.kpis?.total_customers ?? 0, language),
        icon: UsersRound,
      },
      {
        label: t("admin.lowStock"),
        value: formatNumber(analytics?.kpis?.low_stock_products ?? 0, language),
        icon: RefreshCcw,
      },
      {
        label: t("admin.outOfStock"),
        value: formatNumber(analytics?.kpis?.out_of_stock_products ?? 0, language),
        icon: AlertTriangle,
      },
    ],
    [activeCurrency, analytics, language, t],
  );

  const statusDistributionData = useMemo(
    () =>
      (analytics?.charts?.order_status_distribution || []).map((item) => ({
        ...item,
        label: t(`orderStatus.${item.status}`),
      })),
    [analytics, t],
  );

  async function loadDashboard() {
    setLoading(true);
    const [
      summaryData,
      categoryData,
      productPage,
      orderData,
      couponData,
      reviewData,
      stockData,
      analyticsData,
      settingsData,
    ] = await Promise.all([
      getDashboardSummary(),
      getAdminCategories(),
      getAdminProducts({ page_size: 50 }),
      getAdminOrders(),
      getAdminCoupons(),
      getAdminReviews(reviewFilter === "all" ? "" : reviewFilter),
      getAdminStockAlerts(),
      getDashboardAnalytics({ period: analyticsPeriod }),
      refreshSettings(),
    ]);
    setSummary(summaryData);
    setCategories(categoryData);
    setProducts(productPage.results);
    setOrders(orderData);
    setCoupons(couponData);
    setAdminReviews(reviewData);
    setStockAlerts(stockData);
    setAnalytics(analyticsData);
    setOrderUpdates(
      Object.fromEntries(
        orderData.map((order) => [
          order.id,
          {
            status: order.status,
            tracking_number: order.tracking_number || "",
          },
        ]),
      ),
    );
    setSettingsForm(settingsData);
    setLoading(false);
  }

  async function loadAdminReviews(status = reviewFilter) {
    const reviewData = await getAdminReviews(status === "all" ? "" : status);
    setAdminReviews(reviewData);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadAdminReviews();
  }, [reviewFilter]);

  useEffect(() => {
    loadAnalytics();
  }, [analyticsPeriod]);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const editProduct = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category_id: product.category?.id || "",
      description: product.description,
      price: product.price,
      old_price: product.old_price || "",
      stock: product.stock,
      low_stock_threshold: product.low_stock_threshold ?? 5,
      rating: product.rating,
      is_featured: product.is_featured,
      is_active: product.is_active,
      image: null,
    });
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await saveAdminProduct(form);
      setForm(blankProduct);
      setMessage(t("admin.productSaved"));
      await loadDashboard();
    } catch (error) {
      setMessage(
        error.body
          ? Object.values(error.body).flat().join(" ")
          : t("admin.productError"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    await deleteAdminProduct(productId);
    await loadDashboard();
  };

  const updateCouponForm = (key, value) => {
    setCouponForm((current) => ({ ...current, [key]: value }));
  };

  const editCoupon = (coupon) => {
    setCouponForm({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order_amount: coupon.minimum_order_amount,
      maximum_discount_amount: coupon.maximum_discount_amount || "",
      usage_limit: coupon.usage_limit || "",
      is_active: coupon.is_active,
      valid_from: toDateTimeInput(coupon.valid_from),
      valid_until: toDateTimeInput(coupon.valid_until),
    });
    setCouponMessage("");
  };

  const handleCouponSubmit = async (event) => {
    event.preventDefault();
    setCouponSaving(true);
    setCouponMessage("");
    try {
      await saveAdminCoupon(couponForm);
      setCouponForm(blankCoupon);
      setCouponMessage(t("admin.couponSaved"));
      const couponData = await getAdminCoupons();
      setCoupons(couponData);
    } catch (error) {
      setCouponMessage(
        error.body
          ? Object.values(error.body).flat().join(" ")
          : error.message || t("admin.couponError"),
      );
    } finally {
      setCouponSaving(false);
    }
  };

  const handleCouponDelete = async (couponId) => {
    await deleteAdminCoupon(couponId);
    setCoupons((current) => current.filter((coupon) => coupon.id !== couponId));
  };

  const toggleCoupon = async (coupon) => {
    const savedCoupon = await saveAdminCoupon({ id: coupon.id, is_active: !coupon.is_active });
    setCoupons((current) =>
      current.map((item) => (item.id === savedCoupon.id ? savedCoupon : item)),
    );
  };

  const handleAdminReviewApproval = async (reviewId, isApproved) => {
    setReviewSaving(reviewId);
    setReviewMessage("");
    try {
      const savedReview = await updateAdminReview(reviewId, { is_approved: isApproved });
      setAdminReviews((current) =>
        current.map((review) => (review.id === savedReview.id ? savedReview : review)),
      );
      setReviewMessage(`${savedReview.product_name} ${t("common.saved")}.`);
    } catch (error) {
      setReviewMessage(error.message || t("productDetails.saveError"));
    } finally {
      setReviewSaving(null);
    }
  };

  const handleAdminReviewDelete = async (reviewId) => {
    await deleteAdminReview(reviewId);
    setAdminReviews((current) => current.filter((review) => review.id !== reviewId));
    setReviewMessage(t("productDetails.deleted"));
  };

  const updateOrderDraft = (orderId, key, value) => {
    setOrderUpdates((current) => ({
      ...current,
      [orderId]: {
        status: current[orderId]?.status || orders.find((order) => order.id === orderId)?.status,
        tracking_number:
          current[orderId]?.tracking_number ??
          orders.find((order) => order.id === orderId)?.tracking_number ??
          "",
        [key]: value,
      },
    }));
  };

  const handleOrderUpdate = async (orderId) => {
    setOrderSaving(orderId);
    setOrderMessage("");
    try {
      const payload = orderUpdates[orderId] || {};
      const savedOrder = await updateOrderStatus(orderId, payload);
      setOrders((current) =>
        current.map((order) => (order.id === savedOrder.id ? savedOrder : order)),
      );
      setOrderUpdates((current) => ({
        ...current,
        [savedOrder.id]: {
          status: savedOrder.status,
          tracking_number: savedOrder.tracking_number || "",
        },
      }));
      setSelectedOrder((current) =>
        current?.id === savedOrder.id ? savedOrder : current,
      );
      const summaryData = await getDashboardSummary();
      setSummary(summaryData);
      setOrderMessage(t("admin.orderUpdated", {
        orderNumber: savedOrder.order_number || `#${savedOrder.id}`,
      }));
    } catch (error) {
      setOrderMessage(error.message || t("admin.orderError"));
    } finally {
      setOrderSaving(null);
    }
  };

  const toggleProduct = async (product, key) => {
    await saveAdminProduct({ id: product.id, [key]: !product[key] });
    await loadDashboard();
  };

  const updateSettingsForm = (key, value) => {
    setSettingsForm((current) => ({ ...current, [key]: value }));
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage("");
    try {
      const savedSettings = await saveSettings(settingsForm);
      setSettingsForm(savedSettings);
      setSettingsMessage(t("admin.settingsSaved"));
    } catch (error) {
      setSettingsMessage(error.message || t("admin.settingsError"));
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <section className="page-section admin-page container">
      <Seo
        title={t("seo.adminTitle")}
        description={t("seo.adminDescription")}
      />
      <div className="page-heading admin-heading">
        <div>
          <p className="eyebrow">
            <Layers3 size={15} />
            {t("admin.dashboardEyebrow")}
          </p>
          <h1>{t("admin.title")}</h1>
        </div>
        <button className="ghost-btn" type="button" onClick={loadDashboard}>
          <RefreshCcw size={18} />
          {t("common.refresh")}
        </button>
      </div>

      <div className="dashboard-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="dashboard-card" key={card.label}>
              <Icon size={24} />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid stock-dashboard-grid">
        {stockCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="dashboard-card stock-dashboard-card" key={card.label}>
              <Icon size={24} />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          );
        })}
      </div>

      <section className="analytics-panel">
        <div className="admin-section-head analytics-head">
          <div>
            <p className="eyebrow">
              <BarChart3 size={15} />
              {t("admin.analyticsEyebrow")}
            </p>
            <h2>{t("admin.analyticsTitle")}</h2>
          </div>
          <select
            className="analytics-period-select"
            value={analyticsPeriod}
            onChange={(event) => setAnalyticsPeriod(event.target.value)}
          >
            {analyticsPeriods.map((period) => (
              <option key={period} value={period}>
                {t(`admin.periods.${period}`)}
              </option>
            ))}
          </select>
        </div>

        {analyticsError && <p className="form-error analytics-error">{analyticsError}</p>}

        {analyticsLoading && !analytics ? (
          <div className="analytics-loading-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <span className="skeleton skeleton-line" key={index} />
            ))}
          </div>
        ) : (
          <>
            <div className="dashboard-grid analytics-kpi-grid">
              {analyticsCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className="dashboard-card analytics-kpi-card" key={card.label}>
                    <Icon size={22} />
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </article>
                );
              })}
            </div>

            {analytics?.revenue_rule && <p className="analytics-rule">{t("admin.revenueRule")}</p>}

            <div className="analytics-chart-grid">
              <article className="analytics-card chart-card chart-wide">
                <div className="chart-head">
                  <h3>{t("admin.revenueTrend")}</h3>
                  <span>{t(`admin.groupBy.${analytics?.filters?.group_by || "day"}`)}</span>
                </div>
                {analytics?.charts?.revenue_by_period?.some((item) => item.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={analytics.charts.revenue_by_period}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f2cf7b" stopOpacity={0.42} />
                          <stop offset="95%" stopColor="#f2cf7b" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#98a3b3", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#98a3b3", fontSize: 11 }} />
                      <Tooltip content={<AnalyticsTooltip language={language} />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name={t("admin.revenue")}
                        stroke="#f2cf7b"
                        strokeWidth={2.5}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="analytics-empty">{t("admin.noRevenue")}</div>
                )}
              </article>

              <article className="analytics-card chart-card">
                <div className="chart-head">
                  <h3>{t("admin.ordersTrend")}</h3>
                  <span>{t("common.countOrders", { count: analytics?.kpis?.total_orders || 0 })}</span>
                </div>
                {analytics?.charts?.orders_by_period?.some((item) => item.orders > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={analytics.charts.orders_by_period}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#98a3b3", fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#98a3b3", fontSize: 11 }} />
                      <Tooltip content={<AnalyticsTooltip language={language} />} />
                      <Bar dataKey="orders" name={t("admin.orders")} fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="analytics-empty">{t("admin.noOrders")}</div>
                )}
              </article>

              <article className="analytics-card chart-card">
                <div className="chart-head">
                  <h3>{t("admin.statusMix")}</h3>
                  <span>{t("common.countOrders", { count: analytics?.kpis?.cancelled_orders || 0 })} {t("orderStatus.cancelled")}</span>
                </div>
                {statusDistributionData.some((item) => item.count > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={58}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {statusDistributionData.map((entry) => (
                          <Cell key={entry.status} fill={statusColors[entry.status] || "#f2cf7b"} />
                        ))}
                      </Pie>
                      <Tooltip content={<AnalyticsTooltip language={language} />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="analytics-empty">{t("admin.noOrders")}</div>
                )}
              </article>

              <article className="analytics-card chart-card chart-wide">
                <div className="chart-head">
                  <h3>{t("admin.topProducts")}</h3>
                  <span>{t("admin.byRevenue")}</span>
                </div>
                {analytics?.charts?.top_selling_products_by_revenue?.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={analytics.charts.top_selling_products_by_revenue}
                      layout="vertical"
                      margin={{ left: 18, right: 20 }}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#98a3b3", fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fill: "#98a3b3", fontSize: 11 }}
                      />
                      <Tooltip content={<AnalyticsTooltip language={language} />} />
                      <Bar dataKey="revenue" name={t("admin.revenue")} fill="#22d3ee" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="analytics-empty">{t("admin.noTopProducts")}</div>
                )}
              </article>
            </div>

            <div className="analytics-table-grid">
              <article className="analytics-card">
                <div className="chart-head">
                  <h3>{t("admin.recentOrders")}</h3>
                  <span>{t("common.countRecords", { count: analytics?.recent_orders?.length || 0 })}</span>
                </div>
                {analytics?.recent_orders?.length ? (
                  <div className="mini-analytics-table">
                    {analytics.recent_orders.map((order) => (
                      <div key={order.id}>
                        <strong>{order.order_number}</strong>
                        <span>{order.customer}</span>
                        <small>{t(`orderStatus.${order.status}`)}</small>
                        <b>{formatPrice(order.total_price, activeCurrency)}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="analytics-empty">{t("admin.noOrders")}</div>
                )}
              </article>

              <article className="analytics-card">
                <div className="chart-head">
                  <h3>{t("admin.lowStock")}</h3>
                  <span>{t("common.countRecords", { count: analytics?.low_stock_products?.length || 0 })}</span>
                </div>
                {analytics?.low_stock_products?.length ? (
                  <div className="mini-analytics-table">
                    {analytics.low_stock_products.map((product) => (
                      <div key={product.id}>
                        <strong>{product.name}</strong>
                        <span>{product.category}</span>
                        <small>{t(`stock.${product.stock_status}`)}</small>
                        <b>{t("stock.onlyLeft", { count: product.stock })}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="analytics-empty">{t("stock.healthyText")}</div>
                )}
              </article>

              <article className="analytics-card">
                <div className="chart-head">
                  <h3>{t("admin.couponUsage")}</h3>
                  <span>{formatPrice(analytics?.kpis?.total_coupon_discounts || 0, activeCurrency)} {t("common.discount")}</span>
                </div>
                {analytics?.charts?.coupon_usage?.length ? (
                  <div className="mini-analytics-table">
                    {analytics.charts.coupon_usage.map((coupon) => (
                      <div key={coupon.code}>
                        <strong>{coupon.code}</strong>
                        <span>{t("common.countOrders", { count: coupon.orders })}</span>
                        <small>{t("common.discount")}</small>
                        <b>{formatPrice(coupon.total_discount, activeCurrency)}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="analytics-empty">{t("admin.noCouponUsage")}</div>
                )}
              </article>
            </div>
          </>
        )}
      </section>

      <div className="admin-layout">
        <div className="admin-sidebar">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-head">
              <h2>{form.id ? t("admin.editProduct") : t("admin.newProduct")}</h2>
              <button
                className="ghost-btn"
                type="button"
                onClick={() => {
                  setForm(blankProduct);
                  setMessage("");
                }}
              >
                <Plus size={17} />
                {t("common.new")}
              </button>
            </div>

            <label>
              {t("admin.name")}
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                required
              />
            </label>
            <label>
              {t("admin.slug")}
              <input
                value={form.slug}
                onChange={(event) => updateForm("slug", event.target.value)}
                required
              />
            </label>
            <label>
              {t("admin.category")}
              <select
                value={form.category_id}
                onChange={(event) => updateForm("category_id", event.target.value)}
                required
              >
                <option value="">{t("admin.categorySelect")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("admin.description")}
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                required
              />
            </label>
            <div className="form-pair">
              <label>
                {t("admin.price")}
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={form.price}
                  onChange={(event) => updateForm("price", event.target.value)}
                  required
                />
              </label>
              <label>
                {t("admin.oldPrice")}
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={form.old_price}
                  onChange={(event) => updateForm("old_price", event.target.value)}
                />
              </label>
            </div>
            <div className="form-pair">
              <label>
                {t("admin.stock")}
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => updateForm("stock", event.target.value)}
                  required
                />
              </label>
              <label>
                {t("admin.threshold")}
                <input
                  type="number"
                  min="0"
                  value={form.low_stock_threshold}
                  onChange={(event) => updateForm("low_stock_threshold", event.target.value)}
                  required
                />
              </label>
            </div>
            <label>
              {t("admin.rating")}
              <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={(event) => updateForm("rating", event.target.value)}
                  required
                />
            </label>
            <label>
              {t("admin.image")}
              <input
                type="file"
                accept="image/*"
                onChange={(event) => updateForm("image", event.target.files?.[0] || null)}
              />
            </label>
            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) => updateForm("is_featured", event.target.checked)}
                />
                {t("admin.featuredToggle")}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => updateForm("is_active", event.target.checked)}
                />
                {t("admin.activeToggle")}
              </label>
            </div>

            {message && <p className="form-message">{message}</p>}

            <button className="primary-btn full-btn" type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? t("common.saving") : t("admin.saveProduct")}
            </button>
          </form>

          <form className="admin-form coupon-form" onSubmit={handleCouponSubmit}>
            <div className="admin-form-head">
              <h2>{couponForm.id ? t("admin.couponStudio") : t("admin.couponStudio")}</h2>
              <button
                className="ghost-btn"
                type="button"
                onClick={() => {
                  setCouponForm(blankCoupon);
                  setCouponMessage("");
                }}
              >
                <Plus size={17} />
                {t("common.new")}
              </button>
            </div>
            <label>
              {t("admin.code")}
              <input
                value={couponForm.code}
                onChange={(event) => updateCouponForm("code", event.target.value)}
                placeholder={t("admin.couponPlaceholder")}
                required
              />
            </label>
            <div className="form-pair">
              <label>
                {t("admin.discountType")}
                <select
                  value={couponForm.discount_type}
                  onChange={(event) => updateCouponForm("discount_type", event.target.value)}
                >
                  <option value="percentage">{t("admin.percentage")}</option>
                  <option value="fixed">{t("admin.fixed")}</option>
                </select>
              </label>
              <label>
                {t("admin.discountValue")}
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={couponForm.discount_value}
                  onChange={(event) => updateCouponForm("discount_value", event.target.value)}
                  required
                />
              </label>
            </div>
            <div className="form-pair">
              <label>
                {t("admin.minimumOrder")}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={couponForm.minimum_order_amount}
                  onChange={(event) =>
                    updateCouponForm("minimum_order_amount", event.target.value)
                  }
                />
              </label>
              <label>
                {t("admin.maxDiscount")}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={couponForm.maximum_discount_amount}
                  onChange={(event) =>
                    updateCouponForm("maximum_discount_amount", event.target.value)
                  }
                />
              </label>
            </div>
            <label>
              {t("admin.usageLimit")}
              <input
                type="number"
                min="1"
                value={couponForm.usage_limit}
                onChange={(event) => updateCouponForm("usage_limit", event.target.value)}
                placeholder={t("admin.unlimited")}
              />
            </label>
            <div className="form-pair">
              <label>
                {t("admin.validFrom")}
                <input
                  type="datetime-local"
                  value={couponForm.valid_from}
                  onChange={(event) => updateCouponForm("valid_from", event.target.value)}
                  required
                />
              </label>
              <label>
                {t("admin.validUntil")}
                <input
                  type="datetime-local"
                  value={couponForm.valid_until}
                  onChange={(event) => updateCouponForm("valid_until", event.target.value)}
                  required
                />
              </label>
            </div>
            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={couponForm.is_active}
                  onChange={(event) => updateCouponForm("is_active", event.target.checked)}
                />
                {t("admin.activeCoupon")}
              </label>
            </div>
            {couponMessage && <p className="form-message">{couponMessage}</p>}
            <button className="ghost-btn full-btn" type="submit" disabled={couponSaving}>
              <Percent size={18} />
              {couponSaving ? t("common.saving") : t("admin.saveCoupon")}
            </button>
          </form>

          {settingsForm && (
            <form className="admin-form settings-form" onSubmit={handleSettingsSubmit}>
              <div className="admin-form-head">
                <h2>{t("admin.storeSettings")}</h2>
                <Settings size={18} />
              </div>
              <label>
                {t("admin.storeName")}
                <input
                  value={settingsForm.store_name || ""}
                  onChange={(event) => updateSettingsForm("store_name", event.target.value)}
                />
              </label>
              <div className="form-pair">
                <label>
                  {t("auth.phone")}
                  <input
                    value={settingsForm.phone || ""}
                    onChange={(event) => updateSettingsForm("phone", event.target.value)}
                  />
                </label>
                <label>
                  {t("admin.whatsapp")}
                  <input
                    value={settingsForm.whatsapp || ""}
                    onChange={(event) => updateSettingsForm("whatsapp", event.target.value)}
                  />
                </label>
              </div>
              <label>
                {t("admin.email")}
                <input
                  type="email"
                  value={settingsForm.email || ""}
                  onChange={(event) => updateSettingsForm("email", event.target.value)}
                />
              </label>
              <label>
                {t("admin.address")}
                <input
                  value={settingsForm.address || ""}
                  onChange={(event) => updateSettingsForm("address", event.target.value)}
                />
              </label>
              <div className="form-pair">
                <label>
                  {t("common.delivery")}
                  <input
                    type="number"
                    step="0.01"
                    value={settingsForm.delivery_price || ""}
                    onChange={(event) => updateSettingsForm("delivery_price", event.target.value)}
                  />
                </label>
                <label>
                  {t("admin.freeOver")}
                  <input
                    type="number"
                    step="0.01"
                    value={settingsForm.free_delivery_threshold || ""}
                    onChange={(event) =>
                      updateSettingsForm("free_delivery_threshold", event.target.value)
                    }
                  />
                </label>
              </div>
              <label>
                {t("admin.currency")}
                <input
                  value={settingsForm.currency || ""}
                  onChange={(event) => updateSettingsForm("currency", event.target.value)}
                  placeholder={t("admin.currencyPlaceholder")}
                />
              </label>
              <label>
                Instagram
                <input
                  value={settingsForm.instagram || ""}
                  onChange={(event) => updateSettingsForm("instagram", event.target.value)}
                />
              </label>
              <label>
                Facebook
                <input
                  value={settingsForm.facebook || ""}
                  onChange={(event) => updateSettingsForm("facebook", event.target.value)}
                />
              </label>
              {settingsMessage && <p className="form-message">{settingsMessage}</p>}
              <button className="ghost-btn full-btn" type="submit" disabled={settingsSaving}>
                <Save size={18} />
                {settingsSaving ? t("common.saving") : t("admin.saveSettings")}
              </button>
            </form>
          )}
        </div>

        <div className="admin-table-wrap">
          <div className="admin-section-head stock-alerts-head">
            <h2>{t("admin.stockAlerts")}</h2>
            <span>{t("admin.needAttention", { count: stockAlerts.results?.length || 0 })}</span>
          </div>
          {stockAlerts.results?.length ? (
            <div className="stock-alert-list">
              {stockAlerts.results.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <article className="stock-alert-card" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <small>{product.category?.name || t("shop.category")}</small>
                    </div>
                    <span
                      className={`table-status stock-status-badge status-${stockStatus}`}
                    >
                      {getStockLabel(product, t)}
                    </span>
                    <span>
                      {t("admin.threshold")} <strong>{product.low_stock_threshold}</strong>
                    </span>
                    <button className="ghost-btn compact-btn" type="button" onClick={() => editProduct(product)}>
                      <Edit3 size={15} />
                      {t("admin.editStock")}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state premium-empty stock-alert-empty">
              <Package size={36} />
              <h2>{t("stock.healthy")}</h2>
              <p>{t("stock.healthyText")}</p>
            </div>
          )}

          <div className="admin-section-head">
            <h2>{t("admin.products")}</h2>
            <span>{t("common.listed", { count: products.length })}</span>
          </div>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("admin.product")}</th>
                  <th>{t("admin.category")}</th>
                  <th>{t("admin.price")}</th>
                  <th>{t("admin.stock")}</th>
                  <th>{t("admin.threshold")}</th>
                  <th>{t("admin.stockStatus")}</th>
                  <th>{t("admin.visibility")}</th>
                  <th>{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const isStockAlert = stockStatus !== "in_stock";

                  return (
                    <tr className={isStockAlert ? "low-stock-row" : ""} key={product.id}>
                      <td>
                        <div className="table-product">
                          <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            onError={handleImageError}
                          />
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category?.name}</td>
                      <td>{formatPrice(product.price, activeCurrency)}</td>
                      <td>
                        <span className={isStockAlert ? "stock-alert" : ""}>
                          {isStockAlert && <AlertTriangle size={14} />}
                          {product.stock}
                        </span>
                      </td>
                      <td>{product.low_stock_threshold}</td>
                      <td>
                        <span
                          className={`table-status stock-status-badge status-${stockStatus}`}
                        >
                          {getStockLabel(product, t)}
                        </span>
                      </td>
                      <td>
                        <span className={`table-status ${product.is_active ? "" : "muted"}`}>
                          {product.is_active ? t("common.active") : t("common.hidden")}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            title={t("admin.toggleFeatured")}
                            onClick={() => toggleProduct(product, "is_featured")}
                          >
                            <Star
                              size={15}
                              fill={product.is_featured ? "currentColor" : "none"}
                            />
                          </button>
                          <button
                            type="button"
                            title={t("admin.toggleActive")}
                            onClick={() => toggleProduct(product, "is_active")}
                          >
                            <Eye size={15} />
                          </button>
                          <button type="button" onClick={() => editProduct(product)}>
                            <Edit3 size={15} />
                          </button>
                          <button type="button" onClick={() => handleDelete(product.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-section-head coupons-head">
            <h2>{t("admin.coupons")}</h2>
            <span>{t("common.countCodes", { count: coupons.length })}</span>
          </div>
          <div className="table-scroll">
            <table className="admin-table coupons-table">
              <thead>
                <tr>
                  <th>{t("admin.code")}</th>
                  <th>{t("admin.discount")}</th>
                  <th>{t("admin.minimum")}</th>
                  <th>{t("admin.usage")}</th>
                  <th>{t("admin.validity")}</th>
                  <th>{t("admin.status")}</th>
                  <th>{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <strong>{coupon.code}</strong>
                    </td>
                    <td>
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value, activeCurrency)}
                      {coupon.maximum_discount_amount && (
                        <small>{t("admin.max", { amount: formatPrice(coupon.maximum_discount_amount, activeCurrency) })}</small>
                      )}
                    </td>
                    <td>{formatPrice(coupon.minimum_order_amount, activeCurrency)}</td>
                    <td>
                      <strong>{coupon.used_count}</strong>
                      <small>{coupon.usage_limit ? t("admin.of", { count: coupon.usage_limit }) : t("admin.unlimited")}</small>
                    </td>
                    <td>
                      <small>{t("admin.from", { date: formatShortDate(coupon.valid_from, language) })}</small>
                      <small>{t("admin.until", { date: formatShortDate(coupon.valid_until, language) })}</small>
                    </td>
                    <td>
                      <span className={`table-status ${coupon.is_active ? "" : "muted"}`}>
                        {coupon.is_active ? t("common.active") : t("common.inactive")}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title={t("admin.toggleActive")}
                          onClick={() => toggleCoupon(coupon)}
                        >
                          <Eye size={15} />
                        </button>
                        <button type="button" onClick={() => editCoupon(coupon)}>
                          <Edit3 size={15} />
                        </button>
                        <button type="button" onClick={() => handleCouponDelete(coupon.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!coupons.length && (
                  <tr>
                    <td colSpan="7">
                      <span className="muted-table-note">{t("admin.noPromo")}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-section-head reviews-admin-head">
            <h2>{t("admin.reviews")}</h2>
            <div className="review-filter-row">
              <span>{t("common.countRecords", { count: adminReviews.length })}</span>
              <select
                value={reviewFilter}
                onChange={(event) => setReviewFilter(event.target.value)}
              >
                <option value="all">{t("admin.all")}</option>
                <option value="pending">{t("orderStatus.pending")}</option>
                <option value="approved">{t("admin.approved")}</option>
              </select>
            </div>
          </div>
          {reviewMessage && <p className="form-message admin-order-message">{reviewMessage}</p>}
          <div className="table-scroll">
            <table className="admin-table reviews-admin-table">
              <thead>
                <tr>
                  <th>{t("admin.product")}</th>
                  <th>{t("admin.customer")}</th>
                  <th>{t("admin.rating")}</th>
                  <th>{t("admin.review")}</th>
                  <th>{t("admin.date")}</th>
                  <th>{t("admin.status")}</th>
                  <th>{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {adminReviews.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <strong>{review.product_name}</strong>
                      <small>{review.product_slug}</small>
                    </td>
                    <td>
                      <strong>{review.reviewer_name}</strong>
                      <small>{review.customer_email || review.customer_username}</small>
                    </td>
                    <td>
                      <span className="admin-rating">
                        <Star size={14} fill="currentColor" />
                        {review.rating}
                      </span>
                    </td>
                    <td>
                      {review.title && <strong>{review.title}</strong>}
                      <small>{review.comment}</small>
                    </td>
                    <td>{formatShortDate(review.created_at, language)}</td>
                    <td>
                      <span className={`table-status ${review.is_approved ? "" : "muted"}`}>
                        {review.is_approved ? t("admin.approved") : t("orderStatus.pending")}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions order-actions">
                        <button
                          className="ghost-btn compact-btn"
                          type="button"
                          onClick={() =>
                            handleAdminReviewApproval(review.id, !review.is_approved)
                          }
                          disabled={reviewSaving === review.id}
                        >
                          {review.is_approved ? t("admin.unapprove") : t("admin.approve")}
                        </button>
                        <button
                          type="button"
                          title={t("admin.deleteReview")}
                          onClick={() => handleAdminReviewDelete(review.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!adminReviews.length && (
                  <tr>
                    <td colSpan="7">
                      <span className="muted-table-note">{t("admin.noReviewsFilter")}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-section-head orders-head">
            <h2>{t("admin.orders")}</h2>
            <span>{loading ? t("common.loading") : t("common.countRecords", { count: orders.length })}</span>
          </div>
          {orderMessage && <p className="form-message admin-order-message">{orderMessage}</p>}
          <div className="table-scroll">
            <table className="admin-table orders-table">
              <thead>
                <tr>
                  <th>{t("admin.order")}</th>
                  <th>{t("admin.customer")}</th>
                  <th>{t("common.payment")}</th>
                  <th>{t("common.total")}</th>
                  <th>{t("admin.status")}</th>
                  <th>{t("admin.tracking")}</th>
                  <th>{t("admin.details")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const draft = orderUpdates[order.id] || {
                    status: order.status,
                    tracking_number: order.tracking_number || "",
                  };
                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.order_number || `#${order.id}`}</strong>
                        <small>
                          {t("admin.updated", {
                            date: order.updated_at ? formatShortDate(order.updated_at, language) : t("common.now"),
                          })}
                        </small>
                      </td>
                      <td>
                        <strong>{order.full_name}</strong>
                        <small>{order.email || order.customer?.email || order.phone}</small>
                        <small>{order.city}</small>
                      </td>
                      <td>{t(`payment.${order.payment_method}`)}</td>
                      <td>{formatPrice(order.total_price, activeCurrency)}</td>
                      <td>
                        <select
                          value={draft.status}
                          onChange={(event) =>
                            updateOrderDraft(order.id, "status", event.target.value)
                          }
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {t(`orderStatus.${status}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="tracking-input"
                          value={draft.tracking_number}
                          onChange={(event) =>
                            updateOrderDraft(order.id, "tracking_number", event.target.value)
                          }
                          placeholder={t("admin.trackingPlaceholder")}
                        />
                      </td>
                      <td>
                        <div className="table-actions order-actions">
                          <button
                            className="ghost-btn compact-btn"
                            type="button"
                            onClick={() => handleOrderUpdate(order.id)}
                            disabled={orderSaving === order.id}
                          >
                            {orderSaving === order.id ? t("common.saving") : t("common.save")}
                          </button>
                          <button
                            className="ghost-btn compact-btn"
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                          >
                            {t("admin.open")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <p className="eyebrow">{t("admin.orderDetail")}</p>
                <h2>{selectedOrder.order_number || `#${selectedOrder.id}`}</h2>
              </div>
              <button className="icon-btn" type="button" aria-label={t("admin.closeOrderDetail")} onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="customer-panel">
              <h3>{t("admin.customer")}</h3>
              <p>{selectedOrder.full_name}</p>
              <p>{selectedOrder.phone}</p>
              <p>{selectedOrder.city}, {selectedOrder.address}</p>
              {(selectedOrder.email || selectedOrder.customer?.email) && (
                <p>{selectedOrder.email || selectedOrder.customer.email}</p>
              )}
            </div>
            <div className="customer-panel">
              <h3>{t("admin.tracking")}</h3>
              <p>{t("admin.status")}: {t(`orderStatus.${selectedOrder.status}`)}</p>
              <p>
                {t("admin.trackingNumber")}:{" "}
                {selectedOrder.tracking_number ? selectedOrder.tracking_number : t("common.notAssigned")}
              </p>
              <p>
                {t("admin.lastUpdate")}:{" "}
                {selectedOrder.updated_at
                  ? formatLocalizedDate(selectedOrder.updated_at, language, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : t("common.unavailable")}
              </p>
            </div>
            <div className="checkout-items">
              {selectedOrder.items.map((item) => (
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
                  <strong>
                    {formatPrice(Number.parseFloat(item.price) * item.quantity, activeCurrency)}
                  </strong>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <span>{t("common.payment")}</span>
              <strong>{t(`payment.${selectedOrder.payment_method}`)}</strong>
            </div>
            <div className="summary-row">
              <span>{t("common.delivery")}</span>
              <strong>{formatPrice(selectedOrder.delivery_price, activeCurrency)}</strong>
            </div>
            <div className="summary-row total">
              <span>{t("common.total")}</span>
              <strong>{formatPrice(selectedOrder.total_price, activeCurrency)}</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
