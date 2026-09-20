import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function AdminHome({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [userStatusOptions, setUserStatusOptions] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [staffMembers, setStaffMembers] = useState([]);
  const [staffStatusOptions, setStaffStatusOptions] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffStatusFilter, setStaffStatusFilter] = useState("all");
  const [updatingStaffId, setUpdatingStaffId] = useState(null);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");

  const [adminCategories, setAdminCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  const [adminPosts, setAdminPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [postTypeFilter, setPostTypeFilter] = useState("all");
  const [postStatusFilter, setPostStatusFilter] = useState("all");
  const [selectedAdminPost, setSelectedAdminPost] = useState(null);
  const [postReviewNote, setPostReviewNote] = useState("");
  const [reviewingPost, setReviewingPost] = useState(false);

  const [complaints, setComplaints] = useState([]);
  const [complaintStatusOptions, setComplaintStatusOptions] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState("");
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintEditStatus, setComplaintEditStatus] = useState("");
  const [complaintStaffNote, setComplaintStaffNote] = useState("");
  const [savingComplaint, setSavingComplaint] = useState(false);

  const [adminActivityLogs, setAdminActivityLogs] = useState([]);
  const [adminLogsLoading, setAdminLogsLoading] = useState(false);
  const [adminLogsError, setAdminLogsError] = useState("");
  const [adminLogSearch, setAdminLogSearch] = useState("");
  const [adminLogRoleFilter, setAdminLogRoleFilter] = useState("all");
  const [systemSettings, setSystemSettings] = useState(null);
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(false);
  const [systemSettingsError, setSystemSettingsError] = useState("");

  const token = localStorage.getItem("back2you_token");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดข้อมูล Dashboard ได้");
      }

      setDashboard(data);
    } catch (err) {
      console.error("Admin Dashboard Error:", err);
      setError(err.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");

      const params = new URLSearchParams();

      if (userSearch.trim()) {
        params.set("search", userSearch.trim());
      }

      if (userStatusFilter !== "all") {
        params.set("status", userStatusFilter);
      }

      const query = params.toString();
      const response = await fetch(
        `${API_BASE}/api/admin/users${query ? `?${query}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้");
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
      setUserStatusOptions(
        Array.isArray(data.statusOptions) ? data.statusOptions : []
      );
    } catch (err) {
      console.error("Admin Users Error:", err);
      setUsersError(err.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
    } finally {
      setUsersLoading(false);
    }
  };

  const updateUserStatus = async (userId, nextStatus) => {
    try {
      setUpdatingUserId(userId);
      setUsersError("");

      const response = await fetch(
        `${API_BASE}/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถอัปเดตสถานะได้");
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === userId
            ? { ...item, status: nextStatus }
            : item
        )
      );

      await loadDashboard();
    } catch (err) {
      console.error("Update User Status Error:", err);
      setUsersError(err.message || "ไม่สามารถอัปเดตสถานะผู้ใช้งานได้");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const loadStaff = async () => {
    try {
      setStaffLoading(true);
      setStaffError("");

      const params = new URLSearchParams();

      if (staffSearch.trim()) {
        params.set("search", staffSearch.trim());
      }

      if (staffStatusFilter !== "all") {
        params.set("status", staffStatusFilter);
      }

      const query = params.toString();
      const response = await fetch(
        `${API_BASE}/api/admin/staff${query ? `?${query}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดข้อมูลเจ้าหน้าที่ได้");
      }

      setStaffMembers(Array.isArray(data.staff) ? data.staff : []);
      setStaffStatusOptions(
        Array.isArray(data.statusOptions) ? data.statusOptions : []
      );
    } catch (err) {
      console.error("Admin Staff Error:", err);
      setStaffError(err.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
    } finally {
      setStaffLoading(false);
    }
  };

  const updateStaffStatus = async (staffId, nextStatus) => {
    try {
      setUpdatingStaffId(staffId);
      setStaffError("");

      const response = await fetch(
        `${API_BASE}/api/admin/staff/${staffId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถอัปเดตสถานะเจ้าหน้าที่ได้");
      }

      setStaffMembers((current) =>
        current.map((item) =>
          item.id === staffId
            ? { ...item, status: nextStatus }
            : item
        )
      );

      await loadDashboard();
    } catch (err) {
      console.error("Update Staff Status Error:", err);
      setStaffError(
        err.message || "ไม่สามารถอัปเดตสถานะเจ้าหน้าที่ได้"
      );
    } finally {
      setUpdatingStaffId(null);
    }
  };

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      setRolesError("");

      const response = await fetch(`${API_BASE}/api/admin/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดข้อมูลบทบาทได้");
      }

      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch (err) {
      console.error("Admin Roles Error:", err);
      setRolesError(err.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
    } finally {
      setRolesLoading(false);
    }
  };

  const permissionMatrix = {
    1: [
      ["ใช้งานหน้า User และค้นหาประกาศ", true],
      ["สร้างประกาศของหาย / ของที่พบ", true],
      ["ส่งคำขอรับของคืนและหลักฐาน", true],
      ["ยืนยันการรับคืน", true],
      ["ตรวจสอบและอนุมัติโพสต์", false],
      ["ตรวจสอบ Claim / นัดคืน", false],
      ["เข้าถึง Admin Dashboard", false],
    ],
    2: [
      ["ใช้งานหน้า User และค้นหาประกาศ", false],
      ["สร้างประกาศของหาย / ของที่พบ", false],
      ["ส่งคำขอรับของคืนและหลักฐาน", false],
      ["ยืนยันการรับคืน", false],
      ["ตรวจสอบและอนุมัติโพสต์", true],
      ["ตรวจสอบ Claim / นัดคืน", true],
      ["เข้าถึง Admin Dashboard", false],
    ],
    3: [
      ["ใช้งานหน้า User และค้นหาประกาศ", false],
      ["สร้างประกาศของหาย / ของที่พบ", false],
      ["ส่งคำขอรับของคืนและหลักฐาน", false],
      ["ยืนยันการรับคืน", false],
      ["ตรวจสอบและอนุมัติโพสต์", true],
      ["ตรวจสอบ Claim / นัดคืน", true],
      ["เข้าถึง Admin Dashboard", true],
    ],
  };

  const getRoleMeta = (roleId) => {
    const meta = {
      1: {
        label: "User",
        description: "ผู้ใช้งานทั่วไปสำหรับแจ้งของหาย แจ้งพบของ และขอรับของคืน",
        icon: "👤",
        tone: "bg-blue-50 text-blue-600",
      },
      2: {
        label: "Staff",
        description: "เจ้าหน้าที่สำหรับตรวจสอบโพสต์ Claim และดำเนินการคืนของ",
        icon: "🧑‍💼",
        tone: "bg-emerald-50 text-emerald-600",
      },
      3: {
        label: "Admin",
        description: "ผู้ดูแลระบบสำหรับบริหารข้อมูลและเข้าถึงเครื่องมือ Admin",
        icon: "🛡️",
        tone: "bg-purple-50 text-[#a978df]",
      },
    };

    return (
      meta[Number(roleId)] || {
        label: `Role ${roleId}`,
        description: "บทบาทจากฐานข้อมูล",
        icon: "⚙️",
        tone: "bg-slate-100 text-slate-600",
      }
    );
  };

  const loadAdminCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError("");

      const response = await fetch(`${API_BASE}/api/admin/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดหมวดหมู่ได้");
      }

      setAdminCategories(
        Array.isArray(data.categories) ? data.categories : []
      );
    } catch (err) {
      console.error("Admin Categories Error:", err);
      setCategoriesError(err.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const createCategory = async (event) => {
    event.preventDefault();

    const name = categoryName.trim();

    if (!name) {
      setCategoriesError("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    try {
      setCategorySaving(true);
      setCategoriesError("");

      const response = await fetch(`${API_BASE}/api/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถเพิ่มหมวดหมู่ได้");
      }

      setCategoryName("");
      await loadAdminCategories();
    } catch (err) {
      console.error("Create Category Error:", err);
      setCategoriesError(err.message || "ไม่สามารถเพิ่มหมวดหมู่ได้");
    } finally {
      setCategorySaving(false);
    }
  };

  const startEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name || "");
    setCategoriesError("");
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const saveCategory = async (categoryId) => {
    const name = editingCategoryName.trim();

    if (!name) {
      setCategoriesError("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    try {
      setCategorySaving(true);
      setCategoriesError("");

      const response = await fetch(
        `${API_BASE}/api/admin/categories/${categoryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถแก้ไขหมวดหมู่ได้");
      }

      cancelEditCategory();
      await loadAdminCategories();
    } catch (err) {
      console.error("Update Category Error:", err);
      setCategoriesError(err.message || "ไม่สามารถแก้ไขหมวดหมู่ได้");
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (category) => {
    if (Number(category.totalUsage || 0) > 0) {
      setCategoriesError(
        `ลบ "${category.name}" ไม่ได้ เพราะมีรายการใช้งานอยู่ ${category.totalUsage} รายการ`
      );
      return;
    }

    const confirmed = window.confirm(
      `ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingCategoryId(category.id);
      setCategoriesError("");

      const response = await fetch(
        `${API_BASE}/api/admin/categories/${category.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถลบหมวดหมู่ได้");
      }

      await loadAdminCategories();
    } catch (err) {
      console.error("Delete Category Error:", err);
      setCategoriesError(err.message || "ไม่สามารถลบหมวดหมู่ได้");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const loadAdminPosts = async () => {
    try {
      setPostsLoading(true);
      setPostsError("");
      const params = new URLSearchParams();
      if (postSearch.trim()) params.set("search", postSearch.trim());
      if (postTypeFilter !== "all") params.set("type", postTypeFilter);
      if (postStatusFilter !== "all") params.set("status", postStatusFilter);
      const query = params.toString();

      const response = await fetch(
        `${API_BASE}/api/admin/posts${query ? `?${query}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ไม่สามารถโหลดรายการโพสต์ได้");
      setAdminPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (err) {
      setPostsError(err.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
    } finally {
      setPostsLoading(false);
    }
  };

  const reviewAdminPost = async (action) => {
    if (!selectedAdminPost) return;
    if (action === "reject" && !postReviewNote.trim()) {
      setPostsError("กรุณาระบุเหตุผลก่อนปฏิเสธโพสต์");
      return;
    }
    try {
      setReviewingPost(true);
      setPostsError("");
      const response = await fetch(
        `${API_BASE}/api/admin/posts/${selectedAdminPost.type}/${selectedAdminPost.id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, staffNote: postReviewNote.trim() }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ไม่สามารถตรวจสอบโพสต์ได้");
      setSelectedAdminPost(null);
      setPostReviewNote("");
      await Promise.all([loadAdminPosts(), loadDashboard()]);
    } catch (err) {
      setPostsError(err.message || "ไม่สามารถตรวจสอบโพสต์ได้");
    } finally {
      setReviewingPost(false);
    }
  };

  const getAdminPostImageUrl = (image) => {
    if (!image) return "";
    if (/^https?:\/\//i.test(image)) return image;
    if (image.startsWith("/")) return `${API_BASE}${image}`;
    return `${API_BASE}/${image}`;
  };

  const getPostStatusLabel = (status) => ({
    pending: "รอตรวจสอบ",
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธ",
    found: "พบแล้ว",
    returned: "คืนแล้ว",
  }[status] || status || "-");

  const getPostStatusClass = (status) => {
    if (status === "pending") return "bg-amber-50 text-amber-600";
    if (status === "approved") return "bg-emerald-50 text-emerald-600";
    if (status === "rejected") return "bg-red-50 text-red-500";
    if (status === "returned") return "bg-purple-50 text-[#a978df]";
    if (status === "found") return "bg-blue-50 text-[#5b9bea]";
    return "bg-slate-100 text-slate-500";
  };

  useEffect(() => {
    if (!selectedAdminPost) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeWithEscape = (event) => {
      if (event.key === "Escape" && !reviewingPost) {
        setSelectedAdminPost(null);
        setPostReviewNote("");
        setPostsError("");
      }
    };

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [selectedAdminPost, reviewingPost]);

  const loadComplaints = async () => {
    try {
      setComplaintsLoading(true);
      setComplaintsError("");

      const params = new URLSearchParams();
      if (complaintSearch.trim()) params.set("search", complaintSearch.trim());
      if (complaintStatusFilter !== "all") {
        params.set("status", complaintStatusFilter);
      }

      const query = params.toString();
      const response = await fetch(
        `${API_BASE}/api/admin/complaints${query ? `?${query}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดรายการร้องเรียนได้");
      }

      setComplaints(Array.isArray(data.complaints) ? data.complaints : []);
      setComplaintStatusOptions(
        Array.isArray(data.statusOptions) ? data.statusOptions : []
      );
    } catch (error) {
      setComplaintsError(error.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
    } finally {
      setComplaintsLoading(false);
    }
  };

  const openComplaintDetail = (complaint) => {
    setSelectedComplaint(complaint);
    setComplaintEditStatus(complaint.status || "");
    setComplaintStaffNote(complaint.staffNote || "");
    setComplaintsError("");
  };

  const saveComplaint = async () => {
    if (!selectedComplaint || !complaintEditStatus) return;

    try {
      setSavingComplaint(true);
      setComplaintsError("");

      const response = await fetch(
        `${API_BASE}/api/admin/complaints/${selectedComplaint.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: complaintEditStatus,
            staffNote: complaintStaffNote.trim(),
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถอัปเดตการร้องเรียนได้");
      }

      setSelectedComplaint(null);
      await Promise.all([loadComplaints(), loadDashboard()]);
    } catch (error) {
      setComplaintsError(error.message || "ไม่สามารถอัปเดตการร้องเรียนได้");
    } finally {
      setSavingComplaint(false);
    }
  };

  const complaintStatusLabel = (status) => ({
    pending: "รอดำเนินการ",
    investigating: "กำลังตรวจสอบ",
    resolved: "แก้ไขแล้ว",
    rejected: "ปฏิเสธ",
  }[status] || status || "-");

  const complaintStatusClass = (status) => {
    if (status === "pending") return "bg-amber-50 text-amber-600";
    if (status === "investigating") return "bg-blue-50 text-[#5b9bea]";
    if (status === "resolved") return "bg-emerald-50 text-emerald-600";
    if (status === "rejected") return "bg-red-50 text-red-500";
    return "bg-slate-100 text-slate-500";
  };

  const loadAdminActivityLogs = async () => {
    try {
      setAdminLogsLoading(true);
      setAdminLogsError("");

      const params = new URLSearchParams();
      params.set("limit", "200");
      if (adminLogSearch.trim()) params.set("search", adminLogSearch.trim());
      if (adminLogRoleFilter !== "all") {
        params.set("role", adminLogRoleFilter);
      }

      const response = await fetch(
        `${API_BASE}/api/admin/activity-logs?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดบันทึกการใช้งานได้");
      }

      setAdminActivityLogs(
        Array.isArray(data.activityLogs) ? data.activityLogs : []
      );
    } catch (error) {
      setAdminLogsError(error.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
    } finally {
      setAdminLogsLoading(false);
    }
  };

  const getLogValue = (log, candidates, fallback = "") => {
    for (const key of candidates) {
      if (log?.[key] !== undefined && log?.[key] !== null && log?.[key] !== "") {
        return log[key];
      }
    }
    return fallback;
  };

  const getLogRoleLabel = (roleId) => {
    if (Number(roleId) === 3) return "Admin";
    if (Number(roleId) === 2) return "Staff";
    if (Number(roleId) === 1) return "User";
    return "ระบบ";
  };

  const getLogRoleClass = (roleId) => {
    if (Number(roleId) === 3) return "bg-purple-50 text-[#a978df]";
    if (Number(roleId) === 2) return "bg-blue-50 text-[#5b9bea]";
    if (Number(roleId) === 1) return "bg-emerald-50 text-[#67c5b5]";
    return "bg-slate-100 text-slate-500";
  };

  const formatLogDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const loadSystemSettings = async () => {
    try {
      setSystemSettingsLoading(true);
      setSystemSettingsError("");
      const response = await fetch(`${API_BASE}/api/admin/system-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ไม่สามารถโหลดข้อมูลระบบได้");
      setSystemSettings(data);
    } catch (error) {
      setSystemSettingsError(error.message || "ไม่สามารถเชื่อมต่อ Backend ได้");
    } finally {
      setSystemSettingsLoading(false);
    }
  };

  const getProfileImageUrl = (profileImage) => {
    if (!profileImage) return "";

    const image = String(profileImage).trim();

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    if (image.startsWith("/")) {
      return `${API_BASE}${image}`;
    }

    return `${API_BASE}/${image}`;
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: "ใช้งานปกติ",
      inactive: "ไม่ใช้งาน",
      suspended: "ระงับการใช้งาน",
      blocked: "ถูกบล็อก",
      banned: "ถูกระงับถาวร",
      pending: "รอตรวจสอบ",
    };

    return labels[status] || status || "-";
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeSection !== "users") return;

    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [activeSection, userSearch, userStatusFilter]);

  useEffect(() => {
    if (activeSection !== "staff") return;

    const timer = setTimeout(() => {
      loadStaff();
    }, 300);

    return () => clearTimeout(timer);
  }, [activeSection, staffSearch, staffStatusFilter]);

  useEffect(() => {
    if (activeSection !== "roles") return;
    loadRoles();
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "categories") return;
    loadAdminCategories();
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "posts") return;
    const timer = setTimeout(() => loadAdminPosts(), 300);
    return () => clearTimeout(timer);
  }, [activeSection, postSearch, postTypeFilter, postStatusFilter]);

  useEffect(() => {
    if (activeSection !== "complaints") return;
    const timer = setTimeout(() => loadComplaints(), 300);
    return () => clearTimeout(timer);
  }, [activeSection, complaintSearch, complaintStatusFilter]);

  useEffect(() => {
    if (activeSection !== "logs") return;
    const timer = setTimeout(() => loadAdminActivityLogs(), 300);
    return () => clearTimeout(timer);
  }, [activeSection, adminLogSearch, adminLogRoleFilter]);

  useEffect(() => {
    if (activeSection === "settings") loadSystemSettings();
  }, [activeSection]);

  const stats = dashboard?.stats || {};
  const pending = dashboard?.pending || {};
  const security = dashboard?.security || {};
  const categories = dashboard?.topCategories || [];
  const trend = dashboard?.trend || [];

  const chart = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        label: date.toLocaleDateString("th-TH", { month: "short" }),
        lostItems: 0,
        foundItems: 0,
      });
    }

    const trendMap = new Map(trend.map((item) => [item.month, item]));

    return months.map((month) => ({
      ...month,
      lostItems: Number(trendMap.get(month.key)?.lostItems || 0),
      foundItems: Number(trendMap.get(month.key)?.foundItems || 0),
    }));
  }, [trend]);

  const maxChart = Math.max(
    1,
    ...chart.flatMap((item) => [item.lostItems, item.foundItems])
  );

  const maxCategory = Math.max(
    1,
    ...categories.map((category) => Number(category.total || 0))
  );

  const menuItems = [
    ["👥", "จัดการผู้ใช้งาน", "users"],
    ["🧑‍💼", "จัดการเจ้าหน้าที่", "staff"],
    ["⚙️", "บทบาทและสิทธิ์", "roles"],
    ["🎁", "หมวดหมู่สิ่งของ", "categories"],
    ["🗂️", "ตรวจสอบโพสต์", "posts"],
    ["📄", "การร้องเรียน", "complaints"],
    ["🧾", "บันทึกการใช้งาน", "logs"],
    ["📊", "รายงานและสถิติ", "reports"],
    ["☷", "การตั้งค่าระบบ", "settings"],
  ];

  const cards = [
    {
      label: "ผู้ใช้งานทั้งหมด",
      value: stats.users ?? 0,
      icon: "👥",
      tone: "text-[#5b9bea]",
      bubble: "bg-blue-100",
    },
    {
      label: "รายการแจ้งของหาย",
      value: stats.lostItems ?? 0,
      icon: "📍",
      tone: "text-[#ef7777]",
      bubble: "bg-red-100",
    },
    {
      label: "รายการของที่พบ",
      value: stats.foundItems ?? 0,
      icon: "📦",
      tone: "text-amber-500",
      bubble: "bg-amber-100",
    },
    {
      label: "รายการที่คืนสำเร็จ",
      value: stats.completedReturns ?? 0,
      icon: "✅",
      tone: "text-[#67c5b5]",
      bubble: "bg-emerald-100",
    },
    {
      label: "รายการที่รอตรวจสอบ",
      value: stats.pendingReviews ?? 0,
      icon: "⏳",
      tone: "text-orange-500",
      bubble: "bg-orange-100",
    },
  ];

  return (
    <div className="min-h-screen bg-[#eaf3ff] text-[#334155]">
      <div className="min-h-screen lg:flex">
        <aside className="bg-[#33465f] text-white lg:w-[235px] lg:min-h-screen shrink-0">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 lg:block">
            <img
              src="/image/back2you.png"
              alt="Back2You"
              className="w-28 lg:w-full lg:max-w-[180px] mx-auto"
            />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold lg:mt-2 lg:block lg:text-center">
              ADMIN
            </span>
          </div>

          <nav className="overflow-x-auto lg:overflow-visible">
            <div className="flex min-w-max gap-1 p-2 lg:block lg:min-w-0 lg:space-y-1">
              {menuItems.map(([icon, label, section]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (
                      section === "dashboard" ||
                      section === "users" ||
                      section === "staff" ||
                      section === "roles" ||
                      section === "categories" ||
                      section === "posts" ||
                      section === "complaints" ||
                      section === "logs" ||
                      section === "reports" ||
                      section === "settings"
                    ) {
                      setActiveSection(section);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition lg:w-full ${
                    activeSection === section
                      ? "bg-white/15 text-white"
                      : "text-slate-100 hover:bg-white/10"
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </nav>

        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg font-extrabold sm:text-xl">
                  {activeSection === "users"
                    ? "จัดการผู้ใช้งาน"
                    : activeSection === "staff"
                    ? "จัดการเจ้าหน้าที่"
                    : activeSection === "roles"
                    ? "บทบาทและสิทธิ์"
                    : activeSection === "categories"
                    ? "หมวดหมู่สิ่งของ"
                    : activeSection === "posts"
                    ? "ตรวจสอบโพสต์"
                    : activeSection === "complaints"
                    ? "การร้องเรียน"
                    : activeSection === "logs"
                    ? "บันทึกการใช้งาน"
                    : activeSection === "reports"
                    ? "รายงานและสถิติ"
                    : activeSection === "settings"
                    ? "การตั้งค่าระบบ"
                    : "Admin Dashboard"}
                </h1>
                <p className="truncate text-xs text-slate-500">
                  {activeSection === "users"
                    ? "ค้นหา ตรวจสอบ และจัดการสถานะบัญชีผู้ใช้งาน"
                    : activeSection === "staff"
                    ? "ตรวจสอบและจัดการบัญชีเจ้าหน้าที่ของระบบ"
                    : activeSection === "roles"
                    ? "ดูโครงสร้างบทบาทและขอบเขตการเข้าถึงของระบบ"
                    : activeSection === "categories"
                    ? "เพิ่ม แก้ไข และจัดการหมวดหมู่ที่ใช้ในประกาศ"
                    : activeSection === "posts"
                    ? "ตรวจสอบรายการของหายและของที่พบจากข้อมูลจริง"
                    : activeSection === "complaints"
                    ? "ติดตาม ตรวจสอบ และจัดการเรื่องร้องเรียนจากผู้ใช้งาน"
                    : activeSection === "logs"
                    ? "ตรวจสอบประวัติการทำงานของ Staff และ Admin"
                    : activeSection === "reports"
                    ? "สรุปแนวโน้ม ประสิทธิภาพการคืนของ และข้อมูลสำคัญของระบบ"
                    : activeSection === "settings"
                    ? "ตรวจสอบการเชื่อมต่อ ความปลอดภัย และสถานะบริการของ Back2You"
                    : "ภาพรวมระบบ Back2You จากข้อมูลจริง"}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (activeSection === "users") {
                      loadUsers();
                    } else if (activeSection === "staff") {
                      loadStaff();
                    } else if (activeSection === "roles") {
                      loadRoles();
                    } else if (activeSection === "categories") {
                      loadAdminCategories();
                    } else if (activeSection === "posts") {
                      loadAdminPosts();
                    } else if (activeSection === "complaints") {
                      loadComplaints();
                    } else if (activeSection === "logs") {
                      loadAdminActivityLogs();
                    } else if (activeSection === "reports") {
                      loadDashboard();
                    } else if (activeSection === "settings") {
                      loadSystemSettings();
                    } else {
                      loadDashboard();
                    }
                  }}
                  className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#5b9bea] sm:px-4"
                  title="รีเฟรชข้อมูล Dashboard"
                >
                  <span className="text-base">↻</span>
                  <span className="hidden sm:inline">รีเฟรช</span>
                </button>

                <div className="hidden items-center gap-3 rounded-full border border-purple-100 bg-[#f8f2ff] py-1.5 pl-2 pr-4 shadow-sm sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a978df] text-sm font-black text-white">
                    {user?.name?.trim()?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="max-w-[150px] truncate text-xs font-extrabold text-[#7c4db1]">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      ผู้ดูแลระบบ
                    </p>
                  </div>
                </div>

                <div className="h-7 w-px bg-slate-200" />

                <button
                  type="button"
                  onClick={onLogout}
                  className="group flex h-10 items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-[#ef7777] shadow-sm transition hover:border-red-200 hover:bg-[#ef7777] hover:text-white sm:px-4"
                  title="ออกจากระบบ"
                >
                  <span className="text-base transition group-hover:translate-x-0.5">
                    ↪
                  </span>
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6">
            {activeSection === "users" ? (
              <section>
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSection("dashboard");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#5b9bea]"
                        title="กลับไปหน้า Dashboard"
                        aria-label="กลับไปหน้า Dashboard"
                      >
                        ←
                      </button>

                      <div>
                        <h2 className="text-lg font-extrabold">
                          ผู้ใช้งานในระบบ
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                          แสดงเฉพาะบัญชีผู้ใช้งานทั่วไป (User)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-[#f8fbff] px-4 py-2 sm:w-[300px]">
                        <span>🔍</span>
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(event) => setUserSearch(event.target.value)}
                          placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร"
                          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                        />
                      </div>

                      <select
                        value={userStatusFilter}
                        onChange={(event) =>
                          setUserStatusFilter(event.target.value)
                        }
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none"
                      >
                        <option value="all">ทุกสถานะ</option>
                        {userStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {usersError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                      {usersError}
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-500">
                      พบ {users.length} บัญชี
                    </p>
                    {usersLoading ? (
                      <span className="text-xs font-bold text-[#5b9bea]">
                        กำลังโหลด...
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[900px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-400">
                          <th className="px-3 py-3">ผู้ใช้งาน</th>
                          <th className="px-3 py-3">เบอร์โทร</th>
                          <th className="px-3 py-3">กิจกรรม</th>
                          <th className="px-3 py-3">วันที่สมัคร</th>
                          <th className="px-3 py-3">สถานะ</th>
                          <th className="px-3 py-3 text-right">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((item) => {
                          const imageUrl = getProfileImageUrl(item.profileImage);

                          return (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 align-middle"
                            >
                              <td className="px-3 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f2e8ff] font-black text-[#a978df]">
                                    {imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      item.name?.trim()?.charAt(0)?.toUpperCase() || "U"
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="max-w-[220px] truncate text-sm font-extrabold">
                                      {item.name}
                                    </p>
                                    <p className="max-w-[240px] truncate text-xs text-slate-400">
                                      {item.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-slate-500">
                                {item.phone || "-"}
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex gap-1 text-[11px] font-bold">
                                  <span className="rounded-full bg-red-50 px-2 py-1 text-red-500">
                                    หาย {item.stats?.lostItems || 0}
                                  </span>
                                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">
                                    พบ {item.stats?.foundItems || 0}
                                  </span>
                                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">
                                    Claim {item.stats?.claims || 0}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-slate-500">
                                {formatDate(item.createdAt)}
                              </td>
                              <td className="px-3 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                                    item.status === "active"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-orange-50 text-orange-600"
                                  }`}
                                >
                                  {getStatusLabel(item.status)}
                                </span>
                              </td>
                              <td className="px-3 py-4 text-right">
                                <select
                                  value={item.status}
                                  disabled={updatingUserId === item.id}
                                  onChange={(event) =>
                                    updateUserStatus(item.id, event.target.value)
                                  }
                                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none disabled:opacity-50"
                                >
                                  {userStatusOptions.map((status) => (
                                    <option key={status} value={status}>
                                      {getStatusLabel(status)}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 space-y-3 md:hidden">
                    {users.map((item) => {
                      const imageUrl = getProfileImageUrl(item.profileImage);

                      return (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f2e8ff] font-black text-[#a978df]">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                item.name?.trim()?.charAt(0)?.toUpperCase() || "U"
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-extrabold">
                                {item.name}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {item.email}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.phone || "ไม่มีเบอร์โทร"}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold ${
                                item.status === "active"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-orange-50 text-orange-600"
                              }`}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                            <div className="rounded-xl bg-white p-2">
                              <p className="text-red-500">
                                {item.stats?.lostItems || 0}
                              </p>
                              <p className="text-[10px] text-slate-400">ของหาย</p>
                            </div>
                            <div className="rounded-xl bg-white p-2">
                              <p className="text-emerald-600">
                                {item.stats?.foundItems || 0}
                              </p>
                              <p className="text-[10px] text-slate-400">ของพบ</p>
                            </div>
                            <div className="rounded-xl bg-white p-2">
                              <p className="text-blue-600">
                                {item.stats?.claims || 0}
                              </p>
                              <p className="text-[10px] text-slate-400">Claim</p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-400">
                              สมัคร {formatDate(item.createdAt)}
                            </span>
                            <select
                              value={item.status}
                              disabled={updatingUserId === item.id}
                              onChange={(event) =>
                                updateUserStatus(item.id, event.target.value)
                              }
                              className="max-w-[170px] rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none disabled:opacity-50"
                            >
                              {userStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {getStatusLabel(status)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {!usersLoading && users.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="text-4xl">👥</div>
                      <p className="mt-3 font-bold text-slate-500">
                        ไม่พบผู้ใช้งานตามเงื่อนไข
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : activeSection === "staff" ? (
              <section>
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSection("dashboard");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#5b9bea]"
                        title="กลับไปหน้า Dashboard"
                        aria-label="กลับไปหน้า Dashboard"
                      >
                        ←
                      </button>

                      <div>
                        <h2 className="text-lg font-extrabold">
                          เจ้าหน้าที่ในระบบ
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                          บัญชี Staff (roleId 2) ที่ทำหน้าที่ตรวจสอบรายการและดำเนินงาน
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-[#f8fbff] px-4 py-2 sm:w-[300px]">
                        <span>🔍</span>
                        <input
                          type="text"
                          value={staffSearch}
                          onChange={(event) => setStaffSearch(event.target.value)}
                          placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร"
                          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                        />
                      </div>

                      <select
                        value={staffStatusFilter}
                        onChange={(event) =>
                          setStaffStatusFilter(event.target.value)
                        }
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none"
                      >
                        <option value="all">ทุกสถานะ</option>
                        {staffStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {staffError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                      {staffError}
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-500">
                      พบ {staffMembers.length} บัญชีเจ้าหน้าที่
                    </p>
                    {staffLoading ? (
                      <span className="text-xs font-bold text-[#5b9bea]">
                        กำลังโหลด...
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[820px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-400">
                          <th className="px-3 py-3">เจ้าหน้าที่</th>
                          <th className="px-3 py-3">เบอร์โทร</th>
                          <th className="px-3 py-3">กิจกรรมที่บันทึก</th>
                          <th className="px-3 py-3">วันที่เพิ่มบัญชี</th>
                          <th className="px-3 py-3">สถานะ</th>
                          <th className="px-3 py-3 text-right">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffMembers.map((item) => {
                          const imageUrl = getProfileImageUrl(item.profileImage);

                          return (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 align-middle"
                            >
                              <td className="px-3 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-black text-[#5b9bea]">
                                    {imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      item.name?.trim()?.charAt(0)?.toUpperCase() || "S"
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="max-w-[220px] truncate text-sm font-extrabold">
                                      {item.name}
                                    </p>
                                    <p className="max-w-[240px] truncate text-xs text-slate-400">
                                      {item.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-slate-500">
                                {item.phone || "-"}
                              </td>
                              <td className="px-3 py-4">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-600">
                                  {item.activityCount || 0} รายการ
                                </span>
                              </td>
                              <td className="px-3 py-4 text-sm text-slate-500">
                                {formatDate(item.createdAt)}
                              </td>
                              <td className="px-3 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                                    item.status === "active"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-orange-50 text-orange-600"
                                  }`}
                                >
                                  {getStatusLabel(item.status)}
                                </span>
                              </td>
                              <td className="px-3 py-4 text-right">
                                <select
                                  value={item.status}
                                  disabled={updatingStaffId === item.id}
                                  onChange={(event) =>
                                    updateStaffStatus(item.id, event.target.value)
                                  }
                                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none disabled:opacity-50"
                                >
                                  {staffStatusOptions.map((status) => (
                                    <option key={status} value={status}>
                                      {getStatusLabel(status)}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 space-y-3 md:hidden">
                    {staffMembers.map((item) => {
                      const imageUrl = getProfileImageUrl(item.profileImage);

                      return (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-black text-[#5b9bea]">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                item.name?.trim()?.charAt(0)?.toUpperCase() || "S"
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-extrabold">
                                {item.name}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {item.email}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.phone || "ไม่มีเบอร์โทร"}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold ${
                                item.status === "active"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-orange-50 text-orange-600"
                              }`}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-3">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400">
                                กิจกรรมที่บันทึก
                              </p>
                              <p className="text-lg font-black text-[#5b9bea]">
                                {item.activityCount || 0}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400">
                                เพิ่มบัญชีเมื่อ
                              </p>
                              <p className="text-xs font-bold">
                                {formatDate(item.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex justify-end">
                            <select
                              value={item.status}
                              disabled={updatingStaffId === item.id}
                              onChange={(event) =>
                                updateStaffStatus(item.id, event.target.value)
                              }
                              className="max-w-[190px] rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none disabled:opacity-50"
                            >
                              {staffStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {getStatusLabel(status)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {!staffLoading && staffMembers.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="text-4xl">🧑‍💼</div>
                      <p className="mt-3 font-bold text-slate-500">
                        ไม่พบเจ้าหน้าที่ตามเงื่อนไข
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : activeSection === "roles" ? (
              <section className="space-y-5">
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection("dashboard");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#5b9bea]"
                      title="กลับไปหน้า Dashboard"
                      aria-label="กลับไปหน้า Dashboard"
                    >
                      ←
                    </button>

                    <div>
                      <h2 className="text-lg font-extrabold">
                        บทบาทในระบบ
                      </h2>
                      <p className="mt-1 text-xs text-slate-400">
                        จำนวนบัญชีอ่านจากตาราง roles และ users จริง
                      </p>
                    </div>
                  </div>

                  {rolesError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                      {rolesError}
                    </div>
                  ) : null}

                  {rolesLoading ? (
                    <div className="py-12 text-center text-sm font-bold text-[#5b9bea]">
                      กำลังโหลดข้อมูลบทบาท...
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                      {roles.map((role) => {
                        const meta = getRoleMeta(role.id);

                        return (
                          <article
                            key={role.id}
                            className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${meta.tone}`}>
                                {meta.icon}
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-500 shadow-sm">
                                Role ID {role.id}
                              </span>
                            </div>

                            <h3 className="mt-4 text-xl font-black">
                              {role.name || meta.label}
                            </h3>
                            <p className="mt-1 min-h-[40px] text-xs leading-5 text-slate-500">
                              {meta.description}
                            </p>

                            <div className="mt-4 rounded-xl bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                จำนวนบัญชี
                              </p>
                              <p className="mt-1 text-2xl font-black text-[#5b9bea]">
                                {role.userCount}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div>
                    <h2 className="text-lg font-extrabold">
                      ขอบเขตสิทธิ์ปัจจุบัน
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      ตารางนี้สรุปจาก routing และ middleware ที่ระบบ Back2You ใช้อยู่ในปัจจุบัน
                      เพื่อให้ Admin เห็นขอบเขตแต่ละบทบาทชัดเจน
                    </p>
                  </div>

                  <div className="mt-5 hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-400">
                          <th className="px-3 py-3">สิทธิ์การใช้งาน</th>
                          {roles.map((role) => (
                            <th key={role.id} className="px-3 py-3 text-center">
                              {role.name || getRoleMeta(role.id).label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(permissionMatrix[1] || []).map(([label], rowIndex) => (
                          <tr key={label} className="border-b border-slate-100">
                            <td className="px-3 py-4 text-sm font-bold text-slate-600">
                              {label}
                            </td>
                            {roles.map((role) => {
                              const allowed =
                                permissionMatrix[Number(role.id)]?.[rowIndex]?.[1] === true;

                              return (
                                <td key={role.id} className="px-3 py-4 text-center">
                                  <span
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                                      allowed
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-slate-100 text-slate-400"
                                    }`}
                                  >
                                    {allowed ? "✓" : "—"}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 space-y-4 md:hidden">
                    {roles.map((role) => {
                      const meta = getRoleMeta(role.id);
                      const permissions = permissionMatrix[Number(role.id)] || [];

                      return (
                        <div
                          key={role.id}
                          className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.tone}`}>
                              {meta.icon}
                            </div>
                            <div>
                              <p className="font-extrabold">
                                {role.name || meta.label}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Role ID {role.id}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            {permissions.map(([label, allowed]) => (
                              <div
                                key={label}
                                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2"
                              >
                                <span className="text-xs font-semibold text-slate-600">
                                  {label}
                                </span>
                                <span
                                  className={`shrink-0 text-xs font-black ${
                                    allowed
                                      ? "text-emerald-600"
                                      : "text-slate-300"
                                  }`}
                                >
                                  {allowed ? "✓" : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-700">
                    <strong>หมายเหตุ:</strong> หน้านี้เป็นภาพรวมสิทธิ์ที่ระบบใช้อยู่จริง
                    ยังไม่เปิดให้แก้ Permission รายข้อ เพื่อไม่ให้การเปลี่ยนค่าในหน้าเว็บ
                    ขัดกับ middleware และ routing ของ Backend/Frontend
                  </div>
                </div>
              </section>
            ) : activeSection === "categories" ? (
              <section className="space-y-5">
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSection("dashboard");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#5b9bea]"
                        title="กลับไปหน้า Dashboard"
                        aria-label="กลับไปหน้า Dashboard"
                      >
                        ←
                      </button>

                      <div>
                        <h2 className="text-lg font-extrabold">
                          จัดการหมวดหมู่สิ่งของ
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          หมวดหมู่เหล่านี้ใช้ร่วมกับประกาศของหายและของที่พบ
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={createCategory}
                      className="flex w-full gap-2 lg:max-w-md"
                    >
                      <input
                        type="text"
                        value={categoryName}
                        onChange={(event) => setCategoryName(event.target.value)}
                        maxLength={100}
                        placeholder="ชื่อหมวดหมู่ใหม่"
                        className="min-w-0 flex-1 rounded-full border border-slate-200 bg-[#f8fbff] px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-[#5b9bea]"
                      />
                      <button
                        type="submit"
                        disabled={categorySaving}
                        className="shrink-0 rounded-full bg-[#5b9bea] px-5 py-2.5 text-sm font-extrabold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {categorySaving ? "กำลังบันทึก..." : "+ เพิ่ม"}
                      </button>
                    </form>
                  </div>

                  {categoriesError ? (
                    <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                      <span>{categoriesError}</span>
                      <button
                        type="button"
                        onClick={() => setCategoriesError("")}
                        className="shrink-0 font-black"
                        aria-label="ปิดข้อความ"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-extrabold">
                        หมวดหมู่ทั้งหมด
                      </h2>
                      <p className="mt-1 text-xs text-slate-400">
                        {adminCategories.length} หมวดหมู่
                      </p>
                    </div>

                    {categoriesLoading ? (
                      <span className="text-xs font-bold text-[#5b9bea]">
                        กำลังโหลด...
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-400">
                          <th className="px-3 py-3">หมวดหมู่</th>
                          <th className="px-3 py-3 text-center">ของหาย</th>
                          <th className="px-3 py-3 text-center">ของที่พบ</th>
                          <th className="px-3 py-3 text-center">ใช้งานรวม</th>
                          <th className="px-3 py-3 text-right">จัดการ</th>
                        </tr>
                      </thead>

                      <tbody>
                        {adminCategories.map((category) => (
                          <tr
                            key={category.id}
                            className="border-b border-slate-100"
                          >
                            <td className="px-3 py-4">
                              {editingCategoryId === category.id ? (
                                <input
                                  type="text"
                                  value={editingCategoryName}
                                  onChange={(event) =>
                                    setEditingCategoryName(event.target.value)
                                  }
                                  maxLength={100}
                                  autoFocus
                                  className="w-full max-w-sm rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold outline-none"
                                />
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5ff] text-lg">
                                    🎁
                                  </div>
                                  <div>
                                    <p className="font-extrabold">
                                      {category.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      ID {category.id}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className="px-3 py-4 text-center">
                              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-red-500">
                                {category.lostCount}
                              </span>
                            </td>

                            <td className="px-3 py-4 text-center">
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-600">
                                {category.foundCount}
                              </span>
                            </td>

                            <td className="px-3 py-4 text-center font-black text-slate-600">
                              {category.totalUsage}
                            </td>

                            <td className="px-3 py-4">
                              <div className="flex justify-end gap-2">
                                {editingCategoryId === category.id ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={categorySaving}
                                      onClick={() => saveCategory(category.id)}
                                      className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                                    >
                                      บันทึก
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEditCategory}
                                      className="rounded-full bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-500 transition hover:bg-slate-200"
                                    >
                                      ยกเลิก
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => startEditCategory(category)}
                                      className="rounded-full bg-blue-50 px-3 py-2 text-xs font-extrabold text-[#5b9bea] transition hover:bg-blue-100"
                                    >
                                      แก้ไข
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        category.totalUsage > 0 ||
                                        deletingCategoryId === category.id
                                      }
                                      onClick={() => deleteCategory(category)}
                                      title={
                                        category.totalUsage > 0
                                          ? "หมวดหมู่นี้ถูกใช้งานอยู่ จึงไม่สามารถลบได้"
                                          : "ลบหมวดหมู่"
                                      }
                                      className="rounded-full bg-red-50 px-3 py-2 text-xs font-extrabold text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {deletingCategoryId === category.id
                                        ? "กำลังลบ..."
                                        : "ลบ"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 space-y-3 md:hidden">
                    {adminCategories.map((category) => (
                      <article
                        key={category.id}
                        className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg">
                            🎁
                          </div>

                          <div className="min-w-0 flex-1">
                            {editingCategoryId === category.id ? (
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(event) =>
                                  setEditingCategoryName(event.target.value)
                                }
                                maxLength={100}
                                autoFocus
                                className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold outline-none"
                              />
                            ) : (
                              <>
                                <p className="font-extrabold">
                                  {category.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  ID {category.id}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-white p-2">
                            <p className="font-black text-red-500">
                              {category.lostCount}
                            </p>
                            <p className="text-[10px] text-slate-400">ของหาย</p>
                          </div>
                          <div className="rounded-xl bg-white p-2">
                            <p className="font-black text-emerald-600">
                              {category.foundCount}
                            </p>
                            <p className="text-[10px] text-slate-400">ของที่พบ</p>
                          </div>
                          <div className="rounded-xl bg-white p-2">
                            <p className="font-black text-slate-600">
                              {category.totalUsage}
                            </p>
                            <p className="text-[10px] text-slate-400">รวม</p>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end gap-2">
                          {editingCategoryId === category.id ? (
                            <>
                              <button
                                type="button"
                                disabled={categorySaving}
                                onClick={() => saveCategory(category.id)}
                                className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-600 disabled:opacity-50"
                              >
                                บันทึก
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditCategory}
                                className="rounded-full bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-500"
                              >
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditCategory(category)}
                                className="rounded-full bg-blue-50 px-3 py-2 text-xs font-extrabold text-[#5b9bea]"
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                disabled={
                                  category.totalUsage > 0 ||
                                  deletingCategoryId === category.id
                                }
                                onClick={() => deleteCategory(category)}
                                className="rounded-full bg-red-50 px-3 py-2 text-xs font-extrabold text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {deletingCategoryId === category.id
                                  ? "กำลังลบ..."
                                  : "ลบ"}
                              </button>
                            </>
                          )}
                        </div>

                        {category.totalUsage > 0 ? (
                          <p className="mt-2 text-right text-[10px] font-semibold text-slate-400">
                            ลบไม่ได้เนื่องจากมีประกาศใช้งานหมวดหมู่นี้อยู่
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>

                  {!categoriesLoading && adminCategories.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="text-4xl">🎁</div>
                      <p className="mt-3 font-bold text-slate-500">
                        ยังไม่มีหมวดหมู่ในระบบ
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-700">
                    <strong>การลบอย่างปลอดภัย:</strong> ระบบจะไม่อนุญาตให้ลบหมวดหมู่
                    ที่ยังถูกใช้อยู่ในประกาศของหายหรือของที่พบ เพื่อป้องกันข้อมูลและ Foreign Key เสียหาย
                  </div>
                </div>
              </section>
            ) : activeSection === "posts" ? (
              <section className="space-y-5">
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => setActiveSection("dashboard")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm hover:bg-blue-50 hover:text-[#5b9bea]">←</button>
                      <div>
                        <h2 className="text-lg font-extrabold">รายการโพสต์ในระบบ</h2>
                        <p className="mt-1 text-xs text-slate-400">ดูประวัติ และตรวจสอบรายการที่ยัง Pending</p>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[650px]">
                      <input value={postSearch} onChange={(e) => setPostSearch(e.target.value)}
                        placeholder="ค้นหารายการ ผู้โพสต์ สถานที่..."
                        className="rounded-full border border-slate-200 bg-[#f8fbff] px-4 py-2.5 text-sm outline-none" />
                      <select value={postTypeFilter} onChange={(e) => setPostTypeFilter(e.target.value)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">
                        <option value="all">ทุกประเภท</option><option value="lost">ของหาย</option><option value="found">ของที่พบ</option>
                      </select>
                      <select value={postStatusFilter} onChange={(e) => setPostStatusFilter(e.target.value)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">
                        <option value="all">ทุกสถานะ</option><option value="pending">รอตรวจสอบ</option>
                        <option value="approved">อนุมัติแล้ว</option><option value="rejected">ปฏิเสธ</option>
                        <option value="found">พบแล้ว</option><option value="returned">คืนแล้ว</option>
                      </select>
                    </div>
                  </div>
                  {postsError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">{postsError}</div> : null}
                  <p className="mt-5 text-sm font-bold text-slate-500">{postsLoading ? "กำลังโหลด..." : `พบ ${adminPosts.length} รายการ`}</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {adminPosts.map((post) => {
                    const imageUrl = getAdminPostImageUrl(post.image);
                    return (
                      <article key={`${post.type}-${post.id}`} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                        <div className="flex gap-4 p-4">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#edf5ff]">
                            {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-3xl">📦</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${post.type === "lost" ? "bg-red-50 text-[#ef7777]" : "bg-emerald-50 text-[#67c5b5]"}`}>
                                {post.type === "lost" ? "ของหาย" : "ของที่พบ"}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getPostStatusClass(post.status)}`}>{getPostStatusLabel(post.status)}</span>
                            </div>
                            <h3 className="mt-2 truncate font-extrabold">{post.title}</h3>
                            <p className="mt-1 truncate text-xs text-slate-400">{post.categoryName} • {post.location || "ไม่ระบุสถานที่"}</p>
                            <p className="mt-2 text-xs font-semibold text-slate-500">โดย {post.owner?.name || "ไม่ทราบชื่อ"}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                          <p className="truncate text-[10px] text-slate-400">{post.reviewerName ? `ตรวจโดย ${post.reviewerName}` : "ยังไม่มีผู้ตรวจสอบ"}</p>
                          <button type="button" onClick={() => { setSelectedAdminPost(post); setPostReviewNote(post.staffNote || ""); setPostsError(""); }}
                            className="rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold text-[#5b9bea]">ดูรายละเอียด</button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {!postsLoading && adminPosts.length === 0 ? (
                  <div className="rounded-2xl bg-white py-16 text-center shadow-sm"><div className="text-4xl">🗂️</div><p className="mt-3 font-bold text-slate-500">ไม่พบโพสต์ตามเงื่อนไข</p></div>
                ) : null}

                {selectedAdminPost ? (
                  <div
                    className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
                    onClick={(event) => {
                      if (event.target === event.currentTarget && !reviewingPost) {
                        setSelectedAdminPost(null);
                        setPostReviewNote("");
                        setPostsError("");
                      }
                    }}
                  >
                    <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-h-[88vh] sm:rounded-[28px] sm:p-6">
                      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white pb-4">
                        <div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getPostStatusClass(selectedAdminPost.status)}`}>{getPostStatusLabel(selectedAdminPost.status)}</span>
                          <h2 className="mt-3 text-xl font-black">{selectedAdminPost.title}</h2></div>
                        <button
                          type="button"
                          disabled={reviewingPost}
                          onClick={() => {
                            setSelectedAdminPost(null);
                            setPostReviewNote("");
                            setPostsError("");
                          }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-black text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="ปิดรายละเอียด"
                          title="ปิดรายละเอียด"
                        >
                          ×
                        </button>
                      </div>

                      {getAdminPostImageUrl(selectedAdminPost.image) ? <img src={getAdminPostImageUrl(selectedAdminPost.image)} alt="" className="mt-4 max-h-72 w-full rounded-2xl bg-[#f8fbff] object-contain" /> : null}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-[#f8fbff] p-3"><p className="text-[10px] font-bold text-slate-400">ผู้โพสต์</p><p className="mt-1 text-sm font-extrabold">{selectedAdminPost.owner?.name || "-"}</p><p className="truncate text-xs text-slate-400">{selectedAdminPost.owner?.email || "-"}</p></div>
                        <div className="rounded-xl bg-[#f8fbff] p-3"><p className="text-[10px] font-bold text-slate-400">หมวดหมู่ / สถานที่</p><p className="mt-1 text-sm font-extrabold">{selectedAdminPost.categoryName}</p><p className="text-xs text-slate-400">{selectedAdminPost.location || "-"}</p></div>
                      </div>
                      <div className="mt-3 rounded-xl bg-[#f8fbff] p-4"><p className="text-[10px] font-bold text-slate-400">รายละเอียด</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selectedAdminPost.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p></div>

                      {selectedAdminPost.status === "pending" ? (
                        <div className="mt-5 border-t border-slate-100 pt-5">
                          <label className="text-xs font-extrabold text-slate-500">หมายเหตุการตรวจสอบ</label>
                          <textarea value={postReviewNote} onChange={(e) => setPostReviewNote(e.target.value)} rows={3}
                            placeholder="ระบุเหตุผลเมื่อต้องการปฏิเสธ..."
                            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f8fbff] p-3 text-sm outline-none" />
                          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button type="button" disabled={reviewingPost} onClick={() => reviewAdminPost("reject")} className="rounded-full bg-red-50 px-5 py-2.5 text-sm font-extrabold text-red-500 disabled:opacity-50">ปฏิเสธโพสต์</button>
                            <button type="button" disabled={reviewingPost} onClick={() => reviewAdminPost("approve")} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-50">{reviewingPost ? "กำลังบันทึก..." : "อนุมัติโพสต์"}</button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500">
                          รายการนี้ผ่านการตรวจสอบแล้ว จึงแสดงแบบอ่านอย่างเดียว เพื่อไม่กระทบขั้นตอน Claim หรือการคืนของ
                          {selectedAdminPost.reviewerName ? ` • ตรวจโดย ${selectedAdminPost.reviewerName}` : ""}
                          {selectedAdminPost.staffNote ? ` • หมายเหตุ: ${selectedAdminPost.staffNote}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : activeSection === "complaints" ? (
              <section className="space-y-5">
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => setActiveSection("dashboard")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm hover:bg-blue-50 hover:text-[#5b9bea]">←</button>
                      <div>
                        <h2 className="text-lg font-extrabold">รายการร้องเรียน</h2>
                        <p className="mt-1 text-xs text-slate-400">ตรวจสอบเรื่องร้องเรียนและบันทึกผลการดำเนินการ</p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[520px]">
                      <input value={complaintSearch} onChange={(e) => setComplaintSearch(e.target.value)}
                        placeholder="ค้นหาหัวข้อ ผู้ร้องเรียน..."
                        className="rounded-full border border-slate-200 bg-[#f8fbff] px-4 py-2.5 text-sm outline-none focus:border-[#5b9bea]" />
                      <select value={complaintStatusFilter} onChange={(e) => setComplaintStatusFilter(e.target.value)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none">
                        <option value="all">ทุกสถานะ</option>
                        {complaintStatusOptions.map((status) => (
                          <option key={status} value={status}>{complaintStatusLabel(status)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {complaintsError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">{complaintsError}</div>
                  ) : null}

                  <p className="mt-5 text-sm font-bold text-slate-500">
                    {complaintsLoading ? "กำลังโหลด..." : `พบ ${complaints.length} รายการ`}
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {complaints.map((complaint) => (
                    <article key={complaint.id} className="rounded-2xl bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${complaintStatusClass(complaint.status)}`}>
                              {complaintStatusLabel(complaint.status)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">#{complaint.id}</span>
                          </div>
                          <h3 className="mt-3 line-clamp-2 font-extrabold">{complaint.subject}</h3>
                          <p className="mt-1 text-xs text-slate-400">โดย {complaint.user?.name || "ไม่ทราบชื่อ"}</p>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xl">🚨</div>
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">{complaint.description}</p>

                      <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
                        {complaint.relatedLostItem ? <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-500">ของหาย: {complaint.relatedLostItem.title}</span> : null}
                        {complaint.relatedFoundItem ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-600">ของที่พบ: {complaint.relatedFoundItem.title}</span> : null}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <p className="truncate text-[10px] text-slate-400">
                          {complaint.handler ? `ดำเนินการโดย ${complaint.handler.name}` : "ยังไม่มีผู้ดำเนินการ"}
                        </p>
                        <button type="button" onClick={() => openComplaintDetail(complaint)}
                          className="rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold text-[#5b9bea] hover:bg-blue-100">
                          ดูรายละเอียด
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {!complaintsLoading && complaints.length === 0 ? (
                  <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
                    <div className="text-4xl">🛡️</div>
                    <p className="mt-3 font-bold text-slate-500">ไม่พบรายการร้องเรียน</p>
                  </div>
                ) : null}

                {selectedComplaint ? (
                  <div
                    className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
                    onClick={(event) => {
                      if (event.target === event.currentTarget && !savingComplaint) {
                        setSelectedComplaint(null);
                      }
                    }}
                  >
                    <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-h-[88vh] sm:rounded-[28px] sm:p-6">
                      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="min-w-0">
                          <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${complaintStatusClass(selectedComplaint.status)}`}>
                            {complaintStatusLabel(selectedComplaint.status)}
                          </span>
                          <h2 className="mt-3 text-xl font-black">{selectedComplaint.subject}</h2>
                        </div>
                        <button type="button" disabled={savingComplaint} onClick={() => setSelectedComplaint(null)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-black text-slate-500 shadow-sm hover:bg-red-50 hover:text-red-500">
                          ×
                        </button>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-[#f8fbff] p-4">
                          <p className="text-[10px] font-bold text-slate-400">ผู้ร้องเรียน</p>
                          <p className="mt-1 font-extrabold">{selectedComplaint.user?.name || "-"}</p>
                          <p className="truncate text-xs text-slate-400">{selectedComplaint.user?.email || "-"}</p>
                        </div>
                        <div className="rounded-2xl bg-[#f8fbff] p-4">
                          <p className="text-[10px] font-bold text-slate-400">รายการที่เกี่ยวข้อง</p>
                          <p className="mt-1 text-sm font-bold">
                            {selectedComplaint.relatedLostItem?.title ||
                             selectedComplaint.relatedFoundItem?.title ||
                             "ไม่ได้ผูกกับประกาศ"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-[#f8fbff] p-4">
                        <p className="text-[10px] font-bold text-slate-400">รายละเอียดการร้องเรียน</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selectedComplaint.description}</p>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <label className="text-xs font-extrabold text-slate-500">สถานะ</label>
                        <select value={complaintEditStatus} onChange={(e) => setComplaintEditStatus(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#5b9bea]">
                          {complaintStatusOptions.map((status) => (
                            <option key={status} value={status}>{complaintStatusLabel(status)}</option>
                          ))}
                        </select>

                        <label className="mt-4 block text-xs font-extrabold text-slate-500">หมายเหตุจาก Admin</label>
                        <textarea value={complaintStaffNote} onChange={(e) => setComplaintStaffNote(e.target.value)}
                          rows={4} placeholder="บันทึกผลการตรวจสอบหรือรายละเอียดการดำเนินการ..."
                          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f8fbff] p-3 text-sm outline-none focus:border-[#5b9bea]" />

                        <div className="mt-4 flex justify-end">
                          <button type="button" disabled={savingComplaint || !complaintEditStatus} onClick={saveComplaint}
                            className="rounded-full bg-[#5b9bea] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50">
                            {savingComplaint ? "กำลังบันทึก..." : "บันทึกการดำเนินการ"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : activeSection === "logs" ? (
              <section className="space-y-5">
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSection("dashboard");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#5b9bea]"
                      >
                        ←
                      </button>
                      <div>
                        <h2 className="text-lg font-extrabold">บันทึกการใช้งานระบบ</h2>
                        <p className="mt-1 text-xs text-slate-400">
                          แสดง Activity Log ของ Staff และ Admin จากฐานข้อมูล สูงสุด 200 รายการล่าสุด
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[540px]">
                      <input
                        type="text"
                        value={adminLogSearch}
                        onChange={(event) => setAdminLogSearch(event.target.value)}
                        placeholder="ค้นหาชื่อ อีเมล action หรือรายละเอียด..."
                        className="rounded-full border border-slate-200 bg-[#f8fbff] px-4 py-2.5 text-sm outline-none focus:border-[#5b9bea]"
                      />
                      <select
                        value={adminLogRoleFilter}
                        onChange={(event) => setAdminLogRoleFilter(event.target.value)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none"
                      >
                        <option value="all">ทุกบทบาท</option>
                        <option value="3">Admin</option>
                        <option value="2">Staff</option>
                      </select>
                    </div>
                  </div>

                  {adminLogsError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                      {adminLogsError}
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-500">
                      {adminLogsLoading
                        ? "กำลังโหลด..."
                        : `พบ ${adminActivityLogs.length} รายการ`}
                    </p>
                    <button
                      type="button"
                      onClick={loadAdminActivityLogs}
                      disabled={adminLogsLoading}
                      className="rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold text-[#5b9bea] transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      ↻ รีเฟรช
                    </button>
                  </div>
                </div>

                <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-[#f8fbff] text-xs text-slate-400">
                        <tr>
                          <th className="px-5 py-4 font-extrabold">วันเวลา</th>
                          <th className="px-5 py-4 font-extrabold">ผู้ดำเนินการ</th>
                          <th className="px-5 py-4 font-extrabold">บทบาท</th>
                          <th className="px-5 py-4 font-extrabold">Action</th>
                          <th className="px-5 py-4 font-extrabold">เป้าหมาย</th>
                          <th className="px-5 py-4 font-extrabold">รายละเอียด</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminActivityLogs.map((log, index) => {
                          const action = getLogValue(log, ["action", "action_type", "activity"], "-");
                          const targetType = getLogValue(log, ["target_type", "entity_type", "item_type"], "-");
                          const targetId = getLogValue(log, ["target_id", "entity_id", "item_id", "related_id"], "");
                          const description = getLogValue(log, ["description", "details", "detail", "message"], "-");
                          const createdAt = getLogValue(log, ["created_at", "createdAt"], "");
                          return (
                            <tr key={log.id || `${createdAt}-${index}`} className="align-top hover:bg-slate-50/70">
                              <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">
                                {formatLogDate(createdAt)}
                              </td>
                              <td className="px-5 py-4">
                                <p className="font-extrabold text-slate-700">{log.actor_name || "ระบบ"}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{log.actor_email || "-"}</p>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${getLogRoleClass(log.actor_role_id)}`}>
                                  {getLogRoleLabel(log.actor_role_id)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <code className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                                  {String(action)}
                                </code>
                              </td>
                              <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                                {String(targetType)}
                                {targetId !== "" ? ` #${targetId}` : ""}
                              </td>
                              <td className="max-w-[360px] px-5 py-4 text-xs leading-5 text-slate-500">
                                {String(description)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3 lg:hidden">
                  {adminActivityLogs.map((log, index) => {
                    const action = getLogValue(log, ["action", "action_type", "activity"], "-");
                    const targetType = getLogValue(log, ["target_type", "entity_type", "item_type"], "-");
                    const targetId = getLogValue(log, ["target_id", "entity_id", "item_id", "related_id"], "");
                    const description = getLogValue(log, ["description", "details", "detail", "message"], "-");
                    const createdAt = getLogValue(log, ["created_at", "createdAt"], "");
                    return (
                      <article key={log.id || `${createdAt}-${index}`} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-extrabold">{log.actor_name || "ระบบ"}</p>
                            <p className="mt-1 text-[10px] text-slate-400">{formatLogDate(createdAt)}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold ${getLogRoleClass(log.actor_role_id)}`}>
                            {getLogRoleLabel(log.actor_role_id)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <code className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#5b9bea]">
                            {String(action)}
                          </code>
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                            {String(targetType)}{targetId !== "" ? ` #${targetId}` : ""}
                          </span>
                        </div>

                        <p className="mt-3 text-xs leading-5 text-slate-500">{String(description)}</p>
                      </article>
                    );
                  })}
                </div>

                {!adminLogsLoading && adminActivityLogs.length === 0 ? (
                  <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
                    <div className="text-4xl">🧾</div>
                    <p className="mt-3 font-bold text-slate-500">ยังไม่มีบันทึกการใช้งานตามเงื่อนไขนี้</p>
                  </div>
                ) : null}
              </section>
            ) : activeSection === "reports" ? (
              <section className="space-y-5">
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSection("dashboard");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#5b9bea]"
                        aria-label="กลับไปหน้า Dashboard"
                      >
                        ←
                      </button>
                      <div>
                        <h2 className="text-lg font-extrabold">ภาพรวมรายงานระบบ</h2>
                        <p className="mt-1 text-xs text-slate-400">
                          ข้อมูลทั้งหมดคำนวณจาก MySQL จริง และแนวโน้มแสดงย้อนหลัง 6 เดือน
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={loadDashboard}
                      disabled={loading}
                      className="rounded-full bg-blue-50 px-4 py-2.5 text-xs font-extrabold text-[#5b9bea] transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      ↻ {loading ? "กำลังอัปเดต..." : "อัปเดตรายงาน"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {[
                    ["ผู้ใช้งาน", stats.users || 0, "👥", "text-[#5b9bea]", "bg-blue-50"],
                    ["ของหาย", stats.lostItems || 0, "📍", "text-[#ef7777]", "bg-red-50"],
                    ["ของที่พบ", stats.foundItems || 0, "📦", "text-amber-500", "bg-amber-50"],
                    ["คืนสำเร็จ", stats.completedReturns || 0, "✅", "text-[#67c5b5]", "bg-emerald-50"],
                    ["นัดคืนทั้งหมด", stats.totalReturns || 0, "🤝", "text-[#a978df]", "bg-purple-50"],
                    ["รอนัดคืน", stats.scheduledReturns || 0, "🗓️", "text-orange-500", "bg-orange-50"],
                  ].map(([label, value, icon, tone, bubble]) => (
                    <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${bubble}`}>
                        {icon}
                      </div>
                      <p className="mt-3 text-[11px] font-bold text-slate-400">{label}</p>
                      <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold">แนวโน้มการแจ้งสิ่งของ</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          เปรียบเทียบของหายและของที่พบย้อนหลัง 6 เดือน
                        </p>
                      </div>
                      <div className="flex gap-3 text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <i className="h-2.5 w-2.5 rounded-full bg-[#5b9bea]" /> ของหาย
                        </span>
                        <span className="flex items-center gap-1.5">
                          <i className="h-2.5 w-2.5 rounded-full bg-amber-400" /> ของที่พบ
                        </span>
                      </div>
                    </div>

                    {chart.length === 0 ? (
                      <div className="grid h-64 place-items-center text-sm font-semibold text-slate-400">
                        ยังไม่มีข้อมูลสำหรับสร้างกราฟ
                      </div>
                    ) : (
                      <div className="mt-7 flex h-64 items-end gap-2 border-b border-l border-slate-200 px-2 pb-1 sm:gap-5">
                        {chart.map((item) => (
                          <div key={item.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                            <div className="flex h-[210px] items-end justify-center gap-1.5">
                              <div
                                className="group relative w-4 rounded-t-lg bg-[#5b9bea] transition hover:brightness-95 sm:w-7"
                                style={{ height: `${Math.max(3, (item.lostItems / maxChart) * 100)}%` }}
                              >
                                <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-slate-700 px-2 py-1 text-[9px] font-bold text-white group-hover:block">
                                  {item.lostItems}
                                </span>
                              </div>
                              <div
                                className="group relative w-4 rounded-t-lg bg-amber-400 transition hover:brightness-95 sm:w-7"
                                style={{ height: `${Math.max(3, (item.foundItems / maxChart) * 100)}%` }}
                              >
                                <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-slate-700 px-2 py-1 text-[9px] font-bold text-white group-hover:block">
                                  {item.foundItems}
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 truncate text-center text-[10px] font-bold text-slate-400">
                              {item.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <h3 className="font-extrabold">ประสิทธิภาพการคืนของ</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      อัตราสำเร็จไม่นับรายการที่ยกเลิกเป็นฐานคำนวณ
                    </p>

                    <div className="mt-7 flex flex-col items-center">
                      <div
                        className="grid h-40 w-40 place-items-center rounded-full"
                        style={{
                          background: `conic-gradient(#67c5b5 ${stats.returnRate || 0}%, #eaf3ff 0)`,
                        }}
                      >
                        <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-inner">
                          <div>
                            <p className="text-3xl font-black text-[#67c5b5]">{stats.returnRate || 0}%</p>
                            <p className="text-[10px] font-bold text-slate-400">อัตราคืนสำเร็จ</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid w-full grid-cols-2 gap-3">
                        <div className="rounded-xl bg-purple-50 p-3 text-center">
                          <p className="text-xl font-black text-[#a978df]">{stats.totalReturns || 0}</p>
                          <p className="text-[10px] font-bold text-slate-500">นัดคืนทั้งหมด</p>
                        </div>
                        <div className="rounded-xl bg-orange-50 p-3 text-center">
                          <p className="text-xl font-black text-orange-500">{stats.scheduledReturns || 0}</p>
                          <p className="text-[10px] font-bold text-slate-500">รอดำเนินการ</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3 text-center">
                          <p className="text-xl font-black text-[#67c5b5]">{stats.completedReturns || 0}</p>
                          <p className="text-[10px] font-bold text-slate-500">คืนสำเร็จ</p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-3 text-center">
                          <p className="text-xl font-black text-[#ef7777]">{stats.cancelledReturns || 0}</p>
                          <p className="text-[10px] font-bold text-slate-500">ยกเลิก</p>
                        </div>
                      </div>

                      <div className="mt-3 w-full rounded-xl bg-[#f8fbff] px-4 py-3 text-center">
                        <p className="text-[10px] font-bold text-slate-400">ฐานคำนวณอัตราสำเร็จ (ไม่รวมยกเลิก)</p>
                        <p className="mt-1 text-lg font-black text-[#334155]">{stats.returnRateBase || 0} รายการ</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold">หมวดหมู่ยอดนิยม</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          5 หมวดหมู่ที่มีการแจ้งของหายและของที่พบมากที่สุด
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-[#5b9bea]">
                        TOP 5
                      </span>
                    </div>

                    <div className="mt-5 space-y-4">
                      {categories.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีข้อมูลหมวดหมู่</p>
                      ) : (
                        categories.map((category, index) => (
                          <div key={category.id}>
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#edf5ff] text-[10px] font-black text-[#5b9bea]">
                                  {index + 1}
                                </span>
                                <span className="truncate font-extrabold">{category.name}</span>
                              </div>
                              <span className="font-black text-slate-500">{category.total}</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#5b9bea]"
                                style={{ width: `${Math.max(4, (category.total / maxCategory) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <h3 className="font-extrabold">สถานะงานที่ต้องดำเนินการ</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      งานที่ยังค้างในขั้นตอนตรวจสอบของระบบ
                    </p>

                    <div className="mt-5 space-y-3">
                      {[
                        ["📍", "โพสต์ของหายรอตรวจสอบ", pending.lostItems || 0, "bg-red-50 text-red-600"],
                        ["📦", "โพสต์ของที่พบรอตรวจสอบ", pending.foundItems || 0, "bg-amber-50 text-amber-600"],
                        ["🧾", "คำขอรับของคืนรอตรวจสอบ", pending.claims || 0, "bg-blue-50 text-blue-600"],
                      ].map(([icon, label, value, tone]) => (
                        <div key={label} className={`flex items-center justify-between gap-3 rounded-2xl p-4 ${tone}`}>
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="text-xl">{icon}</span>
                            <span className="truncate text-sm font-bold">{label}</span>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-black shadow-sm">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f8fbff] p-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400">รวมงานค้างทั้งหมด</p>
                        <p className="mt-1 text-2xl font-black text-[#334155]">{pending.total || 0}</p>
                      </div>
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl shadow-sm">📋</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-6 text-slate-500">
                  <span className="font-extrabold text-[#5b9bea]">หมายเหตุ:</span>{" "}
                  “นัดคืนทั้งหมด” คือทุกแถวในตาราง returns ส่วนอัตราการคืนสำเร็จคำนวณจากรายการ
                  status = completed และ user_confirmed = 1 หารด้วยนัดคืนทั้งหมดที่ไม่ใช่ status = cancelled
                  เพื่อไม่ให้รายการที่ยกเลิกกดอัตราความสำเร็จลง ส่วนกราฟแนวโน้มใช้วันที่สร้างประกาศย้อนหลัง 6 เดือน
                </div>
              </section>
            ) : activeSection === "settings" ? (
              <section className="space-y-5">
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSection("dashboard");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:bg-blue-50 hover:text-[#5b9bea]"
                      >
                        ←
                      </button>
                      <div>
                        <h2 className="text-lg font-extrabold">ข้อมูลและการตั้งค่าระบบ</h2>
                        <p className="mt-1 text-xs text-slate-400">
                          ตรวจสอบค่าที่ระบบใช้งานจริง โดยไม่เปิดเผย Password หรือ Secret
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={loadSystemSettings}
                      disabled={systemSettingsLoading}
                      className="rounded-full bg-blue-50 px-4 py-2.5 text-xs font-extrabold text-[#5b9bea] disabled:opacity-50"
                    >
                      ↻ {systemSettingsLoading ? "กำลังตรวจสอบ..." : "ตรวจสอบอีกครั้ง"}
                    </button>
                  </div>
                  {systemSettingsError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                      {systemSettingsError}
                    </div>
                  ) : null}
                </div>

                {systemSettings ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["🗄️", "ฐานข้อมูล", systemSettings.database?.connected, "เชื่อมต่อแล้ว", "ไม่เชื่อมต่อ"],
                        ["🔐", "JWT", systemSettings.security?.jwtConfigured, "พร้อมใช้งาน", "ยังไม่ได้ตั้งค่า"],
                        ["✉️", "Email Service", systemSettings.security?.emailConfigured, "ตั้งค่าแล้ว", "ยังไม่ได้ตั้งค่า"],
                        ["🛡️", "Admin API", systemSettings.security?.adminRouteProtection, "ป้องกันด้วยสิทธิ์ Admin", "ควรตรวจสอบ"],
                      ].map(([icon, label, ok, yes, no]) => (
                        <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5ff] text-xl">{icon}</span>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${ok ? "bg-emerald-50 text-[#67c5b5]" : "bg-red-50 text-[#ef7777]"}`}>
                              {ok ? "OK" : "CHECK"}
                            </span>
                          </div>
                          <p className="mt-3 text-xs font-bold text-slate-400">{label}</p>
                          <p className="mt-1 font-extrabold">{ok ? yes : no}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-extrabold">แอปพลิเคชัน</h3>
                        <div className="mt-4 divide-y divide-slate-100">
                          {[
                            ["ชื่อระบบ", systemSettings.application?.name || "-"],
                            ["Environment", systemSettings.application?.environment || "-"],
                            ["Backend Port", systemSettings.application?.apiPort ?? "-"],
                            ["Frontend URL", systemSettings.application?.frontendUrl || "ไม่ได้กำหนด"],
                            ["เวลา Server", systemSettings.serverTime ? new Date(systemSettings.serverTime).toLocaleString("th-TH") : "-"],
                          ].map(([label, value]) => (
                            <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4">
                              <span className="text-xs font-bold text-slate-400">{label}</span>
                              <span className="break-all text-sm font-extrabold text-slate-600">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-extrabold">ฐานข้อมูล MySQL</h3>
                        <div className="mt-4 divide-y divide-slate-100">
                          {[
                            ["สถานะ", systemSettings.database?.connected ? "เชื่อมต่อแล้ว" : "ไม่เชื่อมต่อ"],
                            ["Database", systemSettings.database?.name || "-"],
                            ["Host", systemSettings.database?.host || "-"],
                            ["Port", systemSettings.database?.port ?? "-"],
                            ["จำนวนตาราง", `${systemSettings.database?.tableCount ?? 0} ตาราง`],
                          ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between gap-4 py-3">
                              <span className="text-xs font-bold text-slate-400">{label}</span>
                              <span className="text-right text-sm font-extrabold text-slate-600">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-extrabold">ความปลอดภัย</h3>
                        <div className="mt-4 space-y-3">
                          {[
                            ["JWT Secret", systemSettings.security?.jwtConfigured, "ตรวจสอบเฉพาะว่ามีการตั้งค่า"],
                            ["Password Hash", systemSettings.security?.passwordStorage === "bcrypt", "ใช้ bcrypt สำหรับรหัสผ่าน"],
                            ["Admin Routes", systemSettings.security?.adminRouteProtection, "ตรวจสอบสิทธิ์ Admin ก่อนใช้งาน"],
                            ["Resend API", systemSettings.security?.emailConfigured, "ตรวจสอบเฉพาะว่ามี API Key"],
                          ].map(([label, ok, detail]) => (
                            <div key={label} className="flex items-center gap-3 rounded-xl bg-[#f8fbff] p-3">
                              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-black ${ok ? "bg-emerald-50 text-[#67c5b5]" : "bg-red-50 text-[#ef7777]"}`}>
                                {ok ? "✓" : "!"}
                              </span>
                              <div>
                                <p className="text-sm font-extrabold">{label}</p>
                                <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-extrabold">บัญชีในระบบ</h3>
                        <div className="mt-5 grid grid-cols-3 gap-3">
                          {[
                            ["User", systemSettings.accounts?.users || 0, "bg-blue-50 text-[#5b9bea]"],
                            ["Staff", systemSettings.accounts?.staff || 0, "bg-emerald-50 text-[#67c5b5]"],
                            ["Admin", systemSettings.accounts?.admins || 0, "bg-purple-50 text-[#a978df]"],
                          ].map(([label, value, tone]) => (
                            <div key={label} className={`rounded-2xl p-4 text-center ${tone}`}>
                              <p className="text-2xl font-black">{value}</p>
                              <p className="mt-1 text-[10px] font-extrabold">{label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-slate-500">
                          ปัจจุบันฐานข้อมูลยังไม่มีตาราง System Settings จึงแสดงเฉพาะค่าที่ระบบใช้งานจริง
                          และไม่สร้างสวิตช์ที่กดแล้วไม่มีผลกับระบบ
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800">
                      <span className="font-extrabold">ความปลอดภัย:</span>{" "}
                      API นี้ไม่ส่ง DB Password, JWT Secret หรือ Resend API Key มายัง Frontend
                      โดยแสดงเพียงสถานะว่าค่าที่จำเป็นถูกตั้งไว้แล้วหรือไม่
                    </div>
                  </>
                ) : !systemSettingsLoading && !systemSettingsError ? (
                  <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
                    <div className="text-4xl">⚙️</div>
                    <p className="mt-3 font-bold text-slate-500">ยังไม่มีข้อมูลระบบ</p>
                  </div>
                ) : null}
              </section>
            ) : (
              <>
            {error ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            ) : null}

            {loading && !dashboard ? (
              <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-500">
                กำลังโหลดข้อมูล Dashboard...
              </div>
            ) : (
              <>
                <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                  {cards.map((card) => (
                    <div key={card.label} className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-500">
                            {card.label}
                          </p>
                          <p className={`mt-1 text-3xl font-black ${card.tone}`}>
                            {card.value}
                          </p>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${card.bubble}`}>
                          {card.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                <section className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
                  <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="font-extrabold">รายงานและสถิติ</h2>
                        <p className="text-xs text-slate-400">
                          จำนวนประกาศย้อนหลัง 6 เดือน
                        </p>
                      </div>
                      <div className="flex gap-3 text-xs font-bold">
                        <span>🔵 ของหาย</span>
                        <span>🟠 ของที่พบ</span>
                      </div>
                    </div>

                    <div className="mt-6 flex h-56 items-end gap-2 border-b border-l border-slate-200 px-2 pb-1 sm:gap-4">
                      {chart.map((item) => (
                        <div key={item.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                          <div className="flex h-[185px] items-end justify-center gap-1">
                            <div
                              title={`ของหาย ${item.lostItems}`}
                              className="w-3 rounded-t bg-[#5b9bea] sm:w-5"
                              style={{ height: `${Math.max(3, (item.lostItems / maxChart) * 100)}%` }}
                            />
                            <div
                              title={`ของที่พบ ${item.foundItems}`}
                              className="w-3 rounded-t bg-amber-400 sm:w-5"
                              style={{ height: `${Math.max(3, (item.foundItems / maxChart) * 100)}%` }}
                            />
                          </div>
                          <p className="mt-2 truncate text-center text-[10px] font-bold text-slate-400">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <h2 className="font-extrabold">อัตราการคืนสำเร็จ</h2>
                      <p className="text-xs text-slate-400">
                        จากรายการนัดคืนทั้งหมด
                      </p>

                      <div className="mt-5 flex items-center gap-5">
                        <div
                          className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
                          style={{
                            background: `conic-gradient(#67c5b5 ${stats.returnRate || 0}%, #eaf3ff 0)`,
                          }}
                        >
                          <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
                            <div>
                              <p className="text-2xl font-black text-[#67c5b5]">
                                {stats.returnRate || 0}%
                              </p>
                              <p className="text-[10px] text-slate-400">สำเร็จ</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="font-bold text-slate-600">
                            คืนสำเร็จแล้ว
                          </p>
                          <p className="mt-1 text-3xl font-black text-[#67c5b5]">
                            {stats.completedReturns || 0}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            รายการที่ผู้ใช้ยืนยันรับของแล้ว
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <h2 className="font-extrabold">หมวดหมู่ที่มีการแจ้งมากที่สุด</h2>
                      <div className="mt-4 space-y-3">
                        {categories.length === 0 ? (
                          <p className="text-sm text-slate-400">ยังไม่มีข้อมูลหมวดหมู่</p>
                        ) : (
                          categories.map((category) => (
                            <div key={category.id}>
                              <div className="mb-1 flex justify-between gap-3 text-xs font-bold">
                                <span className="truncate">{category.name}</span>
                                <span className="text-slate-400">{category.total}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[#5b9bea]"
                                  style={{
                                    width: `${Math.max(4, (category.total / maxCategory) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="font-extrabold">ต้องดำเนินการ</h2>
                    <p className="text-xs text-slate-400">
                      รายการที่ยังรอการตรวจสอบหรือพิจารณา
                    </p>

                    <div className="mt-4 space-y-3">
                      {[
                        ["📍", "โพสต์ของหายรอตรวจสอบ", pending.lostItems || 0, "bg-red-50 text-red-600"],
                        ["📦", "โพสต์ของพบรอตรวจสอบ", pending.foundItems || 0, "bg-amber-50 text-amber-600"],
                        ["🧾", "คำขอรับของคืนรอตรวจสอบ", pending.claims || 0, "bg-blue-50 text-blue-600"],
                      ].map(([icon, label, value, tone]) => (
                        <div key={label} className={`flex items-center justify-between gap-3 rounded-xl p-3 ${tone}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{icon}</span>
                            <span className="text-sm font-bold">{label}</span>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-black">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-600">
                      รวมรายการที่ต้องดำเนินการ {pending.total || 0} รายการ
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="font-extrabold">ความปลอดภัยระบบ</h2>
                    <p className="text-xs text-slate-400">
                      ภาพรวมบัญชีและการเชื่อมต่อฐานข้อมูล
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3">
                        <span className="text-sm font-bold">🟢 บัญชีที่ใช้งานได้</span>
                        <span className="font-black text-emerald-600">
                          {security.activeAccounts || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-orange-50 p-3">
                        <span className="text-sm font-bold">🟠 บัญชีที่ถูกจำกัด</span>
                        <span className="font-black text-orange-600">
                          {security.restrictedAccounts || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3">
                        <span className="text-sm font-bold">🗄️ ฐานข้อมูล</span>
                        <span className="font-black text-blue-600">
                          {security.database === "connected" ? "เชื่อมต่อแล้ว" : "ตรวจสอบ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
              </>
            )}
          </main>

          <footer className="px-4 py-7 text-center text-xs text-slate-500">
            © 2026 TAMKUEN LOST&FOUND — พื้นที่กลางสำหรับคนที่ทำของหายและคนที่เก็บของได้
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
