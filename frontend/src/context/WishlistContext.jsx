import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  addWishlistItem as addWishlistItemRequest,
  getWishlist,
  removeWishlistItem as removeWishlistItemRequest,
} from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const data = await getWishlist();
      setItems(data);
      return data;
    } catch (requestError) {
      setItems([]);
      setError(requestError.message || t("wishlist.error"));
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    loadWishlist();
  }, [authLoading, loadWishlist, user?.id]);

  const addToWishlist = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        const authError = new Error(t("wishlist.loginRequired"));
        authError.status = 401;
        throw authError;
      }

      const wishlistItem = await addWishlistItemRequest(productId);
      setItems((currentItems) => {
        if (currentItems.some((item) => item.product?.id === wishlistItem.product?.id)) {
          return currentItems;
        }
        return [wishlistItem, ...currentItems];
      });
      return wishlistItem;
    },
    [isAuthenticated, t],
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        const authError = new Error(t("wishlist.error"));
        authError.status = 401;
        throw authError;
      }

      await removeWishlistItemRequest(productId);
      setItems((currentItems) =>
        currentItems.filter((item) => item.product?.id !== Number(productId)),
      );
    },
    [isAuthenticated, t],
  );

  const value = useMemo(() => {
    const productIds = new Set(items.map((item) => item.product?.id).filter(Boolean));

    return {
      items,
      products: items.map((item) => item.product).filter(Boolean),
      count: items.length,
      loading,
      error,
      loadWishlist,
      addToWishlist,
      removeFromWishlist,
      isWishlisted: (productId) => productIds.has(Number(productId)),
    };
  }, [addToWishlist, error, items, loadWishlist, loading, removeFromWishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
}
