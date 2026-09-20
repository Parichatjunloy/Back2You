import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function StaffClaimReview({ claimId, user, onBack, onReviewed, onLogout }) {
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffNote, setStaffNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const firstLetter = user?.name?.trim()?.charAt(0)?.toUpperCase() || "S";

  useEffect(() => {
    const loadClaim = async () => {
      const token = localStorage.getItem("back2you_token");
      if (!token) {
        onLogout();
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_BASE}/api/staff/claims/${claimId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            onLogout();
            return;
          }
          throw new Error(data.message || "ไม่สามารถโหลดรายละเอียด Claim ได้");
        }
        setClaim(data.claim);
        setStaffNote(data.claim?.staff_note || "");
      } catch (err) {
        setError(err.message || "ไม่สามารถโหลดรายละเอียด Claim ได้");
      } finally {
        setLoading(false);
      }
    };

    loadClaim();
  }, [claimId, onLogout]);

  const getImageUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${API_BASE}${value.startsWith("/") ? value : `/${value}`}`;
  };

  const reviewClaim = async (status) => {
    if (submitting) return;
    if (status === "rejected" && !staffNote.trim()) {
      alert("กรุณาระบุเหตุผลที่ปฏิเสธ");
      return;
    }

    const label = status === "approved" ? "อนุมัติ" : "ปฏิเสธ";
    if (!window.confirm(`ยืนยันการ${label}คำขอนี้หรือไม่?`)) return;

    const token = localStorage.getItem("back2you_token");
    if (!token) {
      onLogout();
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/api/staff/claims/${claimId}/review`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, staffNote: staffNote.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ไม่สามารถตรวจสอบ Claim ได้");
      alert(data.message || "บันทึกผลเรียบร้อยแล้ว");
      onReviewed?.();
    } catch (err) {
      alert(err.message || "ไม่สามารถตรวจสอบ Claim ได้");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaf3ff] text-[#334155] flex flex-col">
      <header className="sticky top-0 z-40 bg-[#5b9bea] shadow-sm">
        <div className="max-w-[1100px] mx-auto min-h-[76px] px-4 sm:px-6 flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="shrink-0">
            <img src="/image/back2you.png" alt="Back2You" className="w-[105px] sm:w-[118px] h-auto" />
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-white rounded-full py-1.5 pl-1.5 pr-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#a978df] text-white flex items-center justify-center font-extrabold">{firstLetter}</div>
              <div><p className="text-sm font-bold">{user?.name || "Staff"}</p><p className="text-[10px] text-slate-400">Staff</p></div>
            </div>
            <button type="button" onClick={onLogout} className="h-10 px-4 rounded-full bg-white/15 border border-white/30 text-white text-sm font-bold hover:bg-white hover:text-[#5b9bea]">ออกจากระบบ</button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button type="button" onClick={onBack} className="text-sm font-bold text-[#397fd2] hover:-translate-x-1 transition">← กลับ Staff Dashboard</button>

        {loading && <div className="mt-5 min-h-[360px] bg-white rounded-[24px] border border-blue-100 flex items-center justify-center text-slate-500">กำลังโหลดรายละเอียด Claim...</div>}
        {!loading && error && <div className="mt-5 p-8 bg-white rounded-[24px] border border-red-100 text-center"><div className="text-4xl">⚠️</div><p className="font-bold mt-3">{error}</p></div>}

        {!loading && !error && claim && (
          <div className="mt-5 space-y-5">
            <section className="bg-white rounded-[24px] border border-blue-100 shadow-sm p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-[#5b9bea]">CLAIM #{String(claim.id).padStart(4, "0")}</p>
                  <h1 className="text-2xl font-extrabold text-slate-700 mt-2">คำขอรับของคืน</h1>
                  <p className="text-sm text-slate-500 mt-1">ตรวจสอบข้อมูลผู้ขอและหลักฐานก่อนอนุมัติ</p>
                </div>
                <span className="self-start rounded-full bg-yellow-100 text-yellow-700 px-4 py-2 text-xs font-bold">● {claim.status === "pending" ? "รอตรวจสอบ" : claim.status}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <Info label="สิ่งของที่ขอรับคืน" value={claim.found_item_title} />
                <Info label="รหัสประกาศ Found" value={`FD-${String(claim.found_item_id).padStart(4, "0")}`} />
                <Info label="ผู้ขอรับคืน" value={claim.claimant_name} />
                <Info label="อีเมล" value={claim.claimant_email} />
                <Info label="เบอร์โทร" value={claim.claimant_phone || "ไม่ระบุ"} />
                <Info label="สถานที่พบ" value={claim.found_item_location || "-"} />
              </div>

              <div className="mt-5 rounded-2xl bg-[#f8fbff] border border-blue-100 p-4">
                <p className="text-xs font-extrabold text-slate-500">ข้อความจากผู้ขอรับคืน</p>
                <p className="text-sm leading-7 text-slate-700 mt-2 whitespace-pre-wrap">{claim.message || "-"}</p>
              </div>

              {claim.found_item_description && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-extrabold text-slate-500">รายละเอียดประกาศของที่พบ</p>
                  <p className="text-sm leading-7 text-slate-600 mt-2 whitespace-pre-wrap">{claim.found_item_description}</p>
                </div>
              )}
            </section>

            <section className="bg-white rounded-[24px] border border-blue-100 shadow-sm p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div><h2 className="text-lg font-extrabold">หลักฐานความเป็นเจ้าของ</h2><p className="text-sm text-slate-500 mt-1">รูปที่ผู้ใช้แนบมากับ Claim</p></div>
                <span className="rounded-full bg-[#edf5ff] px-3 py-1.5 text-xs font-bold text-[#397fd2]">{claim.proofs?.length || 0} รูป</span>
              </div>

              {claim.proofs?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                  {claim.proofs.map((proof) => (
                    <div key={proof.id} className="overflow-hidden rounded-2xl border border-blue-100 bg-[#f8fbff]">
                      <a href={getImageUrl(proof.file_path)} target="_blank" rel="noreferrer" className="block aspect-[4/3] bg-slate-100">
                        <img src={getImageUrl(proof.file_path)} alt="หลักฐานความเป็นเจ้าของ" className="w-full h-full object-cover" />
                      </a>
                      <div className="p-3"><p className="text-xs text-slate-500 leading-5">{proof.description || "ไม่มีคำอธิบายเพิ่มเติม"}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-yellow-50 border border-yellow-100 p-5 text-sm text-yellow-700">ผู้ใช้ไม่ได้แนบรูปหลักฐาน</div>
              )}
            </section>

            {claim.status === "pending" && (
              <section className="bg-white rounded-[24px] border border-blue-100 shadow-sm p-5 sm:p-7">
                <h2 className="text-lg font-extrabold">ผลการตรวจสอบ</h2>
                <p className="text-sm text-slate-500 mt-1">หากปฏิเสธ กรุณาระบุเหตุผลเพื่อให้ผู้ใช้ทราบ</p>
                <textarea value={staffNote} onChange={(e) => setStaffNote(e.target.value)} rows={4} placeholder="หมายเหตุจาก Staff / เหตุผลที่ปฏิเสธ" className="w-full mt-4 rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3 text-sm outline-none focus:border-[#5b9bea] resize-none" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <button type="button" disabled={submitting} onClick={() => reviewClaim("rejected")} className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 font-bold text-[#ef7777] disabled:opacity-50">✕ ปฏิเสธคำขอ</button>
                  <button type="button" disabled={submitting} onClick={() => reviewClaim("approved")} className="rounded-2xl bg-[#67c5b5] px-5 py-3.5 font-bold text-white disabled:opacity-50">✓ อนุมัติคำขอ</button>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-blue-100 bg-white/30"><div className="max-w-[1000px] mx-auto px-5 py-5 text-center text-[11px] text-slate-400">© 2026 TAMKUEN LOST&FOUND — พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้</div></footer>
    </div>
  );
}

function Info({ label, value }) {
  return <div className="rounded-2xl bg-[#edf5ff] p-4"><p className="text-[11px] font-bold text-slate-400">{label}</p><p className="text-sm font-bold text-slate-700 mt-1 break-words">{value || "-"}</p></div>;
}

export default StaffClaimReview;
