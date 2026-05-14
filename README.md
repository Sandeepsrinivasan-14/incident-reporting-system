# Incident Reporting Management System

## Project Overview

The Incident Reporting Management System is a full-stack web application designed to streamline the process of reporting and resolving incidents within an organization. **Reporters** can submit incident reports with priority levels, while **Resolvers** can manage, update, and track incidents through to resolution. The system enforces a critical business rule: **incident priority can never be downgraded**, ensuring accountability and proper escalation.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Vanilla CSS, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite with Prisma ORM |
| **Authentication** | JWT (jsonwebtoken) with bcryptjs password hashing |
| **Dev Tools** | Nodemon, Vite Dev Server with API Proxy |

## User Roles and Permissions

### Reporter
- Register and log in to the system
- Create incidents with title, description, and priority (low/medium/high/critical)
- View own reported incidents and track their status
- Cannot view other reporters' incidents
- Cannot update or resolve incidents

### Resolver
- Register and log in to the system
- View **all** reported incidents across the system
- Update incident status: Open → In Progress → Resolved
- Upgrade incident priority (e.g., low → high)
- **Cannot downgrade** incident priority (enforced by backend)
- Cannot create new incidents

## Critical Business Rule

> ⚠️ **Priority Immutability**: Once an incident's priority is set, it can only be **maintained or upgraded**, never downgraded. Any attempt to lower the priority level is rejected by the backend API with a 400 error.

Priority hierarchy: `low (1) < medium (2) < high (3) < critical (4)`

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/register` | Public | Register a new user (email, password, role) |
| `POST` | `/api/login` | Public | Login and receive JWT token |
| `GET` | `/api/incidents` | Authenticated | Get incidents (REPORTER: own only, RESOLVER: all) |
| `GET` | `/api/incidents/reporter/:userId` | Authenticated | Get specific reporter's incidents |
| `POST` | `/api/incidents` | REPORTER only | Create a new incident |
| `PATCH` | `/api/incidents/:id` | RESOLVER only | Update incident status/priority (with priority protection) |

All protected endpoints require `Authorization: Bearer <token>` header.

## Database Schema

### User Table
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | Primary Key, Auto Increment |
| `email` | String | Unique, Required |
| `password` | String | Hashed with bcryptjs |
| `role` | String | "REPORTER" or "RESOLVER" |

### Incident Table
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | Primary Key, Auto Increment |
| `title` | String | Required |
| `description` | String | Required |
| `priority` | String | Default: "MEDIUM" (low/medium/high/critical) |
| `status` | String | Default: "OPEN" (open/in_progress/resolved) |
| `reporterId` | Integer | Foreign Key → User.id |
| `createdAt` | DateTime | Auto-generated |
| `updatedAt` | DateTime | Auto-updated |

## Live Deployment Links

- **Frontend**: [Deployed on Vercel](https://incident-reporting-system.vercel.app)
- **Backend**: [Deployed on Render](https://incident-reporting-system.onrender.com)

## Local Setup

```bash
# Clone the repository
git clone https://github.com/Sandeepsrinivasan-14/incident-reporting-system.git
cd incident-reporting-system

# Backend Setup
cd backend
npm install
npx prisma generate
npx prisma db push
npm start
# Server runs on http://localhost:3001

# Frontend Setup (in a new terminal)
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Reporter | reporter@test.com | password |
| Resolver | resolver@test.com | password |

## Environment Variables

Create a `backend/.env` file with:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=3001
```

## Project Status

- ✅ Authentication: Working (JWT + bcrypt)
- ✅ Reporter Dashboard: Working (create + view incidents)
- ✅ Resolver Dashboard: Working (view all + update status/priority)
- ✅ Priority Rule: Enforced (backend rejects downgrades)
- ✅ Database: Persistent (SQLite via Prisma)
- ✅ Role-Based Access: Enforced on API and UI
- ✅ All Requirements: Met

---
Built with ❤️ | Version 1.0.0
