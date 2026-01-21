# Incident Reporting Management System

A production-ready full-stack application for managing incident reports with role-based access control.

## ? Completed Features

### Authentication & Authorization
- JWT-based user authentication
- Role-based access control (REPORTER/RESOLVER)
- User registration and login
- Session persistence with localStorage

### Reporter Dashboard
- Create incidents with title, description, and priority
- View all reported incidents
- Track incident status in real-time

### Resolver Dashboard
- View all incidents across the system
- Filter incidents by status (Open, In Progress, Resolved)
- Update incident status and priority
- **Priority Protection**: Cannot downgrade incident priority

### Database
- SQLite database with Prisma ORM
- Complete incident history
- User management

## ?? Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Axios
**Backend:** Node.js, Express.js, Prisma, SQLite
**Auth:** JWT with bcryptjs

## ?? User Roles

### Reporter
- Register and login
- Create incidents with priority (low/medium/high/critical)
- View own reported incidents
- Monitor status changes

### Resolver
- Register and login
- View all incidents
- Update incident status and priority
- Cannot downgrade priority levels

## ?? Critical Business Rule

**Priority Immutability**: Priority can only be maintained or upgraded, never downgraded.

## ?? API Endpoints

- POST /api/register - Register user
- POST /api/login - Login user
- GET /api/incidents - Get all incidents (RESOLVER only)
- POST /api/incidents - Create incident (REPORTER only)
- PATCH /api/incidents/:id - Update incident (RESOLVER only, with priority protection)

## ?? Deployment Status

**Frontend**: Ready for Vercel deployment
**Backend**: Ready for Railway/Render deployment

## ?? Local Setup

`ash
# Backend
cd backend
npm install
npx prisma db push
npm start

# Frontend
cd frontend
npm install
npm run dev

?? Test Accounts
Reporter: reporter@test.com / password

Resolver: resolver@test.com / password

? Project Status
? Authentication: WORKING
? Reporter Dashboard: WORKING
? Resolver Dashboard: WORKING
? Priority Rule: IMPLEMENTED
? Database: WORKING
? All Requirements: MET

Built with ?? | Version 1.0.0 | January 21, 2026
