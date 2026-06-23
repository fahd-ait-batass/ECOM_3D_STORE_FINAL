import { demoCategories, demoProducts } from "./demoData.js";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";
const MEDIA_BASE =
  import.meta.env.VITE_MEDIA_URL ||
  (() => {
    try {
      return new URL(API_BASE).origin;
    } catch {
      return "http://127.0.0.1:8000";
    }
  })();
export const FALLBACK_IMAGE = "/images/tech-placeholder.jpg";
export const AUTH_TOKEN_KEY = "ecom_3d_auth_token";
const MEDIA_CACHE_VERSION = "20260606";

export const fallbackStoreSettings = {
  store_name: "ECOM 3D",
  phone: "+212 600280950",
  whatsapp: "+212 600 280950",
  email: "fahdmama1@gmail.com",
  address: "Marrakech, Maroc",
  instagram: "https://www.instagram.com",
  facebook: "https://www.facebook.com",
  delivery_price: "35.00",
  free_delivery_threshold: "500.00",
  currency: "MAD",
};

export function formatStorePrice(value, currencyCode = fallbackStoreSettings.currency) {
  const currency = String(currencyCode || fallbackStoreSettings.currency).trim().toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number.parseFloat(value || 0));
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: fallbackStoreSettings.currency,
    }).format(Number.parseFloat(value || 0));
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function withMediaVersion(url) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${MEDIA_CACHE_VERSION}`;
}

function formatApiError(errorBody) {
  if (!errorBody || typeof errorBody !== "object") {
    return "";
  }

  if (errorBody.detail) {
    return Array.isArray(errorBody.detail) ? errorBody.detail.join(" ") : String(errorBody.detail);
  }

  if (errorBody.non_field_errors) {
    return Array.isArray(errorBody.non_field_errors)
      ? errorBody.non_field_errors.join(" ")
      : String(errorBody.non_field_errors);
  }

  return Object.entries(errorBody)
    .map(([field, value]) => {
      const label = field.replaceAll("_", " ");
      const message = Array.isArray(value)
        ? value.join(" ")
        : typeof value === "object" && value !== null
          ? Object.values(value).flat().join(" ")
          : String(value);
      return `${label}: ${message}`;
    })
    .filter(Boolean)
    .join(" ");
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const token = getStoredToken();
  const headers = isFormData
    ? { ...options.headers }
    : {
        "Content-Type": "application/json",
        ...options.headers,
      };

  if (token && !headers.Authorization) {
    headers.Authorization = `Token ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers,
      ...options,
    });
  } catch (networkError) {
    const error = new Error(
      `Cannot reach the backend API at ${API_BASE}. Please start Django with START_BACKEND.bat or START_ALL.bat, then try again.`,
    );
    error.cause = networkError;
    error.status = 0;
    throw error;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = formatApiError(errorBody) || "API request failed";
    const error = new Error(errorMessage);
    error.body = errorBody;
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function normalizePage(data, fallback = []) {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    };
  }

  return {
    count: data?.count ?? fallback.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    results: data?.results ?? fallback,
  };
}

export function getImageUrl(image) {
  if (!image) {
    return FALLBACK_IMAGE;
  }

  const imagePath = String(image).trim();
  if (!imagePath) {
    return FALLBACK_IMAGE;
  }

  if (/^(https?:|data:|blob:)/i.test(imagePath)) {
    return imagePath;
  }

  if (imagePath.startsWith("/images/")) {
    return imagePath;
  }

  if (imagePath.startsWith("/media/")) {
    return withMediaVersion(`${MEDIA_BASE}${imagePath}`);
  }

  if (imagePath.startsWith("media/")) {
    return withMediaVersion(`${MEDIA_BASE}/${imagePath}`);
  }

  if (imagePath.startsWith("products/") || imagePath.startsWith("categories/")) {
    return withMediaVersion(`${MEDIA_BASE}/media/${imagePath}`);
  }

  if (imagePath.startsWith("/")) {
    return imagePath;
  }

  return `${MEDIA_BASE}/media/${imagePath}`;
}

export function handleImageError(event) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) {
    return;
  }
  image.dataset.fallbackApplied = "true";
  image.src = FALLBACK_IMAGE;
}

export function getStockStatus(product) {
  if (product?.stock_status) {
    return product.stock_status;
  }

  const stock = Number.parseInt(product?.stock, 10);
  const threshold = Number.parseInt(product?.low_stock_threshold, 10);
  const safeStock = Number.isFinite(stock) ? stock : 0;
  const safeThreshold = Number.isFinite(threshold) ? threshold : 5;

  if (safeStock <= 0) {
    return "out_of_stock";
  }
  if (safeThreshold > 0 && safeStock <= safeThreshold) {
    return "low_stock";
  }
  return "in_stock";
}

export function getStockLabel(product, translate) {
  const stock = Number.parseInt(product?.stock, 10);
  const safeStock = Number.isFinite(stock) ? stock : 0;
  const status = getStockStatus(product);

  if (status === "out_of_stock") {
    return translate ? translate("stock.out_of_stock") : "Out of stock";
  }
  if (status === "low_stock") {
    return translate ? translate("stock.onlyLeft", { count: safeStock }) : `Only ${safeStock} left`;
  }
  return translate ? translate("stock.in_stock") : "In stock";
}

export function isOutOfStock(product) {
  return getStockStatus(product) === "out_of_stock";
}

export async function getCategories() {
  try {
    const categories = await request("/categories/");
    return categories.length ? categories : demoCategories;
  } catch {
    return demoCategories;
  }
}

function filterDemoProducts(params = {}) {
  let products = [...demoProducts];
  const category = params.category;
  const search = (params.search || params.q || "").toLowerCase();
  const minPrice = Number.parseFloat(params.min_price || 0);
  const maxPrice = Number.parseFloat(params.max_price || 0);

  if (category) {
    products = products.filter((product) => product.category.slug === category);
  }
  if (search) {
    products = products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.name.toLowerCase().includes(search),
    );
  }
  if (minPrice) {
    products = products.filter((product) => Number.parseFloat(product.price) >= minPrice);
  }
  if (maxPrice) {
    products = products.filter((product) => Number.parseFloat(product.price) <= maxPrice);
  }

  if (params.sort === "price_asc") {
    products.sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price));
  }
  if (params.sort === "price_desc") {
    products.sort((a, b) => Number.parseFloat(b.price) - Number.parseFloat(a.price));
  }
  if (params.sort === "rating") {
    products.sort((a, b) => Number.parseFloat(b.rating) - Number.parseFloat(a.rating));
  }

  return products;
}

export async function getProductPage(params = {}) {
  try {
    const page = await request(`/products/${buildQuery(params)}`);
    return normalizePage(page, demoProducts);
  } catch {
    const products = filterDemoProducts(params);
    return normalizePage(products, products);
  }
}

export async function getProducts(categorySlug = "") {
  const page = await getProductPage(categorySlug ? { category: categorySlug } : {});
  return page.results;
}

export async function getFeaturedProducts() {
  try {
    const products = await request("/products/featured/");
    return products.length ? products : demoProducts.filter((product) => product.is_featured);
  } catch {
    return demoProducts.filter((product) => product.is_featured);
  }
}

export async function getProduct(slug) {
  try {
    return await request(`/products/${slug}/`);
  } catch {
    return demoProducts.find((product) => product.slug === slug) || null;
  }
}

export function getProductReviews(slug) {
  return request(`/products/${slug}/reviews/`);
}

export function getProductReviewSummary(slug) {
  return request(`/products/${slug}/review-summary/`);
}

export function createProductReview(slug, payload) {
  return request(`/products/${slug}/reviews/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateReview(reviewId, payload) {
  return request(`/reviews/${reviewId}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteReview(reviewId) {
  return request(`/reviews/${reviewId}/`, {
    method: "DELETE",
  });
}

export function getWishlist() {
  return request("/wishlist/");
}

export function addWishlistItem(productId) {
  return request("/wishlist/", {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
  });
}

export function removeWishlistItem(productId) {
  return request(`/wishlist/${productId}/`, {
    method: "DELETE",
  });
}

export function createOrder(payload) {
  return request("/orders/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function validateCoupon(payload) {
  return request("/coupons/validate/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload) {
  return request("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request("/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutUser() {
  return request("/auth/logout/", {
    method: "POST",
  });
}

export function getMe() {
  return request("/auth/me/");
}

export function updateProfile(payload) {
  return request("/auth/profile/", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getMyOrders() {
  return request("/orders/my/");
}

export function getAvitoListings() {
  return request("/avito-listings/");
}

export async function getStoreSettings() {
  try {
    return await request("/store-settings/");
  } catch {
    return fallbackStoreSettings;
  }
}

export function updateStoreSettings(payload) {
  return request("/store-settings/", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getDashboardSummary() {
  return request("/admin-dashboard/summary/");
}

export async function getDashboardAnalytics(params = {}) {
  return request(`/admin-dashboard/analytics/${buildQuery(params)}`);
}

export async function getAdminProducts(params = {}) {
  const page = await request(`/admin-dashboard/products/${buildQuery(params)}`);
  return normalizePage(page);
}

export async function saveAdminProduct(product) {
  const formData = new FormData();
  Object.entries(product).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });

  return request(
    product.id
      ? `/admin-dashboard/products/${product.id}/`
      : "/admin-dashboard/products/",
    {
      method: product.id ? "PATCH" : "POST",
      body: formData,
    },
  );
}

export function deleteAdminProduct(productId) {
  return request(`/admin-dashboard/products/${productId}/`, {
    method: "DELETE",
  });
}

export async function getAdminCategories() {
  return request("/admin-dashboard/categories/");
}

export async function getAdminOrders() {
  return request("/admin-dashboard/orders/");
}

export async function getAdminCoupons() {
  return request("/admin-dashboard/coupons/");
}

export async function getAdminReviews(status = "") {
  return request(`/admin-dashboard/reviews/${buildQuery({ status })}`);
}

export async function getAdminStockAlerts() {
  return request("/admin-dashboard/stock-alerts/");
}

export function updateAdminReview(reviewId, payload) {
  return request(`/admin-dashboard/reviews/${reviewId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminReview(reviewId) {
  return request(`/admin-dashboard/reviews/${reviewId}/`, {
    method: "DELETE",
  });
}

export function saveAdminCoupon(coupon) {
  const payload = { ...coupon };
  if ("maximum_discount_amount" in payload) {
    payload.maximum_discount_amount = payload.maximum_discount_amount || null;
  }
  if ("usage_limit" in payload) {
    payload.usage_limit = payload.usage_limit || null;
  }

  return request(
    coupon.id ? `/admin-dashboard/coupons/${coupon.id}/` : "/admin-dashboard/coupons/",
    {
      method: coupon.id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteAdminCoupon(couponId) {
  return request(`/admin-dashboard/coupons/${couponId}/`, {
    method: "DELETE",
  });
}

export function updateOrderStatus(orderId, payload) {
  const body = typeof payload === "string" ? { status: payload } : payload;
  return request(`/admin-dashboard/orders/${orderId}/status/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
