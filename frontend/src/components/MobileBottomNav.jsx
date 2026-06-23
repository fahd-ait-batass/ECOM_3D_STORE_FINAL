import { Home, Search, ShoppingBag, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { itemCount, openCart } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <nav className="mobile-bottom-nav" aria-label={t("nav.mobileLabel")}>
      <NavLink to="/">
        <Home size={18} />
        {t("nav.home")}
      </NavLink>
      <NavLink to="/shop">
        <Search size={18} />
        {t("nav.shop")}
      </NavLink>
      <button type="button" onClick={openCart}>
        <span className="bottom-cart-icon">
          <ShoppingBag size={18} />
          {itemCount > 0 && <small>{itemCount}</small>}
        </span>
        {t("nav.cart")}
      </button>
      <NavLink to={isAuthenticated ? "/account" : "/login"}>
        <UserRound size={18} />
        {t("nav.account")}
      </NavLink>
    </nav>
  );
}
