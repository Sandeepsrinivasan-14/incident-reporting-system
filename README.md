# Incident Reporting Management System

A full-stack web application for reporting, tracking, and resolving incidents within an organization.

**Reporters** submit incidents with priority levels. **Resolvers** manage, escalate, and resolve them. A core business rule is enforced at the API level: **incident priority can never be downgraded**.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express 5 |
| Database | SQLite via Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Security | Helmet, express-rate-limit |

---

## User Roles

### Reporter
- Create incidents with title, description, and priority (low / medium / high / critical)
- View and track own incidents

### Resolver
- View **all** incidents across the system
- Update incident status: Open → In Progress → Resolved
- Upgrade incident priority (downgrade is blocked)

---

## Business Rule: Priority Immutability

Once set, an incident's priority can only be **maintained or upgraded**, never downgraded. Attempts to lower priority are rejected by the backend with a 400 error.

Priority hierarchy: `low (1) < medium (2) < high (3) < critical (4)`

---

## Local Setup

### Prerequisites
- Node.js 18+

### Backend

```bash
cd backend
cp .env.example .env        # edit JWT_SECRET before running in production
npm run setup               # installs deps, generates Prisma client, creates DB, seeds test accounts
npm run dev                 # runs with nodemon on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # runs on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:3001`.

---

## Environment Variables

Create `backend/.env` (see `backend/.env.example`):

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secure-random-string-min-32-chars"
PORT=3001
NODE_ENV=development
FRONTEND_URL="https://your-app.vercel.app"   # optional: restrict CORS in production
```

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Reporter | reporter@test.com | password |
| Resolver | resolver@test.com | password |

---

## API Reference

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/health` | Public | Health check |
| POST | `/api/register` | Public | Register (email, password ≥8 chars, role) |
| POST | `/api/login` | Public | Login → JWT token |
| GET | `/api/incidents` | Auth | Reporter: own incidents · Resolver: all |
| POST | `/api/incidents` | REPORTER | Create incident |
| PATCH | `/api/incidents/:id` | RESOLVER | Update status / upgrade priority |

All protected endpoints require `Authorization: Bearer <token>`.

---

## Production Deployment

**Frontend → Vercel**
- Set up a Vercel project pointing to the `frontend/` directory
- `frontend/vercel.json` routes `/api/*` to your Render backend URL

**Backend → Render (or any Node host)**
- Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`
- Build command: `npm run build`
- Start command: `npm start`

---

## Project Status

- ✅ JWT authentication with bcrypt password hashing
- ✅ Role-based access (Reporter / Resolver)
- ✅ Priority immutability enforced at API level
- ✅ Security headers (Helmet)
- ✅ Rate limiting (20 auth requests / 15 min)
- ✅ Input validation and sanitization
- ✅ Responsive UI (mobile + desktop)
- ✅ Production build verified
