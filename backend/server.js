require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.JWT_SECRET || "change-this-secret-in-production";

// Security headers
app.use(helmet());

// CORS — allow Vite dev server and production frontend
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, mobile, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);

app.use(express.json({ limit: "10kb" }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api", apiLimiter);

// Priority levels
const PRIORITY_LEVELS = { low: 1, medium: 2, high: 3, critical: 4 };

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==================== AUTH ====================

app.post("/api/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role are required" });
    }

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (!["REPORTER", "RESOLVER"].includes(role)) {
      return res.status(400).json({ error: "Role must be REPORTER or RESOLVER" });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashedPassword, role },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: typeof email === "string" ? email.toLowerCase() : "" },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// ==================== INCIDENTS ====================

app.get("/api/incidents", authenticateToken, async (req, res) => {
  try {
    const where = req.user.role === "REPORTER" ? { reporterId: req.user.id } : {};
    const incidents = await prisma.incident.findMany({
      where,
      include: { reporter: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(incidents);
  } catch (error) {
    console.error("Fetch incidents error:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

app.post("/api/incidents", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "REPORTER") {
      return res.status(403).json({ error: "Only reporters can create incidents" });
    }

    const { title, description, priority } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: "Title must be 200 characters or less" });
    }
    if (!priority || !["low", "medium", "high", "critical"].includes(priority)) {
      return res.status(400).json({ error: "Priority must be low, medium, high, or critical" });
    }

    const incident = await prisma.incident.create({
      data: {
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : "",
        priority,
        status: "open",
        reporterId: req.user.id,
      },
      include: { reporter: { select: { id: true, email: true } } },
    });

    res.status(201).json(incident);
  } catch (error) {
    console.error("Create incident error:", error);
    res.status(500).json({ error: "Failed to create incident" });
  }
});

app.patch("/api/incidents/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "RESOLVER") {
      return res.status(403).json({ error: "Only resolvers can update incidents" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid incident ID" });

    const { status, priority } = req.body;

    const validStatuses = ["open", "in_progress", "resolved"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return res.status(404).json({ error: "Incident not found" });

    if (priority && PRIORITY_LEVELS[priority] < PRIORITY_LEVELS[incident.priority]) {
      return res.status(400).json({
        error: `Cannot downgrade priority from ${incident.priority} to ${priority}`,
      });
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
      },
      include: { reporter: { select: { id: true, email: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update incident error:", error);
    res.status(500).json({ error: "Failed to update incident" });
  }
});

// 404 for unknown API routes
app.use("/api/{*splat}", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
