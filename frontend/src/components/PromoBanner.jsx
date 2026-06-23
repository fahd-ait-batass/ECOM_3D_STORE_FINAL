import { ArrowRight, Clock3, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function PromoBanner() {
  const { t } = useTranslation();
  const countdown = [
    ["02", t("promo.days")],
    ["14", t("promo.hours")],
    ["39", t("promo.minutes")],
  ];

  return (
    <section className="promo-section container" id="drop">
      <div className="promo-band">
        <div>
          <p className="eyebrow">
            <Zap size={15} />
            {t("promo.eyebrow")}
          </p>
          <h2>{t("promo.title")}</h2>
          <p>{t("promo.text")}</p>
        </div>

        <div className="countdown" aria-label={t("promo.countdown")}>
          {countdown.map(([value, label]) => (
            <span key={label}>
              <strong>{value}</strong>
              {label}
            </span>
          ))}
        </div>

        <Link className="primary-btn promo-btn" to="/#featured">
          <Clock3 size={18} />
          {t("promo.reserve")}
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
