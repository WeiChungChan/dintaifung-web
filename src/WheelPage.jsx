import { useMemo, useRef, useState } from "react";
import menuItems from "./menu_items.json";
import "./App.css";

const AUTO_STOP_MS = 15000;
const ITEM_COLORS = ["#fff3e8", "#ffffff", "#ffe7d8", "#fffaf4"];

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

function pickRandomIndex(length) {
  return Math.floor(Math.random() * length);
}

export default function WheelPage() {
  const activeItems = useMemo(
    () => menuItems.filter((item) => item.is_active && !item.is_meme),
    []
  );

  const categories = useMemo(() => {
    const seen = new Map();

    activeItems.forEach((item) => {
      if (!seen.has(item.category_id)) {
        seen.set(item.category_id, item.category_name_zh);
      }
    });

    return Array.from(seen.entries()).map(([category_id, category_name_zh]) => ({
      category_id,
      category_name_zh,
    }));
  }, [activeItems]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const autoStopTimeoutRef = useRef(null);

  const wheelItems = useMemo(() => {
    if (selectedCategory === "all") return activeItems;

    return activeItems.filter(
      (item) => String(item.category_id) === String(selectedCategory)
    );
  }, [activeItems, selectedCategory]);

  const sliceDeg = wheelItems.length > 0 ? 360 / wheelItems.length : 360;

  const wheelGradient = useMemo(() => {
    if (wheelItems.length === 0) {
      return "conic-gradient(#fff3e8 0deg 360deg)";
    }

    return `conic-gradient(${wheelItems
      .map((_, index) => {
        const start = index * sliceDeg;
        const end = (index + 1) * sliceDeg;
        const color = ITEM_COLORS[index % ITEM_COLORS.length];
        return `${color} ${start}deg ${end}deg`;
      })
      .join(", ")})`;
  }, [wheelItems, sliceDeg]);

  function clearAutoStopTimer() {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  }

  function startWheel() {
    if (wheelItems.length === 0 || spinning) return;

    clearAutoStopTimer();
    setSelectedItem(null);
	setShowResult(false);
    setSpinning(true);

    autoStopTimeoutRef.current = setTimeout(() => {
      stopWheel();
    }, AUTO_STOP_MS);
  }

  function stopWheel() {
  if (wheelItems.length === 0) return;

  clearAutoStopTimer();

  const finalIndex = pickRandomIndex(wheelItems.length);
  const currentNormalizedRotation = normalizeDeg(rotation);

  const targetSliceCenter = finalIndex * sliceDeg + sliceDeg / 2;
  const pointerDeg = 0;
  const targetRotationNormalized = normalizeDeg(pointerDeg - targetSliceCenter);

  const delta = normalizeDeg(targetRotationNormalized - currentNormalizedRotation);
  const extraTurns = 5 * 360;
  const finalRotation = rotation + extraTurns + delta;

  setSelectedItem(wheelItems[finalIndex] || null);
  setShowResult(true);   // 🔥 直接顯示
  setSpinning(false);
  setRotation(finalRotation);
}

  function handleCategoryChange(categoryId) {
    if (spinning) return;

    clearAutoStopTimer();
    setSelectedCategory(categoryId);
    setSelectedItem(null);
	setShowResult(false);
    setRotation(0);
  }

  return (
    <>
      <header className="hero">
        <p className="hero-kicker">鼎泰豐點菜轉盤</p>
        <h1>不知道要點什麼？讓轉盤幫你決定</h1>
        <p className="hero-subtitle">
          選擇全部或指定分類，按下開始後讓轉盤隨機挑一道菜。15 秒內沒有停止，系統會自動幫你停下來。
        </p>
      </header>

      <section className="panel wheel-panel">
        <div className="vote-section-title">
          <h2>選擇分類</h2>
          <p>目前轉盤共有 {wheelItems.length} 道菜</p>
        </div>

        <div className="category-tabs">
          <button
            type="button"
            className={selectedCategory === "all" ? "active" : ""}
            onClick={() => handleCategoryChange("all")}
            disabled={spinning}
          >
            全部
          </button>

          {categories.map((cat) => (
            <button
              type="button"
              key={cat.category_id}
              className={
                String(selectedCategory) === String(cat.category_id)
                  ? "active"
                  : ""
              }
              onClick={() => handleCategoryChange(cat.category_id)}
              disabled={spinning}
            >
              {cat.category_name_zh}
            </button>
          ))}
        </div>
      </section>

      <section className="panel wheel-panel">
        <div className="wheel-stage">
          <div className="wheel-pointer">▼</div>

          <div
            className={`wheel-disc-real ${spinning ? "is-spinning" : ""}`}
            style={{
              background: wheelGradient,
              transform: `rotate(${rotation}deg)`,
            }}
          >

            {wheelItems.length <= 24 &&
			  wheelItems.map((item, index) => {
              const angle = index * sliceDeg + sliceDeg / 2;

              return (
                <div
                  className="wheel-item-label"
                  key={item.food_id}
                  style={{
                    transform: `rotate(${angle}deg) translate(0, -122px) rotate(${-angle}deg)`,
                  }}
                >
                  {item.name_zh}
                </div>
              );
            })}
          </div>
		  
		  <div className="wheel-center fixed">
		    <span>今天吃什麼</span>
		  </div>

          <button
            type="button"
            className={`search-button wheel-button ${spinning ? "stop" : ""}`}
            onClick={spinning ? stopWheel : startWheel}
            disabled={wheelItems.length === 0}
          >
            {spinning ? "停止" : "開始"}
          </button>

          {selectedItem && !spinning && showResult && (
            <div className="wheel-result">
              <div className="wheel-result-label">今天就點這道</div>
              <div className="wheel-result-name">{selectedItem.name_zh}</div>
              <div className="wheel-result-category">
                {selectedItem.category_name_zh}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}