import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes } from "react-router-dom";
import { useLocation } from "react-router-dom";

import CartDrawer from "./components/CartDrawer.jsx";
import Footer from "./components/Footer.jsx";
import MobileBottomNav from "./components/MobileBottomNav.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Account from "./pages/Account.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Home from "./pages/Home.jsx";
import InfoPage from "./pages/InfoPage.jsx";
import Login from "./pages/Login.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Register from "./pages/Register.jsx";
import Shop from "./pages/Shop.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import AvitoMarket from "./pages/AvitoMarket.jsx";

function PageFrame({ children }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
      transition={{ duration: 0.34, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "fr";

  useEffect(() => {
    const direction = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.documentElement.dataset.direction = direction;
  }, [language]);

  return (
    <div className="app-shell">
      <div className="ambient-particles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <Navbar />
      <main>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageFrame>
                  <Home />
                </PageFrame>
              }
            />
            <Route
              path="/shop"
              element={
                <PageFrame>
                  <Shop />
                </PageFrame>
              }
            />
            <Route
              path="/products/:slug"
              element={
                <PageFrame>
                  <ProductDetails />
                </PageFrame>
              }
            />
            <Route
              path="/cart"
              element={
                <PageFrame>
                  <Cart />
                </PageFrame>
              }
            />
            <Route
              path="/wishlist"
              element={
                <PageFrame>
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                </PageFrame>
              }
            />
            <Route
              path="/checkout"
              element={
                <PageFrame>
                  <Checkout />
                </PageFrame>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <PageFrame>
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                </PageFrame>
              }
            />
            <Route
              path="/login"
              element={
                <PageFrame>
                  <Login />
                </PageFrame>
              }
            />
            <Route
              path="/register"
              element={
                <PageFrame>
                  <Register />
                </PageFrame>
              }
            />
            <Route
              path="/account"
              element={
                <PageFrame>
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                </PageFrame>
              }
            />
            <Route
              path="/avito-market"
              element={
                <PageFrame>
                  <AvitoMarket />
                </PageFrame>
              }
            />
            <Route
              path="/about"
              element={
                <PageFrame>
                  <InfoPage type="about" />
                </PageFrame>
              }
            />
            <Route
              path="/contact"
              element={
                <PageFrame>
                  <InfoPage type="contact" />
                </PageFrame>
              }
            />
            <Route
              path="/delivery"
              element={
                <PageFrame>
                  <InfoPage type="delivery" />
                </PageFrame>
              }
            />
            <Route
              path="/returns"
              element={
                <PageFrame>
                  <InfoPage type="returns" />
                </PageFrame>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      <CartDrawer />
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
