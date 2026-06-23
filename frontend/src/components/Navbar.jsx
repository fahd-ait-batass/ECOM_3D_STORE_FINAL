import {
  ChevronDown,
  Gift,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Menu,
  PackageSearch,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";

import LanguageSwitcher from "./LanguageSwitcher.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

export default function Navbar() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const { isAdmin, isAuthenticated, logout, user } = useAuth();
  const { count: wishlistCount } = useWishlist();

  const closeMenu = () => setIsOpen(false);
  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  return (
    <header className="navbar-wrap clean-navbar-wrap">
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>
            <Gift size={16} />
            Free express shipping on orders over $50
          </span>
          <div>
            <a href="/account">
              <PackageSearch size={15} />
              Track Order
            </a>
            <a href="/contact">
              <MapPin size={15} />
              Store Locator
            </a>
            <a href="/contact">
              <HelpCircle size={15} />
              Help Center
            </a>
            <div className="top-language">
  <LanguageSwitcher compact />
</div>
          </div>
        </div>
      </div>

      <nav className="navbar container">
        <Link className="brand" to="/" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true">
            <span className="cube-mark" />
          </span>
          <span>
            ECOM <strong>3D</strong>
          </span>
        </Link>

        <div className={`nav-links ${isOpen ? "is-open" : ""}`}>
          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/shop" onClick={closeMenu}>
            Shop
          </NavLink>
          <a href="/#categories" onClick={closeMenu}>
            Categories
          </a>
          <a href="/#featured" onClick={closeMenu}>
            Deals
          </a>
          <a href="/shop" onClick={closeMenu}>
            Brands
          </a>
          <NavLink to="/avito-market" onClick={closeMenu}>
            {t("nav.avitoMarket")}
          </NavLink>
          <NavLink to="/about" onClick={closeMenu}>
            About Us
          </NavLink>
          <NavLink to="/contact" onClick={closeMenu}>
            Contact
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin-dashboard" onClick={closeMenu}>
              Admin
            </NavLink>
          )}
          <div className="mobile-menu-auth">
            {isAuthenticated ? (
              <>
                <NavLink to="/account" onClick={closeMenu}>
                  {t("nav.account")}
                </NavLink>
                <NavLink to="/wishlist" onClick={closeMenu}>
                  {t("nav.wishlist")}
                </NavLink>
                <button type="button" onClick={handleLogout}>
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={closeMenu}>
                  {t("nav.login")}
                </NavLink>
                <NavLink to="/register" onClick={closeMenu}>
                  {t("nav.register")}
                </NavLink>
              </>
            )}
          </div>
          <LanguageSwitcher compact />
        </div>

        <label className="nav-search" aria-label={t("nav.search")}>
          <input type="search" placeholder="Search for products..." />
          <Search size={22} />
        </label>

        <div className="nav-actions">
          <NavLink className="account-pill" to="/account">
            <UserRound size={21} />
            <span>{isAuthenticated ? user?.first_name || user?.username : "Account"}</span>
          </NavLink>

          <NavLink className="cart-link wishlist-link" to="/wishlist" aria-label={t("nav.openWishlist")}>
            <Heart size={22} />
            <span className={wishlistCount > 0 ? "" : "is-empty"}>{wishlistCount}</span>
            <small>Wishlist</small>
          </NavLink>

          <button className="cart-link" type="button" aria-label={t("nav.openCart")} onClick={openCart}>
            <ShoppingCart size={22} />
            <span className={itemCount > 0 ? "" : "is-empty"}>{itemCount}</span>
            <small>Cart</small>
          </button>

          {isAuthenticated && (
            <button className="icon-btn logout-clean hide-mobile" type="button" aria-label={t("nav.logout")} onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          )}

          <LanguageSwitcher />

          <button
            className="icon-btn nav-toggle"
            type="button"
            aria-label={t("nav.toggleMenu")}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
