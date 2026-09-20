import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function ClaimForm({ user, item, onBack, onSuccess, onLogout }) {
  const [message, setMessage] = useState("");
  const [proofDescription, setProofDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const firstLetter = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    setError("");
    if (selected.length > 3) { setError("อัปโหลดหลักฐานได้สูงสุด 3 รูป"); event.target.value = ""; return; }
    const invalid = selected.find((file) => !["image/jpeg", "image/jpg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) { setError("รองรับเฉพาะ JPG/PNG และแต่ละรูปต้องไม่เกิน 5MB"); event.target.value = ""; return; }
    setFiles(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) { setError("กรุณาอธิบายว่าทำไมคุณจึงคิดว่าสิ่งของนี้เป็นของคุณ"); return; }
    const token = localStorage.getItem("back2you_token");
    if (!token) { setError("กรุณาเข้าสู่ระบบใหม่"); return; }
    try {
      setSubmitting(true); setError("");
      const formData = new FormData();
      formData.append("foundItemId", String(item.id));
      formData.append("message", cleanMessage);
      formData.append("proofDescription", proofDescription.trim());
      files.forEach((file) => formData.append("proofs", file));
      const response = await fetch(`${API_BASE}/api/claims`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ส่งคำขอไม่สำเร็จ");
      alert(data.message || "ส่งคำขอเรียบร้อยแล้ว");
      onSuccess?.();
    } catch (err) { setError(err.message || "ไม่สามารถส่งคำขอได้"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#eaf3ff] text-[#334155] flex flex-col">
      <header className="bg-[#5b9bea] shadow-sm">
        <div className="max-w-[1000px] mx-auto min-h-[76px] px-4 sm:px-6 flex items-center justify-between gap-3">
          <button type="button" onClick={onBack}><img src="/image/back2you.png" alt="Back2You" className="w-[105px] sm:w-[118px] h-auto" /></button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#a978df] text-white flex items-center justify-center font-extrabold">{firstLetter}</div>
            <button type="button" onClick={onLogout} className="h-10 px-3 sm:px-4 rounded-full bg-white/15 border border-white/30 text-white text-xs sm:text-sm font-bold hover:bg-white hover:text-[#5b9bea] transition">ออกจากระบบ</button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[760px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button type="button" onClick={onBack} className="text-sm font-bold text-[#397fd2] hover:-translate-x-1 transition">← กลับรายละเอียดประกาศ</button>
        <form onSubmit={handleSubmit} className="mt-5 rounded-[24px] bg-white border border-blue-100 shadow-[0_12px_35px_rgba(51,65,85,0.08)] p-5 sm:p-8">
          <div className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700">📦 ขอรับของคืน</div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-700">{item?.title || "ของที่พบ"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">อธิบายจุดสังเกตหรือข้อมูลที่ช่วยยืนยันความเป็นเจ้าของ โดยหลีกเลี่ยงการส่งข้อมูลส่วนตัวที่ไม่จำเป็น</p>

          <label className="block mt-7 text-sm font-extrabold text-slate-700">รายละเอียดที่ยืนยันว่าเป็นของคุณ <span className="text-red-400">*</span></label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={1500} placeholder="เช่น ลักษณะเฉพาะของสิ่งของ ตำหนิ หรือรายละเอียดที่เจ้าของควรรู้..." className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3 text-sm outline-none focus:border-[#5b9bea]" />
          <div className="mt-1 text-right text-xs text-slate-400">{message.length}/1500</div>

          <label className="block mt-5 text-sm font-extrabold text-slate-700">คำอธิบายหลักฐาน</label>
          <textarea value={proofDescription} onChange={(e) => setProofDescription(e.target.value)} rows={3} maxLength={500} placeholder="อธิบายว่ารูปหลักฐานเกี่ยวข้องอย่างไร (ถ้ามี)" className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3 text-sm outline-none focus:border-[#5b9bea]" />

          <label className="block mt-5 text-sm font-extrabold text-slate-700">รูปหลักฐาน (ไม่บังคับ สูงสุด 3 รูป)</label>
          <input type="file" accept="image/jpeg,image/png" multiple onChange={handleFiles} className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#5b9bea] file:px-4 file:py-2.5 file:font-bold file:text-white" />
          {files.length > 0 && <div className="mt-3 space-y-2">{files.map((file) => <div key={`${file.name}-${file.size}`} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">📎 {file.name}</div>)}</div>}

          {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}

          <div className="mt-7 rounded-2xl bg-[#edf5ff] p-4 text-xs leading-6 text-slate-500">🛡️ คำขอและหลักฐานจะถูกส่งให้ Staff ตรวจสอบ การส่งคำขอไม่ได้หมายความว่าจะได้รับของคืนทันที</div>
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={onBack} disabled={submitting} className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600">ยกเลิก</button>
            <button type="submit" disabled={submitting} className="rounded-full bg-[#67c5b5] px-7 py-3 text-sm font-extrabold text-white disabled:opacity-60">{submitting ? "กำลังส่ง..." : "ส่งคำขอให้ Staff ตรวจสอบ"}</button>
          </div>
        </form>
      </main>
      <footer className="py-6 px-4 text-center text-[11px] sm:text-xs text-slate-400">© 2026 TAMKUEN LOST&FOUND — พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้</footer>
    </div>
  );
}

export default ClaimForm;
