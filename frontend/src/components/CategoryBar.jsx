import {
  ArrowRight,
  Cable,
  Gamepad2,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { getImageUrl, handleImageError } from "../api/client.js";

const categoryIcons = {
  smartphones: Smartphone,
  "laptops-tablets": Laptop,
  "headphones-audio": Headphones,
  "gaming-gear": Gamepad2,
  "smart-watches-wearables": Watch,
  wearables: Watch,
  "tech-accessories": Cable,
};

const categoryLabels = {
  smartphones: "Smartphones",
  "laptops-tablets": "Laptops",
  "headphones-audio": "Audio",
  "gaming-gear": "Gaming",
  "smart-watches-wearables": "Wearables",
  wearables: "Wearables",
  "tech-accessories": "Accessories",
};

const categoryProductImages = {
  smartphones: "products/nova-edge-smartphone.jpg",
  "laptops-tablets": "products/orion-pro-laptop.jpg",
  "headphones-audio": "products/phantom-gaming-headset.jpg",
  "gaming-gear": "products/nebula-game-controller.jpg",
  "smart-watches-wearables": "products/aurum-active-smartwatch.jpg",
  wearables: "products/aurum-active-smartwatch.jpg",
  "tech-accessories": "products/magdock-wireless-charger.jpg",
};

const categoryOrder = [
  "smartphones",
  "laptops-tablets",
  "headphones-audio",
  "wearables",
  "smart-watches-wearables",
  "gaming-gear",
  "tech-accessories",
];

export default function CategoryBar({ categories, selectedCategory, onSelect }) {
  const { t } = useTranslation();
  const orderedCategories = [...categories].sort(
    (first, second) =>
      categoryOrder.indexOf(first.slug) - categoryOrder.indexOf(second.slug)
  );

  return (
    <section className="category-section container clean-category-section" id="categories" aria-label={t("categories.aria")}>
      <div className="category-card-row">
        {orderedCategories.map((category) => {
          const Icon = categoryIcons[category.slug] || Cable;
          const isActive = selectedCategory === category.slug;
          return (
            <button
              className={`category-card ${isActive ? "active" : ""}`}
              key={category.slug}
              type="button"
              onClick={() => onSelect(isActive ? "" : category.slug)}
            >
              <span className="category-visual">
                {categoryProductImages[category.slug] || category.image ? (
                  <img
                    src={getImageUrl(categoryProductImages[category.slug] || category.image)}
                    alt=""
                    loading="lazy"
                    onError={handleImageError}
                  />
                ) : (
                  <Icon size={34} />
                )}
              </span>
              <span>
                <strong>{categoryLabels[category.slug] || category.name}</strong>
                <small>
                  View all
                  <ArrowRight size={15} aria-hidden="true" />
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
