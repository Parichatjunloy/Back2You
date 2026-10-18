import {
  useCallback,
  useEffect,
  useState,
} from "react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

// รองรับทั้ง Supabase URL และพาธรูปภาพจาก Backend
const resolveImageUrl = (value) => {
  if (!value) return null;
  const image = String(value).trim();
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return `${API_BASE}${image}`;
  return `${API_BASE}/${image}`;
};

function StaffHome({
  user,
  onLogout,
  onReview,
  onClaimReview,
  onReturns,
}) {
  // ========================================
  // STATE
  // ========================================

  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("all");

  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(true);

  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchReviewingKey, setMatchReviewingKey] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const [summary, setSummary] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);

  const [activeMenu, setActiveMenu] =
    useState("dashboard");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const firstLetter =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    "S";

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ========================================
  // FORMAT TIME
  // ========================================

  const formatTime = (value) => {
    if (!value) {
      return "-";
    }

    return String(value).slice(0, 5);
  };

  // ========================================
  // LOAD DASHBOARD SUMMARY
  // ========================================

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem(
      "back2you_token"
    );

    if (!token) {
      onLogout();
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        lostResponse,
        foundPendingResponse,
        foundApprovedResponse,
        foundRejectedResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE}/api/staff/dashboard`,
          { headers }
        ),
        fetch(
          `${API_BASE}/api/staff/found-items?status=pending`,
          { headers }
        ),
        fetch(
          `${API_BASE}/api/staff/found-items?status=approved`,
          { headers }
        ),
        fetch(
          `${API_BASE}/api/staff/found-items?status=rejected`,
          { headers }
        ),
      ]);

      const [
        lostData,
        foundPendingData,
        foundApprovedData,
        foundRejectedData,
      ] = await Promise.all([
        lostResponse.json(),
        foundPendingResponse.json(),
        foundApprovedResponse.json(),
        foundRejectedResponse.json(),
      ]);

      const responses = [
        [lostResponse, lostData],
        [foundPendingResponse, foundPendingData],
        [foundApprovedResponse, foundApprovedData],
        [foundRejectedResponse, foundRejectedData],
      ];

      for (const [response, data] of responses) {
        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            alert(
              data.message ||
                "ไม่มีสิทธิ์เข้าถึงระบบ Staff"
            );
            onLogout();
            return;
          }

          throw new Error(
            data.message ||
              "ไม่สามารถโหลด Dashboard ได้"
          );
        }
      }

      setSummary({
        pending:
          Number(lostData.summary?.pending || 0) +
          Number(foundPendingData.items?.length || 0),
        approved:
          Number(lostData.summary?.approved || 0) +
          Number(foundApprovedData.items?.length || 0),
        rejected:
          Number(lostData.summary?.rejected || 0) +
          Number(foundRejectedData.items?.length || 0),
      });
    } catch (error) {
      console.error(
        "Load Staff Dashboard Error:",
        error
      );
    }
  }, [onLogout]);

  // ========================================
  // LOAD PENDING ITEMS
  // ========================================

  const loadPendingItems =
    useCallback(async () => {
      const token = localStorage.getItem(
        "back2you_token"
      );

      if (!token) {
        onLogout();
        return;
      }

      try {
        setLoading(true);

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [lostResponse, foundResponse] =
          await Promise.all([
            fetch(
              `${API_BASE}/api/staff/lost-items?status=pending`,
              { headers }
            ),
            fetch(
              `${API_BASE}/api/staff/found-items?status=pending`,
              { headers }
            ),
          ]);

        const [lostData, foundData] =
          await Promise.all([
            lostResponse.json(),
            foundResponse.json(),
          ]);

        const responses = [
          [lostResponse, lostData],
          [foundResponse, foundData],
        ];

        for (const [response, data] of responses) {
          if (!response.ok) {
            if (
              response.status === 401 ||
              response.status === 403
            ) {
              alert(
                data.message ||
                  "ไม่มีสิทธิ์เข้าถึงระบบ Staff"
              );
              onLogout();
              return;
            }

            throw new Error(
              data.message ||
                "ไม่สามารถโหลดรายการได้"
            );
          }
        }

        const lostItems = (
          lostData.items || []
        ).map((item) => ({
          ...item,
          type: "lost",
        }));

        const foundItems = (
          foundData.items || []
        ).map((item) => ({
          ...item,
          type: "found",
        }));

        const mergedItems = [
          ...lostItems,
          ...foundItems,
        ].sort((a, b) => {
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        });

        setItems(mergedItems);
      } catch (error) {
        console.error(
          "Load Pending Items Error:",
          error
        );

        alert(
          error.message ||
            "ไม่สามารถโหลดรายการที่รอตรวจสอบได้"
        );
      } finally {
        setLoading(false);
      }
    }, [onLogout]);

  // ========================================
  // LOAD PENDING CLAIMS
  // ========================================

  const loadPendingClaims = useCallback(async () => {
    const token = localStorage.getItem("back2you_token");
    if (!token) {
      onLogout();
      return;
    }

    try {
      setClaimsLoading(true);
      const response = await fetch(
        `${API_BASE}/api/staff/claims?status=pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout();
          return;
        }
        throw new Error(data.message || "ไม่สามารถโหลดคำขอรับคืนได้");
      }

      setClaims(data.claims || []);
    } catch (error) {
      console.error("Load Pending Claims Error:", error);
    } finally {
      setClaimsLoading(false);
    }
  }, [onLogout]);

  // ========================================
  // LOAD REVIEW HISTORY
  // เก็บรายการที่ Staff เคยอนุมัติ/ปฏิเสธไว้ดูย้อนหลัง
  // ========================================

  const loadReviewHistory = useCallback(async () => {
    const token = localStorage.getItem("back2you_token");

    if (!token) {
      onLogout();
      return;
    }

    try {
      setHistoryLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const endpoints = [
        ["lost", "approved"],
        ["lost", "rejected"],
        ["lost", "found"],
        ["lost", "returned"],
        ["found", "approved"],
        ["found", "rejected"],
        ["found", "returned"],
      ];

      const responses = await Promise.all(
        endpoints.map(([type, status]) =>
          fetch(
            `${API_BASE}/api/staff/${type}-items?status=${status}`,
            { headers }
          )
        )
      );

      const payloads = await Promise.all(
        responses.map((response) => response.json())
      );

      for (let index = 0; index < responses.length; index += 1) {
        const response = responses[index];
        const data = payloads[index];

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            onLogout();
            return;
          }

          throw new Error(
            data.message || "ไม่สามารถโหลดประวัติการตรวจสอบได้"
          );
        }
      }

      const merged = payloads
        .flatMap((data, index) => {
          const [type] = endpoints[index];

          return (data.items || []).map((item) => ({
            ...item,
            type,
          }));
        })
        .sort((a, b) => {
          const aDate = new Date(
            a.approved_at || a.updated_at || a.created_at || 0
          ).getTime();
          const bDate = new Date(
            b.approved_at || b.updated_at || b.created_at || 0
          ).getTime();

          return bDate - aDate;
        });

      setHistoryItems(merged);
    } catch (error) {
      console.error("Load Review History Error:", error);
      alert(
        error.message || "ไม่สามารถโหลดประวัติการตรวจสอบได้"
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [onLogout]);

  // ========================================
  // ITEM MATCHING
  // ========================================

  const loadMatches = useCallback(async () => {
    const token = localStorage.getItem("back2you_token");

    if (!token) {
      onLogout();
      return;
    }

    try {
      setMatchesLoading(true);

      const response = await fetch(
        `${API_BASE}/api/staff/matches?minScore=45`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout();
          return;
        }

        throw new Error(
          data.message || "ไม่สามารถโหลดรายการที่อาจตรงกันได้"
        );
      }

      setMatches(data.matches || []);
    } catch (error) {
      console.error("Load Matches Error:", error);
    } finally {
      setMatchesLoading(false);
    }
  }, [onLogout]);

  const getMatchScoreClass = (score) => {
    if (score >= 75) {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }

    if (score >= 60) {
      return "bg-blue-50 text-[#397fd2] border-blue-100";
    }

    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  const getMatchImage = (item) => resolveImageUrl(item?.image);

  const handleMatchReview = async (match, status) => {
    const token = localStorage.getItem("back2you_token");

    if (!token) {
      onLogout();
      return;
    }

    const pairKey = `${match.lostItem.id}-${match.foundItem.id}`;
    const actionText =
      status === "confirmed" ? "ยืนยันการจับคู่นี้" : "ปฏิเสธการจับคู่นี้";

    if (!window.confirm(`ต้องการ${actionText}ใช่หรือไม่?`)) {
      return;
    }

    try {
      setMatchReviewingKey(pairKey);

      const response = await fetch(
        `${API_BASE}/api/staff/matches/review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lostItemId: match.lostItem.id,
            foundItemId: match.foundItem.id,
            score: match.score,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout();
          return;
        }

        throw new Error(
          data.message || "ไม่สามารถบันทึกผลการจับคู่ได้"
        );
      }

      setMatches((current) =>
        current.filter(
          (item) =>
            !(
              Number(item.lostItem.id) === Number(match.lostItem.id) &&
              Number(item.foundItem.id) === Number(match.foundItem.id)
            )
        )
      );

      loadActivityLogs();
      alert(data.message || "บันทึกผลการจับคู่เรียบร้อยแล้ว");
    } catch (error) {
      console.error("Review Match Error:", error);
      alert(error.message || "ไม่สามารถบันทึกผลการจับคู่ได้");
    } finally {
      setMatchReviewingKey(null);
    }
  };

  // ========================================
  // ACTIVITY LOGS
  // ========================================

  const loadActivityLogs = useCallback(async () => {
    const token = localStorage.getItem("back2you_token");
    if (!token) {
      onLogout();
      return;
    }

    try {
      setActivityLogsLoading(true);
      const response = await fetch(
        `${API_BASE}/api/staff/activity-logs?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout();
          return;
        }
        throw new Error(data.message || "ไม่สามารถโหลดประวัติการทำงานได้");
      }

      setActivityLogs(data.activityLogs || []);
    } catch (error) {
      console.error("Load Activity Logs Error:", error);
    } finally {
      setActivityLogsLoading(false);
    }
  }, [onLogout]);

  const getActivityValue = (log, fields) => {
    for (const field of fields) {
      if (log?.[field] !== undefined && log?.[field] !== null && log?.[field] !== "") {
        return log[field];
      }
    }
    return null;
  };

  const getActivityAction = (log) =>
    String(getActivityValue(log, ["action", "action_type", "activity"]) || "");

  const getActivityDescription = (log) =>
    getActivityValue(log, ["description", "details", "detail", "message"]) ||
    "มีการดำเนินการในระบบ";

  const getActivityTargetType = (log) =>
    getActivityValue(log, ["target_type", "entity_type", "item_type"]);

  const getActivityTargetId = (log) =>
    getActivityValue(log, ["target_id", "entity_id", "item_id", "related_id"]);

  const getActivityMeta = (log) => {
    const action = getActivityAction(log);

    if (action.includes("rejected")) {
      return { icon: "×", label: "ปฏิเสธ", badgeClass: "bg-red-50 text-red-600", iconClass: "bg-red-50 text-[#ef7777]" };
    }
    if (action.includes("cancelled")) {
      return { icon: "×", label: "ยกเลิก", badgeClass: "bg-slate-100 text-slate-600", iconClass: "bg-slate-100 text-slate-500" };
    }
    if (action.includes("return_scheduled")) {
      return { icon: "◆", label: "สร้างนัดคืน", badgeClass: "bg-violet-50 text-[#8b62bd]", iconClass: "bg-violet-50 text-[#a978df]" };
    }
    if (action.includes("claim")) {
      return { icon: "📦", label: action.includes("approved") ? "อนุมัติ Claim" : "ตรวจ Claim", badgeClass: "bg-emerald-50 text-emerald-700", iconClass: "bg-emerald-50 text-[#4cae9e]" };
    }
    if (action.includes("approved")) {
      return { icon: "✓", label: "อนุมัติ", badgeClass: "bg-emerald-50 text-emerald-700", iconClass: "bg-emerald-50 text-[#4cae9e]" };
    }
    return { icon: "•", label: action || "กิจกรรม", badgeClass: "bg-blue-50 text-[#397fd2]", iconClass: "bg-[#edf5ff] text-[#397fd2]" };
  };

  const formatActivityDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ========================================
  // NOTIFICATIONS
  // ========================================

  const loadUnreadCount = useCallback(async () => {
    const token = localStorage.getItem("back2you_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (response.ok) {
        setUnreadCount(Number(data.unreadCount || 0));
      }
    } catch (error) {
      console.error("Load Staff Notification Count Error:", error);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("back2you_token");
    if (!token) return;

    try {
      setNotificationLoading(true);

      const response = await fetch(
        `${API_BASE}/api/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดการแจ้งเตือนได้");
      }

      setNotifications(data.notifications || []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (error) {
      console.error("Load Staff Notifications Error:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  const handleNotificationToggle = async () => {
    const nextOpen = !notificationOpen;
    setNotificationOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
    }
  };

  const handleReadNotification = async (notificationId) => {
    const token = localStorage.getItem("back2you_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: 1 }
              : notification
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Read Staff Notification Error:", error);
    }
  };

  const handleReadAllNotifications = async () => {
    const token = localStorage.getItem("back2you_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            is_read: 1,
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Read All Staff Notifications Error:", error);
    }
  };

  const formatNotificationDate = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNotificationIcon = (type) => {
    if (!type) return "🔔";
    if (type.includes("approved")) return "✓";
    if (type.includes("rejected")) return "!";
    if (type === "return_scheduled") return "📅";
    if (type.includes("claim")) return "📦";
    return "🔔";
  };

  // ========================================
  // LOAD
  // ========================================

  useEffect(() => {
    loadDashboard();
    loadPendingItems();
    loadPendingClaims();
    loadReviewHistory();
    loadActivityLogs();
    loadMatches();
    loadUnreadCount();
  }, [
    loadDashboard,
    loadPendingItems,
    loadPendingClaims,
    loadReviewHistory,
    loadActivityLogs,
    loadMatches,
    loadUnreadCount,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadUnreadCount]);

  // ========================================
  // REFRESH
  // ========================================

  const handleRefresh = () => {
    loadDashboard();
    loadPendingItems();
    loadPendingClaims();
    loadReviewHistory();
    loadActivityLogs();
    loadMatches();
    loadUnreadCount();
  };

  // ========================================
  // SIDEBAR CLICK
  // ========================================

  const handleMenuClick = (menu) => {
    setMobileMenuOpen(false);

    // Dashboard ใช้งานแล้ว
    if (menu === "dashboard") {
      setActiveMenu("dashboard");
      return;
    }

    if (menu === "items") {
      setActiveMenu("items");

      setTimeout(() => {
        document
          .getElementById("history-section")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 100);

      return;
    }

    // ตรวจสอบรายการใช้งานแล้ว
    if (menu === "review") {
      setActiveMenu("review");

      setTimeout(() => {
        document
          .getElementById("pending-section")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 100);

      return;
    }

    if (menu === "claims") {
      setActiveMenu("claims");
      setTimeout(() => {
        document.getElementById("claims-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    if (menu === "matching") {
      setActiveMenu("matching");
      loadMatches();

      setTimeout(() => {
        document
          .getElementById("matching-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      return;
    }

    if (menu === "returns") {
      setActiveMenu("returns");
      onReturns?.();
      return;
    }

    if (menu === "activity") {
      setActiveMenu("activity");
      loadActivityLogs();
      setTimeout(() => {
        document.getElementById("activity-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    // ส่วนอื่นจะทำในขั้นต่อไป
    alert(
      "เมนูนี้จะเชื่อมต่อในขั้นตอนถัดไป"
    );
  };

  // ========================================
  // SIDEBAR CONTENT
  // ========================================

  const SidebarContent = () => (
    <>
      {/* Brand area */}

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
          active={activeMenu === "dashboard"}
          icon="▦"
          label="แดชบอร์ด"
          onClick={() =>
            handleMenuClick("dashboard")
          }
        />

        <SidebarButton
          active={activeMenu === "items"}
          icon="☷"
          label="รายการของหาย / ของพบ"
          onClick={() =>
            handleMenuClick("items")
          }
        />

        <SidebarButton
          active={activeMenu === "review"}
          icon="📋"
          label="ตรวจสอบรายการ"
          badge={summary.pending}
          onClick={() =>
            handleMenuClick("review")
          }
        />

        <SidebarButton
          active={activeMenu === "claims"}
          icon="📦"
          label="คำขอรับของคืน"
          badge={claims.length}
          onClick={() =>
            handleMenuClick("claims")
          }
        />

        <SidebarButton
          active={activeMenu === "matching"}
          icon="⌕"
          label="รายการที่อาจตรงกัน"
          badge={matches.length}
          onClick={() =>
            handleMenuClick("matching")
          }
        />

        <SidebarButton
          active={activeMenu === "returns"}
          icon="◆"
          label="จัดการคืนของ"
          onClick={() =>
            handleMenuClick("returns")
          }
        />

        <SidebarButton
          active={activeMenu === "activity"}
          icon="◷"
          label="ประวัติการทำงาน"
          onClick={() =>
            handleMenuClick("activity")
          }
        />
      </nav>

      {/* Bottom */}

      <div className="mt-auto p-4 border-t border-white/15">
        <button
          type="button"
          onClick={onLogout}
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
              setMobileMenuOpen(false)
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
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
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
            </div>

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

            {/* Mobile menu */}

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(true)
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
                aria-label="เปิดเมนู"
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
                  Staff Dashboard
                </p>

                <p className="text-blue-100 text-xs">
                  Back2You Management
                </p>
              </div>

            </div>

            {/* Staff */}

            <div className="flex items-center gap-2">

              {/* Notification */}

              <button
                type="button"
                onClick={handleNotificationToggle}
                className="
                  relative
                  w-10
                  h-10
                  rounded-full
                  bg-white
                  flex
                  items-center
                  justify-center
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
                title="การแจ้งเตือน"
                aria-label="เปิดการแจ้งเตือน"
              >
                <span className="text-lg">🔔</span>

                {unreadCount > 0 && (
                  <span
                    className="
                      absolute
                      -top-1
                      -right-1
                      min-w-5
                      h-5
                      px-1
                      rounded-full
                      bg-[#ef7777]
                      text-white
                      text-[10px]
                      font-bold
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Profile */}

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
                    {user?.name || "Staff"}
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Staff
                  </p>
                </div>
              </div>

            </div>

          </div>
        </header>

        {notificationOpen && (
          <div className="fixed inset-0 z-[100]">
            <button
              type="button"
              aria-label="ปิดการแจ้งเตือน"
              onClick={() => setNotificationOpen(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
            />

            <div className="relative flex justify-end px-3 sm:px-6 lg:pl-[274px] pt-[84px] pointer-events-none">
              <section
                className="
                  pointer-events-auto
                  w-full
                  max-w-[430px]
                  max-h-[calc(100vh-105px)]
                  bg-white
                  rounded-3xl
                  border
                  border-blue-100
                  shadow-2xl
                  overflow-hidden
                  flex
                  flex-col
                "
              >
                <div className="shrink-0 bg-gradient-to-r from-[#5b9bea] to-[#74afea] px-5 py-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-lg">การแจ้งเตือน</h2>
                      <p className="text-xs text-blue-50 mt-0.5">
                        {unreadCount > 0
                          ? `ยังไม่ได้อ่าน ${unreadCount} รายการ`
                          : "อ่านครบแล้ว"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 font-bold"
                    >
                      ×
                    </button>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleReadAllNotifications}
                      className="mt-3 text-xs font-bold bg-white/15 hover:bg-white/25 rounded-full px-3 py-1.5"
                    >
                      ✓ อ่านทั้งหมด
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto bg-[#f8fbff] p-3">
                  {notificationLoading ? (
                    <div className="min-h-[180px] flex items-center justify-center text-sm text-slate-500">
                      กำลังโหลดการแจ้งเตือน...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="min-h-[210px] flex flex-col items-center justify-center text-center px-5">
                      <div className="w-14 h-14 rounded-full bg-[#edf5ff] flex items-center justify-center text-2xl">
                        🔔
                      </div>
                      <p className="font-bold mt-3">ยังไม่มีการแจ้งเตือน</p>
                      <p className="text-xs text-slate-400 mt-1">
                        การแจ้งเตือนใหม่ของบัญชี Staff จะแสดงที่นี่
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification) => {
                        const unread = Number(notification.is_read) === 0;

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              if (unread) {
                                handleReadNotification(notification.id);
                              }
                            }}
                            className={`w-full text-left rounded-2xl border p-4 transition ${
                              unread
                                ? "bg-white border-blue-200 shadow-sm hover:border-[#5b9bea]"
                                : "bg-white/70 border-slate-100 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold ${
                                  unread
                                    ? "bg-[#edf5ff] text-[#397fd2]"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {getNotificationIcon(notification.type)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${unread ? "font-bold" : "font-semibold"}`}>
                                    {notification.title}
                                  </p>

                                  {unread && (
                                    <span className="w-2 h-2 rounded-full bg-[#5b9bea] shrink-0 mt-1.5" />
                                  )}
                                </div>

                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  {notification.message}
                                </p>

                                <p className="text-[10px] text-slate-400 mt-2">
                                  {formatNotificationDate(notification.created_at)}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ===================================
            MAIN
        ==================================== */}

        <main className="p-4 sm:p-6 lg:p-7">

          <div className="max-w-[1400px] mx-auto">

            {/* ===============================
                PAGE TITLE
            ================================ */}

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">

              <div>
                <p className="text-sm font-semibold text-[#5b9bea]">
                  Back2You Staff
                </p>

                <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                  แดชบอร์ด
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  ภาพรวมและงานที่ต้องดำเนินการ
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className="
                  self-start
                  sm:self-auto
                  px-4
                  py-2
                  bg-white
                  border
                  border-blue-100
                  rounded-xl
                  text-sm
                  font-semibold
                  hover:bg-blue-50
                  transition
                "
              >
                ↻ รีเฟรชข้อมูล
              </button>

            </div>

            {/* ===============================
                DASHBOARD CARDS
            ================================ */}

            <section
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-4
                gap-4
                mt-6
              "
            >

              {/* Pending */}

              <DashboardCard
                title="รอตรวจสอบ"
                value={summary.pending}
                description="ประกาศที่รอ Staff ตรวจสอบ"
                icon="📋"
                cardClass="bg-[#5b9bea]"
                iconClass="bg-white/20"
                onClick={() =>
                  handleMenuClick("review")
                }
              />

              {/* Matching */}

              <DashboardCard
                title="รอการจับคู่"
                value="—"
                description="จะเชื่อมกับระบบจับคู่"
                icon="⌛"
                cardClass="bg-[#74afea]"
                iconClass="bg-white/20"
                onClick={() =>
                  handleMenuClick("items")
                }
              />

              {/* Return today */}

              <DashboardCard
                title="นัดรับคืนวันนี้"
                value="—"
                description="จะเชื่อมกับระบบคืนของ"
                icon="⌕"
                cardClass="bg-[#67c5b5]"
                iconClass="bg-white/20"
                onClick={() =>
                  handleMenuClick("returns")
                }
              />

              {/* Completed */}

              <DashboardCard
                title="อนุมัติแล้ว"
                value={summary.approved}
                description="ประกาศที่อนุมัติแล้วทั้งหมด"
                icon="✓"
                cardClass="bg-[#a978df]"
                iconClass="bg-white/20"
                onClick={() =>
                  handleMenuClick("items")
                }
              />

            </section>

            {/* ===============================
                SECONDARY STATUS
            ================================ */}

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

              <div
                className="
                  bg-white
                  border
                  border-blue-100
                  rounded-2xl
                  p-4
                  flex
                  items-center
                  justify-between
                "
              >
                <div>
                  <p className="text-sm text-slate-500">
                    ผ่านการตรวจสอบ
                  </p>

                  <p className="text-2xl font-bold mt-1 text-[#67c5b5]">
                    {summary.approved}
                  </p>
                </div>

                <div
                  className="
                    w-11
                    h-11
                    rounded-full
                    bg-[#e3f7f3]
                    text-[#4cae9e]
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-xl
                  "
                >
                  ✓
                </div>
              </div>

              <div
                className="
                  bg-white
                  border
                  border-blue-100
                  rounded-2xl
                  p-4
                  flex
                  items-center
                  justify-between
                "
              >
                <div>
                  <p className="text-sm text-slate-500">
                    ไม่ผ่านการตรวจสอบ
                  </p>

                  <p className="text-2xl font-bold mt-1 text-[#ef7777]">
                    {summary.rejected}
                  </p>
                </div>

                <div
                  className="
                    w-11
                    h-11
                    rounded-full
                    bg-red-50
                    text-[#ef7777]
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-xl
                  "
                >
                  ×
                </div>
              </div>

            </section>

            {/* ===============================
                CLAIMS SECTION
            ================================ */}

            <section id="claims-section" className="mt-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">คำขอรับของคืน</h2>
                  <p className="text-sm text-slate-500 mt-1">คำขอ Claim ที่กำลังรอ Staff ตรวจสอบหลักฐาน</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700">
                  📦 รอตรวจ {claims.length} รายการ
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-blue-100 shadow-sm mt-4 overflow-hidden">
                {claimsLoading ? (
                  <div className="min-h-[180px] flex items-center justify-center text-sm text-slate-500">กำลังโหลดคำขอรับคืน...</div>
                ) : claims.length === 0 ? (
                  <div className="min-h-[180px] flex flex-col items-center justify-center text-center px-4">
                    <div className="text-4xl">✅</div>
                    <p className="font-bold mt-3">ไม่มีคำขอรับคืนที่รอตรวจ</p>
                    <p className="text-sm text-slate-400 mt-1">เมื่อผู้ใช้ส่ง Claim ใหม่ รายการจะปรากฏตรงนี้</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[760px]">
                        <thead className="bg-[#f5f9ff] text-left text-xs text-slate-500">
                          <tr>
                            <th className="px-5 py-4">คำขอ</th>
                            <th className="px-4 py-4">สิ่งของ</th>
                            <th className="px-4 py-4">ผู้ขอรับคืน</th>
                            <th className="px-4 py-4">ข้อความ</th>
                            <th className="px-5 py-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {claims.map((claim) => (
                            <tr key={claim.id} className="hover:bg-[#f8fbff]">
                              <td className="px-5 py-4 text-sm font-bold">CL-{String(claim.id).padStart(4, "0")}</td>
                              <td className="px-4 py-4 text-sm">{claim.found_item_title}</td>
                              <td className="px-4 py-4">
                                <p className="text-sm font-semibold">{claim.claimant_name}</p>
                                <p className="text-xs text-slate-400">{claim.claimant_email}</p>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-500 max-w-[260px] truncate">{claim.message}</td>
                              <td className="px-5 py-4 text-right">
                                <button type="button" onClick={() => onClaimReview?.(claim.id)} className="px-4 py-2 rounded-xl bg-[#67c5b5] text-white text-xs font-bold hover:opacity-90">ตรวจ Claim</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="md:hidden divide-y divide-slate-100">
                      {claims.map((claim) => (
                        <article key={claim.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold">{claim.found_item_title}</p>
                              <p className="text-xs text-slate-500 mt-1">ผู้ขอ: {claim.claimant_name}</p>
                              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{claim.message}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-1 text-[10px] font-bold">รอตรวจ</span>
                          </div>
                          <button type="button" onClick={() => onClaimReview?.(claim.id)} className="w-full mt-4 px-4 py-2.5 rounded-xl bg-[#67c5b5] text-white text-xs font-bold">ตรวจ Claim</button>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* ===============================
                REVIEW HISTORY
            ================================ */}

            <section id="history-section" className="mt-8">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    ประวัติการตรวจสอบ
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    รายการของหายและของพบที่ Staff เคยตรวจสอบแล้วจะยังอยู่ที่นี่
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "ทั้งหมด"],
                    ["approved", "อนุมัติแล้ว"],
                    ["rejected", "ปฏิเสธแล้ว"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setHistoryFilter(value)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition ${
                        historyFilter === value
                          ? "bg-[#5b9bea] text-white"
                          : "bg-white border border-blue-100 text-slate-500 hover:bg-blue-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-blue-100 shadow-sm mt-4 overflow-hidden">
                {historyLoading ? (
                  <div className="min-h-[220px] flex items-center justify-center text-sm text-slate-500">
                    กำลังโหลดประวัติการตรวจสอบ...
                  </div>
                ) : (() => {
                  const filteredHistory = historyItems.filter((item) => {
                    if (historyFilter === "all") {
                      return true;
                    }

                    if (historyFilter === "rejected") {
                      return item.status === "rejected";
                    }

                    return [
                      "approved",
                      "found",
                      "returned",
                    ].includes(item.status);
                  });

                  if (filteredHistory.length === 0) {
                    return (
                      <div className="min-h-[220px] flex flex-col items-center justify-center text-center px-4">
                        <div className="text-4xl">🗂️</div>
                        <p className="font-bold mt-3">
                          ยังไม่มีประวัติในหมวดนี้
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          เมื่อ Staff ตรวจสอบรายการแล้ว ประวัติจะปรากฏตรงนี้
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[860px]">
                          <thead className="bg-[#f5f9ff] text-left text-xs text-slate-500">
                            <tr>
                              <th className="px-5 py-4">รายการ</th>
                              <th className="px-4 py-4">ประเภท</th>
                              <th className="px-4 py-4">ผู้โพสต์</th>
                              <th className="px-4 py-4">วันที่โพสต์</th>
                              <th className="px-4 py-4">สถานะ</th>
                              <th className="px-5 py-4 text-right">รายละเอียด</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {filteredHistory.map((item) => {
                              const approved = [
                                "approved",
                                "found",
                                "returned",
                              ].includes(item.status);

                              return (
                                <tr
                                  key={`${item.type}-${item.id}`}
                                  className="hover:bg-[#f8fbff]"
                                >
                                  <td className="px-5 py-4">
                                    <p className="text-sm font-bold">
                                      {item.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                      #{item.id} · {item.category_name || "ไม่ระบุหมวดหมู่"}
                                    </p>
                                  </td>

                                  <td className="px-4 py-4">
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                                        item.type === "lost"
                                          ? "bg-red-50 text-[#ef7777]"
                                          : "bg-emerald-50 text-[#4cae9e]"
                                      }`}
                                    >
                                      {item.type === "lost"
                                        ? "ของหาย"
                                        : "ของพบ"}
                                    </span>
                                  </td>

                                  <td className="px-4 py-4">
                                    <p className="text-sm font-semibold">
                                      {item.user_name || "-"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {item.user_email || ""}
                                    </p>
                                  </td>

                                  <td className="px-4 py-4 text-sm">
                                    {formatDate(item.created_at)}
                                  </td>

                                  <td className="px-4 py-4">
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                                        approved
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-red-50 text-red-600"
                                      }`}
                                    >
                                      {item.status === "rejected"
                                        ? "ปฏิเสธแล้ว"
                                        : item.status === "returned"
                                          ? "คืนของแล้ว"
                                          : item.status === "found"
                                            ? "พบของแล้ว"
                                            : "อนุมัติแล้ว"}
                                    </span>
                                  </td>

                                  <td className="px-5 py-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onReview?.(item.id, item.type)
                                      }
                                      className="px-4 py-2 rounded-xl bg-[#edf5ff] text-[#397fd2] text-xs font-bold hover:bg-blue-100"
                                    >
                                      ดูรายละเอียด
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="md:hidden divide-y divide-slate-100">
                        {filteredHistory.map((item) => {
                          const approved = [
                            "approved",
                            "found",
                            "returned",
                          ].includes(item.status);

                          return (
                            <article
                              key={`${item.type}-${item.id}`}
                              className="p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-bold">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {item.type === "lost"
                                      ? "ของหาย"
                                      : "ของพบ"}{" "}
                                    · {item.user_name || "-"}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {formatDate(item.created_at)}
                                  </p>
                                </div>

                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                    approved
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-red-50 text-red-600"
                                  }`}
                                >
                                  {item.status === "rejected"
                                    ? "ปฏิเสธแล้ว"
                                    : item.status === "returned"
                                      ? "คืนของแล้ว"
                                      : item.status === "found"
                                        ? "พบของแล้ว"
                                        : "อนุมัติแล้ว"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  onReview?.(item.id, item.type)
                                }
                                className="w-full mt-4 px-4 py-2.5 rounded-xl bg-[#edf5ff] text-[#397fd2] text-xs font-bold"
                              >
                                ดูรายละเอียด
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </section>

            {/* ===============================
                MATCHING SECTION
            ================================ */}

            <section id="matching-section" className="mt-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#5b9bea]">
                    Smart Matching
                  </p>
                  <h2 className="text-xl font-bold mt-1">
                    รายการที่อาจตรงกัน
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    ระบบช่วยคัดคู่ของหายและของพบให้ Staff ตรวจสอบก่อนดำเนินการต่อ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadMatches}
                  className="self-start sm:self-auto px-4 py-2 bg-white border border-blue-100 rounded-xl text-xs sm:text-sm font-bold text-[#397fd2] hover:bg-blue-50 transition"
                >
                  ↻ ค้นหาอีกครั้ง
                </button>
              </div>

              {matchesLoading ? (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm mt-4 min-h-[220px] flex items-center justify-center text-sm text-slate-500">
                  กำลังค้นหารายการที่อาจตรงกัน...
                </div>
              ) : matches.length === 0 ? (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm mt-4 min-h-[220px] flex flex-col items-center justify-center text-center px-5">
                  <div className="w-14 h-14 rounded-full bg-[#edf5ff] text-[#397fd2] flex items-center justify-center text-2xl">
                    ⌕
                  </div>
                  <p className="font-bold mt-3">
                    ยังไม่พบรายการที่มีความใกล้เคียงกัน
                  </p>
                  <p className="text-sm text-slate-400 mt-1 max-w-md">
                    ระบบจะแสดงคู่ที่ผ่านเกณฑ์จากหมวดหมู่ ชื่อ/รายละเอียด สถานที่ และวันที่
                  </p>
                </div>
              ) : (
                <div className="grid xl:grid-cols-2 gap-4 mt-4">
                  {matches.map((match) => {
                    const lostImage = getMatchImage(match.lostItem);
                    const foundImage = getMatchImage(match.foundItem);

                    return (
                      <article
                        key={`${match.lostItem.id}-${match.foundItem.id}`}
                        className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-400">
                              คู่ที่ระบบแนะนำ
                            </p>
                            <p className="font-bold mt-1">
                              ของหาย #{match.lostItem.id} ↔ ของพบ #{match.foundItem.id}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold ${getMatchScoreClass(
                              match.score
                            )}`}
                          >
                            ตรงกัน {match.score}%
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 mt-4">
                          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-3">
                            <div className="flex items-center gap-2">
                              {lostImage ? (
                                <img
                                  src={lostImage}
                                  alt={match.lostItem.title || "รูปของหาย"}
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                  className="w-12 h-12 rounded-xl object-cover bg-white"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                                  ?
                                </div>
                              )}

                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-[#ef7777]">
                                  ของหาย
                                </span>
                                <p className="font-bold text-sm truncate">
                                  {match.lostItem.title}
                                </p>
                              </div>
                            </div>

                            <div className="text-xs text-slate-500 space-y-1 mt-3">
                              <p>หมวด: {match.lostItem.category_name || "-"}</p>
                              <p>สถานที่: {match.lostItem.location || "-"}</p>
                              <p>วันที่: {formatDate(match.lostItem.lost_date)}</p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
                            <div className="flex items-center gap-2">
                              {foundImage ? (
                                <img
                                  src={foundImage}
                                  alt={match.foundItem.title || "รูปของพบ"}
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                  className="w-12 h-12 rounded-xl object-cover bg-white"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                                  ?
                                </div>
                              )}

                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-[#4cae9e]">
                                  ของพบ
                                </span>
                                <p className="font-bold text-sm truncate">
                                  {match.foundItem.title}
                                </p>
                              </div>
                            </div>

                            <div className="text-xs text-slate-500 space-y-1 mt-3">
                              <p>หมวด: {match.foundItem.category_name || "-"}</p>
                              <p>สถานที่: {match.foundItem.location || "-"}</p>
                              <p>วันที่: {formatDate(match.foundItem.found_date)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-bold text-slate-500">
                            เหตุผลที่ระบบจับคู่
                          </p>

                          <div className="flex flex-wrap gap-2 mt-2">
                            {(match.reasons || []).length > 0 ? (
                              match.reasons.map((reason) => (
                                <span
                                  key={reason}
                                  className="px-2.5 py-1 rounded-full bg-[#edf5ff] text-[#397fd2] text-[11px] font-semibold"
                                >
                                  {reason}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">
                                คะแนนรวมผ่านเกณฑ์การจับคู่
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() =>
                              onReview?.({
                                ...match.lostItem,
                                type: "lost",
                              })
                            }
                            className="px-3 py-2.5 rounded-xl border border-red-100 text-[#ef7777] text-xs font-bold hover:bg-red-50 transition"
                          >
                            ดูของหาย
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onReview?.({
                                ...match.foundItem,
                                type: "found",
                              })
                            }
                            className="px-3 py-2.5 rounded-xl border border-emerald-100 text-[#4cae9e] text-xs font-bold hover:bg-emerald-50 transition"
                          >
                            ดูของพบ
                          </button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={
                              matchReviewingKey ===
                              `${match.lostItem.id}-${match.foundItem.id}`
                            }
                            onClick={() =>
                              handleMatchReview(match, "rejected")
                            }
                            className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            ไม่ตรงกัน
                          </button>

                          <button
                            type="button"
                            disabled={
                              matchReviewingKey ===
                              `${match.lostItem.id}-${match.foundItem.id}`
                            }
                            onClick={() =>
                              handleMatchReview(match, "confirmed")
                            }
                            className="px-3 py-2.5 rounded-xl bg-[#5b9bea] text-white text-xs font-bold hover:bg-[#4b8bd9] disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {matchReviewingKey ===
                            `${match.lostItem.id}-${match.foundItem.id}`
                              ? "กำลังบันทึก..."
                              : "✓ ยืนยันว่าตรงกัน"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ===============================
                ACTIVITY LOGS
            ================================ */}

            <section id="activity-section" className="mt-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#5b9bea]">Staff / Admin Audit</p>
                  <h2 className="text-xl font-bold mt-1">ประวัติการทำงาน</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    ตรวจสอบการดำเนินการล่าสุดของ Staff และ Admin ในระบบ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadActivityLogs}
                  className="self-start sm:self-auto px-4 py-2 bg-white border border-blue-100 rounded-xl text-xs sm:text-sm font-bold text-[#397fd2] hover:bg-blue-50 transition"
                >
                  ↻ รีเฟรชประวัติ
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-blue-100 shadow-sm mt-4 overflow-hidden">
                {activityLogsLoading ? (
                  <div className="min-h-[220px] flex items-center justify-center text-sm text-slate-500">
                    กำลังโหลดประวัติการทำงาน...
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="min-h-[220px] flex flex-col items-center justify-center text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-[#edf5ff] text-[#397fd2] flex items-center justify-center text-2xl">◷</div>
                    <p className="font-bold mt-3">ยังไม่มีประวัติการทำงาน</p>
                    <p className="text-sm text-slate-400 mt-1">
                      เมื่อ Staff หรือ Admin ดำเนินการ ประวัติจะปรากฏที่นี่
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-[#f5f9ff] text-left text-xs text-slate-500">
                          <tr>
                            <th className="px-5 py-4">การดำเนินการ</th>
                            <th className="px-4 py-4">ผู้ดำเนินการ</th>
                            <th className="px-4 py-4">รายการอ้างอิง</th>
                            <th className="px-4 py-4">รายละเอียด</th>
                            <th className="px-5 py-4">วันเวลา</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activityLogs.map((log) => {
                            const meta = getActivityMeta(log);
                            const targetType = getActivityTargetType(log);
                            const targetId = getActivityTargetId(log);
                            return (
                              <tr key={log.id} className="hover:bg-[#f8fbff] transition">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold ${meta.iconClass}`}>
                                      {meta.icon}
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.badgeClass}`}>
                                      {meta.label}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="text-sm font-bold">{log.actor_name || "Staff / Admin"}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {log.actor_email || (log.actor_role_id === 3 ? "Admin" : "Staff")}
                                  </p>
                                </td>
                                <td className="px-4 py-4">
                                  {targetType || targetId ? (
                                    <>
                                      <p className="text-sm font-semibold">{targetType || "รายการ"}</p>
                                      <p className="text-xs text-slate-400 mt-1">{targetId ? `#${targetId}` : "-"}</p>
                                    </>
                                  ) : <span className="text-sm text-slate-400">-</span>}
                                </td>
                                <td className="px-4 py-4">
                                  <p className="text-sm text-slate-600 max-w-[360px] leading-relaxed">
                                    {getActivityDescription(log)}
                                  </p>
                                </td>
                                <td className="px-5 py-4 text-sm whitespace-nowrap">
                                  {formatActivityDate(log.created_at)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden divide-y divide-slate-100">
                      {activityLogs.map((log) => {
                        const meta = getActivityMeta(log);
                        const targetType = getActivityTargetType(log);
                        const targetId = getActivityTargetId(log);
                        return (
                          <article key={log.id} className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold ${meta.iconClass}`}>
                                {meta.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-bold text-sm">{log.actor_name || "Staff / Admin"}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{formatActivityDate(log.created_at)}</p>
                                  </div>
                                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.badgeClass}`}>
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                                  {getActivityDescription(log)}
                                </p>
                                {(targetType || targetId) && (
                                  <p className="text-xs text-slate-400 mt-2">
                                    อ้างอิง: {targetType || "รายการ"}{targetId ? ` #${targetId}` : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* ===============================
                PENDING SECTION
            ================================ */}

            <section
              id="pending-section"
              className="mt-8"
            >

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">

                <div>
                  <h2 className="text-xl font-bold">
                    งานที่ต้องดำเนินการ
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    เรียงตามรายการที่สร้างล่าสุด
                  </p>
                </div>

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    bg-yellow-50
                    border
                    border-yellow-200
                    rounded-full
                    px-4
                    py-2
                    text-xs
                    sm:text-sm
                    font-semibold
                    text-yellow-700
                  "
                >
                  <span>●</span>

                  รอตรวจสอบ {summary.pending} รายการ
                </div>

              </div>

              {/* =============================
                  TABLE CONTAINER
              ============================== */}

              <div
                className="
                  bg-white
                  rounded-2xl
                  border
                  border-blue-100
                  shadow-sm
                  mt-4
                  overflow-hidden
                "
              >

                {/* Loading */}

                {loading && (
                  <div className="min-h-[260px] flex items-center justify-center">

                    <div className="text-center">
                      <div className="text-3xl">
                        🔎
                      </div>

                      <p className="text-sm text-slate-500 mt-3">
                        กำลังโหลดรายการ...
                      </p>
                    </div>

                  </div>
                )}

                {/* Empty */}

                {!loading &&
                  items.length === 0 && (
                    <div
                      className="
                        min-h-[260px]
                        flex
                        items-center
                        justify-center
                        bg-[#fbfdff]
                      "
                    >
                      <div className="text-center px-4">

                        <div className="text-4xl">
                          🎉
                        </div>

                        <p className="font-bold mt-3">
                          ไม่มีรายการที่รอตรวจสอบ
                        </p>

                        <p className="text-sm text-slate-400 mt-1">
                          รายการใหม่จากผู้ใช้จะแสดงที่นี่
                        </p>

                      </div>
                    </div>
                  )}

                {/* Desktop Table */}

                {!loading &&
                  items.length > 0 && (
                    <>
                      <div className="hidden md:block overflow-x-auto">

                        <table className="w-full min-w-[850px]">

                          <thead className="bg-[#f5f9ff]">

                            <tr className="text-left text-xs text-slate-500">

                              <th className="px-5 py-4 font-semibold">
                                รายการ
                              </th>

                              <th className="px-4 py-4 font-semibold">
                                ประเภท
                              </th>

                              <th className="px-4 py-4 font-semibold">
                                สถานที่
                              </th>

                              <th className="px-4 py-4 font-semibold">
                                วันที่
                              </th>

                              <th className="px-4 py-4 font-semibold">
                                สถานะ
                              </th>

                              <th className="px-5 py-4 font-semibold text-right">
                                จัดการ
                              </th>

                            </tr>

                          </thead>

                          <tbody className="divide-y divide-slate-100">

                            {items.map((item) => (
                              <tr
                                key={`${item.type}-${item.id}`}
                                className="hover:bg-[#f8fbff] transition"
                              >

                                {/* Item */}

                                <td className="px-5 py-4">

                                  <div className="flex items-center gap-3">

                                    <div
                                      className="
                                        w-12
                                        h-12
                                        rounded-xl
                                        bg-[#edf5ff]
                                        overflow-hidden
                                        shrink-0
                                      "
                                    >
                                      {item.image ? (
                                        <img
                                          src={resolveImageUrl(item.image)}
                                          alt={item.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          📦
                                        </div>
                                      )}
                                    </div>

                                    <div className="min-w-0">

                                      <p className="font-bold text-sm truncate max-w-[210px]">
                                        {item.title}
                                      </p>

                                      <p className="text-[11px] text-slate-400 mt-1">
                                        ID: {item.type === "found" ? "FD" : "LF"}-{String(
                                          item.id
                                        ).padStart(
                                          6,
                                          "0"
                                        )}
                                      </p>

                                      <p className="text-[11px] text-slate-400 truncate max-w-[210px]">
                                        ผู้แจ้ง:{" "}
                                        {item.user_name}
                                      </p>

                                    </div>

                                  </div>

                                </td>

                                {/* Type */}

                                <td className="px-4 py-4">

                                  <div className="flex flex-col items-start gap-1">

                                    <span
                                      className={`
                                        inline-flex
                                        px-2.5
                                        py-1
                                        rounded-full
                                        text-[11px]
                                        font-bold
                                        ${
                                          item.type === "found"
                                            ? "bg-emerald-50 text-[#4cae9e]"
                                            : "bg-red-50 text-[#e97070]"
                                        }
                                      `}
                                    >
                                      {item.type === "found"
                                        ? "ของที่พบ"
                                        : "ของหาย"}
                                    </span>

                                    <span className="text-[11px] text-slate-400">
                                      {item.category_name ||
                                        "ไม่ระบุหมวดหมู่"}
                                    </span>

                                  </div>

                                </td>

                                {/* Location */}

                                <td className="px-4 py-4 text-sm">
                                  <p className="max-w-[160px] line-clamp-2">
                                    {item.location}
                                  </p>
                                </td>

                                {/* Date */}

                                <td className="px-4 py-4">

                                  <p className="text-sm">
                                    {formatDate(
                                      item.type === "found"
                                        ? item.found_date
                                        : item.lost_date
                                    )}
                                  </p>

                                  {(item.type === "found"
                                    ? item.found_time
                                    : item.lost_time) && (
                                    <p className="text-[11px] text-slate-400 mt-1">
                                      เวลา{" "}
                                      {formatTime(
                                        item.type === "found"
                                          ? item.found_time
                                          : item.lost_time
                                      )}
                                    </p>
                                  )}

                                </td>

                                {/* Status */}

                                <td className="px-4 py-4">

                                  <span
                                    className="
                                      inline-flex
                                      items-center
                                      gap-1
                                      rounded-full
                                      bg-yellow-100
                                      text-yellow-700
                                      px-3
                                      py-1
                                      text-[11px]
                                      font-bold
                                    "
                                  >
                                    <span>
                                      ●
                                    </span>

                                    กำลังรอตรวจสอบ
                                  </span>

                                </td>

                                {/* Action */}

                                <td className="px-5 py-4 text-right">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      onReview(
                                        item.id,
                                        item.type
                                      )
                                    }
                                    className="
                                      px-4
                                      py-2
                                      rounded-xl
                                      bg-[#5b9bea]
                                      text-white
                                      text-xs
                                      font-bold
                                      hover:bg-[#4b8cdd]
                                      transition
                                    "
                                  >
                                    ตรวจสอบ
                                  </button>

                                </td>

                              </tr>
                            ))}

                          </tbody>

                        </table>

                      </div>

                      {/* =========================
                          MOBILE CARDS
                      ========================== */}

                      <div className="md:hidden divide-y divide-slate-100">

                        {items.map((item) => (
                          <article
                            key={`${item.type}-${item.id}`}
                            className="p-4"
                          >

                            <div className="flex gap-3">

                              {/* Image */}

                              <div
                                className="
                                  w-20
                                  h-20
                                  rounded-xl
                                  bg-[#edf5ff]
                                  overflow-hidden
                                  shrink-0
                                "
                              >
                                {item.image ? (
                                  <img
                                    src={resolveImageUrl(item.image)}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl">
                                    📦
                                  </div>
                                )}
                              </div>

                              {/* Info */}

                              <div className="flex-1 min-w-0">

                                <div className="flex items-start justify-between gap-2">

                                  <div className="min-w-0">

                                    <p className="font-bold truncate">
                                      {item.title}
                                    </p>

                                    <p className="text-[11px] text-slate-400 mt-1">
                                      {item.type === "found" ? "FD" : "LF"}-{String(
                                        item.id
                                      ).padStart(
                                        6,
                                        "0"
                                      )}
                                    </p>

                                  </div>

                                  <span
                                    className={`
                                      shrink-0
                                      px-2
                                      py-1
                                      rounded-full
                                      text-[10px]
                                      font-bold
                                      ${
                                        item.type === "found"
                                          ? "bg-emerald-50 text-[#4cae9e]"
                                          : "bg-red-50 text-[#e97070]"
                                      }
                                    `}
                                  >
                                    {item.type === "found"
                                      ? "ของที่พบ"
                                      : "ของหาย"}
                                  </span>

                                </div>

                                <p className="text-xs text-slate-500 mt-2 truncate">
                                  📍 {item.location}
                                </p>

                                <p className="text-xs text-slate-500 mt-1">
                                  📅{" "}
                                  {formatDate(
                                    item.type === "found"
                                      ? item.found_date
                                      : item.lost_date
                                  )}
                                </p>

                              </div>

                            </div>

                            <div className="flex items-center justify-between gap-3 mt-4">

                              <span
                                className="
                                  px-3
                                  py-1
                                  rounded-full
                                  bg-yellow-100
                                  text-yellow-700
                                  text-[11px]
                                  font-bold
                                "
                              >
                                ● รอตรวจสอบ
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  onReview(
                                    item.id,
                                    item.type
                                  )
                                }
                                className="
                                  px-4
                                  py-2
                                  rounded-xl
                                  bg-[#5b9bea]
                                  text-white
                                  text-xs
                                  font-bold
                                "
                              >
                                ตรวจสอบ
                              </button>

                            </div>

                          </article>
                        ))}

                      </div>
                    </>
                  )}

              </div>

            </section>

          </div>

        </main>

      </div>

    </div>
  );
}

// ========================================
// SIDEBAR BUTTON
// ========================================

function SidebarButton({
  active,
  icon,
  label,
  badge,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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

      <span className="flex-1">
        {label}
      </span>

      {Number(badge) > 0 && (
        <span
          className={`
            min-w-6
            h-6
            px-1.5
            rounded-full
            flex
            items-center
            justify-center
            text-[10px]
            font-bold
            ${
              active
                ? "bg-[#ef7777] text-white"
                : "bg-white text-[#397fd2]"
            }
          `}
        >
          {Number(badge) > 99
            ? "99+"
            : badge}
        </span>
      )}
    </button>
  );
}

// ========================================
// DASHBOARD CARD
// ========================================

function DashboardCard({
  title,
  value,
  description,
  icon,
  cardClass,
  iconClass,
  onClick,
}) {
  const content = (
    <>
      <div>
        <p className="text-sm text-white/90 font-semibold">
          {title}
        </p>

        <p className="text-3xl font-bold text-white mt-2">
          {value}
        </p>

        <p className="text-xs text-white/80 mt-2">
          {description}
        </p>
      </div>

      <div
        className={`
          w-12
          h-12
          rounded-full
          flex
          items-center
          justify-center
          text-xl
          text-white
          ${iconClass}
        `}
      >
        {icon}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`
          min-h-[135px]
          rounded-2xl
          p-5
          flex
          items-start
          justify-between
          gap-4
          text-left
          shadow-sm
          transition
          hover:-translate-y-0.5
          hover:shadow-md
          ${cardClass}
        `}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`
        min-h-[135px]
        rounded-2xl
        p-5
        flex
        items-start
        justify-between
        gap-4
        shadow-sm
        ${cardClass}
      `}
    >
      {content}
    </div>
  );
}

export default StaffHome;