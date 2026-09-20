import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Profile({ user, onBack, onLogout, onUserUpdated }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    lostItems: 0,
    foundItems: 0,
    claims: 0,
    completedReturns: 0,
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const token = localStorage.getItem("back2you_token");

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${API_BASE}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดโปรไฟล์ได้");
      }

      setProfile(data.profile);
      setStats(data.stats || {});
      setName(data.profile?.name || "");
      setPhone(data.profile?.phone || "");
    } catch (err) {
      setError(err.message || "ไม่สามารถโหลดโปรไฟล์ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const syncUser = (changes) => {
    const nextUser = { ...user, ...changes };
    localStorage.setItem("back2you_user", JSON.stringify(nextUser));
    onUserUpdated?.(nextUser);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_BASE}/api/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถบันทึกโปรไฟล์ได้");
      }

      setProfile((current) => ({
        ...current,
        name: data.user.name,
        phone: data.user.phone,
      }));
      syncUser({
        name: data.user.name,
        phone: data.user.phone,
        profileImage: data.user.profileImage,
      });
      alert("บันทึกโปรไฟล์เรียบร้อยแล้ว");
    } catch (err) {
      setError(err.message || "ไม่สามารถบันทึกโปรไฟล์ได้");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImageSaving(true);
      setError("");

      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await fetch(`${API_BASE}/api/profile/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถเปลี่ยนรูปโปรไฟล์ได้");
      }

      setProfile((current) => ({
        ...current,
        profileImage: data.profileImage,
      }));
      syncUser({ profileImage: data.profileImage });
    } catch (err) {
      setError(err.message || "ไม่สามารถเปลี่ยนรูปโปรไฟล์ได้");
    } finally {
      setImageSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const firstLetter =
    profile?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <div className="min-h-screen bg-[#eaf3ff] text-[#334155] flex flex-col">
      <header className="sticky top-0 z-40 bg-[#5b9bea] shadow-[0_2px_12px_rgba(30,64,175,0.12)]">
        <div className="max-w-[1100px] mx-auto min-h-[76px] px-4 sm:px-6 flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="transition hover:scale-[1.03]">
            <img src="/image/back2you.png" alt="Back2You" className="w-[105px] sm:w-[118px] h-auto" />
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onBack} className="h-10 px-4 rounded-full bg-white text-[#397fd2] text-sm font-bold shadow-sm">
              ← หน้าหลัก
            </button>
            <button type="button" onClick={onLogout} className="h-10 px-4 rounded-full bg-white/15 border border-white/30 text-white text-sm font-bold hover:bg-white hover:text-[#5b9bea] transition">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-9">
        {loading ? (
          <div className="min-h-[420px] rounded-[28px] bg-white border border-blue-100 flex flex-col items-center justify-center shadow-sm">
            <div className="w-11 h-11 rounded-full border-4 border-blue-100 border-t-[#5b9bea] animate-spin" />
            <p className="mt-4 text-sm font-bold text-slate-400">กำลังโหลดโปรไฟล์...</p>
          </div>
        ) : (
          <>
            <section className="overflow-hidden rounded-[28px] bg-white border border-blue-100 shadow-[0_14px_40px_rgba(51,65,85,0.08)]">
              <div className="bg-gradient-to-r from-[#5b9bea] to-[#79b2f2] px-5 sm:px-8 py-7 text-white">
                <p className="text-xs font-extrabold text-white/75">BACK2YOU PROFILE</p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold">โปรไฟล์ของฉัน</h1>
                <p className="mt-1 text-sm text-white/80">จัดการข้อมูลบัญชีและดูภาพรวมการใช้งานของคุณ</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
                <div className="p-6 sm:p-8 bg-[#f8fbff] border-b lg:border-b-0 lg:border-r border-blue-100">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      {profile?.profileImage ? (
                        <img
                          src={getImageUrl(profile.profileImage)}
                          alt="รูปโปรไฟล์"
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-[#a978df] text-white flex items-center justify-center text-5xl font-extrabold border-4 border-white shadow-lg">
                          {firstLetter}
                        </div>
                      )}
                      {imageSaving && (
                        <div className="absolute inset-0 rounded-full bg-slate-900/45 flex items-center justify-center text-white text-xs font-bold">
                          กำลังอัปโหลด
                        </div>
                      )}
                    </div>

                    <h2 className="mt-4 text-xl font-extrabold text-slate-700">{profile?.name}</h2>
                    <p className="mt-1 text-sm text-slate-400 break-all">{profile?.email}</p>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={imageSaving}
                      onClick={() => fileRef.current?.click()}
                      className="mt-5 rounded-full bg-[#edf5ff] px-5 py-2.5 text-sm font-extrabold text-[#397fd2] transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      📷 เปลี่ยนรูปโปรไฟล์
                    </button>
                    <p className="mt-2 text-[11px] text-slate-400">รองรับ JPG / PNG สูงสุด 5 MB</p>
                  </div>
                </div>

                <div className="p-5 sm:p-8">
                  {error && (
                    <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSave}>
                    <h2 className="text-lg font-extrabold text-slate-700">ข้อมูลส่วนตัว</h2>
                    <p className="mt-1 text-xs text-slate-400">อีเมลเป็นบัญชีสำหรับเข้าสู่ระบบ จึงไม่แก้ไขจากหน้านี้</p>

                    <div className="mt-6 grid grid-cols-1 gap-5">
                      <label className="block">
                        <span className="text-sm font-extrabold text-slate-600">ชื่อ</span>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          maxLength={100}
                          required
                          className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3.5 text-sm font-bold outline-none transition focus:border-[#5b9bea] focus:ring-4 focus:ring-blue-100"
                          placeholder="ชื่อของคุณ"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-extrabold text-slate-600">เบอร์โทร</span>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          maxLength={30}
                          className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3.5 text-sm font-bold outline-none transition focus:border-[#5b9bea] focus:ring-4 focus:ring-blue-100"
                          placeholder="เช่น 08x-xxx-xxxx"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-extrabold text-slate-600">อีเมล</span>
                        <input
                          value={profile?.email || ""}
                          disabled
                          className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-100 px-4 py-3.5 text-sm font-bold text-slate-400"
                        />
                      </label>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-full bg-[#5b9bea] px-7 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#4d8bd9] disabled:opacity-50"
                      >
                        {saving ? "กำลังบันทึก..." : "✓ บันทึกข้อมูล"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-700">ภาพรวมของฉัน</h2>
                  <p className="text-xs text-slate-400">ข้อมูลจากการใช้งานจริงใน Back2You</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon="🔎" value={stats.lostItems} label="ประกาศของหาย" />
                <StatCard icon="📦" value={stats.foundItems} label="ประกาศของพบ" />
                <StatCard icon="🧾" value={stats.claims} label="คำขอรับของคืน" />
                <StatCard icon="✅" value={stats.completedReturns} label="รับคืนสำเร็จ" />
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-blue-100 bg-white/70 px-4 py-5 text-center text-xs font-bold text-slate-400">
        © 2026 TAMKUEN LOST&FOUND — พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้
      </footer>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="rounded-[22px] border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
      <div className="text-2xl">{icon}</div>
      <p className="mt-3 text-2xl font-extrabold text-slate-700">{Number(value || 0)}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}

export default Profile;
