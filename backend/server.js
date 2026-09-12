import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

// ── Uploads directory ──────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Multer ─────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|txt|log|csv|json|zip/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

// ── Email ──────────────────────────────────────────────────────────────────────
const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function sendEmail({ to, subject, html }) {
  if (!mailer) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await mailer.sendMail({ from: process.env.SMTP_FROM || "noreply@incidentmanager.io", to, subject, html });
  } catch (e) {
    console.error("[EMAIL ERROR]", e.message);
  }
}

// ── SLA deadlines by priority ──────────────────────────────────────────────────
const SLA_HOURS = { critical: 1, high: 4, medium: 24, low: 72 };
function slaDeadline(priority) {
  const h = SLA_HOURS[priority] || 24;
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({ origin: (o, cb) => (!o || allowedOrigins.includes(o) ? cb(null, true) : cb(new Error("CORS"))), methods: ["GET","POST","PATCH","DELETE","OPTIONS"] }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const apiLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/{*splat}", apiLimiter);

// ── Auth helpers ───────────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}
function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Token invalid or expired" }); }
}
function requireResolver(req, res, next) {
  if (req.user.role !== "RESOLVER") return res.status(403).json({ error: "Resolvers only" });
  next();
}

// ── Audit helper ───────────────────────────────────────────────────────────────
async function audit(incidentId, userId, action, field = null, oldValue = null, newValue = null) {
  await prisma.auditLog.create({ data: { incidentId, userId, action, field, oldValue: oldValue ? String(oldValue) : null, newValue: newValue ? String(newValue) : null } });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

app.get("/health", (_, res) => res.json({ status: "ok", timestamp: new Date() }));

// ── Register ───────────────────────────────────────────────────────────────────
app.post("/api/register", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Valid email required" });
    if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    if (!["REPORTER","RESOLVER"].includes(role)) return res.status(400).json({ error: "Role must be REPORTER or RESOLVER" });
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "Email already registered" });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email: email.toLowerCase(), password: hashed, role } });
    res.status(201).json({ token: signToken(user), user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

// ── Login ──────────────────────────────────────────────────────────────────────
app.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Invalid email or password" });
    res.json({ token: signToken(user), user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

// ── Get resolvers (for assignment dropdown) ────────────────────────────────────
app.get("/api/resolvers", authMiddleware, async (req, res, next) => {
  try {
    const resolvers = await prisma.user.findMany({ where: { role: "RESOLVER" }, select: { id: true, email: true } });
    res.json(resolvers);
  } catch (e) { next(e); }
});

// ── List incidents ─────────────────────────────────────────────────────────────
app.get("/api/incidents", authMiddleware, async (req, res, next) => {
  try {
    const where = req.user.role === "REPORTER" ? { reporterId: req.user.id } : {};
    const incidents = await prisma.incident.findMany({
      where,
      include: {
        reporter:    { select: { id: true, email: true } },
        assignee:    { select: { id: true, email: true } },
        attachments: { select: { id: true, filename: true, originalName: true, mimetype: true, size: true, createdAt: true } },
        _count:      { select: { auditLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(incidents);
  } catch (e) { next(e); }
});

// ── Create incident ────────────────────────────────────────────────────────────
app.post("/api/incidents", authMiddleware, async (req, res, next) => {
  try {
    const { title, description, priority = "medium" } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    if (title.length > 200) return res.status(400).json({ error: "Title must be ≤ 200 characters" });
    if (!["low","medium","high","critical"].includes(priority)) return res.status(400).json({ error: "Invalid priority" });
    const incident = await prisma.incident.create({
      data: { title: title.trim(), description: description?.trim() || "", priority, reporterId: req.user.id, slaDeadline: slaDeadline(priority) },
      include: { reporter: { select: { id: true, email: true } }, assignee: { select: { id: true, email: true } }, attachments: true },
    });
    await audit(incident.id, req.user.id, "created");
    res.status(201).json(incident);
  } catch (e) { next(e); }
});

// ── Update incident ────────────────────────────────────────────────────────────
const PRIORITY_LEVELS = { low: 1, medium: 2, high: 3, critical: 4 };

app.patch("/api/incidents/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.incident.findUnique({ where: { id }, include: { reporter: true, assignee: true } });
    if (!existing) return res.status(404).json({ error: "Incident not found" });
    if (req.user.role === "REPORTER" && existing.reporterId !== req.user.id)
      return res.status(403).json({ error: "Access denied" });

    const { status, priority, notes, assigneeId } = req.body;
    const data = {};
    const auditEntries = [];

    if (status && status !== existing.status) {
      const valid = ["open","in_progress","resolved"];
      if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
      if (req.user.role !== "RESOLVER") return res.status(403).json({ error: "Only resolvers can change status" });
      data.status = status;
      auditEntries.push(["status_changed", "status", existing.status, status]);
    }
    if (priority && priority !== existing.priority) {
      if (!["low","medium","high","critical"].includes(priority)) return res.status(400).json({ error: "Invalid priority" });
      if (req.user.role !== "RESOLVER") return res.status(403).json({ error: "Only resolvers can change priority" });
      if (PRIORITY_LEVELS[priority] < PRIORITY_LEVELS[existing.priority])
        return res.status(400).json({ error: "Priority can only be upgraded, not downgraded" });
      data.priority = priority;
      auditEntries.push(["priority_changed", "priority", existing.priority, priority]);
    }
    if (notes !== undefined) {
      data.notes = typeof notes === "string" ? notes.trim() || null : null;
    }
    if (assigneeId !== undefined) {
      if (req.user.role !== "RESOLVER") return res.status(403).json({ error: "Only resolvers can assign incidents" });
      if (assigneeId === null) {
        data.assigneeId = null;
        if (existing.assigneeId) auditEntries.push(["unassigned", "assignee", String(existing.assigneeId), null]);
      } else {
        const resolver = await prisma.user.findFirst({ where: { id: Number(assigneeId), role: "RESOLVER" } });
        if (!resolver) return res.status(400).json({ error: "Invalid resolver" });
        data.assigneeId = resolver.id;
        if (existing.assigneeId !== resolver.id)
          auditEntries.push(["assigned", "assignee", existing.assignee?.email || null, resolver.email]);
      }
    }

    const updated = await prisma.incident.update({
      where: { id },
      data,
      include: { reporter: { select: { id: true, email: true } }, assignee: { select: { id: true, email: true } }, attachments: true },
    });

    for (const [action, field, oldVal, newVal] of auditEntries) {
      await audit(id, req.user.id, action, field, oldVal, newVal);
    }

    // Email notifications
    if (data.status === "resolved") {
      await sendEmail({
        to: existing.reporter.email,
        subject: `✅ Incident Resolved: ${existing.title}`,
        html: `<h2>Your incident has been resolved</h2><p><strong>${existing.title}</strong></p>${data.notes ? `<p><strong>Resolution note:</strong> ${data.notes}</p>` : ""}<p>Resolved by: ${req.user.email}</p>`,
      });
    }
    if (data.assigneeId && updated.assignee) {
      await sendEmail({
        to: updated.assignee.email,
        subject: `📋 Incident Assigned to You: ${existing.title}`,
        html: `<h2>You've been assigned an incident</h2><p><strong>${existing.title}</strong></p><p>Priority: ${updated.priority}</p><p>Description: ${existing.description}</p>`,
      });
    }
    if (data.status === "in_progress" && existing.assignee) {
      await sendEmail({
        to: existing.reporter.email,
        subject: `🔧 Work Started: ${existing.title}`,
        html: `<h2>Work has started on your incident</h2><p><strong>${existing.title}</strong></p><p>Being handled by: ${existing.assignee.email}</p>`,
      });
    }

    res.json(updated);
  } catch (e) { next(e); }
});

// ── Bulk actions ───────────────────────────────────────────────────────────────
app.post("/api/incidents/bulk", authMiddleware, requireResolver, async (req, res, next) => {
  try {
    const { ids, action, notes } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids array required" });
    if (!["resolve","start_work","assign"].includes(action)) return res.status(400).json({ error: "Invalid action" });

    const incidents = await prisma.incident.findMany({ where: { id: { in: ids.map(Number) } }, include: { reporter: true } });
    const results = { success: 0, skipped: 0 };

    for (const inc of incidents) {
      if (action === "resolve" && inc.status !== "resolved") {
        await prisma.incident.update({ where: { id: inc.id }, data: { status: "resolved", notes: notes?.trim() || null } });
        await audit(inc.id, req.user.id, "status_changed", "status", inc.status, "resolved");
        await sendEmail({ to: inc.reporter.email, subject: `✅ Incident Resolved: ${inc.title}`, html: `<h2>Your incident has been resolved</h2><p><strong>${inc.title}</strong></p>` });
        results.success++;
      } else if (action === "start_work" && inc.status === "open") {
        await prisma.incident.update({ where: { id: inc.id }, data: { status: "in_progress" } });
        await audit(inc.id, req.user.id, "status_changed", "status", inc.status, "in_progress");
        results.success++;
      } else {
        results.skipped++;
      }
    }
    res.json({ message: `Bulk action complete`, ...results });
  } catch (e) { next(e); }
});

// ── Get audit log for incident ─────────────────────────────────────────────────
app.get("/api/incidents/:id/audit", authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return res.status(404).json({ error: "Not found" });
    if (req.user.role === "REPORTER" && incident.reporterId !== req.user.id)
      return res.status(403).json({ error: "Access denied" });
    const logs = await prisma.auditLog.findMany({
      where: { incidentId: id },
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(logs);
  } catch (e) { next(e); }
});

// ── Upload attachment ──────────────────────────────────────────────────────────
app.post("/api/incidents/:id/attachments", authMiddleware, upload.single("file"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return res.status(404).json({ error: "Not found" });
    if (req.user.role === "REPORTER" && incident.reporterId !== req.user.id)
      return res.status(403).json({ error: "Access denied" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const att = await prisma.attachment.create({
      data: { filename: req.file.filename, originalName: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size, incidentId: id },
    });
    await audit(id, req.user.id, "attachment_added", "attachment", null, req.file.originalname);
    res.status(201).json(att);
  } catch (e) { next(e); }
});

// ── Delete attachment ──────────────────────────────────────────────────────────
app.delete("/api/incidents/:id/attachments/:attId", authMiddleware, async (req, res, next) => {
  try {
    const att = await prisma.attachment.findFirst({ where: { id: Number(req.params.attId), incidentId: Number(req.params.id) } });
    if (!att) return res.status(404).json({ error: "Not found" });
    const inc = await prisma.incident.findUnique({ where: { id: att.incidentId } });
    if (req.user.role === "REPORTER" && inc.reporterId !== req.user.id) return res.status(403).json({ error: "Access denied" });
    const filePath = path.join(UPLOADS_DIR, att.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.attachment.delete({ where: { id: att.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Export CSV ─────────────────────────────────────────────────────────────────
app.get("/api/incidents/export", authMiddleware, async (req, res, next) => {
  try {
    const where = req.user.role === "REPORTER" ? { reporterId: req.user.id } : {};
    const incidents = await prisma.incident.findMany({
      where, include: { reporter: { select: { email: true } }, assignee: { select: { email: true } } }, orderBy: { createdAt: "desc" },
    });
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["ID","Title","Description","Priority","Status","Reporter","Assignee","SLA Deadline","Notes","Created","Updated"];
    const rows = incidents.map(i => [
      i.id, i.title, i.description, i.priority, i.status,
      i.reporter?.email || "", i.assignee?.email || "",
      i.slaDeadline ? new Date(i.slaDeadline).toISOString() : "",
      i.notes || "", new Date(i.createdAt).toISOString(), new Date(i.updatedAt).toISOString(),
    ].map(escape).join(","));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="incidents-${Date.now()}.csv"`);
    res.send([header.map(escape).join(","), ...rows].join("\n"));
  } catch (e) { next(e); }
});

// ── Analytics ──────────────────────────────────────────────────────────────────
app.get("/api/analytics", authMiddleware, requireResolver, async (req, res, next) => {
  try {
    const incidents = await prisma.incident.findMany({
      include: { reporter: { select: { email: true } }, assignee: { select: { email: true } } },
    });

    // Incidents over last 30 days (grouped by day)
    const now = new Date();
    const dayMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }
    incidents.forEach(inc => {
      const day = new Date(inc.createdAt).toISOString().slice(0, 10);
      if (dayMap[day] !== undefined) dayMap[day]++;
    });
    const dailyCreated = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

    // By priority
    const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };
    incidents.forEach(i => { if (byPriority[i.priority] !== undefined) byPriority[i.priority]++; });

    // By status
    const byStatus = { open: 0, in_progress: 0, resolved: 0 };
    incidents.forEach(i => { if (byStatus[i.status] !== undefined) byStatus[i.status]++; });

    // MTTR (mean time to resolve) in hours
    const resolved = incidents.filter(i => i.status === "resolved");
    const mttr = resolved.length > 0
      ? resolved.reduce((sum, i) => sum + (new Date(i.updatedAt) - new Date(i.createdAt)), 0) / resolved.length / 3600000
      : 0;

    // SLA breached (past deadline and not resolved)
    const slaBreached = incidents.filter(i => i.slaDeadline && new Date(i.slaDeadline) < now && i.status !== "resolved").length;

    // Top reporters
    const reporterMap = {};
    incidents.forEach(i => {
      const e = i.reporter?.email || "unknown";
      reporterMap[e] = (reporterMap[e] || 0) + 1;
    });
    const topReporters = Object.entries(reporterMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([email, count]) => ({ email, count }));

    res.json({ dailyCreated, byPriority, byStatus, mttr: Math.round(mttr * 10) / 10, slaBreached, topReporters, totalIncidents: incidents.length, resolvedCount: resolved.length, resolutionRate: incidents.length > 0 ? Math.round((resolved.length / incidents.length) * 100) : 0 });
  } catch (e) { next(e); }
});

// ── 404 & Error handlers ───────────────────────────────────────────────────────
app.use("/api/{*splat}", (_, res) => res.status(404).json({ error: "Endpoint not found" }));
app.use((err, req, res, _next) => {
  console.error(err);
  if (err.message === "CORS") return res.status(403).json({ error: "CORS policy violation" });
  res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Email: ${mailer ? "SMTP configured" : "console logging (dev mode)"}`);
});
