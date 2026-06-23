import { BadgeCheck, Headphones, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getCategories, getFeaturedProducts, getProducts } from "../api/client.js";
import CategoryBar from "../components/CategoryBar.jsx";
import FeaturedProducts from "../components/FeaturedProducts.jsx";
import Hero3D from "../components/Hero3D.jsx";
import Seo from "../components/Seo.jsx";

export default function Home() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHome() {
      setLoading(true);
      const [categoryData, productData] = await Promise.all([
        getCategories(),
        selectedCategory ? getProducts(selectedCategory) : getFeaturedProducts(),
      ]);

      if (isMounted) {
        setCategories(categoryData);
        setProducts(productData);
        setLoading(false);
      }
    }

    loadHome();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const serviceItems = [
    {
      icon: Truck,
      title: "Worldwide Delivery",
      text: "Fast shipping to your door",
    },
    {
      icon: Headphones,
      title: "24/7 Customer Support",
      text: "We are here to help",
    },
    {
      icon: ShieldCheck,
      title: "Secure & Safe Payments",
      text: "Multiple secure options",
    },
    {
      icon: BadgeCheck,
      title: "Trusted by Thousands",
      text: "Join our happy customers",
    },
  ];

  return (
    <>
      <Seo
        title={t("seo.homeTitle")}
        description={t("seo.homeDescription")}
      />
      <Hero3D />
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <FeaturedProducts
        loading={loading}
        products={products}
        selectedCategory={selectedCategory}
      />
      <section className="service-section container" aria-label={t("home.servicesLabel")}>
        {serviceItems.map((item) => {
          const Icon = item.icon;
          return (
            <article className="service-item" key={item.title}>
              <Icon size={24} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          );
        })}
      </section>
    </>
  );
}
