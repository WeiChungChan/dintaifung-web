import { useMemo, useState } from "react";
import { STORE_MAP } from "./storeMap";
import "./App.css";
import VotePage from "./VotePage";
import { trackEvent } from "./ga";
import WheelPage from "./WheelPage";

const API_BASE = "/api";

const LANGS = [
  { code: "zh", label: "🇹🇼" },
  { code: "en", label: "🇺🇸" },
  { code: "ja", label: "🇯🇵" },
  { code: "ko", label: "🇰🇷" },
  { code: "vi", label: "🇻🇳" },
  { code: "th", label: "🇹🇭" },
  { code: "id", label: "🇮🇩" },
  { code: "ms", label: "🇲🇾" },
];

const I18N = {
  zh: {
    appKicker: "鼎泰豐抽號時間助手",
    title: "想幾點吃到，幫你反推幾點該去抽號",
    subtitle: "輸入日期與想入座時間，系統會列出各分店的建議抽號時間。",
    date: "日期",
    seatTime: "想入座時間",
    query: "開始查詢",
    querying: "查詢中...",
    adTitle: "廣告位預留",
    adText: "",
    resultTitle: "查詢結果",
    targetSeatTime: "目標入座",
    weekday: "星期",
    suggestedTicket: "建議抽號",
    estimatedWait: "預估等待",
    ticketWindow: "建議區間",
    directEntry: "此時段通常可直接入場",
    arriveNow: "-",
    around: "約",
    closed: "非營業時間",
    closedDesc: "這個時段不在該門市營業時間內。",
    insufficient: "資料不足",
    insufficientDesc: "目前這個時段資料還不夠，暫時無法預估。",
    predictable: "可預估",
    lowRisk: "低風險",
    mediumRisk: "中風險",
    highRisk: "高風險",
    lastTimePrefix: "通常",
    lastTimeSuffix: "左右停止取號",
    warning: "⚠️本網站非鼎泰豐官方營運，為基於公開資料之統計與推估結果，僅供參考，實際候位與入座時間仍以現場公告為準。",
    min: "分鐘",
    searchError: "查詢失敗，請確認 API 位址、網路或後端服務狀態。",
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
  },
  en: {
  appKicker: "Din Tai Fung Ticket Time Helper",
  title: "Tell us when you want to be seated at Din Tai Fung, and we’ll estimate when to take a queue ticket",
  subtitle: "Select a date and target seating time. We’ll estimate the recommended ticket-taking time for each branch.",
  date: "Date",
  seatTime: "Target seating time",
  query: "Search",
  querying: "Searching...",
  adTitle: "Ad Space",
  adText: "",
  resultTitle: "Results",
  targetSeatTime: "Target seating time",
  weekday: "Weekday",
  suggestedTicket: "Recommended ticket time",
  estimatedWait: "Estimated wait",
  ticketWindow: "Suggested ticket window",
  directEntry: "Typically no waiting at this time",
  arriveNow: "-",
  closed: "Closed",
  closedDesc: "This branch is not open for seating at the selected time.",
  insufficient: "Not enough data",
  insufficientDesc: "There is not enough data for this time slot yet.",
  predictable: "Estimated",
  lowRisk: "Low risk",
  mediumRisk: "Medium risk",
  highRisk: "High risk",
  lastTimePrefix: "Usually stops issuing queue tickets around",
  lastTimeSuffix: "",
  warning: "⚠️This website is not operated by Din Tai Fung. The results are statistical estimates based on public data and are for reference only. Actual waiting and seating times should follow on-site announcements.",
  min: "min",
  searchError: "Search failed. Please check the API URL, network, or backend service status.",
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
},

ja: {
  appKicker: "鼎泰豊 整理券時間ヘルパー",
  title: "鼎泰豊に何時に入店したいかを入力すると、整理券を取るべき時間を推定します",
  subtitle: "日付と希望入店時間を選択すると、各店舗のおすすめ整理券取得時間を表示します。",
  date: "日付",
  seatTime: "希望入店時間",
  query: "検索",
  querying: "検索中...",
  adTitle: "広告枠",
  adText: "",
  resultTitle: "検索結果",
  targetSeatTime: "希望入店時間",
  weekday: "曜日",
  suggestedTicket: "おすすめ整理券取得時間",
  estimatedWait: "予想待ち時間",
  ticketWindow: "おすすめ取得時間帯",
  directEntry: "この時間帯は通常待たずに入店できます",
  arriveNow: "-",
  around: "約",
  closed: "営業時間外",
  closedDesc: "選択した時間は、この店舗の入店可能時間外です。",
  insufficient: "データ不足",
  insufficientDesc: "この時間帯はまだ十分なデータがありません。",
  predictable: "推定可",
  lowRisk: "低リスク",
  mediumRisk: "中リスク",
  highRisk: "高リスク",
  lastTimePrefix: "通常",
  lastTimeSuffix: "頃に整理券の発行を終了",
  warning: "⚠️本サイトは鼎泰豊公式ではありません。公開データに基づく統計・推定結果であり、参考情報です。実際の待ち時間や入店時間は現地の案内に従ってください。",
  min: "分",
  searchError: "検索に失敗しました。API URL、ネットワーク、またはバックエンドの状態を確認してください。",
  weekdays: ["日", "月", "火", "水", "木", "金", "土"],
},

ko: {
  appKicker: "딘타이펑 번호표 시간 도우미",
  title: "딘타이펑에 몇 시에 입장하고 싶은지 입력하면, 번호표를 뽑아야 할 시간을 예측해 드립니다",
  subtitle: "날짜와 원하는 입장 시간을 선택하면 지점별 추천 번호표 발권 시간을 보여드립니다.",
  date: "날짜",
  seatTime: "원하는 입장 시간",
  query: "조회하기",
  querying: "조회 중...",
  adTitle: "광고 영역",
  adText: "",
  resultTitle: "조회 결과",
  targetSeatTime: "원하는 입장 시간",
  weekday: "요일",
  suggestedTicket: "추천 번호표 발권 시간",
  estimatedWait: "예상 대기 시간",
  ticketWindow: "추천 발권 시간대",
  directEntry: "이 시간대는 보통 바로 입장 가능합니다",
  arriveNow: "-",
  around: "약",
  closed: "영업시간 외",
  closedDesc: "선택한 시간은 해당 지점의 입장 가능 시간이 아닙니다.",
  insufficient: "데이터 부족",
  insufficientDesc: "현재 이 시간대의 데이터가 아직 충분하지 않습니다.",
  predictable: "예측 가능",
  lowRisk: "낮은 위험",
  mediumRisk: "중간 위험",
  highRisk: "높은 위험",
  lastTimePrefix: "보통",
  lastTimeSuffix: "쯤 번호표 발권을 마감합니다",
  warning: "⚠️본 사이트는 딘타이펑 공식 운영 사이트가 아닙니다. 공개 데이터를 바탕으로 한 통계 및 추정 결과이며 참고용입니다. 실제 대기 및 입장 시간은 현장 안내를 기준으로 합니다.",
  min: "분",
  searchError: "조회에 실패했습니다. API 주소, 네트워크 또는 백엔드 서비스 상태를 확인하세요.",
  weekdays: ["일", "월", "화", "수", "목", "금", "토"],
},

vi: {
  appKicker: "Trợ lý thời gian lấy số Din Tai Fung",
  title: "Chọn giờ bạn muốn vào bàn tại Din Tai Fung, chúng tôi sẽ ước tính thời gian nên lấy số",
  subtitle: "Chọn ngày và giờ muốn vào bàn. Hệ thống sẽ gợi ý thời gian lấy số cho từng chi nhánh.",
  date: "Ngày",
  seatTime: "Giờ muốn vào bàn",
  query: "Tìm kiếm",
  querying: "Đang tìm...",
  adTitle: "Vị trí quảng cáo",
  adText: "",
  resultTitle: "Kết quả",
  targetSeatTime: "Giờ muốn vào bàn",
  weekday: "Thứ",
  suggestedTicket: "Thời gian nên lấy số",
  estimatedWait: "Thời gian chờ ước tính",
  ticketWindow: "Khoảng thời gian nên lấy số",
  directEntry: "Khung giờ này thường có thể vào ngay",
  arriveNow: "-",
  around: "Khoảng",
  closed: "Ngoài giờ phục vụ",
  closedDesc: "Thời gian đã chọn nằm ngoài giờ nhận khách của chi nhánh này.",
  insufficient: "Chưa đủ dữ liệu",
  insufficientDesc: "Hiện chưa có đủ dữ liệu cho khung giờ này.",
  predictable: "Có thể ước tính",
  lowRisk: "Rủi ro thấp",
  mediumRisk: "Rủi ro vừa",
  highRisk: "Rủi ro cao",
  lastTimePrefix: "Thường ngừng phát số vào khoảng",
  lastTimeSuffix: "",
  warning: "⚠️Trang web này không do Din Tai Fung vận hành chính thức. Kết quả là ước tính thống kê dựa trên dữ liệu công khai và chỉ dùng để tham khảo. Thời gian chờ và vào bàn thực tế vui lòng theo thông báo tại cửa hàng.",
  min: "phút",
  searchError: "Tìm kiếm thất bại. Vui lòng kiểm tra địa chỉ API, mạng hoặc trạng thái máy chủ.",
  weekdays: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
},

th: {
  appKicker: "ตัวช่วยคำนวณเวลารับบัตรคิว Din Tai Fung",
  title: "เลือกเวลาที่อยากได้นั่งที่ Din Tai Fung แล้วเราจะคำนวณว่าควรไปรับบัตรคิวกี่โมง",
  subtitle: "เลือกวันที่และเวลาที่ต้องการนั่ง ระบบจะแนะนำเวลารับบัตรคิวของแต่ละสาขา",
  date: "วันที่",
  seatTime: "เวลาที่ต้องการนั่ง",
  query: "ค้นหา",
  querying: "กำลังค้นหา...",
  adTitle: "พื้นที่โฆษณา",
  adText: "",
  resultTitle: "ผลลัพธ์",
  targetSeatTime: "เวลาที่ต้องการนั่ง",
  weekday: "วัน",
  suggestedTicket: "เวลาที่ควรรับบัตรคิว",
  estimatedWait: "เวลารอโดยประมาณ",
  ticketWindow: "ช่วงเวลาที่แนะนำให้รับคิว",
  directEntry: "ช่วงเวลานี้โดยปกติสามารถเข้าได้เลย",
  arriveNow: "-",
  around: "ประมาณ",
  closed: "นอกเวลารับลูกค้า",
  closedDesc: "เวลาที่เลือกอยู่นอกช่วงเวลาที่สาขานี้เปิดรับลูกค้า",
  insufficient: "ข้อมูลยังไม่พอ",
  insufficientDesc: "ขณะนี้ยังมีข้อมูลไม่เพียงพอสำหรับช่วงเวลานี้",
  predictable: "ประเมินได้",
  lowRisk: "ความเสี่ยงต่ำ",
  mediumRisk: "ความเสี่ยงปานกลาง",
  highRisk: "ความเสี่ยงสูง",
  lastTimePrefix: "โดยปกติหยุดแจกบัตรคิวประมาณ",
  lastTimeSuffix: "",
  warning: "⚠️เว็บไซต์นี้ไม่ได้ดำเนินการโดย Din Tai Fung อย่างเป็นทางการ ผลลัพธ์เป็นการประมาณจากสถิติของข้อมูลสาธารณะเพื่อใช้อ้างอิงเท่านั้น เวลารอและเวลาได้นั่งจริงให้ยึดตามประกาศหน้าร้าน",
  min: "นาที",
  searchError: "ค้นหาไม่สำเร็จ โปรดตรวจสอบที่อยู่ API เครือข่าย หรือสถานะเซิร์ฟเวอร์",
  weekdays: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."],
},

id: {
  appKicker: "Asisten Waktu Ambil Nomor Din Tai Fung",
  title: "Pilih jam duduk yang Anda inginkan di Din Tai Fung, kami bantu memperkirakan kapan harus ambil nomor antrean",
  subtitle: "Pilih tanggal dan waktu duduk yang diinginkan. Sistem akan menampilkan rekomendasi waktu ambil nomor untuk setiap cabang.",
  date: "Tanggal",
  seatTime: "Waktu duduk yang diinginkan",
  query: "Cari",
  querying: "Mencari...",
  adTitle: "Ruang Iklan",
  adText: "",
  resultTitle: "Hasil",
  targetSeatTime: "Waktu duduk target",
  weekday: "Hari",
  suggestedTicket: "Waktu ambil nomor yang disarankan",
  estimatedWait: "Estimasi waktu tunggu",
  ticketWindow: "Rentang waktu ambil nomor",
  directEntry: "Pada waktu ini biasanya bisa langsung masuk",
  arriveNow: "-",
  around: "Sekitar",
  closed: "Di luar jam layanan",
  closedDesc: "Waktu yang dipilih berada di luar jam menerima tamu untuk cabang ini.",
  insufficient: "Data belum cukup",
  insufficientDesc: "Data untuk slot waktu ini belum cukup.",
  predictable: "Dapat diperkirakan",
  lowRisk: "Risiko rendah",
  mediumRisk: "Risiko sedang",
  highRisk: "Risiko tinggi",
  lastTimePrefix: "Biasanya berhenti membagikan nomor sekitar",
  lastTimeSuffix: "",
  warning: "⚠️Situs ini tidak dioperasikan secara resmi oleh Din Tai Fung. Hasil merupakan estimasi statistik berdasarkan data publik dan hanya untuk referensi. Waktu tunggu dan waktu duduk sebenarnya mengikuti pengumuman di lokasi.",
  min: "menit",
  searchError: "Pencarian gagal. Periksa URL API, jaringan, atau status server.",
  weekdays: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
},

ms: {
  appKicker: "Pembantu Masa Ambil Nombor Din Tai Fung",
  title: "Pilih masa anda mahu duduk di Din Tai Fung, kami anggarkan bila anda perlu ambil nombor giliran",
  subtitle: "Pilih tarikh dan masa duduk yang diingini. Sistem akan mencadangkan masa ambil nombor bagi setiap cawangan.",
  date: "Tarikh",
  seatTime: "Masa duduk yang diingini",
  query: "Cari",
  querying: "Mencari...",
  adTitle: "Ruang Iklan",
  adText: "",
  resultTitle: "Keputusan",
  targetSeatTime: "Masa duduk sasaran",
  weekday: "Hari",
  suggestedTicket: "Masa ambil nombor yang dicadangkan",
  estimatedWait: "Anggaran masa menunggu",
  ticketWindow: "Julat masa ambil nombor",
  directEntry: "Pada waktu ini biasanya boleh masuk terus",
  arriveNow: "-",
  around: "Kira-kira",
  closed: "Di luar waktu perkhidmatan",
  closedDesc: "Masa yang dipilih berada di luar waktu menerima pelanggan bagi cawangan ini.",
  insufficient: "Data belum mencukupi",
  insufficientDesc: "Data untuk slot masa ini belum mencukupi.",
  predictable: "Boleh dianggarkan",
  lowRisk: "Risiko rendah",
  mediumRisk: "Risiko sederhana",
  highRisk: "Risiko tinggi",
  lastTimePrefix: "Biasanya berhenti memberi nombor sekitar",
  lastTimeSuffix: "",
  warning: "⚠️Laman ini tidak dikendalikan secara rasmi oleh Din Tai Fung. Keputusan ialah anggaran statistik berdasarkan data awam dan hanya untuk rujukan. Masa menunggu dan masa duduk sebenar tertakluk kepada pengumuman di lokasi.",
  min: "minit",
  searchError: "Carian gagal. Sila semak URL API, rangkaian atau status pelayan.",
  weekdays: ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"],
},
};

function formatDateToWeekday(dateStr) {
  return new Date(dateStr).getDay();
}

function isSameWindow(start, end) {
  return start && end && start === end;
}

function buildTimeOptions() {
  const options = [];
  for (let hour = 10; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      if (hour === 21 && minute > 0) break;
      options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

function getStoreName(item, lang) {
  if (["vi", "th", "id", "ms"].includes(lang)) return item.store_name_en;
  if (lang === "en") return item.store_name_en;
  if (lang === "ja") return item.store_name_ja;
  if (lang === "ko") return item.store_name_ko;
  return item.store_name_zh;
}

function getStoreSubName(item, lang) {
  if (["vi", "th", "id", "ms"].includes(lang)) return "";
  if (lang === "zh") return item.store_name_en;
  return item.store_name_zh;
}

function getBadge(item, t) {
  if (item.status === "closed") return { text: t.closed, className: "badge badge-muted" };
  if (item.status === "insufficient_data") return { text: t.insufficient, className: "badge badge-muted" };
  if (item.wait_minutes === 0) return { text: t.directEntry, className: "badge badge-low" };
  if (item.risk_level === "high") return { text: t.highRisk, className: "badge badge-high" };
  if (item.risk_level === "medium") return { text: t.mediumRisk, className: "badge badge-medium" };
  if (item.risk_level === "low") return { text: t.lowRisk, className: "badge badge-low" };
  return { text: t.predictable, className: "badge badge-low" };
}

function renderLastTimeText(item, t) {
  if (!item.last_time_median) return null;
  return `${t.lastTimePrefix} ${item.last_time_median} ${t.lastTimeSuffix}`.trim();
}

function StoreCard({ item, lang, t }) {
  const badge = getBadge(item, t);
  const subName = getStoreSubName(item, lang);

  return (
    <article
      className={`store-card clickable ${STORE_MAP[item.store_id] ? "has-map" : ""}`}
      onClick={() => {
        const url = STORE_MAP[item.store_id];
        if (url) {
          trackEvent("click_store_map", {
            store_id: item.store_id,
            store_name_zh: item.store_name_zh,
          });

          window.open(url, "_blank");
        }
      }}
    >
      <div className="store-card-header">
        <div>
          <h2 className="store-name">
            {getStoreName(item, lang)}
      
            {STORE_MAP[item.store_id] && (
              <span className="map-hint large">🗺️📍</span>
            )}
          </h2>

          {subName && <p className="store-name-en">{subName}</p>}
        </div>

        <span className={badge.className}>{badge.text}</span>
      </div>

      {item.status === "closed" && (
        <div className="store-card-body">
          <p className="muted-text">{t.closedDesc}</p>
        </div>
      )}

      {item.status === "insufficient_data" && (
        <div className="store-card-body">
          <p className="muted-text">{t.insufficientDesc}</p>
          {item.last_time_median && <p className="last-time-text">{renderLastTimeText(item, t)}</p>}
        </div>
      )}

      {item.status === "ok" && (
        <div className="store-card-body">
          <div className="info-row">
            <span className="info-label">{t.suggestedTicket}</span>
            <span className="info-value strong">
              {item.wait_minutes === 0 ? t.directEntry : item.suggested_ticket_time}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">{t.estimatedWait}</span>
            <span className="info-value">
              {item.wait_minutes === 0 ? t.directEntry : `${item.wait_minutes} ${t.min}`}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">{t.ticketWindow}</span>
            <span className="info-value">
              {item.wait_minutes === 0
                ? t.arriveNow
                : isSameWindow(item.ticket_window_start, item.ticket_window_end)
                ? `${t.around} ${item.ticket_window_start}`
                : `${item.ticket_window_start}–${item.ticket_window_end}`}
            </span>
          </div>

          {item.last_time_median && (
            <div className="store-card-footer">
              <p className="last-time-text">{renderLastTimeText(item, t)}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function App() {
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  }, []);

  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState("zh");
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState("12:50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const t = I18N[lang];
  const weekday = useMemo(() => (date ? formatDateToWeekday(date) : null), [date]);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
	
	trackEvent("search_queue", {
	  weekday,
	  target_time: time,
	});

    try {
      const url = `${API_BASE}/predict?weekday=${weekday}&time=${encodeURIComponent(time)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(t.searchError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <nav className="app-tabs">
          <button
            type="button"
            className={activeTab === "home" ? "active" : ""}
            onClick={() => setActiveTab("home")}
          >
            主頁
          </button>

          <button
            type="button"
            className={activeTab === "vote" ? "active" : ""}
            onClick={() => setActiveTab("vote")}
          >
            美味排名
          </button>
		  
		  <button
            type="button"
            className={activeTab === "wheel" ? "active" : ""}
            onClick={() => setActiveTab("wheel")}
          >
            點菜轉盤
          </button>
        </nav>

        {activeTab === "home" && (
          <>
            <header className="hero">
              <div className="hero-topbar">
                <p className="hero-kicker">{t.appKicker}</p>

                <div className="lang-switcher">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      className={`lang-btn ${lang === l.code ? "active" : ""}`}
                      onClick={() => {
                        setLang(l.code);
                        trackEvent("change_language", {
                          lang: l.code,
                        });
                      }}
                      title={l.code}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <h1>{t.title}</h1>
              <p className="hero-subtitle">{t.subtitle}</p>
            </header>

            <section className="panel search-panel">
              <form className="search-form" onSubmit={handleSearch}>
                <div className="field">
                  <label>{t.date}</label>
                  <input
                    type="date"
                    value={date}
                    min={todayStr}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>{t.seatTime}</label>
                  <select value={time} onChange={(e) => setTime(e.target.value)}>
                    {TIME_OPTIONS.map((tt) => (
                      <option key={tt} value={tt}>
                        {tt}
                      </option>
                    ))}
                  </select>
                </div>

                <button className="search-button" type="submit" disabled={loading}>
                  {loading ? t.querying : t.query}
                </button>
              </form>
            </section>

            <section className="ad-banner">
              <div className="ad-label">{t.adTitle}</div>
              <div className="ad-content">{t.adText}</div>
            </section>

            <section className="site-warning">{t.warning}</section>

            {error && <section className="panel error-box">{error}</section>}

            {result && (
              <section className="results-section">
                <div className="results-header">
                  <h2>{t.resultTitle}</h2>
                  <p>
                    {t.targetSeatTime}：{result.target_seat_time}　{t.weekday}：
                    {t.weekdays[result.weekday]}
                  </p>
                </div>

                <div className="results-list">
                  {result.items.map((item) => (
                    <StoreCard key={item.store_id} item={item} lang={lang} t={t} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === "vote" && <VotePage />}
		{activeTab === "wheel" && <WheelPage />}
      </div>
    </div>
  );
}