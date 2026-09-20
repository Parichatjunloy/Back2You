import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function MyReturns({ user, onBack, onLogout }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  const token = localStorage.getItem("back2you_token");

  const loadReturns = useCallback(async () => {
    if (!token) {
      onLogout?.();
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/my-returns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          onLogout?.();
          return;
        }

        throw new Error(
          data.message || "ไม่สามารถโหลดรายการคืนของได้"
        );
      }

      setReturns(data.returns || []);
    } catch (error) {
      alert(error.message || "ไม่สามารถโหลดรายการคืนของได้");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const handleConfirm = async (item) => {
    const confirmed = window.confirm(
      `ยืนยันว่าคุณได้รับ "${item.found_item_title}" คืนแล้วใช่หรือไม่?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setConfirmingId(item.id);

      const response = await fetch(
        `${API_BASE}/api/my-returns/${item.id}/confirm`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "ไม่สามารถยืนยันการรับของได้"
        );
      }

      alert(data.message || "ยืนยันการรับของคืนเรียบร้อยแล้ว");
      await loadReturns();
    } catch (error) {
      alert(error.message || "ไม่สามารถยืนยันการรับของได้");
    } finally {
      setConfirmingId(null);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    return `${API_BASE}${
      imagePath.startsWith("/") ? imagePath : `/${imagePath}`
    }`;
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const statusInfo = (status) => {
    if (status === "completed") {
      return {
        label: "รับของคืนแล้ว",
        className: "bg-emerald-50 text-emerald-700",
      };
    }

    if (status === "cancelled") {
      return {
        label: "นัดถูกยกเลิก",
        className: "bg-red-50 text-red-600",
      };
    }

    return {
      label: "รอรับของ",
      className: "bg-blue-50 text-[#397fd2]",
    };
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf3ff] text-[#334155] flex flex-col">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-[150px] h-64 w-64 rounded-full bg-[#a978df]/20" />
        <div className="absolute -right-28 top-[330px] h-80 w-80 rounded-full bg-[#5b9bea]/18" />
        <div className="absolute left-[7%] top-[760px] h-32 w-32 rounded-full bg-[#f8cf4b]/22" />
        <div className="absolute right-[8%] bottom-[100px] h-44 w-44 rounded-full bg-[#67c5b5]/16" />
      </div>

      <header className="relative z-20 bg-[#5b9bea] border-b border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[72px] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 transition hover:scale-[1.03]"
            aria-label="กลับหน้าหลัก"
          >
            <img
              src="/image/back2you.png"
              alt="Back2You"
              className="w-20 sm:w-24 md:w-28 h-auto"
            />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/90 rounded-full pl-2 pr-4 py-1.5">
              <div className="w-8 h-8 rounded-full bg-[#a978df] text-white flex items-center justify-center font-bold">
                {user?.name?.trim()?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-bold max-w-[160px] truncate">
                {user?.name || "ผู้ใช้"}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="bg-white rounded-full px-4 py-2 text-sm font-bold hover:bg-blue-50 transition"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-[1050px] mx-auto px-4 sm:px-6 py-6 sm:py-9">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="h-1.5 bg-gradient-to-r from-[#a978df] via-[#5b9bea] to-[#67c5b5]" />

          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full border border-slate-300 bg-[#edf5ff] px-4 py-2 text-[11px] font-extrabold tracking-[0.12em] text-[#397fd2]">
                  BACK2YOU
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-slate-700">
                  การคืนของของฉัน
                </h1>

                <p className="mt-2 max-w-[580px] text-xs sm:text-sm leading-6 text-slate-500">
                  ตรวจสอบวันเวลาและสถานที่นัดรับของ
                  และยืนยันเมื่อคุณได้รับของคืนเรียบร้อยแล้ว
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

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-blue-100 bg-[#f8fbff] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b9bea]/10 text-xl">
                    📋
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400">รายการทั้งหมด</p>
                    <p className="mt-0.5 text-xl font-extrabold text-slate-700">
                      {returns.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-[#f8fbff] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    🕒
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400">รอรับของ</p>
                    <p className="mt-0.5 text-xl font-extrabold text-[#397fd2]">
                      {returns.filter((item) => item.status === "scheduled").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-[#f8fffd] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                    ✓
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400">รับคืนแล้ว</p>
                    <p className="mt-0.5 text-xl font-extrabold text-[#49a997]">
                      {returns.filter((item) => item.status === "completed").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 min-h-[300px] rounded-xl border border-blue-100 bg-[#f8fbff] flex flex-col items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#5b9bea]" />
                <p className="mt-4 text-sm font-bold text-slate-400">
                  กำลังโหลดรายการ...
                </p>
              </div>
            ) : returns.length === 0 ? (
              <div className="mt-6 min-h-[300px] rounded-xl border-2 border-dashed border-blue-100 bg-[#f8fbff] flex items-center justify-center px-4 text-center">
                <div>
                  <div className="text-5xl">📦</div>
                  <p className="mt-3 text-lg font-extrabold text-slate-600">
                    ยังไม่มีรายการคืนของ
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    เมื่อ Staff สร้างนัดคืน รายการจะแสดงที่หน้านี้
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {returns.map((item) => {
                  const status = statusInfo(item.status);
                  const imageUrl = getImageUrl(item.found_item_image);
                  const isCompleted = item.status === "completed";
                  const isCancelled = item.status === "cancelled";

                  return (
                    <article
                      key={item.id}
                      className={`group overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        isCompleted
                          ? "border-emerald-100"
                          : isCancelled
                            ? "border-red-100"
                            : "border-blue-100"
                      }`}
                    >
                      <div
                        className={`h-1 ${
                          isCompleted
                            ? "bg-[#67c5b5]"
                            : isCancelled
                              ? "bg-[#ef7777]"
                              : "bg-[#5b9bea]"
                        }`}
                      />

                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                          <div className="w-full sm:w-32 h-44 sm:h-32 rounded-xl bg-[#edf5ff] overflow-hidden shrink-0 border border-slate-100">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.found_item_title}
                                className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.03]"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">
                                📦
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] sm:text-xs font-extrabold text-[#49a997]">
                                    📦 ของที่พบ
                                  </span>
                                  <span className={`rounded-full px-3 py-1 text-[10px] sm:text-xs font-extrabold ${status.className}`}>
                                    {status.label}
                                  </span>
                                </div>

                                <h2 className="mt-3 truncate text-lg sm:text-xl font-extrabold text-slate-700">
                                  {item.found_item_title}
                                </h2>

                                <p className="mt-1 text-[11px] sm:text-xs font-bold text-slate-400">
                                  Return #{item.id} · Claim #{item.claim_id}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="rounded-xl bg-[#f8fbff] p-3">
                                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                  วันเวลานัด
                                </p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-slate-600">
                                  📅 {formatDateTime(item.return_date)}
                                </p>
                              </div>

                              <div className="rounded-xl bg-[#f8fbff] p-3">
                                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                  ผู้รับ
                                </p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-slate-600">
                                  👤 {item.receiver_name || "-"}
                                </p>
                              </div>

                              <div className="md:col-span-2 rounded-xl bg-[#f8fbff] p-3">
                                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                  สถานที่นัดรับ
                                </p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-slate-600">
                                  📍 {item.return_location || "-"}
                                </p>
                              </div>
                            </div>

                            {item.note && (
                              <div className="mt-3 rounded-xl border border-amber-100 bg-[#fff9df] p-3 text-xs sm:text-sm text-slate-600">
                                <span className="font-extrabold text-slate-700">📝 หมายเหตุ: </span>
                                {item.note}
                              </div>
                            )}

                            {item.status === "scheduled" &&
                              Number(item.user_confirmed) !== 1 && (
                                <div className="mt-4 rounded-xl border border-emerald-100 bg-[#f8fffd] p-4">
                                  <p className="text-xs leading-5 text-slate-500">
                                    เมื่อได้รับของจาก Staff เรียบร้อยแล้ว
                                    กรุณากดยืนยันเพื่อปิดรายการคืนของ
                                  </p>

                                  <button
                                    type="button"
                                    disabled={confirmingId === item.id}
                                    onClick={() => handleConfirm(item)}
                                    className="mt-3 w-full sm:w-auto rounded-xl bg-[#67c5b5] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                                  >
                                    {confirmingId === item.id
                                      ? "กำลังยืนยัน..."
                                      : "✓ ยืนยันว่าได้รับของคืนแล้ว"}
                                  </button>
                                </div>
                              )}

                            {item.status === "completed" && (
                              <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#67c5b5] font-extrabold text-white">
                                  ✓
                                </div>
                                <div>
                                  <p className="text-sm font-extrabold text-emerald-700">
                                    ยืนยันรับของเรียบร้อยแล้ว
                                  </p>
                                  {item.user_confirmed_at && (
                                    <p className="mt-1 text-xs text-emerald-600">
                                      ยืนยันเมื่อ {formatDateTime(item.user_confirmed_at)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {item.status === "cancelled" && (
                              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-xs sm:text-sm font-bold text-red-600">
                                นัดคืนรายการนี้ถูกยกเลิกแล้ว
                              </div>
                            )}
                          </div>
                        </div>
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
        © 2026 TAMKUEN LOST&FOUND — พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้
      </footer>
    </div>
  );
}

export default MyReturns;
