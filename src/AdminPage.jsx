import { useEffect, useState } from "react";

const API_BASE = "/api";

const emptyForm = {
  title: "",
  subtitle: "",
  image_url: "",
  target_url: "",
  main_category: "",
  sub_category: "",
  lang: "zh",
  placement: "home",
  priority: 10,
  is_active: true,
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  function authHeaders(extra = {}) {
    return {
      "X-Admin-Token": token,
      ...extra,
    };
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function loadAds() {
    const res = await fetch(`${API_BASE}/admin/ads`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      alert("Token 錯誤或讀取失敗");
      return;
    }

    const data = await res.json();
    setAds(data.items || []);
  }

  async function handleUpload() {
    if (!imageFile) {
      alert("請先選擇圖片");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const res = await fetch(`${API_BASE}/admin/upload-image`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      if (!res.ok) {
        alert("圖片上傳失敗");
        return;
      }

      const data = await res.json();
      updateForm("image_url", data.image_url);
      alert("圖片上傳成功");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.title || !form.image_url || !form.target_url) {
      alert("標題、圖片、目標網址必填");
      return;
    }

    setLoading(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${API_BASE}/admin/ads/${editingId}`
        : `${API_BASE}/admin/ads`;

      const res = await fetch(url, {
        method,
        headers: authHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          ...form,
          priority: Number(form.priority || 0),
        }),
      });

      if (!res.ok) {
        alert(editingId ? "更新失敗" : "新增失敗");
        return;
      }

      setForm(emptyForm);
      setImageFile(null);
      setEditingId(null);
      await loadAds();

      alert(editingId ? "更新成功" : "新增成功");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(ad) {
    setEditingId(ad.id);
    setForm({
      title: ad.title || "",
      subtitle: ad.subtitle || "",
      image_url: ad.image_url || "",
      target_url: ad.target_url || "",
      main_category: ad.main_category || "",
      sub_category: ad.sub_category || "",
      lang: ad.lang || "zh",
      placement: ad.placement || "home",
      priority: ad.priority ?? 10,
      is_active: ad.is_active === 1 || ad.is_active === true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
  }

  async function handleDelete(id) {
    if (!window.confirm("確定刪除這筆廣告？")) return;

    const res = await fetch(`${API_BASE}/admin/ads/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      alert("刪除失敗");
      return;
    }

    await loadAds();
  }

  function handleDragStart(id) {
    setDraggingId(id);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(targetId) {
    if (!draggingId || draggingId === targetId) return;

    const current = [...ads];
    const fromIndex = current.findIndex((ad) => ad.id === draggingId);
    const toIndex = current.findIndex((ad) => ad.id === targetId);

    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);

    setAds(current);
    setDraggingId(null);
  }

  async function saveOrder() {
    const orderedIds = ads.map((ad) => ad.id);

    const res = await fetch(`${API_BASE}/admin/ads/reorder`, {
      method: "POST",
      headers: authHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ ordered_ids: orderedIds }),
    });

    if (!res.ok) {
      alert("排序儲存失敗");
      return;
    }

    await loadAds();
    alert("排序已儲存");
  }

  return (
    <div className="admin-page">
      <header className="admin-hero">
        <div>
          <p className="admin-kicker">Shoronpolover Admin</p>
          <h1>廣告管理後台</h1>
          <p>管理蝦皮分潤廣告、圖片、排序與啟用狀態。</p>
        </div>
      </header>

      <section className="admin-panel">
        <label>Admin Token</label>
        <div className="admin-token-row">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="輸入 Admin Token"
          />
          <button onClick={loadAds}>讀取廣告</button>
        </div>
      </section>

      <section className="admin-panel">
        <h2>{editingId ? `編輯廣告 #${editingId}` : "新增廣告"}</h2>

        <div className="admin-form-grid">
          <input
            placeholder="標題"
            value={form.title}
            onChange={(e) => updateForm("title", e.target.value)}
          />

          <input
            placeholder="副標題"
            value={form.subtitle}
            onChange={(e) => updateForm("subtitle", e.target.value)}
          />

          <input
            placeholder="蝦皮分潤網址"
            value={form.target_url}
            onChange={(e) => updateForm("target_url", e.target.value)}
          />

          <input
            placeholder="圖片 URL"
            value={form.image_url}
            onChange={(e) => updateForm("image_url", e.target.value)}
          />

          <input
            placeholder="大類，例如 玩具"
            value={form.main_category}
            onChange={(e) => updateForm("main_category", e.target.value)}
          />

          <input
            placeholder="小類，例如 Tomica"
            value={form.sub_category}
            onChange={(e) => updateForm("sub_category", e.target.value)}
          />

          <input
            placeholder="語系"
            value={form.lang}
            onChange={(e) => updateForm("lang", e.target.value)}
          />

          <input
            placeholder="位置"
            value={form.placement}
            onChange={(e) => updateForm("placement", e.target.value)}
          />

          <input
            type="number"
            placeholder="排序權重"
            value={form.priority}
            onChange={(e) => updateForm("priority", e.target.value)}
          />

          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateForm("is_active", e.target.checked)}
            />
            啟用
          </label>
        </div>

        <div className="admin-upload-row">
          <label className="admin-file-button">
            選擇圖片

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <span className="admin-file-name">
            {imageFile ? imageFile.name : "尚未選擇檔案"}
          </span>

          <button onClick={handleUpload} disabled={loading}>
            上傳圖片
          </button>
        </div>

        {form.image_url && (
          <div className="admin-preview">
            <img src={`${API_BASE}${form.image_url}`} alt="preview" />
            <span>{form.image_url}</span>
          </div>
        )}

        <div className="admin-actions">
          <button onClick={handleSave} disabled={loading}>
            {editingId ? "儲存修改" : "建立廣告"}
          </button>

          {editingId && (
            <button className="ghost" onClick={cancelEdit}>
              取消編輯
            </button>
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-list-header">
          <h2>廣告列表</h2>
          <button onClick={saveOrder}>儲存目前排序</button>
        </div>

        <p className="admin-hint">拖曳卡片調整順序，最上面的會排在網站最前面。</p>

        <div className="admin-ad-list">
          {ads.map((ad) => (
            <article
              key={ad.id}
              className={`admin-ad-card ${draggingId === ad.id ? "dragging" : ""}`}
              draggable
              onDragStart={() => handleDragStart(ad.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(ad.id)}
            >
              <div className="admin-drag-handle">☰</div>

              <img src={`${API_BASE}${ad.image_url}`} alt={ad.title} />

              <div className="admin-ad-info">
                <div className="admin-ad-title">
                  #{ad.id} {ad.title}
                </div>
                <div className="admin-ad-subtitle">{ad.subtitle}</div>
                <div className="admin-ad-meta">
                  {ad.main_category || "-"} / {ad.sub_category || "-"}・priority {ad.priority}
                </div>
                <div className="admin-ad-meta">
                  clicks {ad.clicks}・impressions {ad.impressions}・{ad.is_active ? "啟用" : "停用"}
                </div>
              </div>

              <div className="admin-card-actions">
                <button onClick={() => startEdit(ad)}>編輯</button>
                <button className="danger" onClick={() => handleDelete(ad.id)}>
                  刪除
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}