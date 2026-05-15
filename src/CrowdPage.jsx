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

export default function CrowdPage({ stores, lang, t }) {
  const todayWeekday = new Date().getDay();

  const [storeId, setStoreId] = useState("");
  const [weekday, setWeekday] = useState(todayWeekday);
  const [chartItems, setChartItems] = useState([]);
  const [listItems, setListItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stores?.length && !storeId) {
      setStoreId(stores[0].store_id);
    }
  }, [stores, storeId]);

  async function loadData() {
    if (!storeId) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/crowd/by-store?store_id=${storeId}&weekday=${weekday}`
      );

      if (!res.ok) {
        setChartItems([]);
        setListItems([]);
        return;
      }

      const data = await res.json();
      const rawItems = data.items || [];

      const byTime = [...rawItems].sort((a, b) =>
        a.ticket_bin.localeCompare(b.ticket_bin)
      );

      const byWait = [...rawItems].sort(
        (a, b) => a.median_wait - b.median_wait
      );

      setChartItems(byTime);
      setListItems(byWait);
    } catch (err) {
      console.error(err);
      setChartItems([]);
      setListItems([]);
    } finally {
      setLoading(false);
    }
  }

  const maxWait = Math.max(...chartItems.map((x) => x.median_wait), 1);

  return (
    <div className="crowd-page">
      <section className="crowd-hero">
        <h1>{t.crowdTitle}</h1>
        <p>{t.crowdDescription}</p>
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

          <select
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
          >
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

      {loading && <div className="crowd-loading">{t.loading}</div>}

      {!loading && chartItems.length > 0 && (
        <section className="crowd-chart">
          <h2>{t.crowdChartTitle}</h2>

          <div className="crowd-bars">
            {chartItems.map((item) => {
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

      {!loading && listItems.length > 0 && (
        <section className="crowd-list">
          {listItems.map((item) => (
            <article key={item.ticket_bin} className="crowd-card">
              <div className="crowd-time">{item.ticket_bin}</div>

              <div className="crowd-main">
                <div className="crowd-wait">
                  <span className="crowd-wait-prefix">{t.usualWaitPrefix}</span>
                  <span className="crowd-wait-value">
                    {item.median_wait} {t.min}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}