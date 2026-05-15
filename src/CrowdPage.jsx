import { useEffect, useState } from "react";

const API_BASE = "/api";

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function getCrowdStoreName(store, lang) {
  if (["en", "vi", "th", "id", "ms"].includes(lang)) return store.e_name;
  if (lang === "ja") return store.j_name;
  if (lang === "ko") return store.k_name;
  return store.c_name;
}

export default function CrowdPage({
  stores,
  lang,
  t,
}) {
  const todayWeekday = new Date().getDay();

  const [storeId, setStoreId] = useState("");
  const [weekday, setWeekday] = useState(todayWeekday);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/crowd/by-store?store_id=${storeId}&weekday=${weekday}`
      );

      if (!res.ok) {
        setItems([]);
        return;
      }

      const data = await res.json();

      const sorted = [...(data.items || [])].sort(
        (a, b) => a.median_wait - b.median_wait
      );

      setItems(sorted);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="crowd-page">
      <section className="crowd-hero">
        <h1>{t.crowdTitle}</h1>

        <p>
          {t.crowdDescription}
        </p>
      </section>

      <section className="crowd-filters">
  <div className="crowd-filter-group">
    <label>{t.store}</label>
    <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
      {stores.map((store) => (
        <option key={store.store_id} value={store.store_id}>
          {getCrowdStoreName(store, lang)}
        </option>
      ))}
    </select>
  </div>

  <div className="crowd-filter-group">
    <label>{t.weekday}</label>
    <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
      {WEEKDAY_OPTIONS.map((item) => (
        <option key={item.value} value={item.value}>
          {t.weekdays[item.value]}
        </option>
      ))}
    </select>
  </div>

  <button
    type="button"
    className="search-button crowd-search-button"
    onClick={loadData}
    disabled={!storeId || loading}
  >
    {loading ? t.querying : t.query}
  </button>
</section>

      {loading ? (
        <div className="crowd-loading">
          {t.loading}
        </div>
      ) : (
        <section className="crowd-list">
		  {items.length > 0 && (
  		  <section className="crowd-chart">
  		    <h2>{t.crowdChartTitle}</h2>

  		    <div className="crowd-bars">
  		      {items.map((item) => {
  		        const maxWait = Math.max(...items.map((x) => x.median_wait), 1);
  		        const height = Math.max((item.median_wait / maxWait) * 100, 4);

  		        return (
   		         <div key={item.ticket_bin} className="crowd-bar-item">
     		         <div className="crowd-bar-value">{item.median_wait}</div>
    		          <div className="crowd-bar-track">
    		            <div
    		              className="crowd-bar-fill"
    		              style={{ height: `${height}%` }}
   		             />
  		            </div>
 		             <div className="crowd-bar-label">{item.ticket_bin}</div>
 		           </div>
 		         );
 		       })}
  		    </div>
 		   </section>
		  )}
          {items.map((item) => (
            <article
              key={item.ticket_bin}
              className="crowd-card"
            >
              <div className="crowd-time">
                {item.ticket_bin}
              </div>

              <div className="crowd-main">
                <div className="crowd-wait">
                  {item.median_wait} min
                </div>

              </div>

            </article>
          ))}
        </section>
      )}
    </div>
  );
}