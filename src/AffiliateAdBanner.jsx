import { useEffect, useState } from "react";

const API_BASE = "/api";

export default function AffiliateAdBanner({ lang = "zh" }) {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    async function loadAds() {
      try {
        const res = await fetch(`${API_BASE}/ads?placement=home&lang=${lang}`);
        if (!res.ok) return;

        const data = await res.json();
        setAds(data.items || []);
      } catch (err) {
        console.error("load ads failed", err);
      }
    }

    loadAds();
  }, [lang]);

  if (!ads.length) return null;

  return (
    <section className="affiliate-ad-banner">
      <div className="affiliate-ad-label">廣告</div>

      <div className="affiliate-ad-scroll">
        {ads.map((ad) => (
          <a
            key={ad.id}
            className="affiliate-ad-card"
            href={`/ad/${ad.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={`${API_BASE}${ad.image_url}`} alt={ad.title} />

            <div className="affiliate-ad-title">{ad.title}</div>

            {ad.subtitle && (
              <div className="affiliate-ad-subtitle">{ad.subtitle}</div>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}