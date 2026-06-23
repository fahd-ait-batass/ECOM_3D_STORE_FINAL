from django.urls import path

from .views import (
    CategoryListView,
    CategoryManageDetailView,
    CategoryManageListCreateView,
    FeaturedProductListView,
    ProductManageDetailView,
    ProductManageListCreateView,
    ProductDetailView,
    ProductListView,
    ProductReviewListCreateView,
    ProductReviewSummaryView,
    ReviewAdminDetailView,
    ReviewAdminListView,
    ReviewOwnerDetailView,
    StockAlertView,
    StoreSettingsView,
    WishlistDeleteView,
    WishlistListCreateView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path(
        "products/featured/",
        FeaturedProductListView.as_view(),
        name="featured-product-list",
    ),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path(
        "products/<slug:slug>/reviews/",
        ProductReviewListCreateView.as_view(),
        name="product-review-list-create",
    ),
    path(
        "products/<slug:slug>/review-summary/",
        ProductReviewSummaryView.as_view(),
        name="product-review-summary",
    ),
    path("reviews/<int:pk>/", ReviewOwnerDetailView.as_view(), name="review-owner-detail"),
    path("store-settings/", StoreSettingsView.as_view(), name="store-settings"),
    path("wishlist/", WishlistListCreateView.as_view(), name="wishlist-list-create"),
    path(
        "wishlist/<int:product_id>/",
        WishlistDeleteView.as_view(),
        name="wishlist-delete",
    ),
    path(
        "admin-dashboard/reviews/",
        ReviewAdminListView.as_view(),
        name="dashboard-review-list",
    ),
    path(
        "admin-dashboard/reviews/<int:pk>/",
        ReviewAdminDetailView.as_view(),
        name="dashboard-review-detail",
    ),
    path(
        "admin-dashboard/stock-alerts/",
        StockAlertView.as_view(),
        name="dashboard-stock-alerts",
    ),
    path(
        "admin-dashboard/categories/",
        CategoryManageListCreateView.as_view(),
        name="dashboard-category-list-create",
    ),
    path(
        "admin-dashboard/categories/<int:pk>/",
        CategoryManageDetailView.as_view(),
        name="dashboard-category-detail",
    ),
    path(
        "admin-dashboard/products/",
        ProductManageListCreateView.as_view(),
        name="dashboard-product-list-create",
    ),
    path(
        "admin-dashboard/products/<int:pk>/",
        ProductManageDetailView.as_view(),
        name="dashboard-product-detail",
    ),
]
