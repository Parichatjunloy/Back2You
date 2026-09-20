import {
  useEffect,
  useRef,
  useState,
} from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ========================================
// Back2You - FoundItem.jsx
// ========================================

function FoundItem({
  user,
  onBack,
  onSuccess,
  onLogout,
}) {
  // ========================================
  // STATE
  // ========================================

  const [categories, setCategories] =
    useState([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [images, setImages] =
    useState([]);

  const [previews, setPreviews] =
    useState([]);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    foundDate: "",
    foundTime: "",
    location: "",
    description: "",
    contact: "",
  });

  // ========================================
  // USER
  // ========================================

  const firstLetter =
    user?.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";

  // ========================================
  // TODAY
  // ป้องกันเลือกวันที่ในอนาคต
  // ========================================

  const getToday = () => {
    const date = new Date();

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = getToday();

  // ========================================
  // LOAD CATEGORIES
  // ========================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/categories`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "ไม่สามารถโหลดหมวดหมู่ได้"
          );
        }

        setCategories(
          data.categories || []
        );
      } catch (error) {
        console.error(
          "Load Categories Error:",
          error
        );

        setError(
          error.message ||
            "ไม่สามารถโหลดหมวดหมู่ได้"
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // ========================================
  // CLEAN PREVIEW URL
  // ========================================

  useEffect(() => {
    return () => {
      previews.forEach(
        (preview) => {
          URL.revokeObjectURL(
            preview
          );
        }
      );
    };
  }, [previews]);

  // ========================================
  // FORM CHANGE
  // ========================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ========================================
  // IMAGE SELECT
  // ========================================

  const handleImageChange = (
    event
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files || []
      );

    // ทำให้สามารถเลือกไฟล์เดิมซ้ำได้
    event.target.value = "";

    if (
      selectedFiles.length === 0
    ) {
      return;
    }

    const remainingSlots =
      MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {
      setError(
        "สามารถอัปโหลดรูปภาพได้สูงสุด 3 รูป"
      );

      return;
    }

    const filesToAdd =
      selectedFiles.slice(
        0,
        remainingSlots
      );

    // ========================================
    // VALIDATE IMAGES
    // ========================================

    for (
      const file of filesToAdd
    ) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setError(
          "รองรับเฉพาะไฟล์ JPG และ PNG เท่านั้น"
        );

        return;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        setError(
          `รูป "${file.name}" มีขนาดเกิน 5MB`
        );

        return;
      }
    }

    // ========================================
    // CREATE PREVIEWS
    // ========================================

    const newPreviews =
      filesToAdd.map(
        (file) =>
          URL.createObjectURL(
            file
          )
      );

    setImages(
      (previous) => [
        ...previous,
        ...filesToAdd,
      ]
    );

    setPreviews(
      (previous) => [
        ...previous,
        ...newPreviews,
      ]
    );

    if (
      selectedFiles.length >
      remainingSlots
    ) {
      setError(
        `เพิ่มได้อีกเพียง ${remainingSlots} รูป ระบบเลือกให้เฉพาะ ${remainingSlots} รูปแรก`
      );
    } else {
      setError("");
    }
  };

  // ========================================
  // REMOVE IMAGE
  // ========================================

  const removeImage = (
    index
  ) => {
    if (previews[index]) {
      URL.revokeObjectURL(
        previews[index]
      );
    }

    setImages(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );

    setPreviews(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );

    setError("");
  };

  // ========================================
  // VALIDATE FORM
  // ========================================

  const validateForm = () => {
    if (!form.title.trim()) {
      return "กรุณากรอกชื่อสิ่งของ";
    }

    if (!form.categoryId) {
      return "กรุณาเลือกหมวดหมู่";
    }

    if (!form.foundDate) {
      return "กรุณาระบุวันที่พบ";
    }

    if (
      form.foundDate > today
    ) {
      return "วันที่พบไม่สามารถเป็นวันที่ในอนาคตได้";
    }

    if (!form.location.trim()) {
      return "กรุณาระบุสถานที่พบ";
    }

    if (!form.contact.trim()) {
      return "กรุณาระบุช่องทางติดต่อ";
    }

    return "";
  };

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setSuccess("");

    // ========================================
    // FRONTEND VALIDATION
    // ========================================

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    // ========================================
    // TOKEN
    // ========================================

    const token =
      localStorage.getItem(
        "back2you_token"
      );

    if (!token) {
      setError(
        "ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่"
      );

      return;
    }

    try {
      setSubmitting(true);

      // ========================================
      // FORM DATA
      // ========================================

      const formData =
        new FormData();

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "categoryId",
        form.categoryId
      );

      formData.append(
        "foundDate",
        form.foundDate
      );

      formData.append(
        "foundTime",
        form.foundTime
      );

      formData.append(
        "location",
        form.location.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "contact",
        form.contact.trim()
      );

      // ========================================
      // IMAGES
      // ========================================

      images.forEach(
        (image) => {
          formData.append(
            "images",
            image
          );
        }
      );

      // ========================================
      // API
      // ========================================

      const response =
        await fetch(
          `${API_BASE}/api/found-items`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "ไม่สามารถส่งประกาศแจ้งพบของได้"
        );
      }

      // ========================================
      // SUCCESS
      // ========================================

      setSuccess(
        "ส่งประกาศแจ้งพบของเรียบร้อยแล้ว กำลังรอ Staff ตรวจสอบ"
      );

      // ========================================
      // RESET FORM
      // ========================================

      setForm({
        title: "",
        categoryId: "",
        foundDate: "",
        foundTime: "",
        location: "",
        description: "",
        contact: "",
      });

      previews.forEach(
        (preview) => {
          URL.revokeObjectURL(
            preview
          );
        }
      );

      setImages([]);
      setPreviews([]);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      // ========================================
      // GO BACK HOME
      // ========================================

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
          return;
        }

        if (onBack) {
          onBack();
        }
      }, 1200);
    } catch (error) {
      console.error(
        "Create Found Item Error:",
        error
      );

      setError(
        error.message ||
          "ไม่สามารถส่งประกาศแจ้งพบของได้"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSubmitting(false);
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
            max-w-[1180px]
            mx-auto
            min-h-[76px]
            px-4
            sm:px-6
            flex
            items-center
            justify-between
            gap-4
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
                w-[108px]
                sm:w-[120px]
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
            {/* PROFILE DESKTOP */}

            <div
              className="
                hidden
                sm:flex
                items-center
                gap-2
                rounded-full
                bg-white
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
                  shrink-0
                "
              >
                {firstLetter}
              </div>

              <div
                className="
                  text-left
                  max-w-[130px]
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

            {/* PROFILE MOBILE */}

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
                shadow-sm
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
                whitespace-nowrap
                transition
                hover:bg-white
                hover:text-[#5b9bea]
                hover:shadow-md
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
          max-w-[960px]
          mx-auto
          px-4
          sm:px-6
          py-7
          sm:py-10
        "
      >
        {/* =====================================
            BACK
        ====================================== */}

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
            hover:gap-3
          "
        >
          <span>←</span>
          กลับหน้าหลัก
        </button>

        {/* =====================================
            CARD
        ====================================== */}

        <div
          className="
            mt-5
            bg-white
            border
            border-emerald-100
            rounded-[28px]
            overflow-hidden
            shadow-[0_10px_35px_rgba(91,155,234,0.10)]
          "
        >
          {/* =================================
              PAGE HERO
          ================================== */}

          <section
            className="
              relative
              overflow-hidden
              px-5
              sm:px-8
              py-7
              sm:py-8
              bg-gradient-to-r
              from-[#f2fffb]
              via-white
              to-[#f5f9ff]
            "
          >
            {/* DECORATION */}

            <div
              className="
                absolute
                -right-16
                -top-20
                w-56
                h-56
                rounded-full
                bg-[#dff8f2]
                pointer-events-none
              "
            />

            <div
              className="
                absolute
                -left-20
                -bottom-24
                w-52
                h-52
                rounded-full
                bg-[#edf5ff]
                pointer-events-none
              "
            />

            <div
              className="
                relative
                z-10
                flex
                items-start
                gap-4
              "
            >
              {/* ICON */}

              <div
                className="
                  w-14
                  h-14
                  sm:w-16
                  sm:h-16
                  rounded-2xl
                  bg-[#67c5b5]
                  text-white
                  flex
                  items-center
                  justify-center
                  text-2xl
                  sm:text-3xl
                  shadow-sm
                  shrink-0
                "
              >
                📦
              </div>

              <div>
                <div
                  className="
                    inline-flex
                    items-center
                    rounded-full
                    bg-[#e5f8f4]
                    text-[#399b8b]
                    px-3
                    py-1
                    text-[10px]
                    sm:text-[11px]
                    font-extrabold
                    tracking-wide
                  "
                >
                  FOUND ITEM
                </div>

                <h1
                  className="
                    mt-2
                    text-2xl
                    sm:text-3xl
                    font-extrabold
                    tracking-[-0.02em]
                  "
                >
                  แจ้งพบของ
                </h1>

                <p
                  className="
                    max-w-[600px]
                    mt-2
                    text-xs
                    sm:text-sm
                    leading-6
                    text-slate-500
                  "
                >
                  กรอกรายละเอียดสิ่งของที่คุณพบ
                  เพื่อช่วยให้เจ้าของสามารถค้นหาและติดต่อขอรับคืนได้ง่ายขึ้น
                </p>
              </div>
            </div>
          </section>

          {/* =================================
              FORM
          ================================== */}

          <form
            onSubmit={handleSubmit}
            className="
              px-5
              sm:px-8
              py-7
              sm:py-8
            "
          >
            {/* =================================
                ERROR
            ================================== */}

            {error && (
              <div
                className="
                  mb-6
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3.5
                  flex
                  items-start
                  gap-3
                  text-sm
                  text-red-600
                "
              >
                <div
                  className="
                    w-8
                    h-8
                    rounded-xl
                    bg-white
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  ⚠️
                </div>

                <div>
                  <p className="font-extrabold">
                    กรุณาตรวจสอบข้อมูล
                  </p>

                  <p className="mt-0.5">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* =================================
                SUCCESS
            ================================== */}

            {success && (
              <div
                className="
                  mb-6
                  rounded-2xl
                  border
                  border-emerald-200
                  bg-emerald-50
                  px-4
                  py-3.5
                  flex
                  items-start
                  gap-3
                  text-sm
                  text-emerald-700
                "
              >
                <div
                  className="
                    w-8
                    h-8
                    rounded-xl
                    bg-white
                    flex
                    items-center
                    justify-center
                    shrink-0
                    font-bold
                  "
                >
                  ✓
                </div>

                <div>
                  <p className="font-extrabold">
                    ส่งประกาศสำเร็จ
                  </p>

                  <p className="mt-0.5">
                    {success}
                  </p>
                </div>
              </div>
            )}

            {/* =================================
                SECTION 1
            ================================== */}

            <FormSection
              number="1"
              title="ข้อมูลสิ่งของ"
              description="ระบุข้อมูลพื้นฐานของสิ่งของที่คุณพบ"
            >
              <div
                className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  gap-5
                "
              >
                {/* TITLE */}

                <div className="md:col-span-2">
                  <Label required>
                    ชื่อสิ่งของ
                  </Label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    maxLength={150}
                    placeholder="เช่น กระเป๋าสตางค์สีดำ"
                    className={inputClass}
                  />
                </div>

                {/* CATEGORY */}

                <div>
                  <Label required>
                    หมวดหมู่
                  </Label>

                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    disabled={
                      loadingCategories
                    }
                    className={inputClass}
                  >
                    <option value="">
                      {loadingCategories
                        ? "กำลังโหลดหมวดหมู่..."
                        : "เลือกหมวดหมู่"}
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* DATE */}

                <div>
                  <Label required>
                    วันที่พบ
                  </Label>

                  <input
                    type="date"
                    name="foundDate"
                    value={
                      form.foundDate
                    }
                    onChange={
                      handleChange
                    }
                    max={today}
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* TIME */}

                <div>
                  <Label>
                    เวลาที่พบ
                  </Label>

                  <input
                    type="time"
                    name="foundTime"
                    value={
                      form.foundTime
                    }
                    onChange={
                      handleChange
                    }
                    className={
                      inputClass
                    }
                  />

                  <p
                    className="
                      mt-2
                      text-[11px]
                      text-slate-400
                    "
                  >
                    ไม่จำเป็นต้องระบุหากจำเวลาไม่ได้
                  </p>
                </div>

                {/* LOCATION */}

                <div>
                  <Label required>
                    สถานที่พบ
                  </Label>

                  <input
                    type="text"
                    name="location"
                    value={
                      form.location
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={255}
                    placeholder="เช่น อาคารเรียน A ชั้น 2"
                    className={
                      inputClass
                    }
                  />
                </div>
              </div>
            </FormSection>

            {/* =================================
                SECTION 2
            ================================== */}

            <FormSection
              number="2"
              title="รายละเอียดเพิ่มเติม"
              description="รายละเอียดเล็ก ๆ อาจช่วยให้เจ้าของจำสิ่งของของตัวเองได้"
            >
              <Label>
                รายละเอียดสิ่งของ
              </Label>

              <textarea
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                rows={5}
                maxLength={1500}
                placeholder="เช่น สี ลักษณะ จุดสังเกต หรือบริเวณที่พบ..."
                className="
                  w-full
                  min-h-[140px]
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  resize-none
                  placeholder:text-slate-400
                  focus:border-[#67c5b5]
                  focus:ring-4
                  focus:ring-emerald-50
                "
              />

              <div
                className="
                  mt-2
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <p
                  className="
                    text-[11px]
                    text-slate-400
                  "
                >
                  ไม่จำเป็นต้องใส่ข้อมูลส่วนตัวในช่องนี้
                </p>

                <p
                  className="
                    text-[11px]
                    text-slate-400
                    whitespace-nowrap
                  "
                >
                  {
                    form
                      .description
                      .length
                  }
                  /1500
                </p>
              </div>
            </FormSection>

            {/* =================================
                SECTION 3 - IMAGES
            ================================== */}

            <FormSection
              number="3"
              title="รูปภาพสิ่งของ"
              description="เพิ่มรูปได้สูงสุด 3 รูป รองรับ JPG และ PNG ขนาดไม่เกิน 5MB ต่อรูป"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={
                  handleImageChange
                }
                className="hidden"
              />

              {/* PREVIEWS */}

              {previews.length >
                0 && (
                <div
                  className="
                    grid
                    grid-cols-2
                    sm:grid-cols-3
                    gap-4
                    mb-4
                  "
                >
                  {previews.map(
                    (
                      preview,
                      index
                    ) => (
                      <div
                        key={
                          preview
                        }
                        className="
                          group
                          relative
                          aspect-square
                          rounded-2xl
                          overflow-hidden
                          border
                          border-slate-200
                          bg-slate-50
                        "
                      >
                        <img
                          src={
                            preview
                          }
                          alt={`รูปสิ่งของ ${
                            index +
                            1
                          }`}
                          className="
                            w-full
                            h-full
                            object-cover
                          "
                        />

                        {/* DARK OVERLAY */}

                        <div
                          className="
                            absolute
                            inset-0
                            bg-black/0
                            transition
                            group-hover:bg-black/10
                            pointer-events-none
                          "
                        />

                        {/* REMOVE */}

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              index
                            )
                          }
                          className="
                            absolute
                            top-2
                            right-2
                            w-8
                            h-8
                            rounded-full
                            bg-slate-900/70
                            text-white
                            flex
                            items-center
                            justify-center
                            font-bold
                            shadow-sm
                            transition
                            hover:bg-red-500
                          "
                        >
                          ×
                        </button>

                        {/* NUMBER */}

                        <div
                          className="
                            absolute
                            bottom-2
                            left-2
                            rounded-full
                            bg-white/95
                            px-2.5
                            py-1
                            text-[10px]
                            font-bold
                            text-slate-600
                            shadow-sm
                          "
                        >
                          รูป{" "}
                          {index + 1}
                        </div>

                        {/* COVER */}

                        {index ===
                          0 && (
                          <div
                            className="
                              absolute
                              bottom-2
                              right-2
                              rounded-full
                              bg-[#67c5b5]
                              px-2.5
                              py-1
                              text-[10px]
                              font-bold
                              text-white
                              shadow-sm
                            "
                          >
                            รูปหลัก
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* UPLOAD BOX */}

              {images.length <
                MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="
                    w-full
                    min-h-[140px]
                    rounded-2xl
                    border-2
                    border-dashed
                    border-emerald-200
                    bg-[#f8fffd]
                    px-5
                    py-6
                    flex
                    flex-col
                    items-center
                    justify-center
                    text-center
                    transition
                    hover:border-[#67c5b5]
                    hover:bg-[#f1fcf9]
                  "
                >
                  <span
                    className="
                      w-12
                      h-12
                      rounded-2xl
                      bg-[#e4f8f3]
                      flex
                      items-center
                      justify-center
                      text-2xl
                    "
                  >
                    📷
                  </span>

                  <span
                    className="
                      mt-3
                      text-sm
                      font-extrabold
                      text-[#399b8b]
                    "
                  >
                    เลือกรูปภาพ
                  </span>

                  <span
                    className="
                      mt-1
                      text-xs
                      text-slate-400
                    "
                  >
                    JPG หรือ PNG
                    • เลือกได้อีก{" "}
                    {MAX_IMAGES -
                      images.length}{" "}
                    รูป
                  </span>
                </button>
              )}

              {/* FULL */}

              {images.length ===
                MAX_IMAGES && (
                <div
                  className="
                    rounded-xl
                    bg-emerald-50
                    border
                    border-emerald-100
                    px-4
                    py-3
                    text-center
                    text-xs
                    font-bold
                    text-emerald-600
                  "
                >
                  ✓ เพิ่มรูปครบ 3 รูปแล้ว
                </div>
              )}
            </FormSection>

            {/* =================================
                SECTION 4 - CONTACT
            ================================== */}

            <FormSection
              number="4"
              title="ช่องทางติดต่อ"
              description="ระบุช่องทางสำหรับติดต่อเกี่ยวกับการรับสิ่งของคืน"
            >
              <Label required>
                ช่องทางติดต่อ
              </Label>

              <input
                type="text"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                maxLength={255}
                placeholder="เช่น เบอร์โทร หรือ LINE"
                className={inputClass}
              />

              <div
                className="
                  mt-3
                  rounded-xl
                  bg-[#f5f9ff]
                  border
                  border-blue-100
                  px-4
                  py-3
                  flex
                  items-start
                  gap-3
                "
              >
                <div
                  className="
                    w-8
                    h-8
                    rounded-lg
                    bg-white
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  🔒
                </div>

                <p
                  className="
                    text-xs
                    leading-5
                    text-slate-500
                  "
                >
                  ใส่เฉพาะช่องทางที่จำเป็นสำหรับการติดต่อเรื่องสิ่งของนี้
                  และตรวจสอบข้อมูลให้ถูกต้องก่อนส่งประกาศ
                </p>
              </div>
            </FormSection>

            {/* =================================
                REVIEW NOTICE
            ================================== */}

            <div
              className="
                mt-8
                rounded-2xl
                border
                border-blue-100
                bg-[#f5f9ff]
                p-4
                sm:p-5
                flex
                items-start
                gap-3
              "
            >
              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-white
                  flex
                  items-center
                  justify-center
                  shrink-0
                  shadow-sm
                  text-xl
                "
              >
                🛡️
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-extrabold
                    text-slate-700
                  "
                >
                  ประกาศจะถูกตรวจสอบก่อนเผยแพร่
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    sm:text-sm
                    leading-5
                    text-slate-500
                  "
                >
                  เมื่อส่งข้อมูลแล้ว
                  ประกาศจะมีสถานะ
                  “รอตรวจสอบ”
                  และจะยังไม่แสดงบนหน้า Home
                  จนกว่า Staff
                  จะตรวจสอบและอนุมัติ
                </p>
              </div>
            </div>

            {/* =================================
                ACTIONS
            ================================== */}

            <div
              className="
                mt-7
                pt-6
                border-t
                border-slate-100
                flex
                flex-col-reverse
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-3
              "
            >
              <p
                className="
                  text-[11px]
                  sm:text-xs
                  text-slate-400
                  text-center
                  sm:text-left
                "
              >
                ช่องที่มี{" "}
                <span className="text-red-500">
                  *
                </span>{" "}
                จำเป็นต้องกรอก
              </p>

              <div
                className="
                  flex
                  flex-col-reverse
                  sm:flex-row
                  gap-3
                "
              >
                {/* CANCEL */}

                <button
                  type="button"
                  onClick={onBack}
                  disabled={
                    submitting
                  }
                  className="
                    h-12
                    px-6
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-sm
                    font-bold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                    hover:border-slate-300
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  ยกเลิก
                </button>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    loadingCategories
                  }
                  className="
                    min-w-[190px]
                    h-12
                    px-7
                    rounded-xl
                    bg-[#67c5b5]
                    text-white
                    text-sm
                    font-extrabold
                    shadow-sm
                    transition
                    hover:bg-[#56b5a5]
                    hover:shadow-md
                    hover:-translate-y-[1px]
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    disabled:translate-y-0
                  "
                >
                  {submitting
                    ? "กำลังส่งประกาศ..."
                    : "ส่งประกาศแจ้งพบของ"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* =====================================
          FOOTER
      ====================================== */}

      <footer
        className="
          mt-auto
          border-t
          border-blue-100
          bg-white/40
        "
      >
        <div
          className="
            max-w-[960px]
            mx-auto
            px-5
            py-7
            text-center
            text-xs
            sm:text-sm
            text-slate-400
          "
        >
          © 2026 TAMKUEN LOST&FOUND —
          พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้
        </div>
      </footer>
    </div>
  );
}

// ========================================
// FORM SECTION
// ========================================

function FormSection({
  number,
  title,
  description,
  children,
}) {
  return (
    <section
      className="
        [&+section]:mt-8
      "
    >
      {/* TITLE */}

      <div
        className="
          flex
          items-start
          gap-3
          mb-5
        "
      >
        <div
          className="
            w-9
            h-9
            rounded-xl
            bg-[#e4f8f3]
            text-[#399b8b]
            flex
            items-center
            justify-center
            text-sm
            font-extrabold
            shrink-0
          "
        >
          {number}
        </div>

        <div>
          <h2
            className="
              text-base
              sm:text-lg
              font-extrabold
              text-slate-700
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-1
              text-xs
              sm:text-sm
              text-slate-400
            "
          >
            {description}
          </p>
        </div>
      </div>

      {/* CONTENT */}

      <div
        className="
          rounded-2xl
          border
          border-slate-100
          bg-[#fbfdff]
          p-4
          sm:p-5
        "
      >
        {children}
      </div>
    </section>
  );
}

// ========================================
// LABEL
// ========================================

function Label({
  required = false,
  children,
}) {
  return (
    <label
      className="
        block
        mb-2
        text-sm
        font-bold
        text-slate-700
      "
    >
      {children}

      {required && (
        <span className="text-red-500">
          {" "}
          *
        </span>
      )}
    </label>
  );
}

// ========================================
// INPUT CLASS
// ========================================

const inputClass = `
  w-full
  h-12
  rounded-xl
  border
  border-slate-200
  bg-white
  px-4
  text-sm
  text-slate-700
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-[#67c5b5]
  focus:ring-4
  focus:ring-emerald-50
  disabled:bg-slate-100
  disabled:text-slate-400
  disabled:cursor-not-allowed
`;

export default FoundItem;