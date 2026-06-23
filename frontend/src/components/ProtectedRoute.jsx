import { LockKeyhole } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ adminOnly = false, children }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        },
      });
    }
  }, [
    loading,
    isAuthenticated,
    navigate,
    location.pathname,
    location.search,
    location.hash,
  ]);

  if (loading || !isAuthenticated) {
    return (
      <section className="page-section container">
        <div className="auth-loading">
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line short" />
        </div>
      </section>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <section className="page-section container">
        <div className="empty-state premium-empty">
          <LockKeyhole size={42} />
          <h1>{t("protected.accessDenied")}</h1>
          <p>{t("protected.staffOnly")}</p>
        </div>
      </section>
    );
  }

  return children;
}
