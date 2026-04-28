import { useEffect, useMemo, useState } from "react";
import menuItems from "./menu_items.json";
import "./App.css";
import { trackEvent } from "./ga";

const API_BASE = "http://34.45.75.196:8000";
const VOTE_TOPIC = "top3_dishes";
const VOTED_KEY = `voted_${VOTE_TOPIC}`;
const MY_VOTE_KEY = `my_vote_${VOTE_TOPIC}`;
const CLIENT_ID_KEY = "dtf_vote_client_id";

const EMPTY_CHOICES = { 1: "", 2: "", 3: "" };

function generateClientId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = generateClientId();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function loadSavedChoices() {
  const saved = localStorage.getItem(MY_VOTE_KEY);
  if (!saved) return EMPTY_CHOICES;

  try {
    const parsed = JSON.parse(saved);
    return {
      1: parsed["1"] || parsed[1] || "",
      2: parsed["2"] || parsed[2] || "",
      3: parsed["3"] || parsed[3] || "",
    };
  } catch {
    return EMPTY_CHOICES;
  }
}

function scoreLabel(rank) {
  if (rank === 1) return "第一名｜3 分";
  if (rank === 2) return "第二名｜2 分";
  return "第三名｜1 分";
}

function getRankLabel(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function nextEmptyRank(choices) {
  if (!choices[1]) return 1;
  if (!choices[2]) return 2;
  if (!choices[3]) return 3;
  return 1;
}

export default function VotePage() {
  const foodMap = useMemo(
    () => Object.fromEntries(menuItems.map((item) => [item.food_id, item])),
    []
  );

  const activeItems = useMemo(
    () => menuItems.filter((item) => item.is_active),
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
  const [choices, setChoices] = useState(() => loadSavedChoices());
  const [activeRank, setActiveRank] = useState(() =>
    nextEmptyRank(loadSavedChoices())
  );

  const [results, setResults] = useState([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [loadingResults, setLoadingResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [rankingExpanded, setRankingExpanded] = useState(false);
  const [hasVoted, setHasVoted] = useState(
    localStorage.getItem(VOTED_KEY) === "true"
  );

  const selectedFoodIds = Object.values(choices).filter(Boolean);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return activeItems;
    return activeItems.filter(
      (item) => String(item.category_id) === String(selectedCategory)
    );
  }, [activeItems, selectedCategory]);

  const officialResults = useMemo(() => {
    return results
      .filter((row) => !foodMap[row.food_id]?.is_meme)
      .map((row) => ({ ...row, food: foodMap[row.food_id] }))
      .filter((row) => row.food);
  }, [results, foodMap]);

  const memeResults = useMemo(() => {
    return results
      .filter((row) => foodMap[row.food_id]?.is_meme)
      .map((row) => ({ ...row, food: foodMap[row.food_id] }))
      .filter((row) => row.food);
  }, [results, foodMap]);

  const displayResults = useMemo(() => {
    const officialRows = officialResults.map((row, index) => ({
      ...row,
      display_type: "official",
      official_rank: index + 1,
    }));

    const memeRows = memeResults.map((row) => ({
      ...row,
      display_type: "meme",
      official_rank: null,
    }));

    return [...officialRows, ...memeRows].sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if (a.display_type === "meme" && b.display_type !== "meme") return -1;
      if (a.display_type !== "meme" && b.display_type === "meme") return 1;

      if ((b.vote_count || 0) !== (a.vote_count || 0)) {
        return (b.vote_count || 0) - (a.vote_count || 0);
      }

      if (a.display_type === "official" && b.display_type === "official") {
        return a.official_rank - b.official_rank;
      }

      return 0;
    });
  }, [officialResults, memeResults]);

  const visibleResults = useMemo(() => {
    if (rankingExpanded) return displayResults;

    const top3Official = displayResults.filter(
      (row) => row.display_type === "official" && row.official_rank <= 3
    );

    const gingerInTop3Range = displayResults.find(
      (row, index) => row.display_type === "meme" && index <= 2
    );

    if (gingerInTop3Range) {
      return [...top3Official, gingerInTop3Range].sort((a, b) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score;
        if (a.display_type === "meme" && b.display_type !== "meme") return -1;
        if (a.display_type !== "meme" && b.display_type === "meme") return 1;
        return (a.official_rank || 999) - (b.official_rank || 999);
      });
    }

    return top3Official;
  }, [displayResults, rankingExpanded]);

  async function fetchResults() {
    setLoadingResults(true);

    try {
      const res = await fetch(
        `${API_BASE}/votes/results?vote_topic=${encodeURIComponent(VOTE_TOPIC)}`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      setResults(data.items || []);
      setTotalVoters(data.total_voters || 0);
    } catch (err) {
      console.error(err);
      setMessage("排行榜載入失敗，請稍後再試。");
    } finally {
      setLoadingResults(false);
    }
  }

  useEffect(() => {
    fetchResults();
  }, []);

  function chooseFood(foodId) {
    if (hasVoted) return;

    setMessage("");

    const alreadyRank = Object.entries(choices).find(([, id]) => id === foodId);
    if (alreadyRank) {
      setMessage("這道已經在你的 Top 3 裡了。");
      return;
    }

    setChoices((prev) => {
      const updated = { ...prev, [activeRank]: foodId };
      setActiveRank(nextEmptyRank(updated));
      return updated;
    });
  }

  function clearChoice(rank) {
    if (hasVoted) return;

    setChoices((prev) => ({ ...prev, [rank]: "" }));
    setActiveRank(rank);
    setMessage("");
  }

  function lockAsVoted(nextMessage) {
    localStorage.setItem(VOTED_KEY, "true");
    localStorage.setItem(MY_VOTE_KEY, JSON.stringify(choices));
    setHasVoted(true);
    setMessage(nextMessage);
  }

  async function submitVote() {
    setMessage("");

    if (hasVoted) {
      setMessage("你已經投過票了，排行榜仍可查看。");
      return;
    }

    if (!choices[1] || !choices[2] || !choices[3]) {
      setMessage("請先選滿第一名、第二名、第三名。");
      return;
    }

    const foodIds = [choices[1], choices[2], choices[3]];
    if (new Set(foodIds).size !== 3) {
      setMessage("三個名次不能選同一道菜。");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vote_topic: VOTE_TOPIC,
        client_id: getClientId(),
        choices: [
          { food_id: choices[1], rank: 1 },
          { food_id: choices[2], rank: 2 },
          { food_id: choices[3], rank: 3 },
        ],
      };

      const res = await fetch(`${API_BASE}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();

      trackEvent("vote_submit", {
        vote_topic: VOTE_TOPIC,
        first_food_id: choices[1],
        second_food_id: choices[2],
        third_food_id: choices[3],
        status: data.status,
      });

      if (data.status === "already_voted") {
        lockAsVoted("你已經投過票了，排行榜仍可查看。");
      } else {
        lockAsVoted("投票成功！排行榜已更新。");
      }

      await fetchResults();
    } catch (err) {
      console.error(err);
      setMessage("投票失敗，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="hero">
        <p className="hero-kicker">鼎泰豐餐點投票</p>
        <h1>你每次去鼎泰豐都必點的三道菜？</h1>
        <p className="hero-subtitle">
          請選出心中的前三名：第一名 3 分、第二名 2 分、第三名 1 分。
        </p>
      </header>

      <section className="panel vote-panel">
        <div className="vote-section-title">
          <h2>目前排行榜</h2>
          <p>已有 {totalVoters} 人參與投票</p>
        </div>

        {loadingResults && <p className="muted-text">排行榜載入中...</p>}

        {!loadingResults && displayResults.length === 0 && (
          <p className="muted-text">目前還沒有票數，快來投第一票。</p>
        )}

        {!loadingResults && displayResults.length > 0 && (
          <>
            <div className="ranking-list text-only">
              {visibleResults.map((row) => (
                <div
                  className={`ranking-row text-only ${
                    row.display_type === "meme" ? "meme-row" : ""
                  }`}
                  key={row.food_id}
                >
                  <div className="ranking-rank">
                    {row.display_type === "meme"
                      ? "🥢"
                      : getRankLabel(row.official_rank)}
                  </div>

                  <div className="ranking-main">
                    <div className="ranking-name">{row.food.name_zh}</div>
                    <div className="ranking-meta">
                      {row.display_type === "meme"
                        ? "薑絲可正常投票，但不列入正式排行榜"
                        : `${row.food.category_name_zh}｜被選 ${row.vote_count} 次`}
                    </div>
                  </div>

                  <div className="ranking-score">{row.total_score} 分</div>
                </div>
              ))}
            </div>

            {displayResults.length > 3 && (
              <button
                type="button"
                className="ranking-toggle-button"
                onClick={() => {
                  const nextExpanded = !rankingExpanded;
                  setRankingExpanded(nextExpanded);

                  trackEvent("toggle_ranking", {
                    expanded: nextExpanded,
                  });
                }}
              >
                {rankingExpanded
                  ? "收合排名"
                  : `更多排名（還有 ${displayResults.length - 3} 項）`}
              </button>
            )}
          </>
        )}
      </section>

      <section className="panel vote-panel">
        <div className="vote-section-title">
          <h2>我要投票</h2>
          {hasVoted ? (
            <p>你已經投過票，仍可查看排行榜。</p>
          ) : (
            <p>先點選要填入的名次，再從下方選菜。</p>
          )}
        </div>

        <div className="choice-grid compact">
          {[1, 2, 3].map((rank) => {
            const food = foodMap[choices[rank]];
            const isActive = activeRank === rank && !hasVoted;

            return (
              <button
                key={rank}
                type="button"
                className={`choice-card compact ${isActive ? "active" : ""}`}
                onClick={() => !hasVoted && setActiveRank(rank)}
              >
                <div className="choice-label">{scoreLabel(rank)}</div>

                {food ? (
                  <div className="choice-selected-text">
                    <strong>{food.name_zh}</strong>
                    <span>{food.category_name_zh}</span>
                    {!hasVoted && (
                      <em
                        onClick={(e) => {
                          e.stopPropagation();
                          clearChoice(rank);
                        }}
                      >
                        清除
                      </em>
                    )}
                  </div>
                ) : (
                  <div className="choice-empty">
                    {isActive ? "正在選這一名" : "尚未選擇"}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!hasVoted && (
          <>
            <div className="category-tabs">
              <button
                type="button"
                className={selectedCategory === "all" ? "active" : ""}
                onClick={() => setSelectedCategory("all")}
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
                  onClick={() => setSelectedCategory(cat.category_id)}
                >
                  {cat.category_name_zh}
                </button>
              ))}
            </div>

            <div className="food-select-list clean">
              {filteredItems.map((item) => {
                const isSelected = selectedFoodIds.includes(item.food_id);

                return (
                  <button
                    type="button"
                    className={`food-option clean ${isSelected ? "selected" : ""}`}
                    key={item.food_id}
                    onClick={() => chooseFood(item.food_id)}
                    disabled={isSelected}
                  >
                    <div className="food-option-main">
                      <div className="food-option-name">
                        {item.name_zh}
                        {item.is_meme && <span className="meme-tag">彩蛋</span>}
                      </div>
                      <div className="food-option-category">
                        {item.category_name_zh}
                      </div>
                    </div>

                    <div className="food-option-pick">
                      {isSelected ? "已選" : `選為第 ${activeRank} 名`}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              className="search-button vote-submit"
              type="button"
              disabled={submitting}
              onClick={submitVote}
            >
              {submitting ? "送出中..." : "送出我的 Top 3"}
            </button>
          </>
        )}

        {message && <div className="vote-message">{message}</div>}
      </section>
    </>
  );
}