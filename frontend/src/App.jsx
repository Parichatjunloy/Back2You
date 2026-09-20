import { useEffect, useState } from "react";

import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import LostItem from "./LostItem";
import FoundItem from "./FoundItem";
import StaffHome from "./StaffHome";
import StaffReview from "./StaffReview";
import ItemDetail from "./ItemDetail";
import MyItems from "./MyItems";
import ClaimForm from "./ClaimForm";
import StaffClaimReview from "./StaffClaimReview";
import StaffReturns from "./StaffReturns";
import MyReturns from "./MyReturns";
import Profile from "./Profile";
import AdminHome from "./AdminHome";

// ========================================
// Back2You
// App.jsx
//
// roleId 1 = User
// roleId 2 = Staff
// roleId 3 = Admin
// ========================================

function App() {
  // ========================================
  // USER
  // โหลดข้อมูล User จาก localStorage
  // ========================================

  const [user, setUser] = useState(() => {
    try {
      const savedUser =
        localStorage.getItem("back2you_user");

      if (!savedUser) {
        return null;
      }

      return JSON.parse(savedUser);
    } catch (error) {
      console.error(
        "อ่านข้อมูล User ไม่สำเร็จ:",
        error
      );

      localStorage.removeItem(
        "back2you_user"
      );

      localStorage.removeItem(
        "back2you_token"
      );

      return null;
    }
  });

  // ========================================
  // PAGE
  //
  // app
  // login
  // register
  // home
  // post
  // lost
  // found       ← เพิ่มใหม่
  // staff
  // staff-review
  // my-items
  // ========================================

  const [page, setPage] = useState(() => {
    try {
      const savedToken =
        localStorage.getItem(
          "back2you_token"
        );

      const savedUser =
        localStorage.getItem(
          "back2you_user"
        );

      if (
        !savedToken ||
        !savedUser
      ) {
        return "app";
      }

      const parsedUser =
        JSON.parse(savedUser);

      if (Number(parsedUser.roleId) === 3) {
        return "admin";
      }

      if (Number(parsedUser.roleId) === 2) {
        return "staff";
      }

      return "home";
    } catch (error) {
      console.error(
        "กำหนดหน้าเริ่มต้นไม่สำเร็จ:",
        error
      );

      return "app";
    }
  });

  // ========================================
  // STAFF REVIEW ID
  // ========================================

  const [
    staffReviewId,
    setStaffReviewId,
  ] = useState(null);

  // ========================================
  // STAFF REVIEW TYPE
  // lost / found
  // ========================================

  const [
    staffReviewType,
    setStaffReviewType,
  ] = useState("lost");

  // ========================================
  // SELECTED PUBLIC POST
  // ========================================

  const [selectedPost, setSelectedPost] = useState(null);
  const [claimItem, setClaimItem] = useState(null);
  const [staffClaimId, setStaffClaimId] = useState(null);

  // ========================================
  // MAGIC LINK LOADING
  // ========================================

  const [
    verifying,
    setVerifying,
  ] = useState(false);

  // ========================================
  // CHECK STAFF / ADMIN
  // ========================================

  const isStaff = (currentUser) => {
    const roleId =
      Number(currentUser?.roleId);

    return (
      roleId === 2 ||
      roleId === 3
    );
  };

  const isAdmin = (currentUser) => {
    return Number(currentUser?.roleId) === 3;
  };

  // ========================================
  // GO TO CORRECT PAGE BY ROLE
  // ========================================

  const goToUserPage = (
    currentUser
  ) => {
    if (isAdmin(currentUser)) {
      setPage("admin");
      return;
    }

    if (Number(currentUser?.roleId) === 2) {
      setStaffReviewId(null);
      setStaffReviewType("lost");
      setPage("staff");
      return;
    }

    setPage("home");
  };

  // ========================================
  // MAGIC LINK
  // ========================================

  useEffect(() => {
    const verifyMagicLink =
      async () => {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const magicToken =
          params.get("token");

        // ====================================
        // ไม่มี Magic Link
        // ====================================

        if (!magicToken) {
          return;
        }

        // ====================================
        // Login อยู่แล้ว
        // ไม่ Verify Magic Link ซ้ำ
        // ====================================

        const savedToken =
          localStorage.getItem(
            "back2you_token"
          );

        const savedUser =
          localStorage.getItem(
            "back2you_user"
          );

        if (
          savedToken &&
          savedUser
        ) {
          try {
            const parsedUser =
              JSON.parse(savedUser);

            // ลบ ?token=... ออกจาก URL
            window.history.replaceState(
              {},
              "",
              window.location.pathname
            );

            setUser(parsedUser);

            if (Number(parsedUser.roleId) === 3) {
              setPage("admin");
            } else if (Number(parsedUser.roleId) === 2) {
              setPage("staff");
            } else {
              setPage("home");
            }

            return;
          } catch (error) {
            console.error(
              "อ่านข้อมูล User ไม่สำเร็จ:",
              error
            );

            localStorage.removeItem(
              "back2you_token"
            );

            localStorage.removeItem(
              "back2you_user"
            );

            setUser(null);
          }
        }

        // ====================================
        // ยังไม่ได้ Login
        // ตรวจ Magic Link
        // ====================================

        try {
          setVerifying(true);

          const response =
            await fetch(
              `${API_BASE}/api/auth/verify-magic-link?token=${encodeURIComponent(
                magicToken
              )}`
            );

          const data =
            await response.json();

          // ==================================
          // Magic Link ใช้ไม่ได้
          // ==================================

          if (!response.ok) {
            window.history.replaceState(
              {},
              "",
              window.location.pathname
            );

            setUser(null);
            setPage("login");
            setVerifying(false);

            alert(
              data.message ||
                "Magic Link ไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่"
            );

            return;
          }

          // ==================================
          // Login สำเร็จ
          // ==================================

          localStorage.setItem(
            "back2you_token",
            data.token
          );

          localStorage.setItem(
            "back2you_user",
            JSON.stringify(
              data.user
            )
          );

          setUser(data.user);

          // ==================================
          // CHECK ROLE
          // ==================================

          if (Number(data.user.roleId) === 3) {
              setPage("admin");
            } else if (Number(data.user.roleId) === 2) {
              setPage("staff");
            } else {
              setPage("home");
            }

          // ลบ ?token=...
          window.history.replaceState(
            {},
            "",
            window.location.pathname
          );

          setVerifying(false);
        } catch (error) {
          console.error(
            "Verify Magic Link Error:",
            error
          );

          window.history.replaceState(
            {},
            "",
            window.location.pathname
          );

          setUser(null);
          setPage("login");
          setVerifying(false);

          alert(
            "ไม่สามารถเชื่อมต่อ Backend ได้ กรุณาตรวจสอบว่า Backend เปิดอยู่"
          );
        }
      };

    verifyMagicLink();
  }, []);

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem(
      "back2you_token"
    );

    localStorage.removeItem(
      "back2you_user"
    );

    setUser(null);

    setStaffReviewId(null);
    setStaffReviewType("lost");
    setSelectedPost(null);
    setClaimItem(null);
    setStaffClaimId(null);

    setPage("app");

    window.history.replaceState(
      {},
      "",
      window.location.pathname
    );
  };

  // ========================================
  // VERIFYING MAGIC LINK
  // ========================================

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#eaf3ff] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl px-8 py-8 shadow-sm text-center">
          <div className="text-4xl mb-4">
            🔐
          </div>

          <h1 className="text-xl font-bold text-[#334155]">
            กำลังเข้าสู่ระบบ...
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            กำลังตรวจสอบ Magic Link
          </p>
        </div>
      </div>
    );
  }


  // ========================================
  // ADMIN DASHBOARD
  // roleId 3 เท่านั้น
  // ========================================

  if (
    user &&
    isAdmin(user) &&
    page === "admin"
  ) {
    return (
      <AdminHome
        user={user}
        onLogout={handleLogout}
      />
    );
  }


  if (
    user &&
    isAdmin(user) &&
    page !== "admin"
  ) {
    return (
      <AdminHome
        user={user}
        onLogout={handleLogout}
      />
    );
  }


  // ========================================
  // STAFF RETURNS
  // ========================================

  if (
    user &&
    isStaff(user) &&
    page === "staff-returns"
  ) {
    return (
      <StaffReturns
        user={user}
        onBack={() => {
          setPage("staff");
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ========================================
  // STAFF CLAIM REVIEW
  // ========================================

  if (
    user &&
    isStaff(user) &&
    page === "staff-claim-review" &&
    staffClaimId
  ) {
    return (
      <StaffClaimReview
        claimId={staffClaimId}
        user={user}
        onBack={() => {
          setStaffClaimId(null);
          setPage("staff");
        }}
        onReviewed={() => {
          setStaffClaimId(null);
          setPage("staff");
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ========================================
  // STAFF REVIEW
  // ========================================

  if (
    user &&
    isStaff(user) &&
    page === "staff-review" &&
    staffReviewId
  ) {
    return (
      <StaffReview
        itemId={staffReviewId}
        itemType={staffReviewType}
        user={user}
        onBack={() => {
          setStaffReviewId(null);
          setStaffReviewType("lost");
          setPage("staff");
        }}
        onReviewed={() => {
          setStaffReviewId(null);
          setStaffReviewType("lost");
          setPage("staff");
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ========================================
  // STAFF HOME
  // ========================================

  if (
    user &&
    isStaff(user) &&
    page === "staff"
  ) {
    return (
      <StaffHome
        user={user}
        onLogout={handleLogout}
        onReturns={() => {
          setPage("staff-returns");
        }}
        onClaimReview={(claimId) => {
          setStaffClaimId(claimId);
          setPage("staff-claim-review");
        }}
        onReview={(itemId, itemType = "lost") => {
          setStaffReviewId(
            itemId
          );
          setStaffReviewType(
            itemType
          );

          setPage(
            "staff-review"
          );
        }}
      />
    );
  }

  // ========================================
  // ป้องกัน STAFF เข้า USER PAGE
  //
  // เพิ่ม found เข้าไปด้วย
  // ========================================

  if (
    user &&
    isStaff(user) &&
    (
      page === "home" ||
      page === "post" ||
      page === "lost" ||
      page === "found" ||
      page === "my-items" ||
      page === "item-detail" ||
      page === "claim" ||
      page === "profile"
    )
  ) {
    return (
      <StaffHome
        user={user}
        onLogout={handleLogout}
        onReturns={() => {
          setPage("staff-returns");
        }}
        onClaimReview={(claimId) => {
          setStaffClaimId(claimId);
          setPage("staff-claim-review");
        }}
        onReview={(itemId, itemType = "lost") => {
          setStaffReviewId(
            itemId
          );
          setStaffReviewType(
            itemType
          );

          setPage(
            "staff-review"
          );
        }}
      />
    );
  }


  // ========================================
  // PROFILE
  // USER เท่านั้น
  // ========================================

  if (
    user &&
    !isStaff(user) &&
    page === "profile"
  ) {
    return (
      <Profile
        user={user}
        onBack={() => {
          setPage("home");
        }}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
        }}
        onLogout={handleLogout}
      />
    );
  }


  // ========================================
  // MY RETURNS
  // USER เท่านั้น
  // ========================================

  if (
    user &&
    !isStaff(user) &&
    page === "my-returns"
  ) {
    return (
      <MyReturns
        user={user}
        onBack={() => {
          setPage("home");
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ========================================
  // MY ITEMS
  // USER เท่านั้น
  // ========================================

  if (
    user &&
    !isStaff(user) &&
    page === "my-items"
  ) {
    return (
      <MyItems
        user={user}
        onBack={() => {
          setPage("home");
        }}
        onOpenPost={(post) => {
          setSelectedPost({
            id: post.id,
            type: post.type,
          });
          setPage("item-detail");
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ========================================
  // CLAIM FORM
  // USER เท่านั้น
  // ========================================

  if (
    user &&
    !isStaff(user) &&
    page === "claim" &&
    claimItem
  ) {
    return (
      <ClaimForm
        user={user}
        item={claimItem}
        onBack={() => {
          setPage("item-detail");
        }}
        onSuccess={() => {
          setClaimItem(null);
          setSelectedPost(null);
          setPage("home");
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ========================================
  // ITEM DETAIL
  // USER เท่านั้น
  // ========================================

  if (
    user &&
    !isStaff(user) &&
    page === "item-detail" &&
    selectedPost
  ) {
    return (
      <ItemDetail
        user={user}
        itemId={selectedPost.id}
        itemType={selectedPost.type}
        onClaim={(item) => {
          setClaimItem(item);
          setPage("claim");
        }}
        onBack={() => {
          setSelectedPost(null);
          setPage("home");
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ========================================
  // POST CHOICE
  // USER เท่านั้น
  // เลือกระหว่างแจ้งของหาย / แจ้งพบของ
  // ========================================

  if (
    user &&
    !isStaff(user) &&
    page === "post"
  ) {
    return (
      <PostChoice
        onBack={() => {
          setPage("home");
        }}
        onGoPost={() => {
          setPage("post");
        }}
        onGoLost={() => {
          setPage("lost");
        }}
        onGoFound={() => {
          setPage("found");
        }}
      />
    );
  }


  // ========================================
  // LOST ITEM
  // USER เท่านั้น
  // ========================================

  if (
    user &&
    !isStaff(user) &&
    page === "lost"
  ) {
    return (
      <LostItem
        user={user}
        onBack={() => {
          setPage("home");
        }}
        onSuccess={() => {
          setPage("home");
        }}
        onLogout={
          handleLogout
        }
      />
    );
  }

  // ========================================
  // FOUND ITEM
  // USER เท่านั้น
  // ========================================

  if (
    user &&
    !isStaff(user) &&
    page === "found"
  ) {
    return (
      <FoundItem
        user={user}
        onBack={() => {
          setPage("home");
        }}
        onSuccess={() => {
          setPage("home");
        }}
        onLogout={
          handleLogout
        }
      />
    );
  }

  // ========================================
  // USER HOME
  // ========================================

  if (
    user &&
    !isStaff(user) &&
    page === "home"
  ) {
    return (
      <Home
        user={user}
        onLogout={
          handleLogout
        }
        onGoPost={() => {
          setPage("post");
        }}
        onGoLost={() => {
          setPage("lost");
        }}
        onGoFound={() => {
          setPage("found");
        }}
        onGoMyItems={() => {
          setPage("my-items");
        }}
        onGoReturns={() => {
          setPage("my-returns");
        }}
        onGoProfile={() => {
          setPage("profile");
        }}
        onOpenPost={(post) => {
          setSelectedPost({
            id: post.id,
            type: post.type,
          });
          setPage("item-detail");
        }}
      />
    );
  }


  // ========================================
  // LOGIN
  // ========================================

  if (page === "login") {
    return (
      <>
        <Login
          onBack={() => {
            if (user) {
              goToUserPage(
                user
              );
            } else {
              setPage("app");
            }
          }}
          onGoRegister={() => {
            setPage(
              "register"
            );
          }}
        />
      </>
    );
  }

  // ========================================
  // REGISTER
  // ========================================

  if (page === "register") {
    return (
      <Register
        onBack={() => {
          setPage("app");
        }}
        onGoLogin={() => {
          setPage("login");
        }}
      />
    );
  }

  // ========================================
  // ถ้ามี USER แต่ PAGE ผิด
  // ========================================

  if (user) {
    if (isAdmin(user)) {
      return (
        <AdminHome
          user={user}
          onLogout={handleLogout}
        />
      );
    }

    if (isStaff(user)) {
      return (
        <StaffHome
          user={user}
          onLogout={
            handleLogout
          }
          onReturns={() => {
            setPage("staff-returns");
          }}
          onClaimReview={(claimId) => {
            setStaffClaimId(claimId);
            setPage("staff-claim-review");
          }}
          onReview={(
            itemId,
            itemType = "lost"
          ) => {
            setStaffReviewId(
              itemId
            );
            setStaffReviewType(
              itemType
            );

            setPage(
              "staff-review"
            );
          }}
        />
      );
    }

    return (
      <Home
        user={user}
        onLogout={
          handleLogout
        }
        onGoPost={() => {
          setPage("post");
        }}
        onGoLost={() => {
          setPage("lost");
        }}
        onGoFound={() => {
          setPage("found");
        }}
        onGoMyItems={() => {
          setPage("my-items");
        }}
        onGoReturns={() => {
          setPage("my-returns");
        }}
        onGoProfile={() => {
          setPage("profile");
        }}
        onOpenPost={(post) => {
          setSelectedPost({
            id: post.id,
            type: post.type,
          });
          setPage("item-detail");
        }}
      />
    );
  }

  // ========================================
  // PUBLIC APP
  // หน้าแรกก่อน Login
  // ดูข้อมูลได้ แต่การทำรายการต้องเข้าสู่ระบบ
  // ========================================

  return (
    <PublicLanding
      onLogin={() => setPage("login")}
      onRegister={() => setPage("register")}
    />
  );
}

function PostChoice({
  onBack,
  onGoLost,
  onGoFound,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf3ff] text-[#334155]">
      {/* Decorative background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-24 top-[150px] h-64 w-64 rounded-full bg-[#a978df]/20" />
        <div className="absolute -right-28 top-[300px] h-80 w-80 rounded-full bg-[#5b9bea]/18" />
        <div className="absolute left-[8%] bottom-[80px] h-32 w-32 rounded-full bg-[#f8cf4b]/25" />
        <div className="absolute right-[10%] bottom-[40px] h-44 w-44 rounded-full bg-[#67c5b5]/18" />
      </div>

      <header className="relative z-20 bg-[#5b9bea] border-b border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-[75px] flex items-center">
            <button
              type="button"
              onClick={onBack}
              className="mx-auto shrink-0 transition hover:scale-[1.02]"
              aria-label="กลับหน้าหลัก"
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
        <section className="w-full max-w-[820px] overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="h-1.5 bg-gradient-to-r from-[#a978df] via-[#5b9bea] to-[#67c5b5]" />

          <div className="px-5 py-8 sm:px-9 sm:py-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-[#edf5ff] px-5 py-2 text-[11px] font-extrabold tracking-[0.12em] text-[#397fd2]">
                BACK2YOU
              </div>

              <h1 className="mt-5 text-2xl sm:text-[30px] font-extrabold text-slate-700">
                คุณต้องการโพสต์แบบไหน?
              </h1>

              <p className="mx-auto mt-2 max-w-[520px] text-xs sm:text-sm leading-6 text-slate-500">
                เลือกประเภทประกาศให้ตรงกับสิ่งที่เกิดขึ้น
                เพื่อให้ระบบและผู้ใช้งานคนอื่นช่วยกันตามหาได้ง่ายขึ้น
              </p>

              <div className="mx-auto mt-5 max-w-[560px] rounded-full bg-[#f8cf4b] px-4 py-2 text-[11px] sm:text-xs font-bold text-slate-700">
                ✨ เลือกได้ 1 แบบ แล้วกรอกรายละเอียดในขั้นตอนถัดไป
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <button
                type="button"
                onClick={onGoLost}
                className="group relative overflow-hidden rounded-[24px] border border-red-200 bg-white p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#ef7777] hover:bg-[#fff8f8] hover:shadow-[0_14px_32px_rgba(239,119,119,0.14)] focus:outline-none focus:ring-4 focus:ring-red-100"
              >
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#ef7777]/10 transition-transform duration-300 group-hover:scale-125" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ef7777] text-2xl shadow-sm transition-transform duration-200 group-hover:scale-105">
                    📍
                  </div>

                  <h2 className="mt-5 text-xl font-extrabold text-slate-700">
                    แจ้งของหาย
                  </h2>

                  <p className="mt-2 min-h-[48px] text-xs sm:text-sm leading-6 text-slate-500">
                    สำหรับสิ่งของที่คุณทำหาย
                    สร้างประกาศเพื่อให้คนที่พบสามารถช่วยแจ้งกลับมาได้
                  </p>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-xs font-extrabold text-[#df6262]">
                    <span>สร้างประกาศของหาย</span>
                    <span className="text-lg transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onGoFound}
                className="group relative overflow-hidden rounded-[24px] border border-emerald-200 bg-white p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#67c5b5] hover:bg-[#f8fffd] hover:shadow-[0_14px_32px_rgba(103,197,181,0.14)] focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#67c5b5]/12 transition-transform duration-300 group-hover:scale-125" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#67c5b5] text-2xl shadow-sm transition-transform duration-200 group-hover:scale-105">
                    📦
                  </div>

                  <h2 className="mt-5 text-xl font-extrabold text-slate-700">
                    แจ้งพบของ
                  </h2>

                  <p className="mt-2 min-h-[48px] text-xs sm:text-sm leading-6 text-slate-500">
                    สำหรับสิ่งของที่คุณเก็บได้
                    สร้างประกาศเพื่อช่วยให้เจ้าของตัวจริงตามหาของได้ง่ายขึ้น
                  </p>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-xs font-extrabold text-[#49a997]">
                    <span>สร้างประกาศพบของ</span>
                    <span className="text-lg transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-7 text-center">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8fbff] px-5 py-2.5 text-xs font-bold text-slate-500 transition hover:border-[#5b9bea] hover:text-[#397fd2]"
              >
                ← กลับหน้าหลัก
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
function PublicLanding({ onLogin, onRegister }) {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();
        if (response.ok) setCategories(data.categories || []);
      } catch (error) {
        console.error("Public Categories Error:", error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.set("type", filter);
        params.set("limit", "30");
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (categoryId) params.set("categoryId", categoryId);
        if (locationFilter.trim()) params.set("location", locationFilter.trim());
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        const response = await fetch(`${API_BASE}/api/posts?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "ไม่สามารถโหลดประกาศได้");
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Public Posts Error:", error);
        setPosts([]);
        setError(error.message || "ไม่สามารถโหลดประกาศได้");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [filter, searchQuery, categoryId, locationFilter, dateFrom, dateTo]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchQuery(searchText.trim());
  };

  const clearFilters = () => {
    setFilter("all");
    setSearchText("");
    setSearchQuery("");
    setCategoryId("");
    setLocationFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters =
    filter !== "all" ||
    Boolean(searchQuery) ||
    Boolean(categoryId) ||
    Boolean(locationFilter.trim()) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const requireLogin = () => {
    onLogin?.();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf3ff] text-[#334155] flex flex-col">
      {/* วงกลมตกแต่งพื้นหลัง — โทนเดียวกับหน้าแจ้งของหาย */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-[150px] h-56 w-56 rounded-full bg-[#ef7777]/20 blur-[1px]" />
        <div className="absolute -right-24 top-[300px] h-72 w-72 rounded-full bg-[#67c5b5]/20 blur-[1px]" />
        <div className="absolute left-[8%] top-[720px] h-28 w-28 rounded-full bg-[#f8cf4b]/25" />
        <div className="absolute right-[12%] top-[880px] h-40 w-40 rounded-full bg-[#a978df]/15" />
        <div className="absolute -left-24 bottom-[140px] h-64 w-64 rounded-full bg-[#5b9bea]/15" />
        <div className="absolute -right-12 bottom-[40px] h-36 w-36 rounded-full bg-[#ef7777]/15" />
      </div>

      <header className="sticky top-0 z-40 bg-[#5b9bea] border-b border-blue-300">
        <div className="max-w-[1500px] mx-auto min-h-[78px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="shrink-0 transition hover:scale-[1.03]"
            aria-label="หน้าแรก"
          >
            <img src="/image/back2you.png" alt="Back2You" className="w-[108px] sm:w-[122px] h-auto" />
          </button>

          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 rounded-[22px] border border-white/80 bg-white/95 p-1.5 shadow-[0_8px_24px_rgba(51,65,85,0.10)]">
            <button type="button" onClick={() => document.getElementById("public-search")?.focus()} className="px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#edf5ff] hover:text-[#397fd2]">ค้นหา</button>
            <button type="button" onClick={requireLogin} className="px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#edf5ff] hover:text-[#397fd2]">โพสต์</button>
            <button type="button" onClick={requireLogin} className="px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#edf5ff] hover:text-[#397fd2]">ของของฉัน</button>
            <button type="button" onClick={requireLogin} className="px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#edf5ff] hover:text-[#397fd2]">การคืนของ</button>
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onRegister} className="hidden sm:inline-flex rounded-full border border-white/50 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
              สมัครสมาชิก
            </button>
            <button type="button" onClick={onLogin} className="rounded-full bg-white px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#397fd2] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              เข้าสู่ระบบ
            </button>
          </div>
        </div>

        <div className="md:hidden px-4 pb-3">
          <nav className="max-w-md mx-auto bg-white rounded-full p-1 flex shadow-sm">
            <button type="button" onClick={() => document.getElementById("public-search")?.focus()} className="flex-1 py-2 rounded-full text-xs font-bold hover:bg-[#edf5ff]">ค้นหา</button>
            <button type="button" onClick={requireLogin} className="flex-1 py-2 rounded-full text-xs font-bold hover:bg-[#edf5ff]">โพสต์</button>
            <button type="button" onClick={requireLogin} className="flex-1 py-2 rounded-full text-xs font-bold hover:bg-[#edf5ff]">ของฉัน</button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section className="rounded-xl border border-slate-200 bg-white px-5 sm:px-8 md:px-10 py-8 sm:py-10 shadow-sm">
          <div className="max-w-[700px] mx-auto text-center">
            <div className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-[#edf5ff] px-5 py-2 text-[11px] sm:text-xs font-extrabold tracking-[0.12em] text-[#397fd2]">
              BACK2YOU
            </div>
            <h1 className="mt-4 text-[28px] sm:text-[34px] md:text-[40px] leading-[1.2] font-extrabold tracking-[-0.03em] text-slate-700">
              ของหาย ไม่ได้แปลว่า<br />
              <span className="text-[#e97070]">หายไปตลอดกาล</span>
            </h1>
            <p className="mt-4 max-w-[600px] mx-auto text-xs sm:text-sm leading-6 text-slate-500">
              ค้นหาและดูประกาศของหายหรือของที่พบได้ทันที
              ส่วนการโพสต์ ขอรับของคืน และจัดการข้อมูลส่วนตัว จะใช้งานได้หลังเข้าสู่ระบบ
            </p>

            <div className="mt-5 mx-auto max-w-[610px] rounded-full bg-[#f8cf4b] px-4 py-2 text-[11px] sm:text-xs font-bold text-slate-700">
              🔎 ดูและค้นหาประกาศได้โดยไม่ต้องเข้าสู่ระบบ
            </div>
          </div>

          <form onSubmit={handleSearch} className="max-w-[610px] mx-auto mt-7">
            <div className="min-h-[50px] border border-slate-300 rounded-xl bg-[#edf5ff] flex items-center gap-2 pl-4 pr-1.5 focus-within:border-[#5b9bea] focus-within:ring-2 focus-within:ring-blue-200">
              <span>🔍</span>
              <input
                id="public-search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="ค้นหาของหายหรือของที่พบ"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="rounded-lg bg-[#5b9bea] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white hover:bg-[#4d8bd9]">
                ค้นหา
              </button>
            </div>
          </form>

          <div className="max-w-[760px] mx-auto mt-4">
            <button type="button" onClick={() => setAdvancedOpen((value) => !value)} className="mx-auto flex items-center gap-2 text-xs font-extrabold text-[#397fd2]">
              ⚙️ ตัวกรองเพิ่มเติม <span>{advancedOpen ? "▲" : "▼"}</span>
            </button>

            {advancedOpen && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-slate-300 bg-[#edf5ff] p-4">
                <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">ทุกหมวดหมู่</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="สถานที่" className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-200" />
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-200" />
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 max-w-[760px] mx-auto mt-7">
            <button type="button" onClick={requireLogin} className="rounded-xl border border-slate-300 bg-white p-4 flex items-center gap-4 text-left transition hover:bg-red-50 hover:-translate-y-0.5 hover:shadow-sm">
              <span className="w-11 h-11 rounded-full bg-[#ef7777] flex items-center justify-center text-xl">📍</span>
              <span><strong className="block text-sm text-slate-700">แจ้งของหาย</strong><small className="text-slate-400">เข้าสู่ระบบเพื่อสร้างประกาศ</small></span>
            </button>
            <button type="button" onClick={requireLogin} className="rounded-xl border border-slate-300 bg-white p-4 flex items-center gap-4 text-left transition hover:bg-emerald-50 hover:-translate-y-0.5 hover:shadow-sm">
              <span className="w-11 h-11 rounded-full bg-[#67c5b5] flex items-center justify-center text-xl">📦</span>
              <span><strong className="block text-sm text-slate-700">แจ้งพบของ</strong><small className="text-slate-400">เข้าสู่ระบบเพื่อสร้างประกาศ</small></span>
            </button>
          </div>

          <div className="mt-9 border-t border-slate-200 pt-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-700">ประกาศล่าสุด</h2>
                <p className="mt-1 text-xs text-slate-400">แสดงเฉพาะประกาศที่ผ่านการอนุมัติแล้ว</p>
              </div>
              <div className="flex w-full sm:w-auto overflow-hidden rounded-full border border-slate-300 bg-[#eaf3ff] p-1">
                {[
                  ["all", "ทั้งหมด"],
                  ["lost", "ของหาย"],
                  ["found", "ของที่พบ"],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setFilter(value)} className={`flex-1 sm:flex-none rounded-full px-4 py-2 text-xs font-extrabold transition ${filter === value ? "bg-[#e97070] text-white shadow-sm" : "text-slate-500 hover:bg-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={clearFilters} className="text-xs font-bold text-[#ef7777] hover:underline">ล้างตัวกรองทั้งหมด</button>
              </div>
            )}

            {loading ? (
              <div className="min-h-[240px] flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-[#5b9bea] animate-spin" />
                <p className="mt-4 text-sm font-bold text-slate-400">กำลังโหลดประกาศ...</p>
              </div>
            ) : error ? (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm font-bold text-red-600">{error}</div>
            ) : posts.length === 0 ? (
              <div className="mt-5 min-h-[220px] rounded-2xl border border-dashed border-slate-200 bg-[#f8fbff] flex items-center justify-center text-center p-6">
                <div><div className="text-4xl">📭</div><p className="mt-3 text-sm font-bold text-slate-500">ไม่พบประกาศ</p><p className="mt-1 text-xs text-slate-400">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p></div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.map((post) => <PublicPostCard key={`${post.type}-${post.id}`} post={post} onLogin={onLogin} />)}
              </div>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-amber-200 bg-[#fff5c7] p-5 sm:p-6 text-center">
            <p className="text-sm font-extrabold text-slate-700">ต้องการโพสต์ ติดต่อเจ้าของ หรือขอรับของคืน?</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">เข้าสู่ระบบเพื่อใช้งานฟังก์ชันของสมาชิก Back2You</p>
            <button type="button" onClick={onLogin} className="mt-4 rounded-xl bg-[#e97070] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#df6262]">เข้าสู่ระบบเพื่อใช้งาน</button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t border-blue-100 bg-white/30">
        <div className="max-w-[1000px] mx-auto px-5 py-7 text-center text-xs sm:text-sm text-slate-500">
          © 2026 TAMKUEN LOST&FOUND — พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้
        </div>
      </footer>
    </div>
  );
}

function PublicPostCard({ post, onLogin }) {
  const isLost = post.type === "lost";
  const imagePath = post.image || post.images?.[0] || null;
  const imageUrl =
    imagePath && (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
      ? imagePath
      : imagePath
        ? `${API_BASE}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`
        : null;

  const rawDate = post.lost_date || post.found_date || post.created_at;
  const displayDate = formatPublicDate(rawDate);

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-300 bg-white transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f1f5f9]">
        {imageUrl ? (
          <img src={imageUrl} alt={post.title || "ประกาศ"} className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <div className="text-4xl">{isLost ? "🔎" : "📦"}</div>
            <p className="mt-2 text-xs font-medium">ไม่มีรูปภาพ</p>
          </div>
        )}
        <div className={`absolute top-3 left-3 rounded-full px-3 py-1.5 text-[10px] font-extrabold text-white shadow-sm ${isLost ? "bg-[#ef7777]" : "bg-[#67c5b5]"}`}>
          {isLost ? "ของหาย" : "ของที่พบ"}
        </div>
      </div>

      <div className="p-4">
        {post.category_name && <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#5b9bea]">{post.category_name}</p>}
        <h3 className="mt-1 text-base font-extrabold text-slate-700 line-clamp-1">{post.title}</h3>
        {post.description && <p className="mt-2 min-h-[40px] text-xs leading-5 text-slate-500 line-clamp-2">{post.description}</p>}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          {post.location && <div className="flex items-start gap-2 text-xs text-slate-500"><span>📍</span><span className="line-clamp-1">{post.location}</span></div>}
          {displayDate && <div className="flex items-center gap-2 text-xs text-slate-500"><span>📅</span><span>{displayDate}</span></div>}
        </div>
        <button type="button" onClick={onLogin} className="mt-4 w-full rounded-xl border border-slate-300 bg-[#edf5ff] px-4 py-2.5 text-xs font-extrabold text-[#397fd2] transition hover:bg-blue-100">
          เข้าสู่ระบบเพื่อดูรายละเอียด / ทำรายการ
        </button>
      </div>
    </article>
  );
}

function formatPublicDate(value) {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return String(value);
  }
}


export default App;
