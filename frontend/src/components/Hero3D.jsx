import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

const trustItems = [
  {
    icon: Truck,
    title: "Free Shipping",
    text: "On orders over $50",
  },
  {
    icon: RotateCcw,
    title: "30-Day Returns",
    text: "Hassle free returns",
  },
  {
    icon: ShieldCheck,
    title: "2-Year Warranty",
    text: "Quality guaranteed",
  },
  {
    icon: Lock,
    title: "Secure Payment",
    text: "100% secure checkout",
  },
];

export default function Hero3D() {
  return (
    <section className="hero-section clean-hero-section">
      <div className="container">
        <motion.div
          className="hero-card clean-hero-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="hero-copy clean-hero-copy">
            <p className="eyebrow clean-eyebrow">NEW COLLECTION 2025</p>
            <h1>
              Premium
              <br />
              Tech Essentials
            </h1>
            <p className="hero-lede">
              Elevate your everyday with cutting-edge devices built for
              performance and style.
            </p>

            <div className="hero-actions">
              <Link className="primary-btn" to="/shop">
                Shop Collection
                <ArrowRight size={18} />
              </Link>
              <Link className="ghost-btn" to="/shop">
                Explore Deals
              </Link>
            </div>

            <div className="hero-trust-grid" aria-label="Store benefits">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article className="hero-trust-item" key={item.title}>
                    <span>
                      <Icon size={22} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.text}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <motion.div
            className="hero-stage clean-hero-stage"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.68, ease: "easeOut" }}
          >
            <div className="reference-hero-stage">
              <img
                src="/images/home-hero-stage-reference.png"
                alt=""
                loading="eager"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
