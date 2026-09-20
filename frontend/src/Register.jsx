import { useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Register({ onBack, onGoLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanConfirmEmail = confirmEmail.trim().toLowerCase();

    if (!cleanName) {
      alert("กรุณากรอกชื่อของคุณ");
      return;
    }

    if (cleanName.length > 100) {
      alert("ชื่อต้องไม่เกิน 100 ตัวอักษร");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailPattern.test(cleanEmail)) {
      alert("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    if (!cleanConfirmEmail) {
      alert("กรุณายืนยันอีเมล");
      return;
    }

    if (cleanEmail !== cleanConfirmEmail) {
      alert("อีเมลทั้งสองช่องไม่ตรงกัน");
      return;
    }

    if (password.length < 8) {
      alert("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (password.length > 72) {
      alert("รหัสผ่านต้องไม่เกิน 72 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      alert("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      alert(
        "สมัครสมาชิกสำเร็จ! 🎉\n\nใช้อีเมลและรหัสผ่านนี้เพื่อเข้าสู่ระบบได้เลย"
      );

      setName("");
      setEmail("");
      setConfirmEmail("");
      setPassword("");
      setConfirmPassword("");

      onGoLogin?.();
    } catch (error) {
      console.error("Register Error:", error);
      alert(
        "ไม่สามารถเชื่อมต่อ Backend ได้\nกรุณาตรวจสอบว่า Backend เปิดอยู่"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading) {
      handleRegister();
    }
  };

  const inputClass =
    "w-full h-11 px-4 rounded-xl border border-slate-300 bg-[#edf5ff] outline-none text-sm focus:border-[#5b9bea] focus:ring-2 focus:ring-blue-200 disabled:opacity-60";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf3ff] text-[#334155]">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-20 top-[140px] h-56 w-56 rounded-full bg-[#ef7777]/20" />
        <div className="absolute -right-24 top-[280px] h-72 w-72 rounded-full bg-[#67c5b5]/20" />
        <div className="absolute left-[9%] bottom-[100px] h-28 w-28 rounded-full bg-[#f8cf4b]/25" />
        <div className="absolute right-[11%] bottom-[45px] h-40 w-40 rounded-full bg-[#a978df]/15" />
      </div>

      <header className="relative z-20 bg-[#5b9bea] border-b border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-[75px] flex items-center">
            <button
              type="button"
              onClick={onBack}
              className="group absolute left-0 inline-flex h-10 sm:h-11 items-center gap-2 rounded-full border border-white/70 bg-white/95 px-3 sm:px-4 text-[#397fd2] shadow-[0_4px_14px_rgba(30,64,175,0.14)] transition-all duration-200 hover:-translate-x-0.5 hover:bg-white hover:shadow-[0_6px_18px_rgba(30,64,175,0.20)] active:translate-y-px"
              aria-label="ย้อนกลับ"
              title="ย้อนกลับ"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eaf3ff] text-base font-extrabold transition-transform duration-200 group-hover:-translate-x-0.5">
                ←
              </span>
              <span className="hidden sm:inline text-sm font-extrabold">
                ย้อนกลับ
              </span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="mx-auto shrink-0 transition hover:scale-[1.02]"
              aria-label="กลับหน้าแรก"
            >
              <img
                src="/image/back2you.png"
                alt="Back2You"
                className="w-20 sm:w-24 md:w-28 h-auto"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-[calc(100vh-75px)] flex items-start justify-center px-4 py-8 sm:py-12">
        <section className="w-full max-w-[450px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#ef7777] via-[#f8cf4b] to-[#67c5b5]" />

          <div className="px-6 sm:px-9 py-7 sm:py-9">
            <div className="text-center">
              <div className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-[#edf5ff] px-5 py-2 text-[11px] font-extrabold tracking-[0.12em] text-[#397fd2]">
                BACK2YOU
              </div>

              <div className="w-14 h-14 mx-auto mt-5 rounded-full bg-[#67c5b5] flex items-center justify-center text-2xl shadow-sm">
                👤
              </div>

              <h1 className="mt-4 text-2xl sm:text-[28px] font-extrabold text-slate-700">
                สมัครสมาชิก
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-6">
                สร้างบัญชี Back2You เพื่อแจ้งของหาย
                <br />
                และช่วยนำของกลับคืนสู่เจ้าของ
              </p>

              <div className="mt-5 rounded-full bg-[#f8cf4b] px-4 py-2 text-[11px] sm:text-xs font-bold text-slate-700">
                ✨ สมัครครั้งเดียว แล้วใช้อีเมลและรหัสผ่านเข้าสู่ระบบได้เลย
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <label htmlFor="register-name" className="block text-sm font-semibold mb-2">
                  ชื่อของคุณ <span className="text-red-500">*</span>
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  disabled={loading}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="เช่น สมชาย ใจดี"
                  autoComplete="name"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-semibold mb-2">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  disabled={loading}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="example@gmail.com"
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="confirm-email" className="block text-sm font-semibold mb-2">
                  ยืนยันอีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirm-email"
                  type="email"
                  value={confirmEmail}
                  disabled={loading}
                  onChange={(event) => setConfirmEmail(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="กรอกอีเมลอีกครั้ง"
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-semibold mb-2">
                  รหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={loading}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    autoComplete="new-password"
                    className={`${inputClass} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    className="absolute inset-y-0 right-3 text-xs font-bold text-[#397fd2] disabled:opacity-60"
                  >
                    {showPassword ? "ซ่อน" : "แสดง"}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold mb-2">
                  ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  disabled={loading}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และระบบจะจัดเก็บแบบเข้ารหัส
            </p>

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="w-full h-12 mt-6 rounded-xl bg-[#5b9bea] text-white text-base font-bold hover:bg-[#4b8cdd] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </button>

            <div className="mt-7 rounded-xl border border-slate-200 bg-[#f8fbff] px-4 py-4 text-center">
              <p className="text-sm text-slate-500">
                มีบัญชี Back2You อยู่แล้ว?
              </p>

              <button
                type="button"
                onClick={onGoLogin}
                className="mt-2 inline-flex rounded-full bg-white border border-[#5b9bea] px-5 py-2 text-[#4b8cdd] font-bold text-sm transition hover:bg-[#edf5ff]"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Register;
