import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ========================================
// Back2You - Home.jsx
// ========================================

function Home({
  user,
  onLogout,
  onGoPost,
  onGoLost,
  onGoFound,
  onGoMyItems,
  onGoReturns,
  onGoProfile,
  onOpenPost,
}) {
  // ========================================
  // STATE
  // ========================================

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");

  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [categories, setCategories] = useState([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const [complaintCenterOpen, setComplaintCenterOpen] = useState(false);

  // ========================================
  // USER
  // ========================================

  const firstLetter =
    user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const profileImagePath =
    user?.profileImage || user?.profile_image || "";

  const profileImageUrl = profileImagePath
    ? profileImagePath.startsWith("http://") ||
      profileImagePath.startsWith("https://")
      ? profileImagePath
      : `${API_BASE}${
          profileImagePath.startsWith("/")
            ? profileImagePath
            : `/${profileImagePath}`
        }`
    : "";

  // ========================================
  // LOAD POSTS
  // ========================================

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        params.set("type", filter);
        params.set("limit", "30");

        if (searchQuery.trim()) {
          params.set(
            "search",
            searchQuery.trim()
          );
        }

        if (categoryId) {
          params.set("categoryId", categoryId);
        }

        if (locationFilter.trim()) {
          params.set("location", locationFilter.trim());
        }

        if (dateFrom) {
          params.set("dateFrom", dateFrom);
        }

        if (dateTo) {
          params.set("dateTo", dateTo);
        }

        const response = await fetch(
          `${API_BASE}/api/posts?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "ไม่สามารถโหลดประกาศได้"
          );
        }

        setPosts(data.posts || []);
      } catch (error) {
        console.error(
          "Load Posts Error:",
          error
        );

        setError(
          error.message ||
            "ไม่สามารถโหลดประกาศได้"
        );

        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [filter, searchQuery, categoryId, locationFilter, dateFrom, dateTo]);

  // ========================================
  // CATEGORIES FOR ADVANCED FILTER
  // ========================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();

        if (response.ok) {
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Load Categories Error:", error);
      }
    };

    loadCategories();
  }, []);

  // ========================================
  // NOTIFICATIONS
  // ========================================

  const loadUnreadCount = async () => {
    const token = localStorage.getItem("back2you_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (error) {
      console.error("Load Notification Count Error:", error);
    }
  };

  const loadNotifications = async () => {
    const token = localStorage.getItem("back2you_token");
    if (!token) return;

    try {
      setNotificationLoading(true);

      const response = await fetch(
        `${API_BASE}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "ไม่สามารถโหลดการแจ้งเตือนได้"
        );
      }

      setNotifications(data.notifications || []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (error) {
      console.error("Load Notifications Error:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleNotificationToggle = () => {
    const nextOpen = !notificationOpen;
    setNotificationOpen(nextOpen);

    if (nextOpen) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification) return;

    if (!notification.is_read) {
      await markNotificationRead(notification.id);
    }

    if (
      notification.type === "match_confirmed" &&
      notification.related_id
    ) {
      setNotificationOpen(false);

      onOpenPost?.({
        id: Number(notification.related_id),
        type: "found",
      });
    }
  };

  const markNotificationRead = async (notificationId) => {
    const token = localStorage.getItem("back2you_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, is_read: 1 }
            : item
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Read Notification Error:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    const token = localStorage.getItem("back2you_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: 1 }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Read All Notifications Error:", error);
    }
  };

  useEffect(() => {
    loadUnreadCount();

    const intervalId = window.setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  // ========================================
  // SEARCH
  // ========================================

  const handleSearch = (event) => {
    event.preventDefault();

    setSearchQuery(
      searchText.trim()
    );
  };

  const handleClearSearch = () => {
    setSearchText("");
    setSearchQuery("");
  };

  const handleClearAdvancedFilters = () => {
    setCategoryId("");
    setLocationFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const handleClearAllFilters = () => {
    setFilter("all");
    setSearchText("");
    setSearchQuery("");
    handleClearAdvancedFilters();
  };

  const hasAdvancedFilters =
    Boolean(categoryId) ||
    Boolean(locationFilter.trim()) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const hasAnyFilters =
    filter !== "all" ||
    Boolean(searchQuery) ||
    hasAdvancedFilters;

  // ========================================
  // GO LOST
  // ========================================

  const handleLostItem = () => {
    if (onGoLost) {
      onGoLost();
    }
  };

  // ========================================
  // GO FOUND
  // ========================================

  const handleFoundItem = () => {
    if (onGoFound) {
      onGoFound();
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#eaf3ff]
        text-[#334155]
        flex
        flex-col
      "
    >
      {/* Decorative background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* 1: Purple */}
        <div className="absolute -left-24 top-[170px] h-64 w-64 rounded-full bg-[#a978df]/20" />

        {/* 2: Blue */}
        <div className="absolute -right-28 top-[340px] h-80 w-80 rounded-full bg-[#5b9bea]/18" />

        {/* Supporting circles */}
        <div className="absolute left-[8%] top-[760px] h-32 w-32 rounded-full bg-[#f8cf4b]/22" />
        <div className="absolute right-[8%] top-[980px] h-44 w-44 rounded-full bg-[#67c5b5]/16" />
        <div className="absolute -left-16 bottom-[180px] h-48 w-48 rounded-full bg-[#ef7777]/12" />
      </div>
      {/* =====================================
          HEADER
      ====================================== */}

      <header
        className="
          relative
          sticky
          top-0
          z-40
          bg-[#5b9bea]
          shadow-[0_2px_12px_rgba(30,64,175,0.12)]
        "
      >
        <div
          className="
            relative
            max-w-[1500px]
            mx-auto
            min-h-[84px]
            px-4
            sm:px-6
            lg:px-8
            flex
            md:grid
            md:grid-cols-[minmax(140px,1fr)_auto_minmax(300px,1fr)]
            items-center
            gap-4
            lg:gap-6
          "
        >
          {/* =================================
              LOGO
          ================================== */}

          <button
            type="button"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="
              justify-self-start
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
                sm:w-[122px]
                xl:w-[132px]
                h-auto
                object-contain
              "
            />
          </button>

          {/* =================================
              CENTER NAV - DESKTOP
          ================================== */}

          <nav
            className="
              hidden
              md:flex
              justify-self-center
              items-center
              gap-1
              bg-white/95
              backdrop-blur-md
              rounded-[22px]
              p-1.5
              border
              border-white/80
              shadow-[0_8px_24px_rgba(51,65,85,0.10)]
            "
          >
            {/* SEARCH */}

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("home-search")
                  ?.focus();

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              className="
                min-w-[88px] lg:min-w-[98px] xl:min-w-[108px]
                px-3
                py-2.5
                rounded-full
                text-sm
                font-bold
                transition
                hover:bg-[#edf5ff]
                hover:text-[#397fd2]
              "
            >
              ค้นหา
            </button>

            {/* POST */}

            <button
              type="button"
              onClick={() => onGoPost?.()}
              className="
                min-w-[88px] lg:min-w-[98px] xl:min-w-[108px]
                px-3
                py-2.5
                rounded-full
                text-sm
                font-bold
                transition
                hover:bg-[#edf5ff]
                hover:text-[#397fd2]
              "
            >
              โพสต์
            </button>

            {/* MY ITEMS */}

            <button
              type="button"
              onClick={() => {
                onGoMyItems?.();
              }}
              className="
                min-w-[88px] lg:min-w-[98px] xl:min-w-[108px]
                px-3
                py-2.5
                rounded-full
                text-sm
                font-bold
                transition
                hover:bg-[#edf5ff]
                hover:text-[#397fd2]
              "
            >
              ของของฉัน
            </button>

            <button
              type="button"
              onClick={() => {
                onGoReturns?.();
              }}
              className="
                min-w-[88px] lg:min-w-[98px] xl:min-w-[108px]
                px-3
                py-2.5
                rounded-full
                text-sm
                font-bold
                transition
                hover:bg-[#edf5ff]
                hover:text-[#397fd2]
              "
            >
              การคืนของ
            </button>

            <button
              type="button"
              onClick={() => setComplaintCenterOpen(true)}
              className="
                min-w-[88px] lg:min-w-[98px] xl:min-w-[108px]
                px-3 py-2.5 rounded-full text-sm font-bold transition
                hover:bg-[#fff1f1] hover:text-[#ef7777]
              "
            >
              ร้องเรียน
            </button>
          </nav>

          {/* =================================
              RIGHT
          ================================== */}

          <div
            className="
              justify-self-end
              flex
              items-center
              justify-end
              gap-2
              xl:gap-3
              min-w-0
              shrink-0
            "
          >
            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={handleNotificationToggle}
              className="
                relative
                w-11
                h-11
                rounded-2xl
                bg-white/95
                backdrop-blur-md
                text-slate-600
                flex
                items-center
                justify-center
                shadow-[0_6px_18px_rgba(51,65,85,0.10)]
                border
                border-white/80
                transition
                hover:-translate-y-[1px]
                hover:shadow-md
                focus:outline-none
                focus:ring-4
                focus:ring-white/20
                shrink-0
              "
              title="การแจ้งเตือน"
              aria-label="การแจ้งเตือน"
            >
              <span className="text-[18px] leading-none">🔔</span>

              {unreadCount > 0 && (
                <span
                  className="
                    absolute
                    -top-1.5
                    -right-1.5
                    min-w-[20px]
                    h-5
                    px-1
                    rounded-full
                    bg-[#ef7777]
                    border-2
                    border-[#5b9bea]
                    text-white
                    text-[9px]
                    font-extrabold
                    flex
                    items-center
                    justify-center
                    shadow-sm
                  "
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div
                className="
                  fixed
                  inset-0
                  z-[100]
                  flex
                  items-start
                  justify-center
                  sm:justify-end
                  bg-slate-900/20
                  backdrop-blur-[2px]
                  px-3
                  sm:px-6
                  pt-[92px]
                  sm:pt-[86px]
                "
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setNotificationOpen(false);
                  }
                }}
              >
                <section
                  className="
                    w-full
                    max-w-[430px]
                    max-h-[calc(100vh-110px)]
                    overflow-hidden
                    rounded-[24px]
                    bg-white
                    border
                    border-blue-100
                    shadow-[0_24px_70px_rgba(15,23,42,0.20)]
                    flex
                    flex-col
                  "
                  aria-label="รายการแจ้งเตือน"
                >
                  <div
                    className="
                      shrink-0
                      px-4
                      sm:px-5
                      py-4
                      border-b
                      border-slate-100
                      bg-gradient-to-r
                      from-[#f7fbff]
                      to-white
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div
                        className="
                          w-10
                          h-10
                          rounded-2xl
                          bg-[#edf5ff]
                          flex
                          items-center
                          justify-center
                          shrink-0
                        "
                      >
                        🔔
                      </div>

                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-700">
                          การแจ้งเตือน
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {unreadCount > 0
                            ? `มี ${unreadCount} รายการที่ยังไม่ได้อ่าน`
                            : "อ่านการแจ้งเตือนครบแล้ว"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      className="
                        w-9
                        h-9
                        rounded-full
                        bg-slate-100
                        text-slate-500
                        flex
                        items-center
                        justify-center
                        text-xl
                        transition
                        hover:bg-slate-200
                      "
                      aria-label="ปิด"
                    >
                      ×
                    </button>
                  </div>

                  {unreadCount > 0 && (
                    <div
                      className="
                        shrink-0
                        px-4
                        sm:px-5
                        py-2.5
                        bg-white
                        border-b
                        border-slate-100
                        flex
                        justify-end
                      "
                    >
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="
                          px-3
                          py-1.5
                          rounded-full
                          bg-[#edf5ff]
                          text-[#397fd2]
                          text-[11px]
                          font-extrabold
                          transition
                          hover:bg-blue-100
                        "
                      >
                        ✓ อ่านทั้งหมด
                      </button>
                    </div>
                  )}

                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    {notificationLoading ? (
                      <div className="min-h-[260px] flex flex-col items-center justify-center text-center px-5">
                        <div
                          className="
                            w-9
                            h-9
                            rounded-full
                            border-4
                            border-blue-100
                            border-t-[#5b9bea]
                            animate-spin
                          "
                        />
                        <p className="mt-3 text-xs font-bold text-slate-400">
                          กำลังโหลดการแจ้งเตือน...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="min-h-[280px] flex flex-col items-center justify-center text-center px-6">
                        <div
                          className="
                            w-16
                            h-16
                            rounded-[22px]
                            bg-[#edf5ff]
                            flex
                            items-center
                            justify-center
                            text-3xl
                          "
                        >
                          🔔
                        </div>
                        <p className="font-extrabold text-slate-600 mt-4">
                          ยังไม่มีการแจ้งเตือน
                        </p>
                        <p className="max-w-[280px] text-xs leading-5 text-slate-400 mt-1">
                          เมื่อประกาศ คำขอรับของคืน
                          หรือนัดคืนของมีความคืบหน้า
                          ระบบจะแจ้งให้คุณทราบที่นี่
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {notifications.map((notification) => {
                          const isUnread = !notification.is_read;

                          return (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => {
                                handleNotificationClick(notification);
                              }}
                              className={`
                                w-full
                                rounded-2xl
                                border
                                px-4
                                py-3.5
                                text-left
                                transition
                                ${
                                  isUnread
                                    ? "bg-[#f2f7ff] border-blue-100 hover:bg-[#eaf3ff]"
                                    : "bg-white border-slate-100 hover:bg-slate-50"
                                }
                              `}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`
                                    w-9
                                    h-9
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    shrink-0
                                    ${
                                      isUnread
                                        ? "bg-[#5b9bea] text-white"
                                        : "bg-slate-100 text-slate-400"
                                    }
                                  `}
                                >
                                  {getNotificationIcon(notification.type)}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={`
                                        text-sm
                                        leading-5
                                        ${
                                          isUnread
                                            ? "font-extrabold text-slate-700"
                                            : "font-bold text-slate-600"
                                        }
                                      `}
                                    >
                                      {notification.title}
                                    </p>

                                    {isUnread && (
                                      <span
                                        className="
                                          mt-1.5
                                          w-2
                                          h-2
                                          rounded-full
                                          bg-[#5b9bea]
                                          shrink-0
                                        "
                                      />
                                    )}
                                  </div>

                                  <p className="text-xs leading-5 text-slate-500 mt-1">
                                    {notification.message}
                                  </p>

                                  <p className="text-[10px] text-slate-400 mt-2">
                                    {formatNotificationDate(
                                      notification.created_at
                                    )}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div
                    className="
                      shrink-0
                      px-4
                      py-3
                      border-t
                      border-slate-100
                      bg-[#fbfdff]
                      text-center
                    "
                  >
                    <p className="text-[10px] text-slate-400">
                      แสดงการแจ้งเตือนล่าสุดสูงสุด 50 รายการ
                    </p>
                  </div>
                </section>
              </div>
            )}

            {/* PROFILE */}

            <button type="button" onClick={() => onGoProfile?.()} title="โปรไฟล์ของฉัน"
              className="
                hidden
                sm:flex
                items-center
                gap-2
                bg-white/95 backdrop-blur-md
                rounded-[20px]
                py-1.5
                pl-1.5
                pr-4
                shadow-[0_6px_18px_rgba(51,65,85,0.10)]
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
                  overflow-hidden
                "
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="รูปโปรไฟล์"
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  firstLetter
                )}
              </div>

              <div
                className="
                  max-w-[120px]
                  text-left
                "
              >
                <p
                  className="
                    text-sm
                    font-bold
                    truncate
                    leading-tight
                  "
                >
                  {user?.name || "ผู้ใช้"}
                </p>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-slate-400
                  "
                >
                  ผู้ใช้งาน
                </p>
              </div>
            </button>

            {/* MOBILE PROFILE */}

            <button type="button" onClick={() => onGoProfile?.()} title="โปรไฟล์ของฉัน"
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
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="รูปโปรไฟล์"
                  className="w-full h-full rounded-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                firstLetter
              )}
            </button>

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
               shrink-0
                  border
                  border-white/35
                  shadow-sm
                  hover:-translate-y-[1px]
                  hover:bg-white/20
                  transition-all
                  duration-200"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* =================================
            MOBILE NAV
        ================================== */}

        <div
          className="
            md:hidden
            px-4
            pb-3
          "
        >
          <nav
            className="
              max-w-md
              mx-auto
              bg-white
              rounded-full
              p-1
              flex
              items-center
              shadow-sm
            "
          >
            <button
              type="button"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });

                setTimeout(() => {
                  document
                    .getElementById("home-search")
                    ?.focus();
                }, 300);
              }}
              className="
                flex-1
                py-2
                rounded-full
                text-xs
                sm:text-sm
                font-bold
                hover:bg-[#edf5ff]
                hover:text-[#397fd2]
              "
            >
              ค้นหา
            </button>

            <button
              type="button"
              onClick={() => onGoPost?.()}
              className="
                flex-1
                py-2
                rounded-full
                text-xs
                sm:text-sm
                font-bold
                hover:bg-[#edf5ff]
                hover:text-[#397fd2]
              "
            >
              โพสต์
            </button>

            <button
              type="button"
              onClick={() => {
                onGoMyItems?.();
              }}
              className="
                flex-1
                py-2
                rounded-full
                text-xs
                sm:text-sm
                font-bold
                hover:bg-[#edf5ff]
                hover:text-[#397fd2]
              "
            >
              ของของฉัน
            </button>

            <button
              type="button"
              onClick={() => {
                onGoReturns?.();
              }}
              className="
                flex-1
                py-2
                rounded-full
                text-xs
                sm:text-sm
                font-bold
                hover:bg-[#edf5ff]
                hover:text-[#397fd2]
              "
            >
              การคืนของ
            </button>

            <button
              type="button"
              onClick={() => setComplaintCenterOpen(true)}
              className="
                flex-1 py-2 rounded-full text-xs sm:text-sm font-bold
                hover:bg-[#fff1f1] hover:text-[#ef7777]
              "
            >
              ร้องเรียน
            </button>
          </nav>
        </div>
      </header>

      {/* =====================================
          MAIN
      ====================================== */}

      <main
        className="
          relative
          z-10
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
        <section
          className="
            bg-white/95
            backdrop-blur-sm
            rounded-[22px]
            border
            border-blue-100
            shadow-[0_10px_35px_rgba(91,155,234,0.08)]
            px-4
            sm:px-6
            md:px-8
            py-8
            sm:py-10
          "
        >
          {/* =================================
              HERO
          ================================== */}

          <div
            className="
              max-w-[700px]
              mx-auto
              text-center
            "
          >
            <div
              className="
                inline-flex
                items-center
                justify-center
                rounded-full
                bg-[#edf5ff]
                px-4
                py-1.5
                text-[11px]
                sm:text-xs
                font-extrabold
                text-[#397fd2]
              "
            >
              BACK2YOU
            </div>

            <h1
              className="
                mt-4
                text-[28px]
                sm:text-[34px]
                md:text-[40px]
                leading-[1.2]
                font-extrabold
                tracking-[-0.03em]
                text-slate-700
              "
            >
              ของหาย ไม่ได้แปลว่า
              <br />
              <span className="text-[#5b9bea]">
                หายไปตลอดกาล
              </span>
            </h1>

            <p
              className="
                mt-4
                max-w-[600px]
                mx-auto
                text-xs
                sm:text-sm
                leading-6
                text-slate-500
              "
            >
              แจ้งของที่หายหรือของที่เก็บได้
              ให้คนในพื้นที่เดียวกันช่วยตามหา
              และช่วยกันนำสิ่งของกลับคืนสู่เจ้าของ
            </p>
          </div>

          {/* =================================
              SEARCH
          ================================== */}

          <form
            onSubmit={handleSearch}
            className="
              max-w-[610px]
              mx-auto
              mt-7
            "
          >
            <div
              className="
                min-h-[50px]
                border
                border-slate-200
                rounded-full
                bg-[#f4f8ff]
                flex
                items-center
                gap-2
                pl-4
                pr-1.5
                transition
                focus-within:border-[#5b9bea]
                focus-within:ring-4
                focus-within:ring-blue-50
              "
            >
              <span
                className="
                  text-lg
                  shrink-0
                "
              >
                🔍
              </span>

              <input
                id="home-search"
                type="text"
                value={searchText}
                onChange={(event) => {
                  setSearchText(
                    event.target.value
                  );
                }}
                placeholder="ค้นหาชื่อสิ่งของ สถานที่ หรือหมวดหมู่..."
                className="
                  flex-1
                  min-w-0
                  bg-transparent
                  outline-none
                  text-xs
                  sm:text-sm
                  font-medium
                  text-slate-700
                  placeholder:text-slate-400
                "
              />

              {/* CLEAR */}

              {searchText && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="
                    w-8
                    h-8
                    rounded-full
                    text-slate-400
                    flex
                    items-center
                    justify-center
                    transition
                    hover:bg-white
                    hover:text-slate-600
                  "
                  aria-label="ล้างการค้นหา"
                >
                  ×
                </button>
              )}

              {/* SEARCH BUTTON */}

              <button
                type="submit"
                className="
                  h-10
                  px-4
                  sm:px-5
                  rounded-full
                  bg-[#5b9bea]
                  text-white
                  text-xs
                  sm:text-sm
                  font-bold
                  whitespace-nowrap
                  transition
                  hover:bg-[#4d8bd9]
                "
              >
                ค้นหา
              </button>
            </div>
          </form>

          {/* =================================
              ADVANCED SEARCH & FILTER
          ================================== */}

          <div className="max-w-[760px] mx-auto mt-3">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setAdvancedOpen((current) => !current)}
                className={`
                  rounded-full border px-4 py-2 text-xs font-extrabold transition
                  ${
                    advancedOpen || hasAdvancedFilters
                      ? "border-[#5b9bea] bg-[#edf5ff] text-[#397fd2]"
                      : "border-slate-200 bg-white text-slate-500 hover:border-blue-200"
                  }
                `}
              >
                ⚙️ ตัวกรองเพิ่มเติม{hasAdvancedFilters ? " •" : ""}
              </button>

              {hasAnyFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="rounded-full px-3 py-2 text-xs font-bold text-slate-400 hover:text-[#397fd2]"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>

            {advancedOpen && (
              <div className="mt-3 rounded-[20px] border border-blue-100 bg-[#f8fbff] p-4 sm:p-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-extrabold text-slate-500">หมวดหมู่</span>
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className="
                        mt-1.5
                        w-full
                        cursor-pointer
                        appearance-none
                        rounded-xl
                        border
                        border-blue-100
                        bg-white
                        px-4
                        py-3
                        pr-10
                        text-xs
                        font-bold
                        text-slate-600
                        outline-none
                        transition
                        hover:border-[#5b9bea]
                        focus:border-[#5b9bea]
                        focus:ring-4
                        focus:ring-blue-50
                      "
                      style={{
                        backgroundImage:
                          `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M6 8l4 4 4-4' stroke='%235b9bea' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        backgroundSize: "18px",
                      }}
                    >
                      <option value="">📂 ทุกหมวดหมู่</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-extrabold text-slate-500">สถานที่</span>
                    <input
                      type="text"
                      value={locationFilter}
                      onChange={(event) => setLocationFilter(event.target.value)}
                      placeholder="เช่น อาคารเรียน, ห้องสมุด"
                      className="mt-1.5 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 outline-none placeholder:text-slate-300 focus:border-[#5b9bea]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-extrabold text-slate-500">ตั้งแต่วันที่</span>
                    <input
                      type="date"
                      value={dateFrom}
                      max={dateTo || undefined}
                      onChange={(event) => setDateFrom(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-[#5b9bea]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-extrabold text-slate-500">ถึงวันที่</span>
                    <input
                      type="date"
                      value={dateTo}
                      min={dateFrom || undefined}
                      onChange={(event) => setDateTo(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-[#5b9bea]"
                    />
                  </label>
                </div>

                {hasAdvancedFilters && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleClearAdvancedFilters}
                      className="text-xs font-extrabold text-[#397fd2] hover:underline"
                    >
                      ล้างตัวกรองเพิ่มเติม
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =================================
              ACTION BUTTONS
          ================================== */}

          <div
            className="
              max-w-[760px]
              mx-auto
              mt-6
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-3
              sm:gap-5
            "
          >
            {/* LOST */}

            <button
              type="button"
              onClick={handleLostItem}
              className="
                group
                min-h-[64px]
                rounded-2xl
                border
                border-red-200
                bg-white
                px-5
                flex
                items-center
                justify-center
                sm:justify-start
                gap-4
                transition
                hover:bg-red-50
                hover:border-[#ef7777]
                hover:-translate-y-[1px]
                hover:shadow-sm
              "
            >
              <div
                className="
                  w-11
                  h-11
                  rounded-full
                  bg-[#ef7777]
                  flex
                  items-center
                  justify-center
                  text-xl
                  shrink-0
                  shadow-sm
                  transition
                  group-hover:scale-105
                "
              >
                📍
              </div>

              <div className="text-left">
                <p
                  className="
                    text-base
                    font-extrabold
                    text-slate-700
                  "
                >
                  แจ้งของหาย
                </p>

                <p
                  className="
                    mt-0.5
                    text-[11px]
                    text-slate-400
                  "
                >
                  สร้างประกาศตามหาสิ่งของ
                </p>
              </div>
            </button>

            {/* FOUND */}

            <button
              type="button"
              onClick={handleFoundItem}
              className="
                group
                min-h-[64px]
                rounded-2xl
                border
                border-emerald-200
                bg-white
                px-5
                flex
                items-center
                justify-center
                sm:justify-start
                gap-4
                transition
                hover:bg-emerald-50
                hover:border-[#67c5b5]
                hover:-translate-y-[1px]
                hover:shadow-sm
              "
            >
              <div
                className="
                  w-11
                  h-11
                  rounded-full
                  bg-[#67c5b5]
                  flex
                  items-center
                  justify-center
                  text-xl
                  shrink-0
                  shadow-sm
                  transition
                  group-hover:scale-105
                "
              >
                📦
              </div>

              <div className="text-left">
                <p
                  className="
                    text-base
                    font-extrabold
                    text-slate-700
                  "
                >
                  แจ้งพบของ
                </p>

                <p
                  className="
                    mt-0.5
                    text-[11px]
                    text-slate-400
                  "
                >
                  แจ้งสิ่งของที่คุณเก็บได้
                </p>
              </div>
            </button>
          </div>

          {/* =================================
              POSTS HEADER
          ================================== */}

          <div
            className="
              mt-10
              pt-7
              border-t
              border-slate-100
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-4
            "
          >
            <div>
              <h2
                className="
                  text-xl
                  sm:text-2xl
                  font-extrabold
                  text-slate-700
                "
              >
                ประกาศล่าสุด
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                รายการที่ผ่านการตรวจสอบและอนุมัติแล้ว
              </p>
            </div>

            {/* =================================
                FILTER
            ================================== */}

            <div
              className="
                w-full
                sm:w-auto
                bg-[#edf2f8]
                rounded-full
                p-1
                flex
                items-center
              "
            >
              <FilterButton
                active={filter === "all"}
                onClick={() => {
                  setFilter("all");
                }}
              >
                ทั้งหมด
              </FilterButton>

              <FilterButton
                active={filter === "lost"}
                onClick={() => {
                  setFilter("lost");
                }}
              >
                ของหาย
              </FilterButton>

              <FilterButton
                active={filter === "found"}
                onClick={() => {
                  setFilter("found");
                }}
              >
                ของที่พบ
              </FilterButton>
            </div>
          </div>

          {/* =================================
              ACTIVE FILTERS
          ================================== */}

          {hasAnyFilters && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-[#f5f9ff] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-extrabold text-slate-600">กำลังกรอง:</span>
                {searchQuery && (
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold text-[#397fd2]">คำค้น “{searchQuery}”</span>
                )}
                {filter !== "all" && (
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold text-[#397fd2]">{filter === "lost" ? "ของหาย" : "ของที่พบ"}</span>
                )}
                {categoryId && (
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold text-[#397fd2]">
                    {categories.find((item) => String(item.id) === String(categoryId))?.name || "หมวดหมู่"}
                  </span>
                )}
                {locationFilter.trim() && (
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold text-[#397fd2]">สถานที่: {locationFilter.trim()}</span>
                )}
                {(dateFrom || dateTo) && (
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold text-[#397fd2]">
                    วันที่ {dateFrom || "..."} ถึง {dateTo || "..."}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearAllFilters}
                className="self-start sm:self-auto shrink-0 text-xs font-extrabold text-[#397fd2] hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}

          {/* =================================
              POSTS
          ================================== */}

          <div className="mt-5">
            {/* LOADING */}

            {loading && (
              <LoadingState />
            )}

            {/* ERROR */}

            {!loading && error && (
              <ErrorState
                message={error}
              />
            )}

            {/* EMPTY */}

            {!loading &&
              !error &&
              posts.length === 0 && (
                <EmptyState
                  filter={filter}
                  searchQuery={searchQuery}
                />
              )}

            {/* POSTS GRID */}

            {!loading &&
              !error &&
              posts.length > 0 && (
                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    lg:grid-cols-3
                    gap-5
                  "
                >
                  {posts.map((post) => (
                    <PostCard
                        key={`${post.type}-${post.id}`}
                        post={post}
                        onOpenPost={onOpenPost}
                    />
                  ))}
                </div>
              )}
          </div>
        </section>
      </main>

      {complaintCenterOpen && (
        <ComplaintCenter
          onClose={() => setComplaintCenterOpen(false)}
        />
      )}

      {/* =====================================
          FOOTER
      ====================================== */}

      <footer
        className="
          relative
          z-10
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
// FILTER BUTTON
// ========================================

function FilterButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1
        sm:flex-none
        min-w-0
        sm:min-w-[92px]
        px-3
        sm:px-4
        py-2
        rounded-full
        text-xs
        sm:text-sm
        font-bold
        whitespace-nowrap
        transition

        ${
          active
            ? `
              bg-[#5b9bea]
              text-white
              shadow-sm
            `
            : `
              text-slate-500
              hover:bg-white
              hover:text-[#397fd2]
            `
        }
      `}
    >
      {children}
    </button>
  );
}

// ========================================
// POST CARD
// ========================================

function PostCard({
  post,
  onOpenPost,
}) {
  const isLost =
    post.type === "lost";

  // รองรับทั้ง image และ images[]
  const imagePath =
    post.image ||
    post.images?.[0] ||
    null;

  const imageUrl =
    imagePath &&
    (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    )
      ? imagePath
      : imagePath
        ? `${API_BASE}${imagePath}`
        : null;

  // ========================================
  // DATE
  // ========================================

  const rawDate =
    post.lost_date ||
    post.found_date ||
    post.created_at;

  const displayDate =
    formatDate(rawDate);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => {
        onOpenPost?.({
          id: post.id,
          type: post.type,
        });
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();

          onOpenPost?.({
            id: post.id,
            type: post.type,
          });
        }
      }}
      className="
        group
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        transition
        hover:-translate-y-1
        hover:shadow-[0_10px_25px_rgba(51,65,85,0.10)]
        cursor-pointer
        focus:outline-none
        focus:ring-4
        focus:ring-blue-100
      "
    >
      {/* =====================================
          IMAGE
      ====================================== */}

      <div
        className="
          relative
          aspect-[4/3]
          overflow-hidden
          bg-[#f1f5f9]
        "
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={post.title}
            className="
              w-full
              h-full
              object-cover
              transition
              duration-300
              group-hover:scale-[1.03]
            "
            onError={(event) => {
              event.currentTarget.style.display =
                "none";
            }}
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
            <div className="text-4xl">
              {isLost ? "🔎" : "📦"}
            </div>

            <p
              className="
                mt-2
                text-xs
                font-medium
              "
            >
              ไม่มีรูปภาพ
            </p>
          </div>
        )}

        {/* TYPE BADGE */}

        <div
          className={`
            absolute
            top-3
            left-3
            rounded-full
            px-3
            py-1.5
            text-[10px]
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

      {/* =====================================
          CONTENT
      ====================================== */}

      <div className="p-4">
        {/* CATEGORY */}

        {post.category_name && (
          <p
            className="
              text-[10px]
              font-extrabold
              uppercase
              tracking-wide
              text-[#5b9bea]
            "
          >
            {post.category_name}
          </p>
        )}

        {/* TITLE */}

        <h3
          className="
            mt-1
            text-base
            font-extrabold
            text-slate-700
            line-clamp-1
          "
        >
          {post.title}
        </h3>

        {/* DESCRIPTION */}

        {post.description && (
          <p
            className="
              mt-2
              text-xs
              leading-5
              text-slate-500
              line-clamp-2
              min-h-[40px]
            "
          >
            {post.description}
          </p>
        )}

        {/* META */}

        <div
          className="
            mt-4
            pt-3
            border-t
            border-slate-100
            space-y-2
          "
        >
          {/* LOCATION */}

          {post.location && (
            <div
              className="
                flex
                items-start
                gap-2
                text-xs
                text-slate-500
              "
            >
              <span className="shrink-0">
                📍
              </span>

              <span
                className="
                  line-clamp-1
                "
              >
                {post.location}
              </span>
            </div>
          )}

          {/* DATE */}

          {displayDate && (
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                text-slate-500
              "
            >
              <span>
                📅
              </span>

              <span>
                {displayDate}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ========================================
// LOADING
// ========================================

function LoadingState() {
  return (
    <div
      className="
        min-h-[220px]
        rounded-2xl
        border
        border-slate-100
        bg-[#fbfdff]
        flex
        flex-col
        items-center
        justify-center
        text-center
        px-5
      "
    >
      <div
        className="
          w-10
          h-10
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
        กำลังโหลดประกาศ...
      </p>
    </div>
  );
}

// ========================================
// ERROR
// ========================================

function ErrorState({
  message,
}) {
  return (
    <div
      className="
        min-h-[200px]
        rounded-2xl
        border
        border-red-100
        bg-red-50/50
        flex
        flex-col
        items-center
        justify-center
        text-center
        px-5
      "
    >
      <div className="text-4xl">
        ⚠️
      </div>

      <p
        className="
          mt-3
          text-sm
          font-extrabold
          text-red-500
        "
      >
        ไม่สามารถโหลดประกาศได้
      </p>

      <p
        className="
          mt-1
          max-w-md
          text-xs
          leading-5
          text-red-400
        "
      >
        {message}
      </p>
    </div>
  );
}

// ========================================
// EMPTY
// ========================================

function EmptyState({
  filter,
  searchQuery,
}) {
  let title =
    "ยังไม่มีประกาศ";

  let description =
    "เมื่อมีประกาศที่ได้รับการอนุมัติ รายการจะแสดงที่นี่";

  if (filter === "lost") {
    title =
      "ยังไม่มีประกาศของหาย";

    description =
      "ประกาศของหายที่ Staff อนุมัติแล้วจะแสดงที่นี่";
  }

  if (filter === "found") {
    title =
      "ยังไม่มีประกาศของที่พบ";

    description =
      "ประกาศของที่พบที่ Staff อนุมัติแล้วจะแสดงที่นี่";
  }

  if (searchQuery) {
    title =
      "ไม่พบรายการที่ค้นหา";

    description =
      `ไม่พบประกาศที่ตรงกับ “${searchQuery}”`;
  }

  return (
    <div
      className="
        min-h-[220px]
        rounded-2xl
        border
        border-dashed
        border-slate-200
        bg-[#fbfdff]
        flex
        flex-col
        items-center
        justify-center
        text-center
        px-5
      "
    >
      <div
        className="
          w-14
          h-14
          rounded-2xl
          bg-[#edf5ff]
          flex
          items-center
          justify-center
          text-2xl
        "
      >
        🔎
      </div>

      <p
        className="
          mt-4
          text-sm
          sm:text-base
          font-extrabold
          text-slate-600
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1
          max-w-md
          text-xs
          sm:text-sm
          leading-5
          text-slate-400
        "
      >
        {description}
      </p>
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
        month: "short",
        year: "numeric",
      }
    ).format(date);
  } catch {
    return dateValue;
  }
}


function getNotificationIcon(type) {
  if (!type) return "🔔";

  if (type.includes("approved")) return "✓";
  if (type.includes("rejected")) return "!";
  if (type === "return_scheduled") return "📅";
  if (type.includes("claim")) return "📦";

  return "🔔";
}

function formatNotificationDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}


function ComplaintCenter({ onClose }) {
  const [tab, setTab] = useState("new");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const loadMyComplaints = async () => {
    const token = localStorage.getItem("back2you_token");
    if (!token) return;
    try {
      setLoadingHistory(true);
      const response = await fetch(`${API_BASE}/api/complaints/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "โหลดข้อร้องเรียนไม่สำเร็จ");
      setComplaints(data.complaints || []);
    } catch (error) {
      setFormError(error.message || "โหลดข้อร้องเรียนไม่สำเร็จ");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (tab === "history") loadMyComplaints();
  }, [tab]);

  const submitComplaint = async (event) => {
    event.preventDefault();
    setMessage("");
    setFormError("");
    const token = localStorage.getItem("back2you_token");
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ส่งข้อร้องเรียนไม่สำเร็จ");
      setSubject("");
      setDescription("");
      setMessage("ส่งข้อร้องเรียนเรียบร้อยแล้ว Admin จะตรวจสอบและแจ้งผลกลับ");
    } catch (error) {
      setFormError(error.message || "ส่งข้อร้องเรียนไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (status) =>
    ({ pending: "รอตรวจสอบ", investigating: "กำลังตรวจสอบ", resolved: "ดำเนินการแล้ว", rejected: "ไม่รับเรื่อง" }[status] || status || "-");

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-900/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="flex max-h-[90vh] w-full max-w-[650px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-extrabold text-slate-700">ร้องเรียน / แจ้งปัญหา</h2>
            <p className="mt-1 text-xs text-slate-400">ส่งเรื่องให้ Admin ตรวจสอบ หรือดูสถานะเรื่องที่เคยส่ง</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl text-slate-500">×</button>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-[#f8fbff] p-2">
          <button type="button" onClick={() => { setTab("new"); setFormError(""); }} className={`rounded-full py-2.5 text-xs font-extrabold ${tab === "new" ? "bg-white text-[#5b9bea] shadow-sm" : "text-slate-400"}`}>ส่งเรื่องใหม่</button>
          <button type="button" onClick={() => { setTab("history"); setFormError(""); }} className={`rounded-full py-2.5 text-xs font-extrabold ${tab === "history" ? "bg-white text-[#5b9bea] shadow-sm" : "text-slate-400"}`}>ข้อร้องเรียนของฉัน</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {formError && <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">{formError}</div>}
          {message && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{message}</div>}

          {tab === "new" ? (
            <form onSubmit={submitComplaint} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-600">หัวข้อร้องเรียน</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} required placeholder="เช่น พบปัญหาการใช้งานระบบ" className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3 text-sm outline-none focus:border-[#5b9bea]" />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-600">รายละเอียด</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} placeholder="อธิบายปัญหาหรือเหตุผลที่ต้องการให้ Admin ตรวจสอบ..." className="mt-2 w-full resize-none rounded-2xl border border-blue-100 bg-[#edf5ff] px-4 py-3 text-sm outline-none focus:border-[#5b9bea]" />
              </div>
              <button disabled={saving} className="w-full rounded-full bg-[#5b9bea] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50">
                {saving ? "กำลังส่ง..." : "ส่งข้อร้องเรียน"}
              </button>
            </form>
          ) : loadingHistory ? (
            <div className="py-14 text-center text-sm font-bold text-slate-400">กำลังโหลด...</div>
          ) : complaints.length === 0 ? (
            <div className="py-14 text-center"><div className="text-4xl">📄</div><p className="mt-3 text-sm font-bold text-slate-400">ยังไม่มีข้อร้องเรียน</p></div>
          ) : (
            <div className="space-y-3">
              {complaints.map((complaint) => (
                <article key={complaint.id} className="rounded-2xl border border-slate-100 bg-[#fbfdff] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-700">{complaint.subject}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{new Date(complaint.created_at).toLocaleString("th-TH")}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-[#5b9bea]">{statusLabel(complaint.status)}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-500">{complaint.description}</p>
                  {(complaint.lost_item_title || complaint.found_item_title) && <p className="mt-3 rounded-xl bg-white p-3 text-xs font-bold text-slate-500">🔗 ประกาศที่เกี่ยวข้อง: {complaint.lost_item_title || complaint.found_item_title}</p>}
                  {complaint.staff_note && <div className="mt-3 rounded-xl bg-[#edf5ff] p-3"><p className="text-[10px] font-extrabold text-[#397fd2]">หมายเหตุจาก Admin</p><p className="mt-1 text-xs leading-5 text-slate-600">{complaint.staff_note}</p></div>}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;