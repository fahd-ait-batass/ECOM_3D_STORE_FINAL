from django.urls import path

from .views import (
    CouponManageDetailView,
    CouponManageListCreateView,
    CouponValidateView,
    DashboardAnalyticsView,
    DashboardSummaryView,
    MyOrderListView,
    OrderListCreateView,
    OrderStatusUpdateView,
)

urlpatterns = [
    path("coupons/validate/", CouponValidateView.as_view(), name="coupon-validate"),
    path("orders/", OrderListCreateView.as_view(), name="order-list-create"),
    path("orders/my/", MyOrderListView.as_view(), name="my-order-list"),
    path(
        "orders/<int:pk>/status/",
        OrderStatusUpdateView.as_view(),
        name="order-status-update",
    ),
    path(
        "admin-dashboard/orders/",
        OrderListCreateView.as_view(),
        name="dashboard-order-list",
    ),
    path(
        "admin-dashboard/coupons/",
        CouponManageListCreateView.as_view(),
        name="dashboard-coupon-list",
    ),
    path(
        "admin-dashboard/coupons/<int:pk>/",
        CouponManageDetailView.as_view(),
        name="dashboard-coupon-detail",
    ),
    path(
        "admin-dashboard/orders/<int:pk>/status/",
        OrderStatusUpdateView.as_view(),
        name="dashboard-order-status-update",
    ),
    path(
        "admin-dashboard/summary/",
        DashboardSummaryView.as_view(),
        name="dashboard-summary",
    ),
    path(
        "admin-dashboard/analytics/",
        DashboardAnalyticsView.as_view(),
        name="dashboard-analytics",
    ),
]
