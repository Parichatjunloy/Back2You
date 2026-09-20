// ========================================
// Back2You Backend
// server.js
// ========================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { Resend } = require("resend");

const pool = require("./db");

dotenv.config();

// ========================================
// APP
// ========================================

const app = express();

const PORT =
  process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

// ========================================
// RESEND
// ========================================

const resend = new Resend(
  process.env.RESEND_API_KEY
);

// ========================================
// MIDDLEWARE
// ========================================

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ========================================
// IMAGE FOLDER
// ========================================

const imageFolder = path.join(
  __dirname,
  "image"
);

if (
  !fs.existsSync(imageFolder)
) {
  fs.mkdirSync(
    imageFolder,
    {
      recursive: true,
    }
  );
}

app.use(
  "/image",
  express.static(imageFolder)
);

// ========================================
// MULTER
// ========================================

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        imageFolder
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extensionByMime = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
      };

      const extension =
        extensionByMime[file.mimetype] || "";

      const filename =
        `${Date.now()}-${crypto
          .randomBytes(12)
          .toString(
            "hex"
          )}${extension}`;

      cb(
        null,
        filename
      );
    },
  });

const upload = multer({
  storage,

  limits: {
    fileSize:
      5 * 1024 * 1024,
    files: 3,
  },

  fileFilter: (
    req,
    file,
    cb
  ) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "รองรับเฉพาะไฟล์ JPG และ PNG"
        )
      );
    }
  },
});

// ========================================
// HELPERS
// ========================================

function normalizeEmail(
  email
) {
  return String(
    email || ""
  )
    .trim()
    .toLowerCase();
}

function isValidEmail(
  email
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function hashLoginToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token || ""))
    .digest("hex");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ========================================
// AUTH MIDDLEWARE
// ========================================

async function authenticateToken(
  req,
  res,
  next
) {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({
        message:
          "กรุณาเข้าสู่ระบบ",
      });
  }

  const parts =
    authHeader.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer"
  ) {
    return res
      .status(401)
      .json({
        message:
          "รูปแบบ Token ไม่ถูกต้อง",
      });
  }

  const token = parts[1];

  try {
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const userId = Number(decoded.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Token ไม่ถูกต้อง",
      });
    }

    // ตรวจสถานะและ role จากฐานข้อมูลทุกครั้ง
    // เพื่อให้การระงับบัญชี/เปลี่ยนสิทธิ์มีผลทันที
    const [users] = await pool.query(
      `SELECT id, role_id, email, status
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "ไม่พบบัญชีผู้ใช้งาน",
      });
    }

    const currentUser = users[0];

    if (currentUser.status !== "active") {
      return res.status(403).json({
        message: "บัญชีนี้ถูกระงับการใช้งาน",
      });
    }

    req.user = {
      ...decoded,
      userId: Number(currentUser.id),
      roleId: Number(currentUser.role_id),
      email: currentUser.email,
    };

    next();
  } catch (error) {
    return res
      .status(401)
      .json({
        message:
          "Token หมดอายุหรือไม่ถูกต้อง",
      });
  }
}

// ========================================
// STAFF MIDDLEWARE
// ========================================

function requireStaff(
  req,
  res,
  next
) {
  const roleId =
    Number(
      req.user?.roleId
    );

  // Staff = 2
  // Admin = 3
  if (
    roleId !== 2 &&
    roleId !== 3
  ) {
    return res
      .status(403)
      .json({
        message:
          "ไม่มีสิทธิ์เข้าถึงระบบ Staff",
      });
  }

  next();
}

// ========================================
// ADMIN MIDDLEWARE
// ========================================

function requireAdmin(req, res, next) {
  const roleId = Number(req.user?.roleId);

  if (roleId !== 3) {
    return res.status(403).json({
      message: "ไม่มีสิทธิ์เข้าถึงระบบ Admin",
    });
  }

  next();
}

function requireUser(req, res, next) {
  const roleId = Number(req.user?.roleId);

  if (roleId !== 1) {
    return res.status(403).json({
      message: "ฟังก์ชันนี้สำหรับผู้ใช้งานทั่วไปเท่านั้น",
    });
  }

  next();
}

// ========================================
// NOTIFICATION HELPER
// ========================================

async function createNotification(
  db,
  { userId, title, message, type = null, relatedId = null }
) {
  await db.query(
    `INSERT INTO notifications
     (user_id, title, message, type, related_id, is_read)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [userId, title, message, type, relatedId]
  );
}

async function createStaffNotifications(
  db,
  { title, message, type = null, relatedId = null }
) {
  const [staffUsers] = await db.query(
    `SELECT id
     FROM users
     WHERE role_id IN (2, 3)
       AND status = 'active'`
  );

  for (const staffUser of staffUsers) {
    await createNotification(db, {
      userId: staffUser.id,
      title,
      message,
      type,
      relatedId,
    });
  }
}

let activityLogColumnCache = null;

async function getActivityLogColumns(db = pool) {
  if (activityLogColumnCache) {
    return activityLogColumnCache;
  }

  const [columns] = await db.query("SHOW COLUMNS FROM activity_logs");
  activityLogColumnCache = new Set(columns.map((column) => column.Field));
  return activityLogColumnCache;
}

async function createActivityLog(
  db,
  {
    userId,
    action,
    targetType = null,
    targetId = null,
    description = null,
  }
) {
  try {
    const columns = await getActivityLogColumns(db);

    const fieldMap = [];
    const values = [];

    const addField = (candidates, value) => {
      const field = candidates.find((candidate) => columns.has(candidate));
      if (!field || value === undefined) return;
      fieldMap.push(field);
      values.push(value);
    };

    addField(["user_id", "staff_id", "actor_id"], userId);
    addField(["action", "action_type", "activity"], action);
    addField(["target_type", "entity_type", "item_type"], targetType);
    addField(["target_id", "entity_id", "item_id", "related_id"], targetId);
    addField(
      ["description", "details", "detail", "message"],
      description ||
        [targetType, targetId ? `#${targetId}` : null]
          .filter(Boolean)
          .join(" ")
    );

    if (fieldMap.length === 0) {
      console.warn("Activity Log skipped: ไม่พบคอลัมน์ที่รองรับใน activity_logs");
      return;
    }

    const placeholders = fieldMap.map(() => "?").join(", ");

    await db.query(
      `INSERT INTO activity_logs (${fieldMap.join(", ")})
       VALUES (${placeholders})`,
      values
    );
  } catch (error) {
    // Activity log ไม่ควรทำให้ action หลักของระบบล้มเหลว
    console.error("Create Activity Log Error:", error);
  }
}

// ========================================
// MATCHING HELPERS
// ========================================

function normalizeMatchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMatchWords(value) {
  return new Set(
    normalizeMatchText(value)
      .split(" ")
      .filter((word) => word.length >= 2)
  );
}

function calculateTextSimilarity(left, right) {
  const leftWords = getMatchWords(left);
  const rightWords = getMatchWords(right);

  if (leftWords.size === 0 || rightWords.size === 0) return 0;

  let common = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) common += 1;
  }

  const union = new Set([...leftWords, ...rightWords]).size;
  return union > 0 ? common / union : 0;
}

function calculateDateMatchScore(lostDate, foundDate) {
  if (!lostDate || !foundDate) return 0;

  const lost = new Date(lostDate);
  const found = new Date(foundDate);

  if (
    Number.isNaN(lost.getTime()) ||
    Number.isNaN(found.getTime()) ||
    found.getTime() < lost.getTime()
  ) {
    return 0;
  }

  const diffDays = Math.floor(
    (found.getTime() - lost.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 1) return 1;
  if (diffDays <= 3) return 0.85;
  if (diffDays <= 7) return 0.65;
  if (diffDays <= 14) return 0.4;
  if (diffDays <= 30) return 0.2;
  return 0;
}

function buildItemMatch(lostItem, foundItem) {
  const categoryMatched =
    lostItem.category_id &&
    foundItem.category_id &&
    Number(lostItem.category_id) === Number(foundItem.category_id);

  const titleSimilarity = calculateTextSimilarity(
    lostItem.title,
    foundItem.title
  );

  const descriptionSimilarity = calculateTextSimilarity(
    `${lostItem.title || ""} ${lostItem.description || ""}`,
    `${foundItem.title || ""} ${foundItem.description || ""}`
  );

  const locationSimilarity = calculateTextSimilarity(
    lostItem.location,
    foundItem.location
  );

  const dateScore = calculateDateMatchScore(
    lostItem.lost_date,
    foundItem.found_date
  );

  let score = 0;
  score += categoryMatched ? 35 : 0;
  score += Math.round(titleSimilarity * 25);
  score += Math.round(descriptionSimilarity * 15);
  score += Math.round(locationSimilarity * 15);
  score += Math.round(dateScore * 10);

  score = Math.min(100, score);

  const reasons = [];
  if (categoryMatched) reasons.push("หมวดหมู่ตรงกัน");
  if (titleSimilarity >= 0.25) reasons.push("ชื่อรายการมีคำใกล้เคียงกัน");
  if (descriptionSimilarity >= 0.2) reasons.push("รายละเอียดมีคำใกล้เคียงกัน");
  if (locationSimilarity >= 0.25) reasons.push("สถานที่ใกล้เคียงกัน");
  if (dateScore >= 0.65) reasons.push("วันที่หายและวันที่พบอยู่ใกล้กัน");

  return {
    lostItem,
    foundItem,
    score,
    reasons,
  };
}


// ========================================
// USER PROFILE
// ========================================

app.get(
  "/api/profile",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(req.user.userId);

      const [users] = await pool.query(
        `SELECT id, role_id, name, email, phone, profile_image, status, created_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }

      const [lostRows] = await pool.query(
        "SELECT COUNT(*) AS total FROM lost_items WHERE user_id = ?",
        [userId]
      );
      const [foundRows] = await pool.query(
        "SELECT COUNT(*) AS total FROM found_items WHERE user_id = ?",
        [userId]
      );
      const [claimRows] = await pool.query(
        "SELECT COUNT(*) AS total FROM claims WHERE user_id = ?",
        [userId]
      );
      const [returnRows] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM returns r
         INNER JOIN claims c ON c.id = r.claim_id
         WHERE c.user_id = ?
           AND r.status = 'completed'
           AND r.user_confirmed = 1`,
        [userId]
      );

      const profile = users[0];

      return res.json({
        profile: {
          id: profile.id,
          roleId: profile.role_id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || "",
          profileImage: profile.profile_image || "",
          status: profile.status,
          createdAt: profile.created_at,
        },
        stats: {
          lostItems: Number(lostRows[0]?.total || 0),
          foundItems: Number(foundRows[0]?.total || 0),
          claims: Number(claimRows[0]?.total || 0),
          completedReturns: Number(returnRows[0]?.total || 0),
        },
      });
    } catch (error) {
      console.error("Get Profile Error:", error);
      return res.status(500).json({ message: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้" });
    }
  }
);

app.patch(
  "/api/profile",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(req.user.userId);
      const name = String(req.body.name || "").trim();
      const phone = String(req.body.phone || "").trim();

      if (!name) {
        return res.status(400).json({ message: "กรุณากรอกชื่อ" });
      }

      if (name.length > 100) {
        return res.status(400).json({ message: "ชื่อต้องไม่เกิน 100 ตัวอักษร" });
      }

      if (phone.length > 30) {
        return res.status(400).json({ message: "เบอร์โทรต้องไม่เกิน 30 ตัวอักษร" });
      }

      await pool.query(
        `UPDATE users
         SET name = ?, phone = ?
         WHERE id = ?`,
        [name, phone || null, userId]
      );

      const [users] = await pool.query(
        `SELECT id, role_id, name, email, phone, profile_image
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
      );

      const updated = users[0];

      return res.json({
        success: true,
        message: "บันทึกโปรไฟล์เรียบร้อยแล้ว",
        user: {
          id: updated.id,
          roleId: updated.role_id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone || "",
          profileImage: updated.profile_image || "",
        },
      });
    } catch (error) {
      console.error("Update Profile Error:", error);
      return res.status(500).json({ message: "ไม่สามารถบันทึกโปรไฟล์ได้" });
    }
  }
);

app.post(
  "/api/profile/image",
  authenticateToken,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const userId = Number(req.user.userId);

      if (!req.file) {
        return res.status(400).json({ message: "กรุณาเลือกรูปโปรไฟล์" });
      }

      const profileImage = `/image/${req.file.filename}`;

      const [oldRows] = await pool.query(
        "SELECT profile_image FROM users WHERE id = ? LIMIT 1",
        [userId]
      );

      await pool.query(
        "UPDATE users SET profile_image = ? WHERE id = ?",
        [profileImage, userId]
      );

      const oldImage = oldRows[0]?.profile_image;
      if (oldImage && oldImage.startsWith("/image/")) {
        const oldFilename = path.basename(oldImage);
        const oldPath = path.join(imageFolder, oldFilename);

        if (
          oldFilename !== req.file.filename &&
          fs.existsSync(oldPath)
        ) {
          try {
            fs.unlinkSync(oldPath);
          } catch (unlinkError) {
            console.warn("Delete Old Profile Image Error:", unlinkError);
          }
        }
      }

      return res.json({
        success: true,
        message: "เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว",
        profileImage,
      });
    } catch (error) {
      console.error("Upload Profile Image Error:", error);
      return res.status(500).json({ message: "ไม่สามารถอัปโหลดรูปโปรไฟล์ได้" });
    }
  }
);

// ========================================
// ADMIN DASHBOARD
// ========================================

app.get(
  "/api/admin/dashboard",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [
        [userRows],
        [lostRows],
        [foundRows],
        [returnRows],
        [pendingLostRows],
        [pendingFoundRows],
        [pendingClaimRows],
        [categoryRows],
        [trendRows],
        [accountStatusRows],
      ] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS total
           FROM users
           WHERE role_id = 1`
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM lost_items`
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM found_items`
        ),
        pool.query(
          `SELECT
             COUNT(*) AS total_returns,
             SUM(CASE
                   WHEN status = 'scheduled'
                   THEN 1 ELSE 0
                 END) AS scheduled_returns,
             SUM(CASE
                   WHEN status = 'completed' AND user_confirmed = 1
                   THEN 1 ELSE 0
                 END) AS completed_returns,
             SUM(CASE
                   WHEN status = 'cancelled'
                   THEN 1 ELSE 0
                 END) AS cancelled_returns
           FROM returns`
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM lost_items
           WHERE status = 'pending'`
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM found_items
           WHERE status = 'pending'`
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM claims
           WHERE status = 'pending'`
        ),
        pool.query(
          `SELECT
             c.id,
             c.name,
             COUNT(x.id) AS total
           FROM categories c
           LEFT JOIN (
             SELECT id, category_id FROM lost_items
             UNION ALL
             SELECT id, category_id FROM found_items
           ) x ON x.category_id = c.id
           GROUP BY c.id, c.name
           ORDER BY total DESC, c.name ASC
           LIMIT 5`
        ),
        pool.query(
          `SELECT
             DATE_FORMAT(created_at, '%Y-%m') AS month_key,
             SUM(lost_count) AS lost_count,
             SUM(found_count) AS found_count
           FROM (
             SELECT created_at, 1 AS lost_count, 0 AS found_count
             FROM lost_items
             WHERE created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)

             UNION ALL

             SELECT created_at, 0 AS lost_count, 1 AS found_count
             FROM found_items
             WHERE created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
           ) monthly_items
           GROUP BY DATE_FORMAT(created_at, '%Y-%m')
           ORDER BY month_key ASC`
        ),
        pool.query(
          `SELECT
             SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_accounts,
             SUM(CASE WHEN status <> 'active' THEN 1 ELSE 0 END) AS restricted_accounts
           FROM users`
        ),
      ]);

      const totalReturns = Number(returnRows[0]?.total_returns || 0);
      const scheduledReturns = Number(returnRows[0]?.scheduled_returns || 0);
      const completedReturns = Number(returnRows[0]?.completed_returns || 0);
      const cancelledReturns = Number(returnRows[0]?.cancelled_returns || 0);
      const returnRateBase = Math.max(totalReturns - cancelledReturns, 0);
      const pendingLost = Number(pendingLostRows[0]?.total || 0);
      const pendingFound = Number(pendingFoundRows[0]?.total || 0);
      const pendingClaims = Number(pendingClaimRows[0]?.total || 0);

      return res.json({
        stats: {
          users: Number(userRows[0]?.total || 0),
          lostItems: Number(lostRows[0]?.total || 0),
          foundItems: Number(foundRows[0]?.total || 0),
          completedReturns,
          totalReturns,
          scheduledReturns,
          cancelledReturns,
          returnRateBase,
          pendingReviews: pendingLost + pendingFound,
          pendingClaims,
          returnRate:
            returnRateBase > 0
              ? Math.round((completedReturns / returnRateBase) * 100)
              : 0,
        },
        pending: {
          lostItems: pendingLost,
          foundItems: pendingFound,
          claims: pendingClaims,
          total: pendingLost + pendingFound + pendingClaims,
        },
        topCategories: categoryRows.map((row) => ({
          id: row.id,
          name: row.name,
          total: Number(row.total || 0),
        })),
        trend: trendRows.map((row) => ({
          month: row.month_key,
          lostItems: Number(row.lost_count || 0),
          foundItems: Number(row.found_count || 0),
        })),
        security: {
          activeAccounts: Number(accountStatusRows[0]?.active_accounts || 0),
          restrictedAccounts: Number(accountStatusRows[0]?.restricted_accounts || 0),
          database: "connected",
        },
      });
    } catch (error) {
      console.error("Admin Dashboard Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถโหลดข้อมูล Admin Dashboard ได้",
      });
    }
  }
);

// ========================================
// ADMIN - USER MANAGEMENT
// ========================================

function parseMysqlEnumValues(typeValue) {
  const match = String(typeValue || "").match(/^enum\((.*)\)$/i);
  if (!match) return [];

  return match[1]
    .split(",")
    .map((value) =>
      value
        .trim()
        .replace(/^'/, "")
        .replace(/'$/, "")
        .replace(/''/g, "'")
    )
    .filter(Boolean);
}

app.get(
  "/api/admin/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const search = String(req.query.search || "").trim();
      const status = String(req.query.status || "").trim();

      const [statusColumns] = await pool.query(
        "SHOW COLUMNS FROM users LIKE 'status'"
      );

      const statusOptions = parseMysqlEnumValues(statusColumns[0]?.Type);

      const where = ["u.role_id = 1"];
      const params = [];

      if (search) {
        where.push(
          "(u.name LIKE ? OR u.email LIKE ? OR COALESCE(u.phone, '') LIKE ?)"
        );
        const keyword = `%${search}%`;
        params.push(keyword, keyword, keyword);
      }

      if (status && statusOptions.includes(status)) {
        where.push("u.status = ?");
        params.push(status);
      }

      const [rows] = await pool.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           u.phone,
           u.profile_image,
           u.status,
           u.created_at,
           (SELECT COUNT(*) FROM lost_items li WHERE li.user_id = u.id) AS lost_count,
           (SELECT COUNT(*) FROM found_items fi WHERE fi.user_id = u.id) AS found_count,
           (SELECT COUNT(*) FROM claims c WHERE c.user_id = u.id) AS claim_count
         FROM users u
         WHERE ${where.join(" AND ")}
         ORDER BY u.created_at DESC, u.id DESC`,
        params
      );

      return res.json({
        users: rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone || "",
          profileImage: row.profile_image || "",
          status: row.status,
          createdAt: row.created_at,
          stats: {
            lostItems: Number(row.lost_count || 0),
            foundItems: Number(row.found_count || 0),
            claims: Number(row.claim_count || 0),
          },
        })),
        statusOptions,
      });
    } catch (error) {
      console.error("Admin Get Users Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้",
      });
    }
  }
);

app.patch(
  "/api/admin/users/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const connection = await pool.getConnection();

    try {
      const userId = Number(req.params.id);
      const nextStatus = String(req.body.status || "").trim();

      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
          message: "รหัสผู้ใช้งานไม่ถูกต้อง",
        });
      }

      const [statusColumns] = await connection.query(
        "SHOW COLUMNS FROM users LIKE 'status'"
      );

      const statusOptions = parseMysqlEnumValues(statusColumns[0]?.Type);

      if (!statusOptions.includes(nextStatus)) {
        return res.status(400).json({
          message: "สถานะบัญชีไม่ถูกต้อง",
        });
      }

      await connection.beginTransaction();

      const [users] = await connection.query(
        `SELECT id, name, email, status
         FROM users
         WHERE id = ? AND role_id = 1
         LIMIT 1
         FOR UPDATE`,
        [userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          message: "ไม่พบผู้ใช้งาน",
        });
      }

      const currentUser = users[0];

      await connection.query(
        `UPDATE users
         SET status = ?
         WHERE id = ? AND role_id = 1`,
        [nextStatus, userId]
      );

      await createActivityLog(connection, {
        userId: Number(req.user.userId),
        action: "admin_user_status_updated",
        targetType: "user",
        targetId: userId,
        description:
          `Admin เปลี่ยนสถานะผู้ใช้ ${currentUser.name} (${currentUser.email}) ` +
          `จาก ${currentUser.status} เป็น ${nextStatus}`,
      });

      await connection.commit();

      return res.json({
        success: true,
        message: "อัปเดตสถานะผู้ใช้งานเรียบร้อยแล้ว",
        user: {
          id: userId,
          status: nextStatus,
        },
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (_) {}

      console.error("Admin Update User Status Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถอัปเดตสถานะผู้ใช้งานได้",
      });
    } finally {
      connection.release();
    }
  }
);

// ========================================
// ADMIN - STAFF MANAGEMENT
// ========================================

app.get(
  "/api/admin/staff",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const search = String(req.query.search || "").trim();
      const status = String(req.query.status || "").trim();

      const [statusColumns] = await pool.query(
        "SHOW COLUMNS FROM users LIKE 'status'"
      );

      const statusOptions = parseMysqlEnumValues(statusColumns[0]?.Type);

      const where = ["u.role_id = 2"];
      const params = [];

      if (search) {
        where.push(
          "(u.name LIKE ? OR u.email LIKE ? OR COALESCE(u.phone, '') LIKE ?)"
        );
        const keyword = `%${search}%`;
        params.push(keyword, keyword, keyword);
      }

      if (status && statusOptions.includes(status)) {
        where.push("u.status = ?");
        params.push(status);
      }

      const [rows] = await pool.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           u.phone,
           u.profile_image,
           u.status,
           u.created_at
         FROM users u
         WHERE ${where.join(" AND ")}
         ORDER BY u.created_at DESC, u.id DESC`,
        params
      );

      const staffIds = rows.map((row) => Number(row.id));
      const activityCountMap = new Map();

      if (staffIds.length > 0) {
        try {
          const schema = await getActivityLogSchema();

          if (schema && schema.actorColumn) {
            const placeholders = staffIds.map(() => "?").join(", ");

            const [activityRows] = await pool.query(
              `SELECT ${schema.actorColumn} AS actor_id, COUNT(*) AS total
               FROM activity_logs
               WHERE ${schema.actorColumn} IN (${placeholders})
               GROUP BY ${schema.actorColumn}`,
              staffIds
            );

            for (const row of activityRows) {
              activityCountMap.set(
                Number(row.actor_id),
                Number(row.total || 0)
              );
            }
          }
        } catch (activityError) {
          console.error(
            "Admin Staff Activity Count Error:",
            activityError
          );
        }
      }

      return res.json({
        staff: rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone || "",
          profileImage: row.profile_image || "",
          status: row.status,
          createdAt: row.created_at,
          activityCount: activityCountMap.get(Number(row.id)) || 0,
        })),
        statusOptions,
      });
    } catch (error) {
      console.error("Admin Get Staff Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถโหลดข้อมูลเจ้าหน้าที่ได้",
      });
    }
  }
);

app.patch(
  "/api/admin/staff/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const connection = await pool.getConnection();

    try {
      const staffId = Number(req.params.id);
      const nextStatus = String(req.body.status || "").trim();

      if (!Number.isInteger(staffId) || staffId <= 0) {
        return res.status(400).json({
          message: "รหัสเจ้าหน้าที่ไม่ถูกต้อง",
        });
      }

      const [statusColumns] = await connection.query(
        "SHOW COLUMNS FROM users LIKE 'status'"
      );

      const statusOptions = parseMysqlEnumValues(statusColumns[0]?.Type);

      if (!statusOptions.includes(nextStatus)) {
        return res.status(400).json({
          message: "สถานะบัญชีไม่ถูกต้อง",
        });
      }

      await connection.beginTransaction();

      const [staffRows] = await connection.query(
        `SELECT id, name, email, status
         FROM users
         WHERE id = ? AND role_id = 2
         LIMIT 1
         FOR UPDATE`,
        [staffId]
      );

      if (staffRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          message: "ไม่พบเจ้าหน้าที่",
        });
      }

      const currentStaff = staffRows[0];

      await connection.query(
        `UPDATE users
         SET status = ?
         WHERE id = ? AND role_id = 2`,
        [nextStatus, staffId]
      );

      await createActivityLog(connection, {
        userId: Number(req.user.userId),
        action: "admin_staff_status_updated",
        targetType: "staff",
        targetId: staffId,
        description:
          `Admin เปลี่ยนสถานะเจ้าหน้าที่ ${currentStaff.name} (${currentStaff.email}) ` +
          `จาก ${currentStaff.status} เป็น ${nextStatus}`,
      });

      await connection.commit();

      return res.json({
        success: true,
        message: "อัปเดตสถานะเจ้าหน้าที่เรียบร้อยแล้ว",
        staff: {
          id: staffId,
          status: nextStatus,
        },
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (_) {}

      console.error("Admin Update Staff Status Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถอัปเดตสถานะเจ้าหน้าที่ได้",
      });
    } finally {
      connection.release();
    }
  }
);

// ========================================
// ADMIN - ROLES & PERMISSIONS OVERVIEW
// ========================================

app.get(
  "/api/admin/roles",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [roleRows] = await pool.query(
        `SELECT
           r.id,
           r.name,
           COUNT(u.id) AS user_count
         FROM roles r
         LEFT JOIN users u ON u.role_id = r.id
         GROUP BY r.id, r.name
         ORDER BY r.id ASC`
      );

      return res.json({
        roles: roleRows.map((role) => ({
          id: Number(role.id),
          name: role.name,
          userCount: Number(role.user_count || 0),
        })),
      });
    } catch (error) {
      console.error("Admin Roles Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถโหลดข้อมูลบทบาทได้",
      });
    }
  }
);

// ========================================
// ADMIN - CATEGORY MANAGEMENT
// ========================================

app.get(
  "/api/admin/categories",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           c.id,
           c.name,
           (SELECT COUNT(*) FROM lost_items li WHERE li.category_id = c.id) AS lost_count,
           (SELECT COUNT(*) FROM found_items fi WHERE fi.category_id = c.id) AS found_count
         FROM categories c
         ORDER BY c.name ASC`
      );

      return res.json({
        categories: rows.map((row) => ({
          id: Number(row.id),
          name: row.name,
          lostCount: Number(row.lost_count || 0),
          foundCount: Number(row.found_count || 0),
          totalUsage:
            Number(row.lost_count || 0) + Number(row.found_count || 0),
        })),
      });
    } catch (error) {
      console.error("Admin Categories Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถโหลดหมวดหมู่ได้",
      });
    }
  }
);

app.post(
  "/api/admin/categories",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const connection = await pool.getConnection();

    try {
      const name = String(req.body.name || "").trim();

      if (!name) {
        return res.status(400).json({
          message: "กรุณากรอกชื่อหมวดหมู่",
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          message: "ชื่อหมวดหมู่ยาวเกินไป",
        });
      }

      const [duplicates] = await connection.query(
        `SELECT id
         FROM categories
         WHERE LOWER(TRIM(name)) = LOWER(?)
         LIMIT 1`,
        [name]
      );

      if (duplicates.length > 0) {
        return res.status(409).json({
          message: "มีหมวดหมู่นี้อยู่แล้ว",
        });
      }

      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO categories (name)
         VALUES (?)`,
        [name]
      );

      await createActivityLog(connection, {
        userId: Number(req.user.userId),
        action: "admin_category_created",
        targetType: "category",
        targetId: Number(result.insertId),
        description: `Admin เพิ่มหมวดหมู่ "${name}"`,
      });

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: "เพิ่มหมวดหมู่เรียบร้อยแล้ว",
        category: {
          id: Number(result.insertId),
          name,
        },
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (_) {}

      console.error("Admin Create Category Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถเพิ่มหมวดหมู่ได้",
      });
    } finally {
      connection.release();
    }
  }
);

app.patch(
  "/api/admin/categories/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const connection = await pool.getConnection();

    try {
      const categoryId = Number(req.params.id);
      const name = String(req.body.name || "").trim();

      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return res.status(400).json({
          message: "รหัสหมวดหมู่ไม่ถูกต้อง",
        });
      }

      if (!name) {
        return res.status(400).json({
          message: "กรุณากรอกชื่อหมวดหมู่",
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          message: "ชื่อหมวดหมู่ยาวเกินไป",
        });
      }

      const [categories] = await connection.query(
        `SELECT id, name
         FROM categories
         WHERE id = ?
         LIMIT 1`,
        [categoryId]
      );

      if (categories.length === 0) {
        return res.status(404).json({
          message: "ไม่พบหมวดหมู่",
        });
      }

      const [duplicates] = await connection.query(
        `SELECT id
         FROM categories
         WHERE LOWER(TRIM(name)) = LOWER(?)
           AND id <> ?
         LIMIT 1`,
        [name, categoryId]
      );

      if (duplicates.length > 0) {
        return res.status(409).json({
          message: "มีหมวดหมู่นี้อยู่แล้ว",
        });
      }

      const oldName = categories[0].name;

      await connection.beginTransaction();

      await connection.query(
        `UPDATE categories
         SET name = ?
         WHERE id = ?`,
        [name, categoryId]
      );

      await createActivityLog(connection, {
        userId: Number(req.user.userId),
        action: "admin_category_updated",
        targetType: "category",
        targetId: categoryId,
        description: `Admin เปลี่ยนชื่อหมวดหมู่จาก "${oldName}" เป็น "${name}"`,
      });

      await connection.commit();

      return res.json({
        success: true,
        message: "แก้ไขหมวดหมู่เรียบร้อยแล้ว",
        category: {
          id: categoryId,
          name,
        },
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (_) {}

      console.error("Admin Update Category Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถแก้ไขหมวดหมู่ได้",
      });
    } finally {
      connection.release();
    }
  }
);

app.delete(
  "/api/admin/categories/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const connection = await pool.getConnection();

    try {
      const categoryId = Number(req.params.id);

      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return res.status(400).json({
          message: "รหัสหมวดหมู่ไม่ถูกต้อง",
        });
      }

      await connection.beginTransaction();

      const [categories] = await connection.query(
        `SELECT id, name
         FROM categories
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [categoryId]
      );

      if (categories.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          message: "ไม่พบหมวดหมู่",
        });
      }

      const [usageRows] = await connection.query(
        `SELECT
           (SELECT COUNT(*) FROM lost_items WHERE category_id = ?) AS lost_count,
           (SELECT COUNT(*) FROM found_items WHERE category_id = ?) AS found_count`,
        [categoryId, categoryId]
      );

      const lostCount = Number(usageRows[0]?.lost_count || 0);
      const foundCount = Number(usageRows[0]?.found_count || 0);

      if (lostCount > 0 || foundCount > 0) {
        await connection.rollback();
        return res.status(409).json({
          message:
            `ลบไม่ได้ เพราะหมวดหมู่นี้ถูกใช้อยู่ ${lostCount + foundCount} รายการ ` +
            `(ของหาย ${lostCount}, ของที่พบ ${foundCount})`,
        });
      }

      const categoryName = categories[0].name;

      await connection.query(
        `DELETE FROM categories
         WHERE id = ?`,
        [categoryId]
      );

      await createActivityLog(connection, {
        userId: Number(req.user.userId),
        action: "admin_category_deleted",
        targetType: "category",
        targetId: categoryId,
        description: `Admin ลบหมวดหมู่ "${categoryName}"`,
      });

      await connection.commit();

      return res.json({
        success: true,
        message: "ลบหมวดหมู่เรียบร้อยแล้ว",
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (_) {}

      console.error("Admin Delete Category Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถลบหมวดหมู่ได้",
      });
    } finally {
      connection.release();
    }
  }
);

// ========================================
// ADMIN - POST REVIEW
// ========================================

app.get("/api/admin/posts", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const type = String(req.query.type || "all").trim();
    const status = String(req.query.status || "all").trim();
    const search = String(req.query.search || "").trim();

    if (!["all", "lost", "found"].includes(type)) {
      return res.status(400).json({ message: "ประเภทรายการไม่ถูกต้อง" });
    }

    const lostStatuses = ["pending", "approved", "rejected", "found", "returned"];
    const foundStatuses = ["pending", "approved", "rejected", "returned"];
    const params = [];
    const parts = [];

    if (type === "all" || type === "lost") {
      const where = [];
      if (status !== "all") {
        if (lostStatuses.includes(status)) {
          where.push("li.status = ?");
          params.push(status);
        } else {
          where.push("1 = 0");
        }
      }
      if (search) {
        const keyword = `%${search}%`;
        where.push("(li.title LIKE ? OR COALESCE(li.location,'') LIKE ? OR COALESCE(u.name,'') LIKE ? OR COALESCE(u.email,'') LIKE ?)");
        params.push(keyword, keyword, keyword, keyword);
      }
      parts.push(`SELECT li.id, 'lost' AS item_type, li.title, li.description,
        li.location, li.lost_date AS item_date, li.lost_time AS item_time,
        li.image, li.status, li.staff_note, li.approved_by, li.approved_at,
        li.created_at, u.id AS owner_id, u.name AS owner_name,
        u.email AS owner_email, c.name AS category_name,
        reviewer.name AS reviewer_name
        FROM lost_items li
        LEFT JOIN users u ON u.id = li.user_id
        LEFT JOIN categories c ON c.id = li.category_id
        LEFT JOIN users reviewer ON reviewer.id = li.approved_by
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`);
    }

    if (type === "all" || type === "found") {
      const where = [];
      if (status !== "all") {
        if (foundStatuses.includes(status)) {
          where.push("fi.status = ?");
          params.push(status);
        } else {
          where.push("1 = 0");
        }
      }
      if (search) {
        const keyword = `%${search}%`;
        where.push("(fi.title LIKE ? OR COALESCE(fi.location,'') LIKE ? OR COALESCE(u.name,'') LIKE ? OR COALESCE(u.email,'') LIKE ?)");
        params.push(keyword, keyword, keyword, keyword);
      }
      parts.push(`SELECT fi.id, 'found' AS item_type, fi.title, fi.description,
        fi.location, fi.found_date AS item_date, fi.found_time AS item_time,
        fi.image, fi.status, fi.staff_note, fi.approved_by, fi.approved_at,
        fi.created_at, u.id AS owner_id, u.name AS owner_name,
        u.email AS owner_email, c.name AS category_name,
        reviewer.name AS reviewer_name
        FROM found_items fi
        LEFT JOIN users u ON u.id = fi.user_id
        LEFT JOIN categories c ON c.id = fi.category_id
        LEFT JOIN users reviewer ON reviewer.id = fi.approved_by
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`);
    }

    const [rows] = await pool.query(
      `${parts.join(" UNION ALL ")} ORDER BY created_at DESC, id DESC LIMIT 300`,
      params
    );

    return res.json({
      posts: rows.map((row) => ({
        id: Number(row.id),
        type: row.item_type,
        title: row.title,
        description: row.description || "",
        location: row.location || "",
        itemDate: row.item_date,
        itemTime: row.item_time,
        image: row.image || "",
        status: row.status,
        staffNote: row.staff_note || "",
        approvedAt: row.approved_at,
        createdAt: row.created_at,
        owner: {
          id: row.owner_id ? Number(row.owner_id) : null,
          name: row.owner_name || "ไม่ทราบชื่อ",
          email: row.owner_email || "",
        },
        categoryName: row.category_name || "ไม่ระบุหมวดหมู่",
        reviewerName: row.reviewer_name || "",
      })),
    });
  } catch (error) {
    console.error("Admin Posts Error:", error);
    return res.status(500).json({ message: "ไม่สามารถโหลดรายการโพสต์ได้" });
  }
});

app.patch("/api/admin/posts/:type/:id/review", authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const type = String(req.params.type || "").trim();
    const itemId = Number(req.params.id);
    const action = String(req.body.action || "").trim();
    const staffNote = String(req.body.staffNote || "").trim();

    if (!["lost", "found"].includes(type)) {
      return res.status(400).json({ message: "ประเภทรายการไม่ถูกต้อง" });
    }
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ message: "รหัสรายการไม่ถูกต้อง" });
    }
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "คำสั่งตรวจสอบไม่ถูกต้อง" });
    }
    if (action === "reject" && !staffNote) {
      return res.status(400).json({ message: "กรุณาระบุเหตุผลเมื่อต้องการปฏิเสธโพสต์" });
    }

    const tableName = type === "lost" ? "lost_items" : "found_items";
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, user_id, title, status FROM ${tableName}
       WHERE id = ? LIMIT 1 FOR UPDATE`,
      [itemId]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "ไม่พบรายการ" });
    }
    const item = rows[0];
    if (item.status !== "pending") {
      await connection.rollback();
      return res.status(409).json({ message: "Admin ตรวจสอบได้เฉพาะโพสต์ที่ยังรอตรวจสอบ" });
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    await connection.query(
      `UPDATE ${tableName}
       SET status = ?, staff_note = ?, approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [nextStatus, staffNote || null, Number(req.user.userId), itemId]
    );

    const itemLabel = type === "lost" ? "ของหาย" : "ของที่พบ";
    await createNotification(connection, {
      userId: Number(item.user_id),
      title: action === "approve"
        ? `โพสต์${itemLabel}ได้รับการอนุมัติ`
        : `โพสต์${itemLabel}ไม่ได้รับการอนุมัติ`,
      message: action === "approve"
        ? `รายการ "${item.title}" ผ่านการตรวจสอบแล้ว`
        : `รายการ "${item.title}" ไม่ผ่านการตรวจสอบ: ${staffNote}`,
      type: `${type}_${nextStatus}`,
      relatedId: itemId,
    });

    await createActivityLog(connection, {
      userId: Number(req.user.userId),
      action: `admin_${type}_${nextStatus}`,
      targetType: type,
      targetId: itemId,
      description: `Admin ${action === "approve" ? "อนุมัติ" : "ปฏิเสธ"}โพสต์${itemLabel} "${item.title}"${staffNote ? ` — ${staffNote}` : ""}`,
    });

    await connection.commit();
    return res.json({
      success: true,
      message: action === "approve" ? "อนุมัติโพสต์เรียบร้อยแล้ว" : "ปฏิเสธโพสต์เรียบร้อยแล้ว",
    });
  } catch (error) {
    try { await connection.rollback(); } catch (_) {}
    console.error("Admin Review Post Error:", error);
    return res.status(500).json({ message: "ไม่สามารถตรวจสอบโพสต์ได้" });
  } finally {
    connection.release();
  }
});

// ========================================
// USER - COMPLAINTS
// ========================================

app.get("/api/complaints/my", authenticateToken, requireUser, async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const [rows] = await pool.query(
      `SELECT
         co.id,
         co.subject,
         co.description,
         co.related_lost_item_id,
         co.related_found_item_id,
         co.status,
         co.staff_note,
         co.resolved_at,
         co.created_at,
         li.title AS lost_item_title,
         fi.title AS found_item_title
       FROM complaints co
       LEFT JOIN lost_items li ON li.id = co.related_lost_item_id
       LEFT JOIN found_items fi ON fi.id = co.related_found_item_id
       WHERE co.user_id = ?
       ORDER BY co.created_at DESC, co.id DESC
       LIMIT 100`,
      [userId]
    );

    return res.json({ complaints: rows });
  } catch (error) {
    console.error("My Complaints Error:", error);
    return res.status(500).json({ message: "ไม่สามารถโหลดข้อร้องเรียนของคุณได้" });
  }
});

app.post("/api/complaints", authenticateToken, requireUser, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = Number(req.user.userId);
    const subject = String(req.body.subject || "").trim();
    const description = String(req.body.description || "").trim();
    const relatedType = String(req.body.relatedType || "").trim().toLowerCase();
    const relatedIdRaw = req.body.relatedId;
    const relatedId =
      relatedIdRaw === undefined || relatedIdRaw === null || relatedIdRaw === ""
        ? null
        : Number(relatedIdRaw);

    if (!subject || subject.length > 150) {
      return res.status(400).json({
        message: "กรุณาระบุหัวข้อร้องเรียนไม่เกิน 150 ตัวอักษร",
      });
    }

    if (!description) {
      return res.status(400).json({ message: "กรุณาระบุรายละเอียดการร้องเรียน" });
    }

    if (relatedType && !["lost", "found"].includes(relatedType)) {
      return res.status(400).json({ message: "ประเภทประกาศที่เกี่ยวข้องไม่ถูกต้อง" });
    }

    if (relatedType && (!Number.isInteger(relatedId) || relatedId <= 0)) {
      return res.status(400).json({ message: "รหัสประกาศที่เกี่ยวข้องไม่ถูกต้อง" });
    }

    let relatedLostItemId = null;
    let relatedFoundItemId = null;
    let relatedTitle = "";

    if (relatedType === "lost") {
      const [items] = await connection.query(
        `SELECT id, title FROM lost_items WHERE id = ? LIMIT 1`,
        [relatedId]
      );
      if (!items.length) {
        return res.status(404).json({ message: "ไม่พบประกาศของหายที่ต้องการร้องเรียน" });
      }
      relatedLostItemId = relatedId;
      relatedTitle = items[0].title || "";
    } else if (relatedType === "found") {
      const [items] = await connection.query(
        `SELECT id, title FROM found_items WHERE id = ? LIMIT 1`,
        [relatedId]
      );
      if (!items.length) {
        return res.status(404).json({ message: "ไม่พบประกาศของที่พบที่ต้องการร้องเรียน" });
      }
      relatedFoundItemId = relatedId;
      relatedTitle = items[0].title || "";
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO complaints
       (user_id, subject, description, related_lost_item_id, related_found_item_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, subject, description, relatedLostItemId, relatedFoundItemId]
    );

    const complaintId = Number(result.insertId);

    const [admins] = await connection.query(
      `SELECT id
       FROM users
       WHERE role_id = 3 AND status = 'active'`
    );

    for (const admin of admins) {
      await createNotification(connection, {
        userId: Number(admin.id),
        title: "มีข้อร้องเรียนใหม่",
        message: relatedTitle
          ? `มีข้อร้องเรียนใหม่เกี่ยวกับประกาศ “${relatedTitle}”`
          : `มีข้อร้องเรียนใหม่: ${subject}`,
        type: "complaint_created",
        relatedId: complaintId,
      });
    }

    await connection.commit();

    return res.status(201).json({
      message: "ส่งข้อร้องเรียนเรียบร้อยแล้ว",
      complaint: { id: complaintId },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    console.error("Create Complaint Error:", error);
    return res.status(500).json({ message: "ไม่สามารถส่งข้อร้องเรียนได้" });
  } finally {
    connection.release();
  }
});

// ========================================
// ADMIN - COMPLAINTS
// ========================================

app.get("/api/admin/complaints", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || "all").trim().toLowerCase();
    const search = String(req.query.search || "").trim();

    const [statusColumn] = await pool.query(
      `SHOW COLUMNS FROM complaints LIKE 'status'`
    );
    const statusOptions = statusColumn.length
      ? parseMysqlEnumValues(statusColumn[0].Type)
      : [];

    if (status !== "all" && statusOptions.length && !statusOptions.includes(status)) {
      return res.status(400).json({ message: "สถานะการร้องเรียนไม่ถูกต้อง" });
    }

    const where = [];
    const params = [];

    if (status !== "all") {
      where.push("co.status = ?");
      params.push(status);
    }

    if (search) {
      const keyword = `%${search}%`;
      where.push(`(
        co.subject LIKE ? OR
        co.description LIKE ? OR
        COALESCE(u.name, '') LIKE ? OR
        COALESCE(u.email, '') LIKE ?
      )`);
      params.push(keyword, keyword, keyword, keyword);
    }

    const [rows] = await pool.query(
      `SELECT
         co.id,
         co.user_id,
         co.subject,
         co.description,
         co.related_lost_item_id,
         co.related_found_item_id,
         co.status,
         co.handled_by,
         co.staff_note,
         co.resolved_at,
         co.created_at,
         u.name AS user_name,
         u.email AS user_email,
         handler.name AS handler_name,
         li.title AS lost_item_title,
         fi.title AS found_item_title
       FROM complaints co
       INNER JOIN users u ON u.id = co.user_id
       LEFT JOIN users handler ON handler.id = co.handled_by
       LEFT JOIN lost_items li ON li.id = co.related_lost_item_id
       LEFT JOIN found_items fi ON fi.id = co.related_found_item_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY co.created_at DESC, co.id DESC
       LIMIT 300`,
      params
    );

    return res.json({
      statusOptions,
      complaints: rows.map((row) => ({
        id: Number(row.id),
        subject: row.subject,
        description: row.description,
        status: row.status,
        staffNote: row.staff_note || "",
        resolvedAt: row.resolved_at,
        createdAt: row.created_at,
        user: {
          id: Number(row.user_id),
          name: row.user_name || "ไม่ทราบชื่อ",
          email: row.user_email || "",
        },
        handler: row.handled_by
          ? {
              id: Number(row.handled_by),
              name: row.handler_name || "ไม่ทราบชื่อ",
            }
          : null,
        relatedLostItem: row.related_lost_item_id
          ? {
              id: Number(row.related_lost_item_id),
              title: row.lost_item_title || `รายการ #${row.related_lost_item_id}`,
            }
          : null,
        relatedFoundItem: row.related_found_item_id
          ? {
              id: Number(row.related_found_item_id),
              title: row.found_item_title || `รายการ #${row.related_found_item_id}`,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Admin Complaints Error:", error);
    return res.status(500).json({ message: "ไม่สามารถโหลดรายการร้องเรียนได้" });
  }
});

app.patch("/api/admin/complaints/:id", authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const complaintId = Number(req.params.id);
    const status = String(req.body.status || "").trim().toLowerCase();
    const staffNote = String(req.body.staffNote || "").trim();

    if (!Number.isInteger(complaintId) || complaintId <= 0) {
      return res.status(400).json({ message: "รหัสการร้องเรียนไม่ถูกต้อง" });
    }

    const [statusColumn] = await connection.query(
      `SHOW COLUMNS FROM complaints LIKE 'status'`
    );
    const statusOptions = statusColumn.length
      ? parseMysqlEnumValues(statusColumn[0].Type)
      : [];

    if (!status || (statusOptions.length && !statusOptions.includes(status))) {
      return res.status(400).json({ message: "สถานะการร้องเรียนไม่ถูกต้อง" });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, user_id, subject, status
       FROM complaints
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [complaintId]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "ไม่พบรายการร้องเรียน" });
    }

    const complaint = rows[0];
    const resolvedAt = ["resolved", "rejected"].includes(status);

    await connection.query(
      `UPDATE complaints
       SET status = ?,
           handled_by = ?,
           staff_note = ?,
           resolved_at = ?
       WHERE id = ?`,
      [
        status,
        Number(req.user.userId),
        staffNote || null,
        resolvedAt ? new Date() : null,
        complaintId,
      ]
    );

    await createNotification(connection, {
      userId: Number(complaint.user_id),
      title: "อัปเดตสถานะการร้องเรียน",
      message: `เรื่อง "${complaint.subject}" เปลี่ยนสถานะเป็น ${status}${staffNote ? ` — ${staffNote}` : ""}`,
      type: "complaint_status_updated",
      relatedId: complaintId,
    });

    await createActivityLog(connection, {
      userId: Number(req.user.userId),
      action: "admin_complaint_status_updated",
      targetType: "complaint",
      targetId: complaintId,
      description: `Admin เปลี่ยนสถานะการร้องเรียน "${complaint.subject}" จาก ${complaint.status} เป็น ${status}${staffNote ? ` — ${staffNote}` : ""}`,
    });

    await connection.commit();

    return res.json({
      success: true,
      message: "อัปเดตการร้องเรียนเรียบร้อยแล้ว",
    });
  } catch (error) {
    try { await connection.rollback(); } catch (_) {}
    console.error("Admin Update Complaint Error:", error);
    return res.status(500).json({ message: "ไม่สามารถอัปเดตการร้องเรียนได้" });
  } finally {
    connection.release();
  }
});

// ========================================
// ADMIN - ACTIVITY LOGS
// ========================================

app.get("/api/admin/activity-logs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit);
    const limit =
      Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 200
        ? limitRaw
        : 100;

    const search = String(req.query.search || "").trim().toLowerCase();
    const role = String(req.query.role || "all").trim();

    const columns = await getActivityLogColumns(pool);
    const [logs] = await pool.query(
      `SELECT *
       FROM activity_logs
       ORDER BY ${columns.has("created_at") ? "created_at DESC, " : ""}id DESC
       LIMIT ?`,
      [limit]
    );

    const actorColumn = ["user_id", "staff_id", "actor_id"].find((name) =>
      columns.has(name)
    );

    let actorMap = new Map();

    if (actorColumn) {
      const actorIds = [
        ...new Set(
          logs
            .map((log) => Number(log[actorColumn]))
            .filter((id) => Number.isInteger(id) && id > 0)
        ),
      ];

      if (actorIds.length > 0) {
        const placeholders = actorIds.map(() => "?").join(", ");
        const [users] = await pool.query(
          `SELECT id, name, email, role_id
           FROM users
           WHERE id IN (${placeholders})`,
          actorIds
        );
        actorMap = new Map(users.map((user) => [Number(user.id), user]));
      }
    }

    let activityLogs = logs
      .map((log) => {
        const actorId = actorColumn ? Number(log[actorColumn]) : null;
        const actor = actorId ? actorMap.get(actorId) : null;

        return {
          ...log,
          actor_name: actor?.name || null,
          actor_email: actor?.email || null,
          actor_role_id: actor?.role_id || null,
        };
      })
      .filter((log) => [2, 3].includes(Number(log.actor_role_id)));

    if (role !== "all") {
      const roleId = Number(role);
      if (![2, 3].includes(roleId)) {
        return res.status(400).json({ message: "ตัวกรองบทบาทไม่ถูกต้อง" });
      }
      activityLogs = activityLogs.filter(
        (log) => Number(log.actor_role_id) === roleId
      );
    }

    if (search) {
      activityLogs = activityLogs.filter((log) =>
        Object.values(log).some((value) =>
          String(value ?? "").toLowerCase().includes(search)
        )
      );
    }

    return res.json({ activityLogs });
  } catch (error) {
    console.error("Admin Activity Logs Error:", error);
    return res.status(500).json({
      message: "ไม่สามารถโหลดบันทึกการใช้งานได้",
    });
  }
});

// ========================================
// ADMIN - SYSTEM SETTINGS / INFORMATION
// ========================================

app.get("/api/admin/system-settings", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [tableRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.tables
       WHERE table_schema = DATABASE()`
    );

    const [accountRows] = await pool.query(
      `SELECT
         SUM(CASE WHEN role_id = 1 THEN 1 ELSE 0 END) AS users,
         SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) AS staff,
         SUM(CASE WHEN role_id = 3 THEN 1 ELSE 0 END) AS admins
       FROM users`
    );

    await pool.query("SELECT 1");

    return res.json({
      application: {
        name: "Back2You",
        apiPort: Number(process.env.PORT || 5000),
        frontendUrl: process.env.FRONTEND_URL || null,
        environment: process.env.NODE_ENV || "development",
      },
      database: {
        connected: true,
        name: process.env.DB_NAME || null,
        host: process.env.DB_HOST || null,
        port: Number(process.env.DB_PORT || 3306),
        tableCount: Number(tableRows[0]?.total || 0),
      },
      security: {
        jwtConfigured: Boolean(process.env.JWT_SECRET),
        emailConfigured: Boolean(process.env.RESEND_API_KEY),
        passwordStorage: "bcrypt",
        adminRouteProtection: true,
      },
      accounts: {
        users: Number(accountRows[0]?.users || 0),
        staff: Number(accountRows[0]?.staff || 0),
        admins: Number(accountRows[0]?.admins || 0),
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin System Settings Error:", error);
    return res.status(500).json({ message: "ไม่สามารถโหลดข้อมูลการตั้งค่าระบบได้" });
  }
});

// ========================================
// ROOT
// ========================================

app.get(
  "/",
  (req, res) => {
    res.json({
      message:
        "Back2You Backend API",
    });
  }
);

// ========================================
// TEST DATABASE
// ========================================

app.get(
  "/api/test-db",
  async (
    req,
    res
  ) => {
    try {
      const [rows] =
        await pool.query(
          "SELECT 1 AS connected"
        );

      res.json({
        success: true,
        message:
          "MySQL connected",
        result: rows[0],
      });
    } catch (error) {
      console.error(
        "Database Error:",
        error
      );

      res
        .status(500)
        .json({
          success: false,
          message:
            "Database connection failed",
        });
    }
  }
);

// ========================================
// AUTH RATE LIMIT (single-server protection)
// ========================================

const authRateBuckets = new Map();

function authRateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 20;
  const key = String(req.ip || req.socket?.remoteAddress || "unknown");

  // เก็บ limiter แบบ in-memory ให้มีขอบเขต ไม่ปล่อย Map โตไม่จำกัด
  if (authRateBuckets.size > 10000) {
    for (const [bucketKey, bucket] of authRateBuckets) {
      if (bucket.resetAt <= now) authRateBuckets.delete(bucketKey);
    }

    if (authRateBuckets.size > 10000) {
      authRateBuckets.clear();
    }
  }

  const current = authRateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    authRateBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return next();
  }

  current.count += 1;

  if (current.count > maxAttempts) {
    res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({
      message: "มีการร้องขอเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ภายหลัง",
    });
  }

  next();
}

// ========================================
// REGISTER - EMAIL + PASSWORD
// ========================================

app.post(
  "/api/auth/register",
  authRateLimit,
  async (req, res) => {
    try {
      const name = String(req.body.name || "").trim();
      const email = normalizeEmail(req.body.email);
      const password = String(req.body.password || "");

      if (!name || !email || !password) {
        return res.status(400).json({
          message: "กรุณากรอกชื่อ อีเมล และรหัสผ่าน",
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          message: "ชื่อต้องไม่เกิน 100 ตัวอักษร",
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          message: "รูปแบบอีเมลไม่ถูกต้อง",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
        });
      }

      if (password.length > 72) {
        return res.status(400).json({
          message: "รหัสผ่านต้องไม่เกิน 72 ตัวอักษร",
        });
      }

      const [existingUsers] = await pool.query(
        `SELECT id
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          message: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [result] = await pool.query(
        `INSERT INTO users
         (role_id, name, email, password, status)
         VALUES (1, ?, ?, ?, 'active')`,
        [name, email, passwordHash]
      );

      return res.status(201).json({
        success: true,
        message: "สมัครสมาชิกสำเร็จ",
        user: {
          id: result.insertId,
          roleId: 1,
          name,
          email,
        },
      });
    } catch (error) {
      console.error("Register Error:", error);

      return res.status(500).json({
        message: "ไม่สามารถสมัครสมาชิกได้",
      });
    }
  }
);

// ========================================
// LOGIN - EMAIL + PASSWORD
// ========================================

app.post(
  "/api/auth/login",
  authRateLimit,
  async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      const password = String(req.body.password || "");

      if (!email || !password) {
        return res.status(400).json({
          message: "กรุณากรอกอีเมลและรหัสผ่าน",
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          message: "รูปแบบอีเมลไม่ถูกต้อง",
        });
      }

      const [rows] = await pool.query(
        `SELECT id, role_id, name, email, password, status
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          code: "ACCOUNT_NOT_FOUND",
          message: "ไม่พบบัญชีอีเมลนี้ กรุณาสมัครสมาชิกก่อน",
        });
      }

      const currentUser = rows[0];

      if (currentUser.status !== "active") {
        return res.status(403).json({
          message: "บัญชีนี้ถูกระงับการใช้งาน",
        });
      }

      const storedPassword = String(currentUser.password || "");
      const isBcryptHash =
        /^\$2[aby]\$\d{2}\$/.test(storedPassword);

      // บัญชีเก่าจากระบบ Magic Link ไม่มีรหัสผ่านที่ผู้ใช้รู้
      if (!isBcryptHash) {
        return res.status(409).json({
          code: "PASSWORD_NOT_SET",
          message:
            "บัญชีนี้สร้างจากระบบเข้าสู่ระบบแบบเดิมและยังไม่ได้ตั้งรหัสผ่าน กรุณาใช้บัญชีที่สมัครใหม่สำหรับระบบรหัสผ่าน",
        });
      }

      const passwordMatched = await bcrypt.compare(
        password,
        storedPassword
      );

      if (!passwordMatched) {
        return res.status(401).json({
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        });
      }

      const token = jwt.sign(
        {
          userId: currentUser.id,
          roleId: currentUser.role_id,
          email: currentUser.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        token,
        user: {
          id: currentUser.id,
          roleId: currentUser.role_id,
          name: currentUser.name,
          email: currentUser.email,
        },
      });
    } catch (error) {
      console.error("Login Error:", error);

      return res.status(500).json({
        message: "ไม่สามารถเข้าสู่ระบบได้",
      });
    }
  }
);

// ========================================
// REQUEST MAGIC LINK
// ========================================

app.post(
  "/api/auth/request-magic-link",
  authRateLimit,
  async (
    req,
    res
  ) => {
    try {
      const email =
        normalizeEmail(
          req.body.email
        );

      if (!email) {
        return res
          .status(400)
          .json({
            message:
              "กรุณากรอกอีเมล",
          });
      }

      if (
        !isValidEmail(email)
      ) {
        return res
          .status(400)
          .json({
            message:
              "รูปแบบอีเมลไม่ถูกต้อง",
          });
      }

      const [users] =
        await pool.query(
          `
          SELECT
            id,
            role_id,
            name,
            email,
            status
          FROM users
          WHERE email = ?
          LIMIT 1
          `,
          [email]
        );

      if (
        users.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "ไม่พบบัญชีผู้ใช้นี้",
          });
      }

      const user =
        users[0];

      if (
        user.status !==
        "active"
      ) {
        return res
          .status(403)
          .json({
            message:
              "บัญชีนี้ถูกระงับการใช้งาน",
          });
      }

      const magicToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      const magicTokenHash =
        hashLoginToken(
          magicToken
        );

      const expiresAt =
        new Date(
          Date.now() +
            15 *
              60 *
              1000
        );

      // ลบ Token เก่าของ User
      await pool.query(
        `
        DELETE FROM login_tokens
        WHERE user_id = ?
        `,
        [user.id]
      );

      // สร้าง Token ใหม่
      await pool.query(
        `
        INSERT INTO login_tokens
        (
          user_id,
          token,
          expires_at
        )
        VALUES (?, ?, ?)
        `,
        [
          user.id,
          magicTokenHash,
          expiresAt,
        ]
      );

      const magicLink =
        `${FRONTEND_URL}/?token=${magicToken}`;

      // ====================================
      // SEND EMAIL
      // ====================================

      const emailResult =
        await resend.emails.send(
          {
            from:
              "Back2You <onboarding@resend.dev>",

            to: [email],

            subject:
              "เข้าสู่ระบบ Back2You",

            html: `
              <div
                style="
                  font-family: Arial, sans-serif;
                  max-width: 560px;
                  margin: 0 auto;
                  padding: 30px;
                  color: #334155;
                "
              >
                <div
                  style="
                    background: #5b9bea;
                    padding: 22px;
                    border-radius: 18px 18px 0 0;
                    color: white;
                    text-align: center;
                  "
                >
                  <h1
                    style="
                      margin: 0;
                      font-size: 26px;
                    "
                  >
                    Back2You
                  </h1>
                </div>

                <div
                  style="
                    background: #f7fbff;
                    padding: 28px;
                    border-radius: 0 0 18px 18px;
                    text-align: center;
                  "
                >
                  <h2>
                    เข้าสู่ระบบ Back2You
                  </h2>

                  <p>
                    สวัสดี ${escapeHtml(user.name)}
                  </p>

                  <p
                    style="
                      color: #64748b;
                      line-height: 1.7;
                    "
                  >
                    กดปุ่มด้านล่างเพื่อเข้าสู่ระบบ
                    ลิงก์นี้ใช้ได้ครั้งเดียวและมีอายุ 15 นาที
                  </p>

                  <a
                    href="${magicLink}"
                    style="
                      display: inline-block;
                      margin-top: 16px;
                      padding: 13px 25px;
                      background: #5b9bea;
                      color: white;
                      text-decoration: none;
                      border-radius: 12px;
                      font-weight: bold;
                    "
                  >
                    เข้าสู่ระบบ Back2You
                  </a>
                </div>
              </div>
            `,
          }
        );

      if (
        emailResult.error
      ) {
        console.error(
          "[Resend API Error]:",
          {
            status:
              emailResult
                .error
                .statusCode,

            error:
              emailResult.error,

            path:
              "/emails",
          }
        );

        throw emailResult.error;
      }

      res.json({
        success: true,

        message:
          "ส่ง Magic Link แล้ว กรุณาตรวจสอบอีเมล",
      });
    } catch (error) {
      console.error(
        "Resend Error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "ไม่สามารถส่ง Magic Link ได้",
        });
    }
  }
);

// ========================================
// VERIFY MAGIC LINK
// ========================================

app.get(
  "/api/auth/verify-magic-link",
  authRateLimit,
  async (
    req,
    res
  ) => {
    try {
      const token =
        String(
          req.query.token ||
            ""
        ).trim();

      if (!token) {
        return res
          .status(400)
          .json({
            message:
              "ไม่พบ Magic Link Token",
          });
      }

      const tokenHash =
        hashLoginToken(token);

      const [rows] =
        await pool.query(
          `
          SELECT
            lt.id AS login_token_id,
            lt.user_id,
            lt.token,
            lt.expires_at,
            lt.used_at,

            u.role_id,
            u.name,
            u.email,
            u.status

          FROM login_tokens lt

          INNER JOIN users u
            ON u.id = lt.user_id

          WHERE lt.token = ?
             OR lt.token = ?

          LIMIT 1
          `,
          [tokenHash, token]
        );

      if (
        rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Magic Link ไม่ถูกต้อง",
          });
      }

      const data =
        rows[0];

      if (data.used_at) {
        return res
          .status(400)
          .json({
            message:
              "Magic Link นี้ถูกใช้งานแล้ว",
          });
      }

      if (
        new Date(
          data.expires_at
        ).getTime() <
        Date.now()
      ) {
        return res
          .status(400)
          .json({
            message:
              "Magic Link หมดอายุแล้ว กรุณาขอลิงก์ใหม่",
          });
      }

      if (
        data.status !==
        "active"
      ) {
        return res
          .status(403)
          .json({
            message:
              "บัญชีนี้ถูกระงับการใช้งาน",
          });
      }

      // ====================================
      // CREATE JWT
      // ====================================

      const jwtToken =
        jwt.sign(
          {
            userId:
              data.user_id,

            roleId:
              data.role_id,

            email:
              data.email,
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "7d",
          }
        );

      // ====================================
      // MARK MAGIC LINK USED
      // ====================================

      await pool.query(
        `
        UPDATE login_tokens
        SET used_at = NOW()
        WHERE id = ?
        `,
        [
          data.login_token_id,
        ]
      );

      res.json({
        success: true,

        token:
          jwtToken,

        user: {
          id:
            data.user_id,

          roleId:
            data.role_id,

          name:
            data.name,

          email:
            data.email,
        },
      });
    } catch (error) {
      console.error(
        "Verify Magic Link Error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "ไม่สามารถตรวจสอบ Magic Link ได้",
        });
    }
  }
);

// ========================================
// USER NOTIFICATIONS
// ========================================

app.get(
  "/api/notifications",
  authenticateToken,
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, title, message, type, related_id, is_read, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT 50`,
        [req.user.userId]
      );

      const [[countRow]] = await pool.query(
        `SELECT COUNT(*) AS unread_count
         FROM notifications
         WHERE user_id = ? AND is_read = 0`,
        [req.user.userId]
      );

      return res.json({
        notifications: rows,
        unreadCount: Number(countRow.unread_count || 0),
      });
    } catch (error) {
      console.error("Notifications Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถโหลดการแจ้งเตือนได้",
      });
    }
  }
);

app.get(
  "/api/notifications/unread-count",
  authenticateToken,
  async (req, res) => {
    try {
      const [[row]] = await pool.query(
        `SELECT COUNT(*) AS unread_count
         FROM notifications
         WHERE user_id = ? AND is_read = 0`,
        [req.user.userId]
      );

      return res.json({
        unreadCount: Number(row.unread_count || 0),
      });
    } catch (error) {
      console.error("Unread Notification Count Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถโหลดจำนวนการแจ้งเตือนได้",
      });
    }
  }
);

app.patch(
  "/api/notifications/:id/read",
  authenticateToken,
  async (req, res) => {
    try {
      const notificationId = Number(req.params.id);

      if (!Number.isInteger(notificationId) || notificationId <= 0) {
        return res.status(400).json({
          message: "รหัสการแจ้งเตือนไม่ถูกต้อง",
        });
      }

      const [result] = await pool.query(
        `UPDATE notifications
         SET is_read = 1
         WHERE id = ? AND user_id = ?`,
        [notificationId, req.user.userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "ไม่พบการแจ้งเตือน",
        });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Read Notification Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถอัปเดตการแจ้งเตือนได้",
      });
    }
  }
);

app.patch(
  "/api/notifications/read-all",
  authenticateToken,
  async (req, res) => {
    try {
      await pool.query(
        `UPDATE notifications
         SET is_read = 1
         WHERE user_id = ? AND is_read = 0`,
        [req.user.userId]
      );

      return res.json({ success: true });
    } catch (error) {
      console.error("Read All Notifications Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถอัปเดตการแจ้งเตือนได้",
      });
    }
  }
);

// ========================================
// STAFF ITEM MATCHING
// ========================================

app.get(
  "/api/staff/matches",
  authenticateToken,
  requireStaff,
  async (req, res) => {
    try {
      const minimumScoreRaw = Number(req.query.minScore);
      const minimumScore =
        Number.isFinite(minimumScoreRaw) &&
        minimumScoreRaw >= 0 &&
        minimumScoreRaw <= 100
          ? minimumScoreRaw
          : 45;

      const [lostItems] = await pool.query(
        `SELECT
           li.id,
           li.user_id,
           li.category_id,
           li.title,
           li.description,
           li.location,
           li.lost_date,
           li.lost_time,
           li.image,
           li.status,
           li.created_at,
           c.name AS category_name
         FROM lost_items li
         LEFT JOIN categories c ON c.id = li.category_id
         WHERE li.status IN ('approved', 'found')
         ORDER BY li.created_at DESC`
      );

      const [foundItems] = await pool.query(
        `SELECT
           fi.id,
           fi.user_id,
           fi.category_id,
           fi.title,
           fi.description,
           fi.location,
           fi.found_date,
           fi.found_time,
           fi.image,
           fi.status,
           fi.created_at,
           c.name AS category_name
         FROM found_items fi
         LEFT JOIN categories c ON c.id = fi.category_id
         WHERE fi.status = 'approved'
         ORDER BY fi.created_at DESC`
      );

      const [reviewedRows] = await pool.query(
        `SELECT lost_item_id, found_item_id
         FROM item_matches
         WHERE status IN ('confirmed', 'rejected')`
      );

      const reviewedPairs = new Set(
        reviewedRows.map(
          (row) => `${Number(row.lost_item_id)}:${Number(row.found_item_id)}`
        )
      );

      const matches = [];

      for (const lostItem of lostItems) {
        for (const foundItem of foundItems) {
          // ไม่จับคู่ประกาศของคนเดียวกัน
          if (Number(lostItem.user_id) === Number(foundItem.user_id)) {
            continue;
          }

          // คู่ที่ Staff ตรวจแล้วจะไม่กลับมาเสนอซ้ำ
          const pairKey = `${Number(lostItem.id)}:${Number(foundItem.id)}`;
          if (reviewedPairs.has(pairKey)) {
            continue;
          }

          const match = buildItemMatch(lostItem, foundItem);

          if (match.score >= minimumScore) {
            matches.push(match);
          }
        }
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        const aDate = new Date(
          a.foundItem.created_at || a.lostItem.created_at || 0
        ).getTime();
        const bDate = new Date(
          b.foundItem.created_at || b.lostItem.created_at || 0
        ).getTime();

        return bDate - aDate;
      });

      return res.json({
        count: matches.length,
        minimumScore,
        matches: matches.slice(0, 100),
      });
    } catch (error) {
      console.error("Staff Matching Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถค้นหารายการที่อาจตรงกันได้",
      });
    }
  }
);

// ========================================
// STAFF MATCH REVIEW
// ========================================

app.post(
  "/api/staff/matches/review",
  authenticateToken,
  requireStaff,
  async (req, res) => {
    let connection;

    try {
      const lostItemId = Number(req.body.lostItemId);
      const foundItemId = Number(req.body.foundItemId);
      const score = Number(req.body.score);
      const status = String(req.body.status || "").trim();

      if (
        !Number.isInteger(lostItemId) ||
        lostItemId <= 0 ||
        !Number.isInteger(foundItemId) ||
        foundItemId <= 0
      ) {
        return res.status(400).json({
          message: "ข้อมูลคู่ Matching ไม่ถูกต้อง",
        });
      }

      if (!["confirmed", "rejected"].includes(status)) {
        return res.status(400).json({
          message: "สถานะ Matching ไม่ถูกต้อง",
        });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [[lostItem]] = await connection.query(
        `SELECT id, user_id, title, status
         FROM lost_items
         WHERE id = ?
         LIMIT 1`,
        [lostItemId]
      );

      const [[foundItem]] = await connection.query(
        `SELECT id, user_id, title, status
         FROM found_items
         WHERE id = ?
         LIMIT 1`,
        [foundItemId]
      );

      if (!lostItem || !foundItem) {
        await connection.rollback();
        return res.status(404).json({
          message: "ไม่พบประกาศของหายหรือของพบที่ต้องการตรวจสอบ",
        });
      }

      const safeScore =
        Number.isFinite(score) && score >= 0 && score <= 100
          ? Math.round(score)
          : null;

      await connection.query(
        `INSERT INTO item_matches
          (lost_item_id, found_item_id, match_score, status, reviewed_by, reviewed_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           match_score = VALUES(match_score),
           status = VALUES(status),
           reviewed_by = VALUES(reviewed_by),
           reviewed_at = NOW()`,
        [
          lostItemId,
          foundItemId,
          safeScore,
          status,
          req.user.userId,
        ]
      );

      if (status === "confirmed") {
        await createNotification(connection, {
          userId: lostItem.user_id,
          title: "พบรายการที่อาจเป็นของคุณ",
          message: `Staff ตรวจพบว่าประกาศของพบ “${foundItem.title}” อาจตรงกับของหาย “${lostItem.title}” ของคุณ กดเพื่อดูรายละเอียดและส่งคำขอรับของคืนได้`,
          type: "match_confirmed",
          relatedId: foundItemId,
        });
      }

      await createActivityLog(connection, {
        userId: req.user.userId,
        action:
          status === "confirmed"
            ? "item_match_confirmed"
            : "item_match_rejected",
        targetType: "item_match",
        targetId: foundItemId,
        description:
          status === "confirmed"
            ? `ยืนยันคู่ของหาย #${lostItemId} กับของพบ #${foundItemId}`
            : `ปฏิเสธคู่ของหาย #${lostItemId} กับของพบ #${foundItemId}`,
      });

      await connection.commit();

      return res.json({
        success: true,
        message:
          status === "confirmed"
            ? "ยืนยันการจับคู่เรียบร้อยแล้ว"
            : "ปฏิเสธการจับคู่เรียบร้อยแล้ว",
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Match Review Rollback Error:", rollbackError);
        }
      }

      console.error("Staff Match Review Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถบันทึกผลการจับคู่ได้",
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

// ========================================
// STAFF ACTIVITY LOGS
// ========================================

app.get(
  "/api/staff/activity-logs",
  authenticateToken,
  requireStaff,
  async (req, res) => {
    try {
      const limitRaw = Number(req.query.limit);
      const limit =
        Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 200
          ? limitRaw
          : 100;

      const columns = await getActivityLogColumns(pool);
      const [logs] = await pool.query(
        `SELECT *
         FROM activity_logs
         ORDER BY ${columns.has("created_at") ? "created_at DESC, " : ""}id DESC
         LIMIT ?`,
        [limit]
      );

      const actorColumn = ["user_id", "staff_id", "actor_id"].find((name) =>
        columns.has(name)
      );

      let staffMap = new Map();

      if (actorColumn) {
        const actorIds = [
          ...new Set(
            logs
              .map((log) => Number(log[actorColumn]))
              .filter((id) => Number.isInteger(id) && id > 0)
          ),
        ];

        if (actorIds.length > 0) {
          const placeholders = actorIds.map(() => "?").join(", ");
          const [users] = await pool.query(
            `SELECT id, name, email, role_id
             FROM users
             WHERE id IN (${placeholders})`,
            actorIds
          );

          staffMap = new Map(users.map((user) => [Number(user.id), user]));
        }
      }

      const activityLogs = logs.map((log) => {
        const actorId = actorColumn ? Number(log[actorColumn]) : null;
        const actor = actorId ? staffMap.get(actorId) : null;

        return {
          ...log,
          actor_name: actor?.name || null,
          actor_email: actor?.email || null,
          actor_role_id: actor?.role_id || null,
        };
      });

      return res.json({ activityLogs });
    } catch (error) {
      console.error("Staff Activity Logs Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถโหลดประวัติการทำงานได้",
      });
    }
  }
);

// ========================================
// CATEGORIES
// ========================================

app.get(
  "/api/categories",
  async (
    req,
    res
  ) => {
    try {
      const [rows] =
        await pool.query(
          `
          SELECT
            id,
            name
          FROM categories
          ORDER BY name ASC
          `
        );

      res.json({
        categories: rows,
      });
    } catch (error) {
      console.error(
        "Categories Error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "ไม่สามารถโหลดหมวดหมู่ได้",
        });
    }
  }
);

// ========================================
// CREATE LOST ITEM
// ========================================

app.post(
  "/api/lost-items",

  authenticateToken,
  requireUser,

  upload.array(
    "images",
    3
  ),

  async (
    req,
    res
  ) => {
    let connection;

    try {
      const title =
        String(
          req.body.title ||
            ""
        ).trim();

      const categoryId =
        req.body.categoryId;

      const lostDate =
        req.body.lostDate;

      const lostTime =
        req.body.lostTime ||
        null;

      const location =
        String(
          req.body.location ||
            ""
        ).trim();

      const description =
        String(
          req.body.description ||
            ""
        ).trim();

      const contact =
        String(
          req.body.contact ||
            ""
        ).trim();

      // ====================================
      // VALIDATE
      // ====================================

      if (
        !title ||
        !categoryId ||
        !lostDate ||
        !location ||
        !contact
      ) {
        return res
          .status(400)
          .json({
            message:
              "กรุณากรอกข้อมูลที่จำเป็นให้ครบ",
          });
      }

      // Contact ยังเก็บรวม description
      // ตาม schema ปัจจุบัน
      let finalDescription =
        description;

      if (contact) {
        finalDescription =
          finalDescription
            ? `${finalDescription}\n\nช่องทางติดต่อ: ${contact}`
            : `ช่องทางติดต่อ: ${contact}`;
      }

      const files =
        req.files || [];

      const firstImage =
        files.length > 0
          ? `/image/${files[0].filename}`
          : null;

      connection =
        await pool.getConnection();

      await connection.beginTransaction();

      // ====================================
      // INSERT LOST ITEM
      // ====================================

      const [result] =
        await connection.query(
          `
          INSERT INTO lost_items
          (
            user_id,
            category_id,
            title,
            description,
            location,
            lost_date,
            lost_time,
            image,
            status
          )
          VALUES
          (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'pending'
          )
          `,
          [
            req.user.userId,
            categoryId,
            title,
            finalDescription,
            location,
            lostDate,
            lostTime,
            firstImage,
          ]
        );

      const lostItemId =
        result.insertId;

      // ====================================
      // INSERT IMAGES
      // ====================================

      for (
        const file
        of files
      ) {
        await connection.query(
          `
          INSERT INTO lost_item_images
          (
            lost_item_id,
            image_path
          )
          VALUES (?, ?)
          `,
          [
            lostItemId,
            `/image/${file.filename}`,
          ]
        );
      }

      await createStaffNotifications(connection, {
        title: "มีประกาศของหายใหม่",
        message: `มีประกาศของหาย "${title}" รอการตรวจสอบ`,
        type: "staff_lost_item_pending",
        relatedId: lostItemId,
      });

      await connection.commit();

      res
        .status(201)
        .json({
          success: true,

          message:
            "แจ้งของหายเรียบร้อยแล้ว รอ Staff ตรวจสอบ",

          itemId:
            lostItemId,
        });
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      console.error(
        "Create Lost Item Error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "ไม่สามารถบันทึกประกาศของหายได้",
        });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

// ========================================
// CREATE FOUND ITEM
// ========================================

app.post(
  "/api/found-items",

  authenticateToken,
  requireUser,

  upload.array(
    "images",
    3
  ),

  async (
    req,
    res
  ) => {
    let connection;

    try {
      // ====================================
      // รับข้อมูลจาก FoundItem.jsx
      // ====================================

      const title =
        String(
          req.body.title ||
            ""
        ).trim();

      const categoryId =
        Number(
          req.body.categoryId
        );

      const foundDate =
        String(
          req.body.foundDate ||
            ""
        ).trim();

      const foundTime =
        req.body.foundTime
          ? String(
              req.body.foundTime
            ).trim()
          : null;

      const location =
        String(
          req.body.location ||
            ""
        ).trim();

      const description =
        String(
          req.body.description ||
            ""
        ).trim();

      const contact =
        String(
          req.body.contact ||
            ""
        ).trim();

      // ====================================
      // VALIDATE
      // ====================================

      if (!title) {
        return res
          .status(400)
          .json({
            message:
              "กรุณากรอกชื่อสิ่งของที่พบ",
          });
      }

      if (
        !Number.isInteger(
          categoryId
        ) ||
        categoryId <= 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "กรุณาเลือกหมวดหมู่",
          });
      }

      if (!foundDate) {
        return res
          .status(400)
          .json({
            message:
              "กรุณาระบุวันที่พบของ",
          });
      }

      if (!location) {
        return res
          .status(400)
          .json({
            message:
              "กรุณาระบุสถานที่พบของ",
          });
      }

      if (!contact) {
        return res
          .status(400)
          .json({
            message:
              "กรุณาระบุช่องทางติดต่อ",
          });
      }

      // ====================================
      // ห้ามวันที่ในอนาคต
      // ====================================

      const today =
        new Date();

      today.setHours(
        23,
        59,
        59,
        999
      );

      const selectedDate =
        new Date(
          `${foundDate}T00:00:00`
        );

      if (
        Number.isNaN(
          selectedDate.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "รูปแบบวันที่พบของไม่ถูกต้อง",
          });
      }

      if (
        selectedDate >
        today
      ) {
        return res
          .status(400)
          .json({
            message:
              "วันที่พบของไม่สามารถเป็นวันที่ในอนาคตได้",
          });
      }

      // ====================================
      // ตรวจสอบ Category
      // ====================================

      const [
        categories,
      ] =
        await pool.query(
          `
          SELECT id
          FROM categories
          WHERE id = ?
          LIMIT 1
          `,
          [categoryId]
        );

      if (
        categories.length === 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "ไม่พบหมวดหมู่ที่เลือก",
          });
      }

      // ====================================
      // FILES
      // ====================================

      const files =
        req.files || [];

      const firstImage =
        files.length > 0
          ? `/image/${files[0].filename}`
          : null;

      // ====================================
      // TRANSACTION
      // ====================================

      connection =
        await pool.getConnection();

      await connection
        .beginTransaction();

      // ====================================
      // INSERT FOUND ITEM
      // ====================================

      const [result] =
        await connection.query(
          `
          INSERT INTO found_items
          (
            user_id,
            category_id,
            title,
            description,
            contact,
            location,
            found_date,
            found_time,
            image,
            status
          )
          VALUES
          (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'pending'
          )
          `,
          [
            req.user.userId,
            categoryId,
            title,
            description ||
              null,
            contact,
            location,
            foundDate,
            foundTime ||
              null,
            firstImage,
          ]
        );

      const foundItemId =
        result.insertId;

      // ====================================
      // INSERT FOUND ITEM IMAGES
      // ====================================

      for (
        const file
        of files
      ) {
        await connection.query(
          `
          INSERT INTO found_item_images
          (
            found_item_id,
            image_path
          )
          VALUES (?, ?)
          `,
          [
            foundItemId,
            `/image/${file.filename}`,
          ]
        );
      }

      // ====================================
      // COMMIT
      // ====================================

      await createStaffNotifications(connection, {
        title: "มีประกาศของพบใหม่",
        message: `มีประกาศของพบ "${title}" รอการตรวจสอบ`,
        type: "staff_found_item_pending",
        relatedId: foundItemId,
      });

      await connection.commit();

      // ====================================
      // RESPONSE
      // ====================================

      return res
        .status(201)
        .json({
          success: true,

          message:
            "แจ้งพบของเรียบร้อยแล้ว รอ Staff ตรวจสอบ",

          itemId:
            foundItemId,
        });
    } catch (error) {
      // ====================================
      // ROLLBACK
      // ====================================

      if (connection) {
        try {
          await connection
            .rollback();
        } catch (
          rollbackError
        ) {
          console.error(
            "Found Item Rollback Error:",
            rollbackError
          );
        }
      }

      console.error(
        "Create Found Item Error:",
        error
      );

      // ====================================
      // MYSQL COLUMN ERROR
      // ====================================

      if (
        error.code ===
          "ER_BAD_FIELD_ERROR" &&
        String(
          error.message || ""
        ).includes(
          "found_time"
        )
      ) {
        return res
          .status(500)
          .json({
            message:
              "ตาราง found_items ยังไม่มีคอลัมน์ found_time",
          });
      }

      // ====================================
      // FOREIGN KEY ERROR
      // ====================================

      if (
        error.code ===
        "ER_NO_REFERENCED_ROW_2"
      ) {
        return res
          .status(400)
          .json({
            message:
              "ข้อมูลผู้ใช้หรือหมวดหมู่ไม่ถูกต้อง",
          });
      }

      // ====================================
      // GENERAL ERROR
      // ====================================

      return res
        .status(500)
        .json({
          message:
            "ไม่สามารถบันทึกประกาศพบของได้",
        });
    } finally {
      // ====================================
      // RELEASE CONNECTION
      // ====================================

      if (connection) {
        connection.release();
      }
    }
  }
);

// ========================================
// MY ITEMS
// รายการประกาศของผู้ใช้ที่ Login อยู่
// ========================================

app.get(
  "/api/my-items",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(req.user.userId);

      const [lostRows] = await pool.query(
        `
        SELECT
          li.id,
          li.title,
          li.description,
          li.location,
          li.lost_date,
          li.lost_time,
          li.image,
          li.status,
          li.staff_note,
          li.created_at,
          li.updated_at,
          li.approved_at,
          c.id AS category_id,
          c.name AS category_name
        FROM lost_items li
        LEFT JOIN categories c
          ON c.id = li.category_id
        WHERE li.user_id = ?
        ORDER BY li.created_at DESC, li.id DESC
        `,
        [userId]
      );

      const [foundRows] = await pool.query(
        `
        SELECT
          fi.id,
          fi.title,
          fi.description,
          fi.contact,
          fi.location,
          fi.found_date,
          fi.found_time,
          fi.image,
          fi.status,
          fi.staff_note,
          fi.created_at,
          fi.updated_at,
          fi.approved_at,
          c.id AS category_id,
          c.name AS category_name
        FROM found_items fi
        LEFT JOIN categories c
          ON c.id = fi.category_id
        WHERE fi.user_id = ?
        ORDER BY fi.created_at DESC, fi.id DESC
        `,
        [userId]
      );

      const items = [
        ...lostRows.map((item) => ({ ...item, type: "lost" })),
        ...foundRows.map((item) => ({ ...item, type: "found" })),
      ].sort((a, b) => {
        const bTime = new Date(b.created_at || 0).getTime();
        const aTime = new Date(a.created_at || 0).getTime();
        if (bTime !== aTime) return bTime - aTime;
        return b.id - a.id;
      });

      return res.json({ items });
    } catch (error) {
      console.error("My Items Error:", error);
      return res.status(500).json({
        message: "ไม่สามารถโหลดรายการของคุณได้",
      });
    }
  }
);


// ========================================
// CLAIMS
// ผู้ใช้แจ้งขอรับของที่พบคืน
// ========================================

app.post(
  "/api/claims",
  authenticateToken,
  requireUser,
  upload.array("proofs", 3),
  async (req, res) => {
    let connection;
    try {
      const userId = Number(req.user.userId);
      const foundItemId = Number(req.body.foundItemId);
      const message = String(req.body.message || "").trim();
      const proofDescription = String(req.body.proofDescription || "").trim();

      if (!Number.isInteger(foundItemId) || foundItemId <= 0 || !message) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลคำขอให้ครบ" });
      }

      const [foundRows] = await pool.query(
        `SELECT id, user_id, status FROM found_items WHERE id = ? LIMIT 1`,
        [foundItemId]
      );

      if (foundRows.length === 0 || foundRows[0].status !== "approved") {
        return res.status(404).json({ message: "ไม่พบประกาศของที่พบที่สามารถยื่นคำขอได้" });
      }

      if (Number(foundRows[0].user_id) === userId) {
        return res.status(400).json({ message: "ไม่สามารถยื่นคำขอรับของจากประกาศของตัวเองได้" });
      }

      const [duplicateRows] = await pool.query(
        `SELECT id FROM claims WHERE found_item_id = ? AND user_id = ? AND status = 'pending' LIMIT 1`,
        [foundItemId, userId]
      );

      if (duplicateRows.length > 0) {
        return res.status(409).json({ message: "คุณมีคำขอสำหรับประกาศนี้ที่กำลังรอตรวจสอบอยู่แล้ว" });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [claimResult] = await connection.query(
        `INSERT INTO claims (found_item_id, user_id, message, status) VALUES (?, ?, ?, 'pending')`,
        [foundItemId, userId, message]
      );

      const claimId = claimResult.insertId;
      const files = req.files || [];

      for (const file of files) {
        await connection.query(
          `INSERT INTO ownership_proofs (claim_id, file_path, description, status) VALUES (?, ?, ?, 'pending')`,
          [claimId, `/image/${file.filename}`, proofDescription || null]
        );
      }

      await createStaffNotifications(connection, {
        title: "มีคำขอรับของคืนใหม่",
        message: `มีคำขอรับของคืนใหม่สำหรับประกาศหมายเลข ${foundItemId} รอการตรวจสอบ`,
        type: "staff_claim_pending",
        relatedId: claimId,
      });

      await connection.commit();
      return res.status(201).json({
        success: true,
        message: "ส่งคำขอรับของคืนเรียบร้อยแล้ว กรุณารอ Staff ตรวจสอบ",
        claimId,
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Create Claim Error:", error);
      return res.status(500).json({ message: "ไม่สามารถส่งคำขอรับของคืนได้" });
    } finally {
      if (connection) connection.release();
    }
  }
);

app.get("/api/my-claims", authenticateToken, requireUser, async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const [rows] = await pool.query(
      `SELECT cl.*, fi.title AS found_item_title, fi.image AS found_item_image
       FROM claims cl
       INNER JOIN found_items fi ON fi.id = cl.found_item_id
       WHERE cl.user_id = ?
       ORDER BY cl.id DESC`,
      [userId]
    );
    return res.json({ claims: rows });
  } catch (error) {
    console.error("My Claims Error:", error);
    return res.status(500).json({ message: "ไม่สามารถโหลดคำขอของคุณได้" });
  }
});

app.get("/api/staff/claims", authenticateToken, requireStaff, async (req, res) => {
  try {
    const status = String(req.query.status || "pending").toLowerCase();
    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });

    const [rows] = await pool.query(
      `SELECT cl.*, fi.title AS found_item_title,
              u.name AS claimant_name, u.email AS claimant_email
       FROM claims cl
       INNER JOIN found_items fi ON fi.id = cl.found_item_id
       INNER JOIN users u ON u.id = cl.user_id
       WHERE cl.status = ?
       ORDER BY cl.id DESC`,
      [status]
    );
    return res.json({ claims: rows });
  } catch (error) {
    console.error("Staff Claims Error:", error);
    return res.status(500).json({ message: "ไม่สามารถโหลดคำขอ Claim ได้" });
  }
});

app.get("/api/staff/claims/:id", authenticateToken, requireStaff, async (req, res) => {
  try {
    const claimId = Number(req.params.id);
    if (!Number.isInteger(claimId) || claimId <= 0) return res.status(400).json({ message: "รหัสคำขอไม่ถูกต้อง" });

    const [rows] = await pool.query(
      `SELECT cl.*, fi.title AS found_item_title, fi.description AS found_item_description,
              fi.location AS found_item_location, fi.found_date, fi.found_time,
              u.name AS claimant_name, u.email AS claimant_email, u.phone AS claimant_phone
       FROM claims cl
       INNER JOIN found_items fi ON fi.id = cl.found_item_id
       INNER JOIN users u ON u.id = cl.user_id
       WHERE cl.id = ? LIMIT 1`,
      [claimId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "ไม่พบคำขอ" });

    const [proofs] = await pool.query(
      `SELECT id, file_path, description, status, reviewed_by, reviewed_at, created_at
       FROM ownership_proofs WHERE claim_id = ? ORDER BY id ASC`,
      [claimId]
    );
    return res.json({ claim: { ...rows[0], proofs } });
  } catch (error) {
    console.error("Staff Claim Detail Error:", error);
    return res.status(500).json({ message: "ไม่สามารถโหลดรายละเอียดคำขอได้" });
  }
});

app.patch("/api/staff/claims/:id/review", authenticateToken, requireStaff, async (req, res) => {
  let connection;
  try {
    const claimId = Number(req.params.id);
    const status = String(req.body.status || "").toLowerCase();
    const staffNote = String(req.body.staffNote || "").trim();
    if (!Number.isInteger(claimId) || claimId <= 0) return res.status(400).json({ message: "รหัสคำขอไม่ถูกต้อง" });
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "ผลการตรวจสอบไม่ถูกต้อง" });
    if (status === "rejected" && !staffNote) return res.status(400).json({ message: "กรุณาระบุเหตุผลที่ปฏิเสธ" });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.query(`SELECT id, user_id, found_item_id, status FROM claims WHERE id = ? FOR UPDATE`, [claimId]);
    if (rows.length === 0) { await connection.rollback(); return res.status(404).json({ message: "ไม่พบคำขอ" }); }
    if (rows[0].status !== "pending") { await connection.rollback(); return res.status(409).json({ message: "คำขอนี้ถูกตรวจสอบแล้ว" }); }

    if (status === "approved") {
      const [foundRows] = await connection.query(
        `SELECT id, status
         FROM found_items
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [rows[0].found_item_id]
      );

      if (foundRows.length === 0 || foundRows[0].status !== "approved") {
        await connection.rollback();
        return res.status(409).json({
          message: "ประกาศนี้ไม่อยู่ในสถานะที่สามารถอนุมัติ Claim ได้",
        });
      }

      const [approvedClaims] = await connection.query(
        `SELECT id
         FROM claims
         WHERE found_item_id = ?
           AND status = 'approved'
           AND id <> ?
         LIMIT 1`,
        [rows[0].found_item_id, claimId]
      );

      if (approvedClaims.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          message: "ประกาศนี้มี Claim ที่ได้รับการอนุมัติแล้ว",
        });
      }
    }

    await connection.query(
      `UPDATE claims SET status = ?, reviewed_by = ?, reviewed_at = NOW(), staff_note = ? WHERE id = ?`,
      [status, req.user.userId, staffNote || null, claimId]
    );
    await connection.query(
      `UPDATE ownership_proofs SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE claim_id = ?`,
      [status, req.user.userId, claimId]
    );

    await createNotification(connection, {
      userId: rows[0].user_id,
      title:
        status === "approved"
          ? "คำขอรับของคืนได้รับการอนุมัติ"
          : "คำขอรับของคืนไม่ผ่านการตรวจสอบ",
      message:
        status === "approved"
          ? "Staff อนุมัติคำขอรับของคืนของคุณแล้ว กรุณารอการนัดคืนของ"
          : `Staff ปฏิเสธคำขอรับของคืนของคุณ${staffNote ? `: ${staffNote}` : ""}`,
      type: `claim_${status}`,
      relatedId: claimId,
    });
    await createActivityLog(connection, {
      userId: Number(req.user.userId),
      action: status === "approved" ? "claim_approved" : "claim_rejected",
      targetType: "claim",
      targetId: claimId,
      description:
        status === "approved"
          ? `อนุมัติคำขอรับของคืน #${claimId}`
          : `ปฏิเสธคำขอรับของคืน #${claimId}${staffNote ? `: ${staffNote}` : ""}`,
    });

    await connection.commit();
    return res.json({ success: true, message: status === "approved" ? "อนุมัติคำขอเรียบร้อยแล้ว" : "ปฏิเสธคำขอเรียบร้อยแล้ว" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Review Claim Error:", error);
    return res.status(500).json({ message: "ไม่สามารถตรวจสอบคำขอได้" });
  } finally {
    if (connection) connection.release();
  }
});


// ========================================
// RETURNS
// Staff สร้างนัดคืน / User ยืนยันรับของ
// ========================================

app.get("/api/staff/returns", authenticateToken, requireStaff, async (req, res) => {
  try {
    const [eligibleClaims] = await pool.query(
      `SELECT cl.id AS claim_id, cl.found_item_id, cl.user_id,
              cl.reviewed_at, fi.title AS found_item_title,
              u.name AS claimant_name, u.email AS claimant_email
       FROM claims cl
       INNER JOIN found_items fi ON fi.id = cl.found_item_id
       INNER JOIN users u ON u.id = cl.user_id
       LEFT JOIN returns r ON r.claim_id = cl.id
       WHERE cl.status = 'approved' AND r.id IS NULL
       ORDER BY cl.reviewed_at DESC, cl.id DESC`
    );

    const [returns] = await pool.query(
      `SELECT r.*, cl.found_item_id, cl.user_id,
              fi.title AS found_item_title,
              u.name AS claimant_name, u.email AS claimant_email,
              s.name AS staff_name
       FROM returns r
       INNER JOIN claims cl ON cl.id = r.claim_id
       INNER JOIN found_items fi ON fi.id = cl.found_item_id
       INNER JOIN users u ON u.id = cl.user_id
       LEFT JOIN users s ON s.id = r.staff_id
       ORDER BY r.created_at DESC, r.id DESC`
    );

    return res.json({ eligibleClaims, returns });
  } catch (error) {
    console.error("Staff Returns Error:", error);
    return res.status(500).json({ message: "ไม่สามารถโหลดข้อมูลการคืนของได้" });
  }
});

app.post("/api/staff/returns", authenticateToken, requireStaff, async (req, res) => {
  let connection;

  try {
    const claimId = Number(req.body.claimId);
    const returnDate = String(req.body.returnDate || "").trim();
    const returnLocation = String(req.body.returnLocation || "").trim();
    const receiverName = String(req.body.receiverName || "").trim();
    const note = String(req.body.note || "").trim();

    if (!Number.isInteger(claimId) || claimId <= 0) {
      return res.status(400).json({ message: "รหัส Claim ไม่ถูกต้อง" });
    }

    if (!returnDate || !returnLocation || !receiverName) {
      return res.status(400).json({
        message: "กรุณากรอกวันเวลา สถานที่ และชื่อผู้รับให้ครบ",
      });
    }

    const parsedDate = new Date(returnDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "วันเวลานัดคืนไม่ถูกต้อง" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [claimRows] = await connection.query(
      `SELECT id, found_item_id, user_id, status
       FROM claims
       WHERE id = ?
       FOR UPDATE`,
      [claimId]
    );

    if (claimRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "ไม่พบ Claim นี้" });
    }

    if (claimRows[0].status !== "approved") {
      await connection.rollback();
      return res.status(409).json({
        message: "สร้างนัดคืนได้เฉพาะ Claim ที่อนุมัติแล้ว",
      });
    }

    const [existingRows] = await connection.query(
      `SELECT id FROM returns WHERE claim_id = ? LIMIT 1`,
      [claimId]
    );

    if (existingRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "Claim นี้มีรายการคืนของแล้ว",
      });
    }

    const mysqlDate =
      returnDate.replace("T", " ") +
      (returnDate.length === 16 ? ":00" : "");

    const [result] = await connection.query(
      `INSERT INTO returns
       (
         claim_id,
         staff_id,
         return_date,
         return_location,
         receiver_name,
         note,
         status,
         user_confirmed,
         user_confirmed_at
       )
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 0, NULL)`,
      [
        claimId,
        Number(req.user.userId),
        mysqlDate,
        returnLocation,
        receiverName,
        note,
      ]
    );

    await createNotification(connection, {
      userId: claimRows[0].user_id,
      title: "มีนัดคืนของใหม่",
      message: `Staff สร้างนัดคืนของวันที่ ${returnDate.replace("T", " ")} ที่ ${returnLocation}`,
      type: "return_scheduled",
      relatedId: result.insertId,
    });

    await createActivityLog(connection, {
      userId: Number(req.user.userId),
      action: "return_scheduled",
      targetType: "return",
      targetId: result.insertId,
      description: `สร้างนัดคืนของ #${result.insertId} สำหรับ Claim #${claimId} ที่ ${returnLocation}`,
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "สร้างนัดคืนของเรียบร้อยแล้ว",
      returnId: result.insertId,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Create Return Error:", error);

    return res.status(500).json({
      message: "ไม่สามารถสร้างนัดคืนของได้",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.patch(
  "/api/staff/returns/:id/cancel",
  authenticateToken,
  requireStaff,
  async (req, res) => {
    try {
      const returnId = Number(req.params.id);

      if (!Number.isInteger(returnId) || returnId <= 0) {
        return res.status(400).json({
          message: "รหัสรายการคืนไม่ถูกต้อง",
        });
      }

      const [result] = await pool.query(
        `UPDATE returns
         SET status = 'cancelled'
         WHERE id = ?
           AND status = 'scheduled'
           AND user_confirmed = 0`,
        [returnId]
      );

      if (result.affectedRows === 0) {
        return res.status(409).json({
          message: "รายการนี้ไม่สามารถยกเลิกได้",
        });
      }

      await createActivityLog(pool, {
        userId: Number(req.user.userId),
        action: "return_cancelled",
        targetType: "return",
        targetId: returnId,
        description: `ยกเลิกนัดคืนของ #${returnId}`,
      });

      return res.json({
        success: true,
        message: "ยกเลิกนัดคืนของเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("Cancel Return Error:", error);

      return res.status(500).json({
        message: "ไม่สามารถยกเลิกนัดคืนของได้",
      });
    }
  }
);

app.get("/api/my-returns", authenticateToken, requireUser, async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const [rows] = await pool.query(
      `SELECT r.*, cl.found_item_id,
              fi.title AS found_item_title,
              fi.image AS found_item_image
       FROM returns r
       INNER JOIN claims cl ON cl.id = r.claim_id
       INNER JOIN found_items fi ON fi.id = cl.found_item_id
       WHERE cl.user_id = ?
       ORDER BY r.created_at DESC, r.id DESC`,
      [userId]
    );

    return res.json({ returns: rows });
  } catch (error) {
    console.error("My Returns Error:", error);

    return res.status(500).json({
      message: "ไม่สามารถโหลดรายการคืนของคุณได้",
    });
  }
});

app.patch(
  "/api/my-returns/:id/confirm",
  authenticateToken,
  requireUser,
  async (req, res) => {
    let connection;

    try {
      const returnId = Number(req.params.id);
      const userId = Number(req.user.userId);

      if (!Number.isInteger(returnId) || returnId <= 0) {
        return res.status(400).json({
          message: "รหัสรายการคืนไม่ถูกต้อง",
        });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [rows] = await connection.query(
        `SELECT r.id, r.status, r.user_confirmed,
                cl.user_id, cl.found_item_id
         FROM returns r
         INNER JOIN claims cl ON cl.id = r.claim_id
         WHERE r.id = ?
         FOR UPDATE`,
        [returnId]
      );

      if (rows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          message: "ไม่พบรายการคืนของ",
        });
      }

      const item = rows[0];

      if (Number(item.user_id) !== userId) {
        await connection.rollback();

        return res.status(403).json({
          message: "คุณไม่มีสิทธิ์ยืนยันรายการนี้",
        });
      }

      if (
        item.status !== "scheduled" ||
        Number(item.user_confirmed) === 1
      ) {
        await connection.rollback();

        return res.status(409).json({
          message: "รายการนี้ไม่สามารถยืนยันได้",
        });
      }

      await connection.query(
        `UPDATE returns
         SET status = 'completed',
             user_confirmed = 1,
             user_confirmed_at = NOW()
         WHERE id = ?`,
        [returnId]
      );

      await connection.query(
        `UPDATE found_items
         SET status = 'returned'
         WHERE id = ?`,
        [item.found_item_id]
      );

      await createStaffNotifications(connection, {
      title: "ผู้ใช้ยืนยันรับของคืนแล้ว",
      message: `ผู้ใช้ยืนยันการรับของคืนสำหรับรายการคืนหมายเลข ${returnId} แล้ว`,
      type: "staff_return_confirmed",
      relatedId: returnId,
    });

    await connection.commit();

      return res.json({
        success: true,
        message: "ยืนยันการรับของคืนเรียบร้อยแล้ว",
      });
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      console.error("Confirm Return Error:", error);

      return res.status(500).json({
        message: "ไม่สามารถยืนยันการรับของคืนได้",
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

// ========================================
// PUBLIC POSTS
// เฉพาะรายการที่ Staff อนุมัติแล้ว
// รองรับทั้ง Lost + Found
// ========================================

app.get(
  "/api/posts",
  async (req, res) => {
    try {
      const type = String(
        req.query.type || "all"
      ).toLowerCase();

      const search = String(
        req.query.search || ""
      ).trim();

      const categoryIdRaw = String(
        req.query.categoryId || ""
      ).trim();

      const location = String(
        req.query.location || ""
      ).trim();

      const dateFrom = String(
        req.query.dateFrom || ""
      ).trim();

      const dateTo = String(
        req.query.dateTo || ""
      ).trim();

      const categoryId = categoryIdRaw
        ? Number(categoryIdRaw)
        : null;

      if (
        categoryIdRaw &&
        (!Number.isInteger(categoryId) || categoryId <= 0)
      ) {
        return res.status(400).json({
          message: "หมวดหมู่ไม่ถูกต้อง",
        });
      }

      const datePattern = /^\d{4}-\d{2}-\d{2}$/;

      if (dateFrom && !datePattern.test(dateFrom)) {
        return res.status(400).json({ message: "วันที่เริ่มต้นไม่ถูกต้อง" });
      }

      if (dateTo && !datePattern.test(dateTo)) {
        return res.status(400).json({ message: "วันที่สิ้นสุดไม่ถูกต้อง" });
      }

      if (dateFrom && dateTo && dateFrom > dateTo) {
        return res.status(400).json({
          message: "วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด",
        });
      }

      const limitRaw = Number(
        req.query.limit
      );

      const limit =
        Number.isInteger(limitRaw) &&
        limitRaw > 0 &&
        limitRaw <= 50
          ? limitRaw
          : 20;

      const allowedTypes = [
        "all",
        "lost",
        "found",
      ];

      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          message: "ประเภทประกาศไม่ถูกต้อง",
        });
      }

      const keyword = `%${search}%`;
      const locationKeyword = `%${location}%`;

      // ====================================
      // LOST POSTS
      // ====================================

      let lostPosts = [];

      if (
        type === "all" ||
        type === "lost"
      ) {
        let lostSql = `
          SELECT
            li.id,
            li.title,
            li.description,
            li.location,
            li.lost_date,
            li.lost_time,
            li.image,
            li.status,
            li.created_at,
            li.approved_at,

            c.id AS category_id,
            c.name AS category_name,

            u.id AS user_id,
            u.name AS user_name

          FROM lost_items li

          LEFT JOIN categories c
            ON c.id = li.category_id

          INNER JOIN users u
            ON u.id = li.user_id

          WHERE li.status = 'approved'
        `;

        const lostParams = [];

        if (search) {
          lostSql += `
            AND
            (
              li.title LIKE ?
              OR li.description LIKE ?
              OR li.location LIKE ?
              OR c.name LIKE ?
            )
          `;

          lostParams.push(
            keyword,
            keyword,
            keyword,
            keyword
          );
        }

        if (categoryId) {
          lostSql += ` AND li.category_id = ? `;
          lostParams.push(categoryId);
        }

        if (location) {
          lostSql += ` AND li.location LIKE ? `;
          lostParams.push(locationKeyword);
        }

        if (dateFrom) {
          lostSql += ` AND li.lost_date >= ? `;
          lostParams.push(dateFrom);
        }

        if (dateTo) {
          lostSql += ` AND li.lost_date <= ? `;
          lostParams.push(dateTo);
        }

        lostSql += `
          ORDER BY
            COALESCE(
              li.approved_at,
              li.created_at
            ) DESC,
            li.id DESC

          LIMIT ${limit}
        `;

        const [lostRows] =
          await pool.query(
            lostSql,
            lostParams
          );

        const lostIds =
          lostRows.map(
            (row) => row.id
          );

        const lostImageMap = {};

        if (lostIds.length > 0) {
          const placeholders =
            lostIds
              .map(() => "?")
              .join(",");

          const [images] =
            await pool.query(
              `
              SELECT
                lost_item_id,
                image_path

              FROM lost_item_images

              WHERE lost_item_id
                IN (${placeholders})

              ORDER BY id ASC
              `,
              lostIds
            );

          for (const image of images) {
            if (
              !lostImageMap[
                image.lost_item_id
              ]
            ) {
              lostImageMap[
                image.lost_item_id
              ] = [];
            }

            lostImageMap[
              image.lost_item_id
            ].push(
              image.image_path
            );
          }
        }

        lostPosts = lostRows.map(
          (row) => ({
            ...row,

            type: "lost",

            images:
              lostImageMap[
                row.id
              ] || [],
          })
        );
      }

      // ====================================
      // FOUND POSTS
      // ====================================

      let foundPosts = [];

      if (
        type === "all" ||
        type === "found"
      ) {
        let foundSql = `
          SELECT
            fi.id,
            fi.title,
            fi.description,
            fi.contact,
            fi.location,
            fi.found_date,
            fi.found_time,
            fi.image,
            fi.status,
            fi.created_at,
            fi.approved_at,

            c.id AS category_id,
            c.name AS category_name,

            u.id AS user_id,
            u.name AS user_name

          FROM found_items fi

          LEFT JOIN categories c
            ON c.id = fi.category_id

          INNER JOIN users u
            ON u.id = fi.user_id

          WHERE fi.status = 'approved'
        `;

        const foundParams = [];

        if (search) {
          foundSql += `
            AND
            (
              fi.title LIKE ?
              OR fi.description LIKE ?
              OR fi.location LIKE ?
              OR c.name LIKE ?
            )
          `;

          foundParams.push(
            keyword,
            keyword,
            keyword,
            keyword
          );
        }

        if (categoryId) {
          foundSql += ` AND fi.category_id = ? `;
          foundParams.push(categoryId);
        }

        if (location) {
          foundSql += ` AND fi.location LIKE ? `;
          foundParams.push(locationKeyword);
        }

        if (dateFrom) {
          foundSql += ` AND fi.found_date >= ? `;
          foundParams.push(dateFrom);
        }

        if (dateTo) {
          foundSql += ` AND fi.found_date <= ? `;
          foundParams.push(dateTo);
        }

        foundSql += `
          ORDER BY
            COALESCE(
              fi.approved_at,
              fi.created_at
            ) DESC,
            fi.id DESC

          LIMIT ${limit}
        `;

        const [foundRows] =
          await pool.query(
            foundSql,
            foundParams
          );

        const foundIds =
          foundRows.map(
            (row) => row.id
          );

        const foundImageMap = {};

        if (foundIds.length > 0) {
          const placeholders =
            foundIds
              .map(() => "?")
              .join(",");

          const [images] =
            await pool.query(
              `
              SELECT
                found_item_id,
                image_path

              FROM found_item_images

              WHERE found_item_id
                IN (${placeholders})

              ORDER BY id ASC
              `,
              foundIds
            );

          for (const image of images) {
            if (
              !foundImageMap[
                image.found_item_id
              ]
            ) {
              foundImageMap[
                image.found_item_id
              ] = [];
            }

            foundImageMap[
              image.found_item_id
            ].push(
              image.image_path
            );
          }
        }

        foundPosts = foundRows.map(
          (row) => ({
            ...row,

            type: "found",

            images:
              foundImageMap[
                row.id
              ] || [],
          })
        );
      }

      // ====================================
      // MERGE + SORT
      // ====================================

      const posts = [
        ...lostPosts,
        ...foundPosts,
      ]
        .sort((a, b) => {
          const aDate =
            new Date(
              a.approved_at ||
                a.created_at ||
                0
            ).getTime();

          const bDate =
            new Date(
              b.approved_at ||
                b.created_at ||
                0
            ).getTime();

          if (bDate !== aDate) {
            return bDate - aDate;
          }

          return b.id - a.id;
        })
        .slice(0, limit);

      return res.json({
        posts,
      });
    } catch (error) {
      console.error(
        "Public Posts Error:",
        error
      );

      return res.status(500).json({
        message:
          "ไม่สามารถโหลดประกาศได้",
      });
    }
  }
);

// ========================================
// PUBLIC ITEM DETAIL
// ดูรายละเอียดประกาศที่อนุมัติแล้ว
// รองรับ Lost + Found
// ========================================


// ========================================
// LOST ITEM DETAIL
// GET /api/posts/lost/:id
// ========================================

app.get("/api/posts/lost/:id", async (req, res) => {
  try {
    const itemId = Number(req.params.id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({
        message: "รหัสประกาศไม่ถูกต้อง",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT
        li.id,
        li.title,
        li.description,
        li.location,
        li.lost_date,
        li.lost_time,
        li.image,
        li.status,
        li.created_at,
        li.approved_at,

        c.id AS category_id,
        c.name AS category_name,

        u.id AS user_id,
        u.name AS user_name

      FROM lost_items li

      LEFT JOIN categories c
        ON c.id = li.category_id

      INNER JOIN users u
        ON u.id = li.user_id

      WHERE
        li.id = ?
        AND li.status = 'approved'

      LIMIT 1
      `,
      [itemId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          "ไม่พบประกาศของหาย หรือประกาศนี้ยังไม่ได้รับการอนุมัติ",
      });
    }

    const item = rows[0];

    // ====================================
    // LOAD ALL IMAGES
    // ====================================

    const [imageRows] = await pool.query(
      `
      SELECT
        image_path

      FROM lost_item_images

      WHERE lost_item_id = ?

      ORDER BY id ASC
      `,
      [itemId]
    );

    let images = imageRows.map(
      (image) => image.image_path
    );

    // ถ้าไม่มีในตารางรูปย่อย
    // แต่มีรูปหลัก ให้ใช้รูปหลักแทน
    if (
      images.length === 0 &&
      item.image
    ) {
      images = [item.image];
    }

    return res.json({
      item: {
        ...item,
        type: "lost",
        images,
      },
    });
  } catch (error) {
    console.error(
      "Public Lost Detail Error:",
      error
    );

    return res.status(500).json({
      message:
        "ไม่สามารถโหลดรายละเอียดของหายได้",
    });
  }
});


// ========================================
// FOUND ITEM DETAIL
// GET /api/posts/found/:id
// ========================================

app.get("/api/posts/found/:id", async (req, res) => {
  try {
    const itemId = Number(req.params.id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({
        message: "รหัสประกาศไม่ถูกต้อง",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT
        fi.id,
        fi.title,
        fi.description,
        fi.contact,
        fi.location,
        fi.found_date,
        fi.found_time,
        fi.image,
        fi.status,
        fi.created_at,
        fi.approved_at,

        c.id AS category_id,
        c.name AS category_name,

        u.id AS user_id,
        u.name AS user_name

      FROM found_items fi

      LEFT JOIN categories c
        ON c.id = fi.category_id

      INNER JOIN users u
        ON u.id = fi.user_id

      WHERE
        fi.id = ?
        AND fi.status = 'approved'

      LIMIT 1
      `,
      [itemId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          "ไม่พบประกาศของที่พบ หรือประกาศนี้ยังไม่ได้รับการอนุมัติ",
      });
    }

    const item = rows[0];

    // ====================================
    // LOAD ALL IMAGES
    // ====================================

    const [imageRows] = await pool.query(
      `
      SELECT
        image_path

      FROM found_item_images

      WHERE found_item_id = ?

      ORDER BY id ASC
      `,
      [itemId]
    );

    let images = imageRows.map(
      (image) => image.image_path
    );

    // ถ้าไม่มีในตารางรูปย่อย
    // แต่มีรูปหลัก ให้ใช้รูปหลักแทน
    if (
      images.length === 0 &&
      item.image
    ) {
      images = [item.image];
    }

    return res.json({
      item: {
        ...item,
        type: "found",
        images,
      },
    });
  } catch (error) {
    console.error(
      "Public Found Detail Error:",
      error
    );

    return res.status(500).json({
      message:
        "ไม่สามารถโหลดรายละเอียดของที่พบได้",
    });
  }
});

// ========================================
// STAFF DASHBOARD
// ========================================

app.get(
  "/api/staff/dashboard",

  authenticateToken,
  requireStaff,

  async (
    req,
    res
  ) => {
    try {
      const [rows] =
        await pool.query(
          `
          SELECT
            SUM(
              CASE
                WHEN status = 'pending'
                THEN 1
                ELSE 0
              END
            ) AS pending,

            SUM(
              CASE
                WHEN status = 'approved'
                THEN 1
                ELSE 0
              END
            ) AS approved,

            SUM(
              CASE
                WHEN status = 'rejected'
                THEN 1
                ELSE 0
              END
            ) AS rejected

          FROM lost_items
          `
        );

      res.json({
        summary: {
          pending:
            Number(
              rows[0]
                ?.pending ||
                0
            ),

          approved:
            Number(
              rows[0]
                ?.approved ||
                0
            ),

          rejected:
            Number(
              rows[0]
                ?.rejected ||
                0
            ),
        },
      });
    } catch (error) {
      console.error(
        "Staff Dashboard Error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "ไม่สามารถโหลด Dashboard ได้",
        });
    }
  }
);

// ========================================
// STAFF LOST ITEMS
// ========================================

app.get(
  "/api/staff/lost-items",

  authenticateToken,
  requireStaff,

  async (
    req,
    res
  ) => {
    try {
      const status =
        String(
          req.query.status ||
            "pending"
        ).toLowerCase();

      const allowedStatuses =
        [
          "pending",
          "approved",
          "rejected",
          "found",
          "returned",
        ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "สถานะไม่ถูกต้อง",
          });
      }

      const [rows] =
        await pool.query(
          `
          SELECT
            li.id,
            li.title,
            li.description,
            li.location,
            li.lost_date,
            li.lost_time,
            li.image,
            li.status,
            li.staff_note,
            li.created_at,

            c.name
              AS category_name,

            u.name
              AS user_name,

            u.email
              AS user_email

          FROM lost_items li

          LEFT JOIN categories c
            ON c.id =
               li.category_id

          INNER JOIN users u
            ON u.id =
               li.user_id

          WHERE li.status = ?

          ORDER BY
            li.created_at DESC,
            li.id DESC
          `,
          [status]
        );

      res.json({
        items: rows,
      });
    } catch (error) {
      console.error(
        "Staff Lost Items Error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "ไม่สามารถโหลดรายการได้",
        });
    }
  }
);

// ========================================
// STAFF LOST ITEM DETAIL
// ========================================

app.get(
  "/api/staff/lost-items/:id",

  authenticateToken,
  requireStaff,

  async (
    req,
    res
  ) => {
    try {
      const itemId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          itemId
        ) ||
        itemId <= 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "รหัสประกาศไม่ถูกต้อง",
          });
      }

      const [rows] =
        await pool.query(
          `
          SELECT
            li.*,

            c.name
              AS category_name,

            u.name
              AS user_name,

            u.email
              AS user_email,

            u.phone
              AS user_phone

          FROM lost_items li

          LEFT JOIN categories c
            ON c.id =
               li.category_id

          INNER JOIN users u
            ON u.id =
               li.user_id

          WHERE li.id = ?

          LIMIT 1
          `,
          [itemId]
        );

      if (
        rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "ไม่พบประกาศ",
          });
      }

      const [images] =
        await pool.query(
          `
          SELECT
            id,
            image_path
          FROM lost_item_images
          WHERE lost_item_id = ?
          ORDER BY id ASC
          `,
          [itemId]
        );

      const item = {
        ...rows[0],
        images,
      };

      res.json({
        item,
      });
    } catch (error) {
      console.error(
        "Staff Item Detail Error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "ไม่สามารถโหลดรายละเอียดประกาศได้",
        });
    }
  }
);

// ========================================
// STAFF APPROVE
// ========================================

app.patch(
  "/api/staff/lost-items/:id/approve",

  authenticateToken,
  requireStaff,

  async (
    req,
    res
  ) => {
    try {
      const itemId =
        Number(
          req.params.id
        );

      const staffNote =
        String(
          req.body.staffNote ||
            ""
        ).trim();

      if (
        !Number.isInteger(
          itemId
        ) ||
        itemId <= 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "รหัสประกาศไม่ถูกต้อง",
          });
      }

      const [items] =
        await pool.query(
          `
          SELECT
            id,
            user_id,
            title,
            status
          FROM lost_items
          WHERE id = ?
          LIMIT 1
          `,
          [itemId]
        );

      if (
        items.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "ไม่พบประกาศ",
          });
      }

      if (
        items[0].status !==
        "pending"
      ) {
        return res
          .status(409)
          .json({
            message:
              "ประกาศนี้ถูกตรวจสอบไปแล้ว",
          });
      }

      await pool.query(
        `
        UPDATE lost_items
        SET
          status = 'approved',
          staff_note = ?,
          approved_by = ?,
          approved_at = NOW()
        WHERE id = ?
        `,
        [
          staffNote ||
            null,

          req.user.userId,

          itemId,
        ]
      );

      await createNotification(pool, {
        userId: items[0].user_id,
        title: "ประกาศได้รับการอนุมัติ",
        message: `ประกาศของหาย “${items[0].title}” ได้รับการอนุมัติแล้ว`,
        type: "lost_item_approved",
        relatedId: itemId,
      });

      await createActivityLog(pool, {
        userId: Number(req.user.userId),
        action: "lost_item_approved",
        targetType: "lost_item",
        targetId: itemId,
        description: `อนุมัติประกาศของหาย “${items[0].title}” #${itemId}${staffNote ? `: ${staffNote}` : ""}`,
      });

      res.json({
        success: true,

        message:
          "อนุมัติประกาศเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error(
        "Approve Lost Item Error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "ไม่สามารถอนุมัติประกาศได้",
        });
    }
  }
);

// ========================================
// STAFF REJECT
// ========================================

app.patch(
  "/api/staff/lost-items/:id/reject",

  authenticateToken,
  requireStaff,

  async (
    req,
    res
  ) => {
    try {
      const itemId =
        Number(
          req.params.id
        );

      const staffNote =
        String(
          req.body.staffNote ||
            ""
        ).trim();

      if (
        !Number.isInteger(
          itemId
        ) ||
        itemId <= 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "รหัสประกาศไม่ถูกต้อง",
          });
      }

      if (!staffNote) {
        return res
          .status(400)
          .json({
            message:
              "กรุณาระบุเหตุผลที่ปฏิเสธ",
          });
      }

      const [items] =
        await pool.query(
          `
          SELECT
            id,
            user_id,
            title,
            status
          FROM lost_items
          WHERE id = ?
          LIMIT 1
          `,
          [itemId]
        );

      if (
        items.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "ไม่พบประกาศ",
          });
      }

      if (
        items[0].status !==
        "pending"
      ) {
        return res
          .status(409)
          .json({
            message:
              "ประกาศนี้ถูกตรวจสอบไปแล้ว",
          });
      }

      await pool.query(
        `
        UPDATE lost_items
        SET
          status = 'rejected',
          staff_note = ?,
          approved_by = NULL,
          approved_at = NULL
        WHERE id = ?
        `,
        [
          staffNote,
          itemId,
        ]
      );

      await createNotification(pool, {
        userId: items[0].user_id,
        title: "ประกาศไม่ผ่านการตรวจสอบ",
        message: `ประกาศของหาย “${items[0].title}” ถูกปฏิเสธ${staffNote ? `: ${staffNote}` : ""}`,
        type: "lost_item_rejected",
        relatedId: itemId,
      });

      await createActivityLog(pool, {
        userId: Number(req.user.userId),
        action: "lost_item_rejected",
        targetType: "lost_item",
        targetId: itemId,
        description: `ปฏิเสธประกาศของหาย “${items[0].title}” #${itemId}${staffNote ? `: ${staffNote}` : ""}`,
      });

      res.json({
        success: true,

        message:
          "ปฏิเสธประกาศเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error(
        "Reject Lost Item Error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "ไม่สามารถปฏิเสธประกาศได้",
        });
    }
  }
);

// ========================================
// STAFF FOUND ITEMS
// ========================================

app.get(
  "/api/staff/found-items",

  authenticateToken,
  requireStaff,

  async (req, res) => {
    try {
      const status = String(
        req.query.status || "pending"
      ).toLowerCase();

      const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
        "returned",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "สถานะไม่ถูกต้อง",
        });
      }

      const [rows] = await pool.query(
        `
        SELECT
          fi.id,
          fi.title,
          fi.description,
          fi.contact,
          fi.location,
          fi.found_date,
          fi.found_time,
          fi.image,
          fi.status,
          fi.staff_note,
          fi.created_at,

          c.name AS category_name,

          u.name AS user_name,
          u.email AS user_email

        FROM found_items fi

        LEFT JOIN categories c
          ON c.id = fi.category_id

        INNER JOIN users u
          ON u.id = fi.user_id

        WHERE fi.status = ?

        ORDER BY
          fi.created_at DESC,
          fi.id DESC
        `,
        [status]
      );

      const items = rows.map((row) => ({
        ...row,
        type: "found",
      }));

      return res.json({
        items,
      });
    } catch (error) {
      console.error(
        "Staff Found Items Error:",
        error
      );

      return res.status(500).json({
        message:
          "ไม่สามารถโหลดรายการของที่พบได้",
      });
    }
  }
);


// ========================================
// STAFF FOUND ITEM DETAIL
// ========================================

app.get(
  "/api/staff/found-items/:id",

  authenticateToken,
  requireStaff,

  async (req, res) => {
    try {
      const itemId = Number(
        req.params.id
      );

      if (
        !Number.isInteger(itemId) ||
        itemId <= 0
      ) {
        return res.status(400).json({
          message:
            "รหัสประกาศไม่ถูกต้อง",
        });
      }

      const [rows] = await pool.query(
        `
        SELECT
          fi.*,

          c.name AS category_name,

          u.name AS user_name,
          u.email AS user_email,
          u.phone AS user_phone

        FROM found_items fi

        LEFT JOIN categories c
          ON c.id = fi.category_id

        INNER JOIN users u
          ON u.id = fi.user_id

        WHERE fi.id = ?

        LIMIT 1
        `,
        [itemId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          message: "ไม่พบประกาศ",
        });
      }

      const [images] = await pool.query(
        `
        SELECT
          id,
          image_path

        FROM found_item_images

        WHERE found_item_id = ?

        ORDER BY id ASC
        `,
        [itemId]
      );

      const item = {
        ...rows[0],
        type: "found",
        images,
      };

      return res.json({
        item,
      });
    } catch (error) {
      console.error(
        "Staff Found Item Detail Error:",
        error
      );

      return res.status(500).json({
        message:
          "ไม่สามารถโหลดรายละเอียดของที่พบได้",
      });
    }
  }
);


// ========================================
// STAFF APPROVE FOUND ITEM
// ========================================

app.patch(
  "/api/staff/found-items/:id/approve",

  authenticateToken,
  requireStaff,

  async (req, res) => {
    try {
      const itemId = Number(
        req.params.id
      );

      const staffNote = String(
        req.body.staffNote || ""
      ).trim();

      if (
        !Number.isInteger(itemId) ||
        itemId <= 0
      ) {
        return res.status(400).json({
          message:
            "รหัสประกาศไม่ถูกต้อง",
        });
      }

      const [items] = await pool.query(
        `
        SELECT
          id,
          user_id,
          title,
          status

        FROM found_items

        WHERE id = ?

        LIMIT 1
        `,
        [itemId]
      );

      if (items.length === 0) {
        return res.status(404).json({
          message: "ไม่พบประกาศ",
        });
      }

      if (
        items[0].status !== "pending"
      ) {
        return res.status(409).json({
          message:
            "ประกาศนี้ถูกตรวจสอบไปแล้ว",
        });
      }

      await pool.query(
        `
        UPDATE found_items

        SET
          status = 'approved',
          staff_note = ?,
          approved_by = ?,
          approved_at = NOW()

        WHERE id = ?
        `,
        [
          staffNote || null,
          req.user.userId,
          itemId,
        ]
      );

      await createNotification(pool, {
        userId: items[0].user_id,
        title: "ประกาศได้รับการอนุมัติ",
        message: `ประกาศของที่พบ “${items[0].title}” ได้รับการอนุมัติแล้ว`,
        type: "found_item_approved",
        relatedId: itemId,
      });

      await createActivityLog(pool, {
        userId: Number(req.user.userId),
        action: "found_item_approved",
        targetType: "found_item",
        targetId: itemId,
        description: `อนุมัติประกาศของพบ “${items[0].title}” #${itemId}${staffNote ? `: ${staffNote}` : ""}`,
      });

      return res.json({
        success: true,
        message:
          "อนุมัติประกาศของที่พบเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error(
        "Approve Found Item Error:",
        error
      );

      return res.status(500).json({
        message:
          "ไม่สามารถอนุมัติประกาศได้",
      });
    }
  }
);


// ========================================
// STAFF REJECT FOUND ITEM
// ========================================

app.patch(
  "/api/staff/found-items/:id/reject",

  authenticateToken,
  requireStaff,

  async (req, res) => {
    try {
      const itemId = Number(
        req.params.id
      );

      const staffNote = String(
        req.body.staffNote || ""
      ).trim();

      if (
        !Number.isInteger(itemId) ||
        itemId <= 0
      ) {
        return res.status(400).json({
          message:
            "รหัสประกาศไม่ถูกต้อง",
        });
      }

      if (!staffNote) {
        return res.status(400).json({
          message:
            "กรุณาระบุเหตุผลที่ปฏิเสธ",
        });
      }

      const [items] = await pool.query(
        `
        SELECT
          id,
          user_id,
          title,
          status

        FROM found_items

        WHERE id = ?

        LIMIT 1
        `,
        [itemId]
      );

      if (items.length === 0) {
        return res.status(404).json({
          message: "ไม่พบประกาศ",
        });
      }

      if (
        items[0].status !== "pending"
      ) {
        return res.status(409).json({
          message:
            "ประกาศนี้ถูกตรวจสอบไปแล้ว",
        });
      }

      await pool.query(
        `
        UPDATE found_items

        SET
          status = 'rejected',
          staff_note = ?,
          approved_by = NULL,
          approved_at = NULL

        WHERE id = ?
        `,
        [
          staffNote,
          itemId,
        ]
      );

      await createNotification(pool, {
        userId: items[0].user_id,
        title: "ประกาศไม่ผ่านการตรวจสอบ",
        message: `ประกาศของที่พบ “${items[0].title}” ถูกปฏิเสธ${staffNote ? `: ${staffNote}` : ""}`,
        type: "found_item_rejected",
        relatedId: itemId,
      });

      await createActivityLog(pool, {
        userId: Number(req.user.userId),
        action: "found_item_rejected",
        targetType: "found_item",
        targetId: itemId,
        description: `ปฏิเสธประกาศของพบ “${items[0].title}” #${itemId}${staffNote ? `: ${staffNote}` : ""}`,
      });

      return res.json({
        success: true,
        message:
          "ปฏิเสธประกาศของที่พบเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error(
        "Reject Found Item Error:",
        error
      );

      return res.status(500).json({
        message:
          "ไม่สามารถปฏิเสธประกาศได้",
      });
    }
  }
);

// ========================================
// MULTER ERROR
// ========================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(400)
          .json({
            message:
              "รูปภาพแต่ละรูปต้องมีขนาดไม่เกิน 5MB",
          });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res
          .status(400)
          .json({
            message:
              "อัปโหลดรูปได้สูงสุด 3 รูป",
          });
      }

      return res
        .status(400)
        .json({
          message:
            error.message,
        });
    }

    if (error) {
      console.error(
        "Server Error:",
        error
      );

      const safeUploadMessages = new Set([
        "รองรับเฉพาะไฟล์ JPG และ PNG",
      ]);

      const message =
        safeUploadMessages.has(error.message)
          ? error.message
          : "ข้อมูลที่ส่งมาไม่ถูกต้อง";

      return res
        .status(400)
        .json({
          message,
        });
    }

    next();
  }
);

// ========================================
// 404
// ========================================

app.use(
  (req, res) => {
    res
      .status(404)
      .json({
        message:
          "ไม่พบ API ที่เรียกใช้งาน",
      });
  }
);

function validateRuntimeConfig() {
  const missing = [];

  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    String(process.env.JWT_SECRET).length < 32
  ) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters in production"
    );
  }
}

validateRuntimeConfig();

// ========================================
// START SERVER
// ========================================

app.listen(
  PORT,
  () => {
    console.log(
      `Back2You Backend running at http://localhost:${PORT}`
    );
  }
);