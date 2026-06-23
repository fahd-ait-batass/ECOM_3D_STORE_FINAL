import { ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import Seo from "../components/Seo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  city: "",
  address: "",
  password: "",
};

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await register({
        ...form,
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        password_confirm: form.password,
      });
      setStatus("success");
      navigate("/", { replace: true });
    } catch (error) {
      setStatus("error");
      setMessage(error.message || t("auth.createFailed"));
    }
  };

  return (
    <section className="page-section auth-page container">
      <Seo
        title={t("seo.registerTitle")}
        description={t("seo.registerDescription")}
      />
      <div className="auth-shell register-shell">
        <div className="auth-copy">
          <p className="eyebrow">
            <ShieldCheck size={15} />
            {t("auth.customerProfile")}
          </p>
          <h1>{t("auth.registerHero")}</h1>
          <p>{t("auth.registerText")}</p>
        </div>

        <form className="auth-form register-form" onSubmit={handleSubmit}>
          <div className="auth-form-icon">
            <UserPlus size={24} />
          </div>
          <h2>{t("auth.createAccount")}</h2>
          <div className="form-pair">
            <label>
              {t("auth.username")}
              <input name="username" value={form.username} onChange={handleChange} required />
            </label>
            <label>
              {t("auth.email")}
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <div className="form-pair">
            <label>
              {t("auth.firstName")}
              <input name="first_name" value={form.first_name} onChange={handleChange} />
            </label>
            <label>
              {t("auth.lastName")}
              <input name="last_name" value={form.last_name} onChange={handleChange} />
            </label>
          </div>
          <div className="form-pair">
            <label>
              {t("auth.phone")}
              <input name="phone" value={form.phone} onChange={handleChange} />
            </label>
            <label>
              {t("auth.city")}
              <input name="city" value={form.city} onChange={handleChange} />
            </label>
          </div>
          <label>
            {t("auth.address")}
            <textarea name="address" value={form.address} onChange={handleChange} />
          </label>
          <div className="form-pair">
            <label>
              {t("auth.password")}
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          {status === "error" && <p className="form-error">{message}</p>}
          <button className="primary-btn full-btn" type="submit" disabled={status === "loading"}>
            <UserPlus size={18} />
            {status === "loading" ? t("auth.creating") : t("auth.createAccount")}
          </button>
          <p className="auth-switch">
            {t("auth.registered")} <Link to="/login">{t("auth.signIn")}</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
