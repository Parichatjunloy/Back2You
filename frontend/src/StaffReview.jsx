import {
  useCallback,
  useEffect,
  useState,
} from "react";

// ========================================
// Back2You
// StaffReview.jsx
// ========================================

function StaffReview({
  itemId,
  itemType = "lost",
  user,
  onBack,
  onReviewed,
  onLogout,
}) {
  // ========================================
  // STATE
  // ========================================

  const [item, setItem] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [staffNote, setStaffNote] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    selectedImage,
    setSelectedImage,
  ] = useState(null);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const firstLetter =
    user?.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "S";

  // ========================================
  // API BASE
  // ========================================

  const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "th-TH",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ========================================
  // FORMAT DATE + TIME
  // ========================================

  const formatCreatedAt = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "th-TH",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ========================================
  // FORMAT TIME
  // ========================================

  const formatTime = (
    value
  ) => {
    if (!value) {
      return "ไม่ระบุ";
    }

    return String(
      value
    ).slice(0, 5);
  };

  // ========================================
  // ITEM TYPE
  // ========================================

  const normalizedItemType =
    itemType === "found"
      ? "found"
      : "lost";

  const itemApiResource =
    normalizedItemType === "found"
      ? "found-items"
      : "lost-items";

  // ========================================
  // ITEM CODE
  // ========================================

  const getItemCode = (
    id
  ) => {
    const prefix =
      normalizedItemType === "found"
        ? "FD"
        : "LF";

    return `${prefix}-${String(
      id
    ).padStart(
      6,
      "0"
    )}`;
  };

  // ========================================
  // IMAGE URL
  // ========================================

  const getImageUrl = (
    imagePath
  ) => {
    if (!imagePath) {
      return null;
    }

    if (
      imagePath.startsWith(
        "http://"
      ) ||
      imagePath.startsWith(
        "https://"
      )
    ) {
      return imagePath;
    }

    return `${API_BASE}${imagePath}`;
  };

  // ========================================
  // LOAD ITEM
  // ========================================

  const loadItem =
    useCallback(async () => {
      const token =
        localStorage.getItem(
          "back2you_token"
        );

      if (!token) {
        onLogout();
        return;
      }

      if (!itemId) {
        setError(
          "ไม่พบรหัสประกาศ"
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/api/staff/${itemApiResource}/${itemId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            alert(
              data.message ||
                "กรุณาเข้าสู่ระบบ Staff ใหม่"
            );

            onLogout();

            return;
          }

          throw new Error(
            data.message ||
              "ไม่สามารถโหลดรายละเอียดประกาศได้"
          );
        }

        setItem(
          data.item
        );

        setStaffNote(
          data.item
            ?.staff_note || ""
        );

        // เลือกรูปแรก
        if (
          data.item
            ?.images
            ?.length > 0
        ) {
          setSelectedImage(
            data.item
              .images[0]
              .image_path
          );
        } else if (
          data.item?.image
        ) {
          setSelectedImage(
            data.item.image
          );
        } else {
          setSelectedImage(
            null
          );
        }
      } catch (error) {
        console.error(
          "Load Staff Review Error:",
          error
        );

        setError(
          error.message ||
            "ไม่สามารถโหลดรายละเอียดประกาศได้"
        );
      } finally {
        setLoading(false);
      }
    }, [
      itemId,
      itemApiResource,
      onLogout,
    ]);

  // ========================================
  // LOAD ON START
  // ========================================

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  // ========================================
  // APPROVE
  // ========================================

  const handleApprove =
    async () => {
      if (!item) {
        return;
      }

      if (
        item.status !==
        "pending"
      ) {
        alert(
          "ประกาศนี้ถูกตรวจสอบไปแล้ว"
        );

        return;
      }

      const confirmed =
        window.confirm(
          `ยืนยันอนุมัติประกาศ "${item.title}" หรือไม่?`
        );

      if (!confirmed) {
        return;
      }

      const token =
        localStorage.getItem(
          "back2you_token"
        );

      if (!token) {
        onLogout();
        return;
      }

      try {
        setSubmitting(true);

        const response =
          await fetch(
            `${API_BASE}/api/staff/${itemApiResource}/${item.id}/approve`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  staffNote:
                    staffNote.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            alert(
              data.message ||
                "กรุณาเข้าสู่ระบบ Staff ใหม่"
            );

            onLogout();

            return;
          }

          throw new Error(
            data.message ||
              "ไม่สามารถอนุมัติประกาศได้"
          );
        }

        alert(
          "อนุมัติประกาศเรียบร้อยแล้ว"
        );

        onReviewed();
      } catch (error) {
        console.error(
          "Approve Error:",
          error
        );

        alert(
          error.message ||
            "ไม่สามารถอนุมัติประกาศได้"
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  // ========================================
  // REJECT
  // ========================================

  const handleReject =
    async () => {
      if (!item) {
        return;
      }

      if (
        item.status !==
        "pending"
      ) {
        alert(
          "ประกาศนี้ถูกตรวจสอบไปแล้ว"
        );

        return;
      }

      // ปฏิเสธต้องมีเหตุผล
      if (
        !staffNote.trim()
      ) {
        alert(
          "กรุณาระบุเหตุผลหรือหมายเหตุ ก่อนปฏิเสธประกาศ"
        );

        return;
      }

      const confirmed =
        window.confirm(
          `ยืนยันปฏิเสธประกาศ "${item.title}" หรือไม่?`
        );

      if (!confirmed) {
        return;
      }

      const token =
        localStorage.getItem(
          "back2you_token"
        );

      if (!token) {
        onLogout();
        return;
      }

      try {
        setSubmitting(true);

        const response =
          await fetch(
            `${API_BASE}/api/staff/${itemApiResource}/${item.id}/reject`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  staffNote:
                    staffNote.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            alert(
              data.message ||
                "กรุณาเข้าสู่ระบบ Staff ใหม่"
            );

            onLogout();

            return;
          }

          throw new Error(
            data.message ||
              "ไม่สามารถปฏิเสธประกาศได้"
          );
        }

        alert(
          "ปฏิเสธประกาศเรียบร้อยแล้ว"
        );

        onReviewed();
      } catch (error) {
        console.error(
          "Reject Error:",
          error
        );

        alert(
          error.message ||
            "ไม่สามารถปฏิเสธประกาศได้"
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  // ========================================
  // IMAGES
  // รวมรูปจาก image + images
  // และไม่ให้รูปซ้ำ
  // ========================================

  const allImages = [];

  if (item?.images) {
    for (
      const image
      of item.images
    ) {
      if (
        image.image_path &&
        !allImages.includes(
          image.image_path
        )
      ) {
        allImages.push(
          image.image_path
        );
      }
    }
  }

  if (
    item?.image &&
    !allImages.includes(
      item.image
    )
  ) {
    allImages.unshift(
      item.image
    );
  }

  // ========================================
  // SIDEBAR
  // ========================================

  const SidebarContent =
    () => (
      <>
        {/* Logo */}

        <div className="px-5 py-6 border-b border-white/15">

          <img
            src="/image/back2you.png"
            alt="Back2You"
            className="w-28 h-auto"
          />

          <div className="mt-4">

            <p className="text-white font-bold">
              Staff Center
            </p>

            <p className="text-blue-100 text-xs mt-1">
              ระบบจัดการ Lost & Found
            </p>

          </div>

        </div>

        {/* Menu */}

        <nav className="p-3 space-y-2">

          <SidebarButton
            icon="▦"
            label="แดชบอร์ด"
            onClick={onBack}
          />

          <SidebarButton
            icon="☷"
            label="รายการของหาย / ของพบ"
            onClick={() => {
              alert(
                "เมนูนี้จะเชื่อมต่อในขั้นตอนถัดไป"
              );
            }}
          />

          <SidebarButton
            active
            icon="📋"
            label="ตรวจสอบรายการ"
            onClick={onBack}
          />

          <SidebarButton
            icon="◆"
            label="จัดการคืนของ"
            onClick={() => {
              alert(
                "เมนูนี้จะเชื่อมต่อในขั้นตอนถัดไป"
              );
            }}
          />

        </nav>

        {/* Logout */}

        <div className="mt-auto p-4 border-t border-white/15">

          <button
            type="button"
            onClick={
              onLogout
            }
            className="
              w-full
              flex
              items-center
              gap-3
              rounded-xl
              px-4
              py-3
              text-left
              text-blue-50
              text-sm
              font-semibold
              hover:bg-white/10
              transition
            "
          >
            <span className="text-lg">
              ↪
            </span>

            ออกจากระบบ
          </button>

        </div>
      </>
    );

  // ========================================
  // UI
  // ========================================

  return (
    <div className="min-h-screen bg-[#eaf3ff] text-[#334155]">

      {/* =====================================
          DESKTOP SIDEBAR
      ====================================== */}

      <aside
        className="
          hidden
          lg:flex
          fixed
          left-0
          top-0
          bottom-0
          w-[250px]
          bg-[#397fd2]
          flex-col
          z-40
        "
      >
        <SidebarContent />
      </aside>

      {/* =====================================
          MOBILE SIDEBAR
      ====================================== */}

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">

          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="absolute inset-0 bg-slate-900/30"
          />

          <aside
            className="
              absolute
              left-0
              top-0
              bottom-0
              w-[280px]
              max-w-[85vw]
              bg-[#397fd2]
              flex
              flex-col
              shadow-xl
            "
          >

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  false
                )
              }
              className="
                absolute
                top-4
                right-4
                w-9
                h-9
                rounded-full
                bg-white/15
                text-white
                font-bold
              "
            >
              ×
            </button>

            <SidebarContent />

          </aside>

        </div>
      )}

      {/* =====================================
          RIGHT SIDE
      ====================================== */}

      <div className="lg:ml-[250px] min-h-screen">

        {/* ===================================
            HEADER
        ==================================== */}

        <header
          className="
            sticky
            top-0
            z-30
            h-[72px]
            bg-[#5b9bea]
            border-b
            border-blue-300
            px-4
            sm:px-6
          "
        >

          <div className="h-full flex items-center justify-between gap-4">

            {/* Left */}

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    true
                  )
                }
                className="
                  lg:hidden
                  w-10
                  h-10
                  rounded-xl
                  bg-white
                  flex
                  items-center
                  justify-center
                  text-xl
                  shadow-sm
                "
              >
                ☰
              </button>

              <img
                src="/image/back2you.png"
                alt="Back2You"
                className="lg:hidden w-24 h-auto"
              />

              <div className="hidden lg:block">

                <p className="text-white font-bold">
                  ตรวจสอบประกาศ
                </p>

                <p className="text-blue-100 text-xs">
                  Back2You Staff
                </p>

              </div>

            </div>

            {/* Profile */}

            <div className="flex items-center gap-2">

              <div
                className="
                  bg-white
                  rounded-full
                  py-1
                  pl-1
                  pr-3
                  flex
                  items-center
                  gap-2
                  shadow-sm
                "
              >

                <div
                  className="
                    w-9
                    h-9
                    rounded-full
                    bg-[#a978df]
                    text-white
                    flex
                    items-center
                    justify-center
                    font-bold
                  "
                >
                  {firstLetter}
                </div>

                <div className="hidden sm:block">

                  <p className="text-sm font-bold leading-tight">
                    {user?.name ||
                      "Staff"}
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Staff
                  </p>

                </div>

              </div>

            </div>

          </div>

        </header>

        {/* ===================================
            MAIN
        ==================================== */}

        <main className="p-4 sm:p-6 lg:p-7">

          <div className="max-w-[1250px] mx-auto">

            {/* =================================
                BACK + TITLE
            ================================== */}

            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
              "
            >

              <div>

                <button
                  type="button"
                  onClick={
                    onBack
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-[#397fd2]
                    hover:underline
                  "
                >
                  ← กลับแดชบอร์ด
                </button>

                <h1
                  className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    mt-3
                  "
                >
                  ตรวจสอบประกาศ
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  ตรวจสอบข้อมูลให้ครบถ้วนก่อนอนุมัติหรือปฏิเสธ
                </p>

              </div>

              {item && (
                <div
                  className="
                    self-start
                    bg-yellow-100
                    text-yellow-700
                    rounded-full
                    px-4
                    py-2
                    text-xs
                    sm:text-sm
                    font-bold
                  "
                >
                  ● รอตรวจสอบ
                </div>
              )}

            </div>

            {/* =================================
                LOADING
            ================================== */}

            {loading && (
              <div
                className="
                  bg-white
                  rounded-2xl
                  border
                  border-blue-100
                  mt-6
                  min-h-[420px]
                  flex
                  items-center
                  justify-center
                "
              >

                <div className="text-center">

                  <div className="text-4xl">
                    🔎
                  </div>

                  <p className="mt-3 font-semibold">
                    กำลังโหลดรายละเอียด...
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    กรุณารอสักครู่
                  </p>

                </div>

              </div>
            )}

            {/* =================================
                ERROR
            ================================== */}

            {!loading &&
              error && (
                <div
                  className="
                    bg-white
                    rounded-2xl
                    border
                    border-red-200
                    mt-6
                    p-8
                    text-center
                  "
                >

                  <div className="text-4xl">
                    ⚠️
                  </div>

                  <p className="font-bold mt-3">
                    ไม่สามารถโหลดประกาศได้
                  </p>

                  <p className="text-sm text-red-500 mt-2">
                    {error}
                  </p>

                  <div
                    className="
                      flex
                      justify-center
                      gap-3
                      mt-5
                    "
                  >

                    <button
                      type="button"
                      onClick={
                        onBack
                      }
                      className="
                        px-5
                        py-2.5
                        rounded-xl
                        border
                        border-slate-200
                        font-semibold
                        text-sm
                      "
                    >
                      กลับ
                    </button>

                    <button
                      type="button"
                      onClick={
                        loadItem
                      }
                      className="
                        px-5
                        py-2.5
                        rounded-xl
                        bg-[#5b9bea]
                        text-white
                        font-semibold
                        text-sm
                      "
                    >
                      ลองใหม่
                    </button>

                  </div>

                </div>
              )}

            {/* =================================
                CONTENT
            ================================== */}

            {!loading &&
              !error &&
              item && (
                <>

                  {/* ===========================
                      TOP INFO
                  ============================ */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      xl:grid-cols-[1.1fr_0.9fr]
                      gap-5
                      mt-6
                    "
                  >

                    {/* =========================
                        IMAGES
                    ========================== */}

                    <section
                      className="
                        bg-white
                        rounded-2xl
                        border
                        border-blue-100
                        shadow-sm
                        p-4
                        sm:p-5
                      "
                    >

                      <div className="flex items-center justify-between">

                        <div>
                          <h2 className="font-bold text-lg">
                            รูปภาพสิ่งของ
                          </h2>

                          <p className="text-xs text-slate-400 mt-1">
                            รูปที่ผู้ใช้แนบมากับประกาศ
                          </p>
                        </div>

                        <span
                          className="
                            bg-[#edf5ff]
                            text-[#397fd2]
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-bold
                          "
                        >
                          {allImages.length} รูป
                        </span>

                      </div>

                      {/* Main Image */}

                      <div
                        className="
                          mt-4
                          w-full
                          aspect-[4/3]
                          max-h-[480px]
                          rounded-2xl
                          overflow-hidden
                          bg-[#edf5ff]
                          border
                          border-blue-100
                        "
                      >

                        {selectedImage ? (
                          <img
                            src={getImageUrl(
                              selectedImage
                            )}
                            alt={item.title}
                            className="
                              w-full
                              h-full
                              object-contain
                            "
                          />
                        ) : (
                          <div
                            className="
                              w-full
                              h-full
                              min-h-[300px]
                              flex
                              flex-col
                              items-center
                              justify-center
                              text-slate-400
                            "
                          >

                            <div className="text-5xl">
                              📦
                            </div>

                            <p className="text-sm mt-3">
                              ไม่มีรูปภาพ
                            </p>

                          </div>
                        )}

                      </div>

                      {/* Thumbnails */}

                      {allImages.length >
                        1 && (
                        <div
                          className="
                            grid
                            grid-cols-3
                            gap-3
                            mt-3
                          "
                        >

                          {allImages.map(
                            (
                              imagePath,
                              index
                            ) => (
                              <button
                                key={
                                  imagePath
                                }
                                type="button"
                                onClick={() =>
                                  setSelectedImage(
                                    imagePath
                                  )
                                }
                                className={`
                                  aspect-square
                                  rounded-xl
                                  overflow-hidden
                                  bg-[#edf5ff]
                                  border-2
                                  transition
                                  ${
                                    selectedImage ===
                                    imagePath
                                      ? "border-[#5b9bea]"
                                      : "border-transparent hover:border-blue-200"
                                  }
                                `}
                              >
                                <img
                                  src={getImageUrl(
                                    imagePath
                                  )}
                                  alt={`รูปที่ ${
                                    index +
                                    1
                                  }`}
                                  className="
                                    w-full
                                    h-full
                                    object-cover
                                  "
                                />
                              </button>
                            )
                          )}

                        </div>
                      )}

                    </section>

                    {/* =========================
                        ITEM SUMMARY
                    ========================== */}

                    <section
                      className="
                        bg-white
                        rounded-2xl
                        border
                        border-blue-100
                        shadow-sm
                        p-5
                        sm:p-6
                      "
                    >

                      {/* Item header */}

                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                        "
                      >

                        <div className="min-w-0">

                          <div
                            className={`
                              inline-flex
                              items-center
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-bold
                              ${
                                normalizedItemType === "found"
                                  ? "bg-emerald-50 text-[#4cae9e]"
                                  : "bg-red-50 text-[#e97070]"
                              }
                            `}
                          >
                            {normalizedItemType === "found"
                              ? "ของที่พบ"
                              : "ของหาย"}
                          </div>

                          <h2
                            className="
                              text-xl
                              sm:text-2xl
                              font-bold
                              mt-3
                              break-words
                            "
                          >
                            {item.title}
                          </h2>

                          <p className="text-xs text-slate-400 mt-2">
                            {getItemCode(
                              item.id
                            )}
                          </p>

                        </div>

                        <div
                          className={`
                            w-12
                            h-12
                            rounded-full
                            flex
                            ${
                              normalizedItemType === "found"
                                ? "bg-emerald-50"
                                : "bg-red-50"
                            }
                            items-center
                            justify-center
                            text-xl
                            shrink-0
                          `}
                        >
                          {normalizedItemType === "found" ? "🗃️" : "📍"}
                        </div>

                      </div>

                      {/* Info */}

                      <div className="mt-6 space-y-3">

                        <InfoRow
                          icon="🗂️"
                          label="หมวดหมู่"
                          value={
                            item.category_name ||
                            "ไม่ระบุ"
                          }
                        />

                        <InfoRow
                          icon="📅"
                          label={
                            normalizedItemType === "found"
                              ? "วันที่พบ"
                              : "วันที่ทำหาย"
                          }
                          value={formatDate(
                            normalizedItemType === "found"
                              ? item.found_date
                              : item.lost_date
                          )}
                        />

                        <InfoRow
                          icon="🕐"
                          label={
                            normalizedItemType === "found"
                              ? "เวลาที่พบ"
                              : "เวลาที่ทำหาย"
                          }
                          value={formatTime(
                            normalizedItemType === "found"
                              ? item.found_time
                              : item.lost_time
                          )}
                        />

                        <InfoRow
                          icon="📍"
                          label="สถานที่"
                          value={
                            item.location ||
                            "-"
                          }
                        />

                        <InfoRow
                          icon="🗓️"
                          label="วันที่สร้างประกาศ"
                          value={formatCreatedAt(
                            item.created_at
                          )}
                        />

                      </div>

                      {/* Reporter */}

                      <div
                        className="
                          mt-6
                          pt-5
                          border-t
                          border-slate-100
                        "
                      >

                        <p className="text-sm font-bold">
                          ผู้แจ้ง
                        </p>

                        <div
                          className="
                            mt-3
                            bg-[#f5f9ff]
                            rounded-2xl
                            p-4
                          "
                        >

                          <div className="flex items-center gap-3">

                            <div
                              className="
                                w-11
                                h-11
                                rounded-full
                                bg-[#a978df]
                                text-white
                                flex
                                items-center
                                justify-center
                                font-bold
                              "
                            >
                              {item.user_name
                                ?.charAt(
                                  0
                                )
                                ?.toUpperCase() ||
                                "U"}
                            </div>

                            <div className="min-w-0">

                              <p className="font-bold text-sm">
                                {item.user_name ||
                                  "-"}
                              </p>

                              <p className="text-xs text-slate-500 break-all mt-0.5">
                                {item.user_email ||
                                  "-"}
                              </p>

                            </div>

                          </div>

                          {item.user_phone && (
                            <div className="text-xs text-slate-500 mt-3">
                              โทร:{" "}
                              {item.user_phone}
                            </div>
                          )}

                        </div>

                      </div>

                    </section>

                  </div>

                  {/* ===========================
                      DESCRIPTION
                  ============================ */}

                  <section
                    className="
                      bg-white
                      rounded-2xl
                      border
                      border-blue-100
                      shadow-sm
                      p-5
                      sm:p-6
                      mt-5
                    "
                  >

                    <h2 className="text-lg font-bold">
                      รายละเอียดประกาศ
                    </h2>

                    <p className="text-xs text-slate-400 mt-1">
                      รายละเอียดและลักษณะเฉพาะที่ผู้ใช้แจ้ง
                    </p>

                    <div
                      className="
                        bg-[#f8fbff]
                        rounded-2xl
                        p-4
                        sm:p-5
                        mt-4
                        min-h-[100px]
                      "
                    >

                      <p
                        className="
                          text-sm
                          sm:text-base
                          leading-7
                          whitespace-pre-wrap
                          break-words
                        "
                      >
                        {item.description ||
                          "ผู้ใช้ไม่ได้ระบุรายละเอียดเพิ่มเติม"}
                      </p>

                    </div>

                  </section>

                  {/* ===========================
                      STAFF REVIEW
                  ============================ */}

                  <section
                    className="
                      bg-white
                      rounded-2xl
                      border
                      border-blue-100
                      shadow-sm
                      p-5
                      sm:p-6
                      mt-5
                    "
                  >

                    <div
                      className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-start
                        sm:justify-between
                        gap-3
                      "
                    >

                      <div>

                        <h2 className="text-lg font-bold">
                          ผลการตรวจสอบ
                        </h2>

                        <p className="text-xs text-slate-400 mt-1">
                          เพิ่มหมายเหตุสำหรับประกาศนี้ก่อนดำเนินการ
                        </p>

                      </div>

                      <div
                        className="
                          inline-flex
                          self-start
                          items-center
                          gap-2
                          rounded-full
                          bg-[#edf5ff]
                          text-[#397fd2]
                          px-3
                          py-1.5
                          text-xs
                          font-bold
                        "
                      >
                        👤 {user?.name || "Staff"}
                      </div>

                    </div>

                    {/* Note */}

                    <div className="mt-5">

                      <label
                        htmlFor="staff-note"
                        className="text-sm font-bold"
                      >
                        หมายเหตุ Staff
                      </label>

                      <p className="text-xs text-slate-400 mt-1">
                        หากปฏิเสธประกาศ จำเป็นต้องระบุเหตุผล
                      </p>

                      <textarea
                        id="staff-note"
                        value={
                          staffNote
                        }
                        disabled={
                          submitting
                        }
                        onChange={(
                          event
                        ) =>
                          setStaffNote(
                            event
                              .target
                              .value
                          )
                        }
                        rows={5}
                        maxLength={
                          1000
                        }
                        placeholder="เช่น ข้อมูลครบถ้วน สามารถอนุมัติได้ หรือ ระบุเหตุผลที่ต้องปฏิเสธ..."
                        className="
                          w-full
                          mt-3
                          rounded-2xl
                          border
                          border-slate-200
                          bg-[#f8fbff]
                          px-4
                          py-3
                          text-sm
                          outline-none
                          resize-y
                          focus:border-[#5b9bea]
                          focus:ring-2
                          focus:ring-blue-100
                          disabled:opacity-60
                        "
                      />

                      <div className="text-right text-[11px] text-slate-400 mt-1">
                        {staffNote.length}/1000
                      </div>

                    </div>

                    {/* Advice */}

                    <div
                      className="
                        mt-4
                        rounded-2xl
                        bg-yellow-50
                        border
                        border-yellow-200
                        p-4
                      "
                    >

                      <div className="flex gap-3">

                        <span>
                          💡
                        </span>

                        <div>

                          <p className="text-sm font-bold text-yellow-800">
                            ก่อนยืนยันผลการตรวจสอบ
                          </p>

                          <p className="text-xs sm:text-sm text-yellow-700 mt-1 leading-6">
                            ตรวจสอบชื่อสิ่งของ รูปภาพ สถานที่ วันที่
                            และรายละเอียดให้สอดคล้องกัน
                            หากข้อมูลไม่เหมาะสมหรือไม่ครบถ้วน
                            ให้ระบุเหตุผลในหมายเหตุแล้วกดปฏิเสธ
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* Buttons */}

                    <div
                      className="
                        flex
                        flex-col-reverse
                        sm:flex-row
                        sm:justify-between
                        gap-3
                        mt-6
                      "
                    >

                      <button
                        type="button"
                        onClick={
                          onBack
                        }
                        disabled={
                          submitting
                        }
                        className="
                          px-5
                          py-3
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          text-sm
                          font-bold
                          hover:bg-slate-50
                          transition
                          disabled:opacity-50
                        "
                      >
                        ← กลับ
                      </button>

                      <div
                        className="
                          flex
                          flex-col
                          sm:flex-row
                          gap-3
                        "
                      >

                        {/* Reject */}

                        <button
                          type="button"
                          onClick={
                            handleReject
                          }
                          disabled={
                            submitting
                          }
                          className="
                            min-w-[150px]
                            px-5
                            py-3
                            rounded-xl
                            border
                            border-[#ef7777]
                            bg-red-50
                            text-[#df6262]
                            text-sm
                            font-bold
                            hover:bg-red-100
                            transition
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                          "
                        >
                          {submitting
                            ? "กำลังดำเนินการ..."
                            : "✕ ปฏิเสธ"}
                        </button>

                        {/* Approve */}

                        <button
                          type="button"
                          onClick={
                            handleApprove
                          }
                          disabled={
                            submitting
                          }
                          className="
                            min-w-[170px]
                            px-5
                            py-3
                            rounded-xl
                            bg-[#67c5b5]
                            text-white
                            text-sm
                            font-bold
                            hover:bg-[#55b5a5]
                            transition
                            shadow-sm
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                          "
                        >
                          {submitting
                            ? "กำลังดำเนินการ..."
                            : "✓ อนุมัติประกาศ"}
                        </button>

                      </div>

                    </div>

                  </section>

                </>
              )}

          </div>

        </main>

        {/* ===================================
            FOOTER
        ==================================== */}

        <footer
          className="
            px-4
            py-7
            text-center
            text-xs
            text-slate-500
          "
        >
          © 2026 TAMKUEN LOST&FOUND — Back2You Staff Center
        </footer>

      </div>

    </div>
  );
}

// ========================================
// SIDEBAR BUTTON
// ========================================

function SidebarButton({
  active = false,
  icon,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        w-full
        flex
        items-center
        gap-3
        px-4
        py-3
        rounded-xl
        text-left
        text-sm
        font-semibold
        transition
        ${
          active
            ? "bg-white text-[#397fd2] shadow-sm"
            : "text-white hover:bg-white/10"
        }
      `}
    >

      <span
        className="
          w-6
          text-center
          text-lg
          shrink-0
        "
      >
        {icon}
      </span>

      <span>
        {label}
      </span>

    </button>
  );
}

// ========================================
// INFO ROW
// ========================================

function InfoRow({
  icon,
  label,
  value,
}) {
  return (
    <div
      className="
        bg-[#f8fbff]
        rounded-xl
        px-4
        py-3
        flex
        items-start
        gap-3
      "
    >

      <div
        className="
          w-9
          h-9
          rounded-full
          bg-[#e6f1ff]
          flex
          items-center
          justify-center
          shrink-0
        "
      >
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-[11px] text-slate-400">
          {label}
        </p>

        <p
          className="
            text-sm
            font-semibold
            mt-0.5
            break-words
          "
        >
          {value}
        </p>

      </div>

    </div>
  );
}

export default StaffReview;