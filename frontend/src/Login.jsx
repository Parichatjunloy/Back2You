import { useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Login({ onBack, onGoRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("กรุณากรอกอีเมล");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      alert("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    if (!password) {
      alert("กรุณากรอกรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "ACCOUNT_NOT_FOUND") {
          const goRegister = window.confirm(
            "ไม่พบบัญชีอีเมลนี้\n\nต้องการไปหน้าสมัครสมาชิกหรือไม่?"
          );
          if (goRegister) onGoRegister?.();
          return;
        }

        alert(data.message || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      localStorage.setItem("back2you_token", data.token);
      localStorage.setItem("back2you_user", JSON.stringify(data.user));

      // App.jsx จะอ่าน token/user และพาไปหน้าที่ถูกต้องตาม role
      window.location.reload();
    } catch (error) {
      console.error("Login Error:", error);
      alert(
        "ไม่สามารถเชื่อมต่อ Backend ได้\nกรุณาตรวจสอบว่า Backend เปิดอยู่"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf3ff] text-[#334155]">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-20 top-[140px] h-56 w-56 rounded-full bg-[#ef7777]/20" />
        <div className="absolute -right-24 top-[260px] h-72 w-72 rounded-full bg-[#67c5b5]/20" />
        <div className="absolute left-[10%] bottom-[90px] h-28 w-28 rounded-full bg-[#f8cf4b]/25" />
        <div className="absolute right-[12%] bottom-[50px] h-40 w-40 rounded-full bg-[#a978df]/15" />
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
        <section className="w-full max-w-[430px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#ef7777] via-[#f8cf4b] to-[#67c5b5]" />

          <div className="px-6 sm:px-9 py-7 sm:py-9">
            <div className="text-center">
              <div className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-[#edf5ff] px-5 py-2 text-[11px] font-extrabold tracking-[0.12em] text-[#397fd2]">
                BACK2YOU
              </div>

              <div className="mx-auto mt-5 w-14 h-14 rounded-full bg-[#5b9bea] flex items-center justify-center text-2xl shadow-sm">
                🔐
              </div>

              <h1 className="mt-4 text-2xl sm:text-[28px] font-extrabold text-slate-700">
                เข้าสู่ระบบ
              </h1>

              <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-500">
                กรอกอีเมลและรหัสผ่านที่ใช้สมัครสมาชิก
              </p>

              <div className="mt-5 rounded-full bg-[#f8cf4b] px-4 py-2 text-[11px] sm:text-xs font-bold text-slate-700">
                ✨ เข้าสู่ระบบเพื่อโพสต์และจัดการรายการของคุณ
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-semibold mb-2"
                >
                  อีเมล <span className="text-red-500">*</span>
                </label>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  disabled={loading}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="example@gmail.com"
                  autoComplete="email"
                  className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-[#edf5ff] outline-none text-sm focus:border-[#5b9bea] focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold mb-2"
                >
                  รหัสผ่าน <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={loading}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="กรอกรหัสผ่าน"
                    autoComplete="current-password"
                    className="w-full h-12 px-4 pr-16 rounded-xl border border-slate-300 bg-[#edf5ff] outline-none text-sm focus:border-[#5b9bea] focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
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
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 mt-7 rounded-xl bg-[#5b9bea] text-white text-sm sm:text-base font-bold shadow-sm hover:bg-[#4d8bd9] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

            <div className="mt-7 rounded-xl border border-slate-200 bg-[#f8fbff] px-4 py-4 text-center">
              <p className="text-sm text-slate-500">
                ยังไม่มีบัญชี Back2You?
              </p>

              <button
                type="button"
                onClick={onGoRegister}
                className="mt-2 inline-flex rounded-full bg-white border border-[#5b9bea] px-5 py-2 text-[#4b8cdd] font-bold text-sm transition hover:bg-[#edf5ff]"
              >
                สมัครสมาชิก
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
