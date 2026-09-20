import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function MyItems({ user, onBack, onOpenPost, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("back2you_token");
        if (!token) {
          setError("กรุณาเข้าสู่ระบบใหม่");
          return;
        }

        const response = await fetch(`${API_BASE}/api/my-items`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "ไม่สามารถโหลดรายการได้");
        }

        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error("Load My Items Error:", err);
        setError(err.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const visibleItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${API_BASE}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
  };

  const formatDate = (value) => {
    if (!value) return "ไม่ระบุวันที่";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const statusInfo = (status) => {
    const map = {
      pending: { text: "รอตรวจสอบ", cls: "bg-amber-100 text-amber-700" },
      approved: { text: "อนุมัติแล้ว", cls: "bg-emerald-100 text-emerald-700" },
      rejected: { text: "ไม่ผ่านการอนุมัติ", cls: "bg-red-100 text-red-700" },
      found: { text: "พบของแล้ว", cls: "bg-blue-100 text-blue-700" },
      returned: { text: "คืนเจ้าของแล้ว", cls: "bg-purple-100 text-purple-700" },
    };
    return map[status] || { text: status || "ไม่ทราบสถานะ", cls: "bg-slate-100 text-slate-600" };
  };

  const firstLetter = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf3ff] text-[#334155] flex flex-col">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-[150px] h-64 w-64 rounded-full bg-[#a978df]/20" />
        <div className="absolute -right-28 top-[330px] h-80 w-80 rounded-full bg-[#5b9bea]/18" />
        <div className="absolute left-[7%] top-[760px] h-32 w-32 rounded-full bg-[#f8cf4b]/22" />
        <div className="absolute right-[8%] bottom-[110px] h-44 w-44 rounded-full bg-[#67c5b5]/16" />
      </div>

      <header className="relative z-20 bg-[#5b9bea] border-b border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[72px] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 transition hover:scale-[1.03]"
            aria-label="กลับหน้าหลัก"
          >
            <img src="/image/back2you.png" alt="Back2You" className="w-20 sm:w-24 md:w-28 h-auto" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/70 bg-white/95 pl-2 pr-4 py-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#a978df] text-white flex items-center justify-center font-extrabold">
                {firstLetter}
              </div>
              <span className="max-w-[160px] truncate text-sm font-extrabold text-slate-700">
                {user?.name || "ผู้ใช้"}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-full bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-[#397fd2] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-[1050px] mx-auto px-4 sm:px-6 py-6 sm:py-9 flex-1">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="h-1.5 bg-gradient-to-r from-[#a978df] via-[#5b9bea] to-[#67c5b5]" />

          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full border border-slate-300 bg-[#edf5ff] px-4 py-2 text-[11px] font-extrabold tracking-[0.12em] text-[#397fd2]">
                  BACK2YOU
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-slate-700">
                  ของของฉัน
                </h1>
                <p className="mt-2 max-w-[560px] text-xs sm:text-sm leading-6 text-slate-500">
                  ติดตามประกาศของหายและของที่คุณเก็บได้ พร้อมดูสถานะการตรวจสอบได้ในที่เดียว
                </p>
              </div>

              <button
                type="button"
                onClick={onBack}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-[#edf5ff] px-4 py-2.5 text-xs font-extrabold text-[#397fd2] transition hover:border-[#5b9bea] hover:bg-white"
              >
                ← กลับหน้าหลัก
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-blue-100 bg-[#f8fbff] p-2">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  ["all", "ทั้งหมด", "🗂️"],
                  ["lost", "ของหาย", "📍"],
                  ["found", "ของที่พบ", "📦"],
                ].map(([value, label, icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-xl px-2 sm:px-5 py-2.5 text-[11px] sm:text-sm font-extrabold transition-all ${
                      filter === value
                        ? value === "lost"
                          ? "bg-[#ef7777] text-white shadow-sm"
                          : value === "found"
                            ? "bg-[#67c5b5] text-white shadow-sm"
                            : "bg-[#5b9bea] text-white shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-[#397fd2]"
                    }`}
                  >
                    <span className="mr-1 hidden sm:inline">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="min-h-[300px] flex flex-col items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#5b9bea]" />
                <p className="mt-4 text-sm font-bold text-slate-400">กำลังโหลดรายการ...</p>
              </div>
            ) : error ? (
              <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="mt-6 min-h-[300px] rounded-xl border-2 border-dashed border-blue-100 bg-[#f8fbff] flex items-center justify-center px-4 text-center">
                <div>
                  <div className="text-5xl">📭</div>
                  <p className="mt-3 text-lg font-extrabold text-slate-600">ยังไม่มีรายการ</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {filter === "lost"
                      ? "ยังไม่มีประกาศของหายในบัญชีนี้"
                      : filter === "found"
                        ? "ยังไม่มีประกาศพบของในบัญชีนี้"
                        : "ประกาศที่คุณสร้างจะแสดงอยู่ที่หน้านี้"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {visibleItems.map((item) => {
                  const isLost = item.type === "lost";
                  const status = statusInfo(item.status);
                  const itemDate = isLost ? item.lost_date : item.found_date;
                  const canOpen = item.status === "approved";

                  return (
                    <article
                      key={`${item.type}-${item.id}`}
                      className={`group overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        isLost ? "border-red-100" : "border-emerald-100"
                      }`}
                    >
                      <div className={`h-1 ${isLost ? "bg-[#ef7777]" : "bg-[#67c5b5]"}`} />

                      <div className="flex gap-4 p-4 sm:p-5">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-[#edf5ff] flex items-center justify-center border border-slate-100">
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.title}
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <span className="text-4xl">{isLost ? "📍" : "📦"}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] sm:text-xs font-extrabold ${
                                isLost
                                  ? "bg-red-50 text-[#df6262]"
                                  : "bg-emerald-50 text-[#49a997]"
                              }`}
                            >
                              {isLost ? "ของหาย" : "ของที่พบ"}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-[10px] sm:text-xs font-extrabold ${status.cls}`}>
                              {status.text}
                            </span>
                          </div>

                          <h2 className="mt-3 truncate text-base sm:text-lg font-extrabold text-slate-700">
                            {item.title}
                          </h2>
                          <p className="mt-1 truncate text-xs sm:text-sm font-bold text-[#5b9bea]">
                            {item.category_name || "ไม่ระบุหมวดหมู่"}
                          </p>

                          <div className="mt-3 space-y-1.5 text-xs sm:text-sm text-slate-500">
                            <p className="truncate">📍 {item.location || "ไม่ระบุสถานที่"}</p>
                            <p>📅 {formatDate(itemDate)}</p>
                          </div>
                        </div>
                      </div>

                      {item.status === "rejected" && item.staff_note && (
                        <div className="mx-4 sm:mx-5 mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs sm:text-sm text-red-700">
                          <span className="font-extrabold">เหตุผลจาก Staff: </span>
                          {item.staff_note}
                        </div>
                      )}

                      <div className="border-t border-slate-100 bg-[#fbfdff] px-4 sm:px-5 py-3.5 flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                          รหัส #{item.id}
                        </span>

                        {canOpen ? (
                          <button
                            type="button"
                            onClick={() => onOpenPost?.({ id: item.id, type: item.type })}
                            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                              isLost ? "bg-[#ef7777]" : "bg-[#67c5b5]"
                            }`}
                          >
                            ดูรายละเอียด →
                          </button>
                        ) : (
                          <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                            ดูรายละเอียดได้หลังอนุมัติ
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t border-blue-100 bg-white/30 px-4 py-7 text-center text-xs sm:text-sm text-slate-500">
        © 2026 TAMKUEN LOST&FOUND <span className="hidden sm:inline">—</span>
        <br className="sm:hidden" /> พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้
      </footer>
    </div>
  );
}

export default MyItems;
