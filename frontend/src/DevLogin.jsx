import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function DevLogin({ onBack, onLogin }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_BASE}/api/auth/dev-users`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "ไม่สามารถโหลดบัญชีทดสอบได้");
        }
        setUsers(data.users || []);
      } catch (err) {
        setError(err.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUserId) {
      setError("กรุณาเลือกบัญชีที่ต้องการทดสอบ");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const response = await fetch(`${API_BASE}/api/auth/dev-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(selectedUserId) }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "เข้าสู่ระบบทดสอบไม่สำเร็จ");
      }
      onLogin(data);
    } catch (err) {
      setError(err.message || "เข้าสู่ระบบทดสอบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaf3ff] text-[#334155] flex flex-col">
      <header className="bg-[#5b9bea] shadow-sm">
        <div className="max-w-4xl mx-auto min-h-[76px] px-4 sm:px-6 flex items-center justify-between gap-3">
          <button type="button" onClick={onBack}>
            <img src="/image/back2you.png" alt="Back2You" className="w-[105px] sm:w-[118px] h-auto" />
          </button>
          <button type="button" onClick={onBack} className="rounded-full bg-white/15 border border-white/30 px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-[#5b9bea] transition">
            ← กลับหน้า Login
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-10 flex items-start justify-center">
        <form onSubmit={handleSubmit} className="w-full rounded-[26px] bg-white border border-blue-100 p-6 sm:p-8 shadow-[0_12px_35px_rgba(51,65,85,0.08)]">
          <div className="text-center">
            <div className="text-5xl">🧪</div>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-700">เข้าสู่ระบบสำหรับทดสอบ</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">เลือกบัญชีจากฐานข้อมูลเพื่อทดสอบ User A / User B โดยไม่ต้องส่ง Magic Link</p>
          </div>

          <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-100 p-4 text-xs leading-6 text-amber-700">
            ⚠️ หน้านี้มีไว้สำหรับ Development เท่านั้น Backend จะปิด Dev Login อัตโนมัติเมื่อ NODE_ENV=production
          </div>

          {error && <div className="mt-5 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm font-semibold text-red-600">{error}</div>}

          <label className="block mt-6 text-sm font-extrabold text-slate-700">บัญชีทดสอบ</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={loading || submitting}
            className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3 text-sm outline-none focus:border-[#5b9bea]"
          >
            <option value="">{loading ? "กำลังโหลดบัญชี..." : "-- เลือก User --"}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                #{user.id} - {user.name} ({user.email}) {Number(user.roleId) === 1 ? "[User]" : Number(user.roleId) === 2 ? "[Staff]" : "[Admin]"}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading || submitting || !selectedUserId}
            className="mt-6 w-full rounded-full bg-[#5b9bea] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#4d8bd9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วยบัญชีนี้"}
          </button>
        </form>
      </main>

      <footer className="border-t border-blue-100 bg-white/30 py-5 text-center text-xs text-slate-400">
        © 2026 TAMKUEN LOST&FOUND — พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้
      </footer>
    </div>
  );
}

export default DevLogin;
