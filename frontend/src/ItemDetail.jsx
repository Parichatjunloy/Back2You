import {
  useEffect,
  useState,
} from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ========================================
// Back2You - ItemDetail.jsx
// ========================================

function ItemDetail({
  itemId,
  itemType,
  user,
  onBack,
  onClaim,
  onLogout,
}) {
  // ========================================
  // STATE
  // ========================================

  const [item, setItem] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedImage,
    setSelectedImage,
  ] = useState("");

  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintSaving, setComplaintSaving] = useState(false);
  const [complaintError, setComplaintError] = useState("");
  const [complaintSuccess, setComplaintSuccess] = useState("");

  // ========================================
  // USER
  // ========================================

  const firstLetter =
    user?.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";

  // ========================================
  // LOAD DETAIL
  // ========================================

  useEffect(() => {
    const loadItem = async () => {
      try {
        setLoading(true);
        setError("");
        setItem(null);
        setSelectedImage("");

        if (
          !itemId ||
          !["lost", "found"].includes(
            itemType
          )
        ) {
          throw new Error(
            "ข้อมูลประกาศไม่ถูกต้อง"
          );
        }

        const response = await fetch(
          `${API_BASE}/api/posts/${itemType}/${itemId}`
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "ไม่สามารถโหลดรายละเอียดได้"
          );
        }

        const loadedItem =
          data.item;

        setItem(loadedItem);

        // เลือกรูปแรกเป็นรูปหลัก
        const firstImage =
          loadedItem?.images?.[0] ||
          loadedItem?.image ||
          "";

        setSelectedImage(firstImage);
      } catch (error) {
        console.error(
          "Load Item Detail Error:",
          error
        );

        setError(
          error.message ||
            "ไม่สามารถโหลดรายละเอียดได้"
        );
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [itemId, itemType]);

  // ========================================
  // IMAGE URL
  // ========================================

  const getImageUrl = (
    imagePath
  ) => {
    if (!imagePath) {
      return "";
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

    return `${API_BASE}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
  };

  // ========================================
  // ITEM DATA
  // ========================================

  const isLost =
    item?.type === "lost";

  const dateValue = isLost
    ? item?.lost_date
    : item?.found_date;

  const timeValue = isLost
    ? item?.lost_time
    : item?.found_time;

  const images =
    item?.images?.length > 0
      ? item.images
      : item?.image
        ? [item.image]
        : [];

  const submitItemComplaint = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("back2you_token");
    setComplaintError("");
    setComplaintSuccess("");

    try {
      setComplaintSaving(true);
      const response = await fetch(`${API_BASE}/api/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: complaintSubject.trim(),
          description: complaintDescription.trim(),
          relatedType: itemType,
          relatedId: itemId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ส่งข้อร้องเรียนไม่สำเร็จ");
      setComplaintSubject("");
      setComplaintDescription("");
      setComplaintSuccess("ส่งข้อร้องเรียนเกี่ยวกับประกาศนี้เรียบร้อยแล้ว");
    } catch (error) {
      setComplaintError(error.message || "ส่งข้อร้องเรียนไม่สำเร็จ");
    } finally {
      setComplaintSaving(false);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div
      className="
        min-h-screen
        bg-[#eaf3ff]
        text-[#334155]
        flex
        flex-col
      "
    >
      {/* =====================================
          HEADER
      ====================================== */}

      <header
        className="
          sticky
          top-0
          z-40
          bg-[#5b9bea]
          shadow-[0_2px_12px_rgba(30,64,175,0.12)]
        "
      >
        <div
          className="
            max-w-[1100px]
            mx-auto
            min-h-[76px]
            px-4
            sm:px-6
            flex
            items-center
            justify-between
            gap-3
          "
        >
          {/* LOGO */}

          <button
            type="button"
            onClick={onBack}
            className="
              shrink-0
              transition
              hover:scale-[1.03]
            "
          >
            <img
              src="/image/back2you.png"
              alt="Back2You"
              className="
                w-[105px]
                sm:w-[118px]
                h-auto
              "
            />
          </button>

          {/* RIGHT */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            {/* PROFILE */}

            <div
              className="
                hidden
                sm:flex
                items-center
                gap-2
                bg-white
                rounded-full
                py-1.5
                pl-1.5
                pr-4
                shadow-sm
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-full
                  bg-[#a978df]
                  text-white
                  flex
                  items-center
                  justify-center
                  font-extrabold
                  text-lg
                "
              >
                {firstLetter}
              </div>

              <div
                className="
                  max-w-[120px]
                "
              >
                <p
                  className="
                    text-sm
                    font-bold
                    truncate
                  "
                >
                  {user?.name ||
                    "ผู้ใช้"}
                </p>

                <p
                  className="
                    text-[10px]
                    text-slate-400
                  "
                >
                  ผู้ใช้งาน
                </p>
              </div>
            </div>

            {/* MOBILE PROFILE */}

            <div
              className="
                sm:hidden
                w-10
                h-10
                rounded-full
                bg-[#a978df]
                text-white
                flex
                items-center
                justify-center
                font-extrabold
              "
            >
              {firstLetter}
            </div>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={onLogout}
              className="
                h-10
                px-3
                sm:px-4
                rounded-full
                bg-white/15
                border
                border-white/30
                text-white
                text-xs
                sm:text-sm
                font-bold
                transition
                hover:bg-white
                hover:text-[#5b9bea]
              "
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* =====================================
          MAIN
      ====================================== */}

      <main
        className="
          flex-1
          w-full
          max-w-[1000px]
          mx-auto
          px-4
          sm:px-6
          py-6
          sm:py-8
        "
      >
        {/* BACK */}

        <button
          type="button"
          onClick={onBack}
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-bold
            text-[#397fd2]
            transition
            hover:-translate-x-1
          "
        >
          <span>←</span>
          <span>กลับหน้าหลัก</span>
        </button>

        {/* =====================================
            LOADING
        ====================================== */}

        {loading && (
          <div
            className="
              mt-5
              min-h-[400px]
              rounded-[24px]
              bg-white
              border
              border-blue-100
              flex
              flex-col
              items-center
              justify-center
              shadow-sm
            "
          >
            <div
              className="
                w-11
                h-11
                rounded-full
                border-4
                border-blue-100
                border-t-[#5b9bea]
                animate-spin
              "
            />

            <p
              className="
                mt-4
                text-sm
                font-bold
                text-slate-500
              "
            >
              กำลังโหลดรายละเอียด...
            </p>
          </div>
        )}

        {/* =====================================
            ERROR
        ====================================== */}

        {!loading && error && (
          <div
            className="
              mt-5
              min-h-[350px]
              rounded-[24px]
              bg-white
              border
              border-red-100
              flex
              flex-col
              items-center
              justify-center
              text-center
              px-6
              shadow-sm
            "
          >
            <div className="text-5xl">
              ⚠️
            </div>

            <h2
              className="
                mt-4
                text-lg
                font-extrabold
                text-slate-700
              "
            >
              เปิดประกาศไม่ได้
            </h2>

            <p
              className="
                mt-2
                max-w-md
                text-sm
                leading-6
                text-slate-500
              "
            >
              {error}
            </p>

            <button
              type="button"
              onClick={onBack}
              className="
                mt-6
                rounded-full
                bg-[#5b9bea]
                px-6
                py-2.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-[#4d8bd9]
              "
            >
              กลับหน้าหลัก
            </button>
          </div>
        )}

        {/* =====================================
            DETAIL
        ====================================== */}

        {!loading &&
          !error &&
          item && (
            <article
              className="
                mt-5
                overflow-hidden
                rounded-[24px]
                bg-white
                border
                border-blue-100
                shadow-[0_12px_35px_rgba(51,65,85,0.08)]
              "
            >
              <div
                className="
                  grid
                  grid-cols-1
                  lg:grid-cols-[1.1fr_0.9fr]
                "
              >
                {/* =========================
                    LEFT - IMAGES
                ========================== */}

                <div
                  className="
                    p-4
                    sm:p-6
                    bg-[#f8fbff]
                  "
                >
                  {/* MAIN IMAGE */}

                  <div
                    className="
                      relative
                      overflow-hidden
                      rounded-2xl
                      bg-[#edf2f7]
                      aspect-[4/3]
                    "
                  >
                    {selectedImage ? (
                      <img
                        src={getImageUrl(
                          selectedImage
                        )}
                        alt={
                          item.title ||
                          "รูปสิ่งของ"
                        }
                        className="
                          w-full
                          h-full
                          object-cover
                        "
                      />
                    ) : (
                      <div
                        className="
                          w-full
                          h-full
                          flex
                          flex-col
                          items-center
                          justify-center
                          text-slate-300
                        "
                      >
                        <div
                          className="
                            text-6xl
                          "
                        >
                          {isLost
                            ? "🔎"
                            : "📦"}
                        </div>

                        <p
                          className="
                            mt-3
                            text-sm
                            font-bold
                          "
                        >
                          ไม่มีรูปภาพ
                        </p>
                      </div>
                    )}

                    {/* BADGE */}

                    <div
                      className={`
                        absolute
                        top-4
                        left-4
                        rounded-full
                        px-4
                        py-2
                        text-xs
                        font-extrabold
                        text-white
                        shadow-sm

                        ${
                          isLost
                            ? "bg-[#ef7777]"
                            : "bg-[#67c5b5]"
                        }
                      `}
                    >
                      {isLost
                        ? "ของหาย"
                        : "ของที่พบ"}
                    </div>
                  </div>

                  {/* THUMBNAILS */}

                  {images.length > 1 && (
                    <div
                      className="
                        mt-3
                        grid
                        grid-cols-3
                        gap-3
                      "
                    >
                      {images.map(
                        (
                          image,
                          index
                        ) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => {
                              setSelectedImage(
                                image
                              );
                            }}
                            className={`
                              overflow-hidden
                              rounded-xl
                              aspect-[4/3]
                              bg-slate-100
                              border-2
                              transition

                              ${
                                selectedImage ===
                                image
                                  ? "border-[#5b9bea]"
                                  : "border-transparent hover:border-blue-200"
                              }
                            `}
                          >
                            <img
                              src={getImageUrl(
                                image
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
                </div>

                {/* =========================
                    RIGHT - INFO
                ========================== */}

                <div
                  className="
                    p-5
                    sm:p-7
                    lg:p-8
                  "
                >
                  {/* CATEGORY */}

                  {item.category_name && (
                    <p
                      className="
                        text-xs
                        font-extrabold
                        uppercase
                        tracking-wide
                        text-[#5b9bea]
                      "
                    >
                      {
                        item.category_name
                      }
                    </p>
                  )}

                  {/* TITLE */}

                  <h1
                    className="
                      mt-2
                      text-2xl
                      sm:text-3xl
                      font-extrabold
                      leading-tight
                      text-slate-700
                    "
                  >
                    {item.title}
                  </h1>

                  <p
                    className="
                      mt-2
                      text-xs
                      text-slate-400
                    "
                  >
                    รหัสประกาศ{" "}
                    {isLost
                      ? "LF"
                      : "FD"}
                    -
                    {String(
                      item.id
                    ).padStart(
                      4,
                      "0"
                    )}
                  </p>

                  {/* =========================
                      META
                  ========================== */}

                  <div
                    className="
                      mt-6
                      grid
                      grid-cols-1
                      sm:grid-cols-2
                      gap-3
                    "
                  >
                    <InfoBox
                      icon="📍"
                      label="สถานที่"
                      value={
                        item.location ||
                        "-"
                      }
                    />

                    <InfoBox
                      icon="📅"
                      label={
                        isLost
                          ? "วันที่ทำหาย"
                          : "วันที่พบ"
                      }
                      value={
                        formatDate(
                          dateValue
                        ) || "-"
                      }
                    />

                    <InfoBox
                      icon="🕐"
                      label="เวลา"
                      value={
                        formatTime(
                          timeValue
                        ) || "ไม่ระบุ"
                      }
                    />

                    <InfoBox
                      icon="👤"
                      label="ผู้โพสต์"
                      value={
                        item.user_name ||
                        "ผู้ใช้งาน"
                      }
                    />
                  </div>

                  {/* =========================
                      DESCRIPTION
                  ========================== */}

                  <section
                    className="
                      mt-6
                      pt-6
                      border-t
                      border-slate-100
                    "
                  >
                    <h2
                      className="
                        text-sm
                        font-extrabold
                        text-slate-700
                      "
                    >
                      รายละเอียด
                    </h2>

                    <p
                      className="
                        mt-2
                        text-sm
                        leading-7
                        text-slate-500
                        whitespace-pre-wrap
                        break-words
                      "
                    >
                      {item.description ||
                        "ไม่มีรายละเอียดเพิ่มเติม"}
                    </p>
                  </section>

                  {/* =========================
                      CONTACT - FOUND
                  ========================== */}

                  {!isLost &&
                    item.contact && (
                      <section
                        className="
                          mt-6
                          rounded-2xl
                          border
                          border-emerald-100
                          bg-emerald-50/50
                          p-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            gap-3
                          "
                        >
                          <div
                            className="
                              w-10
                              h-10
                              shrink-0
                              rounded-full
                              bg-[#67c5b5]
                              flex
                              items-center
                              justify-center
                            "
                          >
                            💬
                          </div>

                          <div
                            className="
                              min-w-0
                            "
                          >
                            <p
                              className="
                                text-xs
                                font-extrabold
                                text-emerald-700
                              "
                            >
                              ช่องทางติดต่อ
                            </p>

                            <p
                              className="
                                mt-1
                                text-sm
                                font-bold
                                text-slate-700
                                break-words
                              "
                            >
                              {
                                item.contact
                              }
                            </p>
                          </div>
                        </div>
                      </section>
                    )}


                  {/* =========================
                      CLAIM - FOUND
                  ========================== */}

                  {!isLost && (
                    <section className="mt-6 rounded-[22px] border-2 border-[#67c5b5]/30 bg-[#f0fffb] p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#67c5b5] text-xl">
                          📦
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-extrabold text-slate-700">
                            คิดว่านี่เป็นของคุณ?
                          </h2>
                          <p className="mt-1 text-xs leading-6 text-slate-500">
                            ส่งคำขอรับของคืน พร้อมรายละเอียดและรูปหลักฐานให้ Staff ตรวจสอบ
                          </p>
                        </div>
                      </div>

                      {Number(item.user_id) === Number(user?.id) ? (
                        <div className="mt-4 rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-slate-400">
                          นี่คือประกาศของคุณเอง
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onClaim?.(item)}
                          className="mt-4 w-full rounded-full bg-[#67c5b5] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 sm:text-base"
                        >
                          📦 ขอรับของคืน
                        </button>
                      )}
                    </section>
                  )}

                  {/* =========================
                      REPORT / COMPLAINT
                  ========================== */}

                  <section className="mt-6 rounded-2xl border border-red-100 bg-red-50/50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-slate-700">พบปัญหากับประกาศนี้?</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">แจ้ง Admin เพื่อตรวจสอบประกาศหรือปัญหาที่เกี่ยวข้อง</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setComplaintOpen(true);
                          setComplaintError("");
                          setComplaintSuccess("");
                        }}
                        className="shrink-0 rounded-full border border-red-200 bg-white px-4 py-2.5 text-xs font-extrabold text-[#ef7777] transition hover:bg-red-50"
                      >
                        ⚑ ร้องเรียนประกาศ
                      </button>
                    </div>
                  </section>

                  {/* =========================
                      NOTICE
                  ========================== */}

                  <div
                    className="
                      mt-6
                      rounded-2xl
                      bg-[#edf5ff]
                      p-4
                    "
                  >
                    <p
                      className="
                        text-xs
                        leading-6
                        text-slate-500
                      "
                    >
                      🛡️ ประกาศนี้ผ่านการตรวจสอบและอนุมัติโดย Staff แล้ว
                      โปรดตรวจสอบข้อมูลให้แน่ใจก่อนติดต่อหรือนัดหมายรับสิ่งของ
                    </p>
                  </div>
                </div>
              </div>
            </article>
          )}
      </main>

      {complaintOpen && (
        <div
          className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-900/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setComplaintOpen(false);
          }}
        >
          <section className="w-full max-w-[560px] rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-slate-700">ร้องเรียนประกาศนี้</h2>
                <p className="mt-1 text-xs text-slate-400">ระบบจะผูกข้อร้องเรียนกับประกาศ #{item?.id}</p>
              </div>
              <button type="button" onClick={() => setComplaintOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl text-slate-500">×</button>
            </div>

            {complaintError && <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">{complaintError}</div>}
            {complaintSuccess && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{complaintSuccess}</div>}

            <form onSubmit={submitItemComplaint} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-600">หัวข้อร้องเรียน</label>
                <input required maxLength={150} value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)} placeholder="เช่น ข้อมูลประกาศไม่ถูกต้อง" className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3 text-sm outline-none focus:border-[#5b9bea]" />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-600">รายละเอียด</label>
                <textarea required rows={5} value={complaintDescription} onChange={(e) => setComplaintDescription(e.target.value)} placeholder="อธิบายเหตุผลที่ต้องการให้ Admin ตรวจสอบ..." className="mt-2 w-full resize-none rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3 text-sm outline-none focus:border-[#5b9bea]" />
              </div>
              <button disabled={complaintSaving} className="w-full rounded-full bg-[#ef7777] px-5 py-3 text-sm font-extrabold text-white transition hover:brightness-95 disabled:opacity-50">
                {complaintSaving ? "กำลังส่ง..." : "ส่งข้อร้องเรียน"}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* =====================================
          FOOTER
      ====================================== */}

      <footer
        className="
          mt-auto
          border-t
          border-blue-100
          bg-white/30
        "
      >
        <div
          className="
            max-w-[1000px]
            mx-auto
            px-5
            py-7
            text-center
            text-xs
            sm:text-sm
            text-slate-500
          "
        >
          © 2026 TAMKUEN LOST&FOUND — พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้
        </div>
      </footer>
    </div>
  );
}

// ========================================
// INFO BOX
// ========================================

function InfoBox({
  icon,
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-100
        bg-[#fbfdff]
        p-4
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <span
          className="
            text-lg
            shrink-0
          "
        >
          {icon}
        </span>

        <div className="min-w-0">
          <p
            className="
              text-[10px]
              font-bold
              text-slate-400
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              text-xs
              sm:text-sm
              font-bold
              leading-5
              text-slate-600
              break-words
            "
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// ========================================
// FORMAT DATE
// ========================================

function formatDate(
  dateValue
) {
  if (!dateValue) {
    return "";
  }

  try {
    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateValue;
    }

    return new Intl.DateTimeFormat(
      "th-TH",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(date);
  } catch {
    return dateValue;
  }
}

// ========================================
// FORMAT TIME
// ========================================

function formatTime(
  timeValue
) {
  if (!timeValue) {
    return "";
  }

  const value =
    String(timeValue);

  // MySQL TIME เช่น 14:30:00
  const match =
    value.match(
      /^(\d{1,2}):(\d{2})/
    );

  if (match) {
    return `${match[1].padStart(
      2,
      "0"
    )}:${match[2]} น.`;
  }

  return value;
}

export default ItemDetail;