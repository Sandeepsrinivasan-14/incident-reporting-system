import jwt from "jsonwebtoken";

const DEV_FALLBACK_SECRET = "change-this-secret";

// A missing JWT_SECRET must never silently fall back to a well-known value in production,
// because anyone could then forge tokens. Development/test keep the convenient fallback.
export function resolveJwtSecret(env = process.env) {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  if (env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return DEV_FALLBACK_SECRET;
}

export function createAuth(secret) {
  function signToken(user) {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: "7d" });
  }

  function authMiddleware(req, res, next) {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(h.slice(7), secret);
      next();
    } catch {
      res.status(401).json({ error: "Token invalid or expired" });
    }
  }

  function requireResolver(req, res, next) {
    if (req.user.role !== "RESOLVER") return res.status(403).json({ error: "Resolvers only" });
    next();
  }

  return { signToken, authMiddleware, requireResolver };
}
