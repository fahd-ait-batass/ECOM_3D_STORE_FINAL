import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const CartContext = createContext(null);
const CART_KEY = "ecom_3d_store_cart";

function getStoredCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function money(value) {
  return Number.parseFloat(value || 0);
}

function getStockLimit(product) {
  const parsed = Number.parseInt(product?.stock, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 99;
}

export function CartProvider({ children }) {
  const { t } = useTranslation();
  const [items, setItems] = useState(getStoredCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    setIsCartOpen(true);
    const stockLimit = getStockLimit(product);

    if (stockLimit <= 0) {
      setCartMessage(t("checkout.outOfStock", { name: product.name }));
      return;
    }

    setLastAdded(product);
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === product.id);
      const nextQuantity = Math.min((existing?.quantity || 0) + quantity, stockLimit);
      if (existing) {
        if (nextQuantity < existing.quantity + quantity) {
          setCartMessage(t("checkout.onlyStockLeft", { name: product.name, count: stockLimit }));
        } else {
          setCartMessage("");
        }
        return currentItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                stock: product.stock,
                stock_status: product.stock_status,
                low_stock_threshold: product.low_stock_threshold,
                quantity: nextQuantity,
              }
            : item,
        );
      }

      const safeQuantity = Math.min(quantity, stockLimit);
      if (safeQuantity < quantity) {
        setCartMessage(t("checkout.onlyStockLeft", { name: product.name, count: stockLimit }));
      } else {
        setCartMessage("");
      }

      return [
        ...currentItems,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          price: product.price,
          old_price: product.old_price,
          stock: product.stock,
          stock_status: product.stock_status,
          low_stock_threshold: product.low_stock_threshold,
          average_rating: product.average_rating,
          review_count: product.review_count,
          rating: product.rating,
          quantity: safeQuantity,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== productId) {
          return item;
        }
        const stockLimit = getStockLimit(item);
        const nextQuantity = Math.max(1, Math.min(quantity, Math.max(1, stockLimit)));
        if (quantity > stockLimit) {
          setCartMessage(t("checkout.onlyStockLeft", { name: item.name, count: stockLimit }));
        } else {
          setCartMessage("");
        }
        return { ...item, quantity: nextQuantity };
      }),
    );
  };

  const clearCart = () => setItems([]);
  const clearCartMessage = () => setCartMessage("");
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + money(item.price) * item.quantity,
      0,
    );

    return {
      items,
      itemCount,
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartMessage,
      clearCartMessage,
      isCartOpen,
      lastAdded,
      openCart,
      closeCart,
    };
  }, [cartMessage, isCartOpen, items, lastAdded, t]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
