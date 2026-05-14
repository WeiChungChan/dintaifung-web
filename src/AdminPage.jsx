import { useEffect, useState } from "react";

const API_BASE = "/api";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [ads, setAds] = useState([]);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(false);

  async function loadAds() {
    try {
      const res = await fetch(`${API_BASE}/admin/ads`, {
        headers: {
          "X-Admin-Token": token,
        },
      });

      if (!res.ok) {
        alert("Token 錯誤或 API 失敗");
        return;
      }

      const data = await res.json();
      setAds(data.items || []);
    } catch (err) {
      console.error(err);
      alert("讀取廣告失敗");
    }
  }

  async function handleUpload() {
    if (!imageFile) {
      alert("請選擇圖片");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", imageFile);

      const res = await fetch(`${API_BASE}/admin/upload-image`, {
        method: "POST",
        headers: {
          "X-Admin-Token": token,
        },
        body: formData,
      });

      if (!res.ok) {
        alert("圖片上傳失敗");
        return;
      }

      const data = await res.json();

      setImageUrl(data.image_url);

      alert("圖片上傳成功");
    } catch (err) {
      console.error(err);
      alert("圖片上傳失敗");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAd() {
    if (!imageUrl) {
      alert("請先上傳圖片");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/admin/ads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token,
        },
        body: JSON.stringify({
          title,
          subtitle,
          image_url: imageUrl,
          target_url: targetUrl,
          main_category: mainCategory,
          sub_category: subCategory,
          lang: "zh",
          placement: "home",
          priority: 10,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        alert("新增廣告失敗");
        return;
      }

      alert("新增成功");

      setTitle("");
      setSubtitle("");
      setTargetUrl("");
      setMainCategory("");
      setSubCategory("");
      setImageFile(null);
      setImageUrl("");

      loadAds();
    } catch (err) {
      console.error(err);
      alert("新增廣告失敗");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("確定刪除？")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/ads/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Token": token,
        },
      });

      if (!res.ok) {
        alert("刪除失敗");
        return;
      }

      loadAds();
    } catch (err) {
      console.error(err);
      alert("刪除失敗");
    }
  }

  return (
    <div className="admin-page">
      <h1>廣告後台</h1>

      <div className="admin-block">
        <label>Admin Token</label>

        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        <button onClick={loadAds}>
          讀取廣告列表
        </button>
      </div>

      <hr />

      <div className="admin-block">
        <h2>新增廣告</h2>

        <input
          placeholder="標題"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          placeholder="副標題"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        <input
          placeholder="蝦皮分潤網址"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
        />

        <input
          placeholder="大類"
          value={mainCategory}
          onChange={(e) => setMainCategory(e.target.value)}
        />

        <input
          placeholder="小類"
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
        />

        <div style={{ marginTop: 16 }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <button onClick={handleUpload} disabled={loading}>
            上傳圖片
          </button>
        </div>

        {imageUrl && (
          <div style={{ marginTop: 16 }}>
            <img
              src={`${API_BASE}${imageUrl}`}
              alt=""
              style={{
                width: 160,
                borderRadius: 12,
              }}
            />
          </div>
        )}

        <button
          style={{ marginTop: 20 }}
          onClick={handleCreateAd}
          disabled={loading}
        >
          建立廣告
        </button>
      </div>

      <hr />

      <div className="admin-block">
        <h2>目前廣告</h2>

        {ads.map((ad) => (
          <div
            key={ad.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <img
              src={`${API_BASE}${ad.image_url}`}
              alt=""
              style={{
                width: 120,
                borderRadius: 12,
              }}
            />

            <h3>{ad.title}</h3>

            <p>{ad.subtitle}</p>

            <p>
              {ad.main_category} / {ad.sub_category}
            </p>

            <a
              href={ad.target_url}
              target="_blank"
              rel="noreferrer"
            >
              商品連結
            </a>

            <div style={{ marginTop: 12 }}>
              <button onClick={() => handleDelete(ad.id)}>
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}