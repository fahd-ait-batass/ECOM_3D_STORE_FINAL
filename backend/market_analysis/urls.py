from django.urls import path

from .views import AvitoListingListView

urlpatterns = [
    path("avito-listings/", AvitoListingListView.as_view(), name="avito-listing-list"),
]
