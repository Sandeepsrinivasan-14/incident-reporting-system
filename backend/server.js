require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || "your-secret-key-change-in-production";

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Utility: Priority levels
const PRIORITY_LEVELS = { low: 1, medium: 2, high: 3, critical: 4 };

// Middleware: JWT Authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ==================== AUTH ENDPOINTS ====================

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role required" });
    }

    if (!["REPORTER", "RESOLVER"].includes(role)) {
      return res.status(400).json({ error: "Role must be REPORTER or RESOLVER" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role },
    });

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
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
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

// ==================== INCIDENT ENDPOINTS ====================

// GET ALL INCIDENTS (REPORTERS see their own, RESOLVERS see all)
app.get("/api/incidents", authenticateToken, async (req, res) => {
  try {
    let incidents;

    if (req.user.role === "RESOLVER") {
      incidents = await prisma.incident.findMany({
        include: { reporter: { select: { id: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else if (req.user.role === "REPORTER") {
      incidents = await prisma.incident.findMany({
        where: { reporterId: req.user.id },
        include: { reporter: { select: { id: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

// GET REPORTER'S INCIDENTS
app.get("/api/incidents/reporter/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== parseInt(userId) && req.user.role !== "RESOLVER") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const incidents = await prisma.incident.findMany({
      where: { reporterId: parseInt(userId) },
      include: { reporter: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(incidents);
  } catch (error) {
    console.error("Error fetching reporter incidents:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

// CREATE INCIDENT (REPORTER only)
app.post("/api/incidents", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "REPORTER") {
      return res.status(403).json({ error: "Only reporters can create incidents" });
    }

    const { title, description, priority } = req.body;

    if (!title || !priority) {
      return res.status(400).json({ error: "Title and priority required" });
    }

    if (!["low", "medium", "high", "critical"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority level" });
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        description: description || "",
        priority,
        status: "open",
        reporterId: req.user.id,
      },
      include: { reporter: { select: { id: true, email: true } } },
    });

    res.json(incident);
  } catch (error) {
    console.error("Error creating incident:", error);
    res.status(500).json({ error: "Failed to create incident" });
  }
});

// UPDATE INCIDENT (RESOLVER only - WITH PRIORITY PROTECTION)
app.patch("/api/incidents/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "RESOLVER") {
      return res.status(403).json({ error: "Only resolvers can update incidents" });
    }

    const { id } = req.params;
    const { status, priority } = req.body;

    const incident = await prisma.incident.findUnique({ where: { id: parseInt(id) } });

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // CRITICAL RULE: PREVENT PRIORITY DOWNGRADE
    if (priority && PRIORITY_LEVELS[priority] < PRIORITY_LEVELS[incident.priority]) {
      return res.status(400).json({
        error: `Cannot downgrade priority from ${incident.priority} to ${priority}`,
      });
    }

    const updated = await prisma.incident.update({
      where: { id: parseInt(id) },
      data: {
        status: status || undefined,
        priority: priority || undefined,
      },
      include: { reporter: { select: { id: true, email: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating incident:", error);
    res.status(500).json({ error: "Failed to update incident" });
  }
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
  console.log(`? Server running on http://localhost:${PORT}`);
  console.log(`?? Database: Prisma ORM connected`);
  console.log(`?? JWT Authentication active`);
  console.log(`??  Priority Downgrade Prevention: ENABLED`);
});
