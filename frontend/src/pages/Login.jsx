import { LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Seo from "../components/Seo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const redirectTo = useMemo(() => {
    const from = location.state?.from;
    if (!from?.pathname || ["/login", "/register"].includes(from.pathname)) {
      return "/";
    }
    return `${from.pathname}${from.search || ""}${from.hash || ""}`;
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await login({
        username: form.username.trim(),
        password: form.password,
      });
      setStatus("success");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setStatus("error");
      setMessage(error.message || t("auth.loginFailed"));
    }
  };

  return (
    <section className="page-section auth-page container">
      <Seo
        title={t("seo.loginTitle")}
        description={t("seo.loginDescription")}
      />
      <div className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">
            <ShieldCheck size={15} />
            {t("auth.secureAccess")}
          </p>
          <h1>{t("auth.loginHero")}</h1>
          <p>{t("auth.loginText")}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-icon">
            <LockKeyhole size={24} />
          </div>
          <h2>{t("auth.login")}</h2>
          <label>
            {t("auth.usernameEmail")}
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </label>
          <label>
            {t("auth.password")}
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>
          {status === "error" && <p className="form-error">{message}</p>}
          <button className="primary-btn full-btn" type="submit" disabled={status === "loading"}>
            <LogIn size={18} />
            {status === "loading" ? t("auth.signingIn") : t("auth.signIn")}
          </button>
          <p className="auth-switch">
            {t("auth.newStore")} <Link to="/register">{t("auth.createAccountLink")}</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
