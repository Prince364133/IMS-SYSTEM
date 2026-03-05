# Instaura IMS — Production Platform

> **Full-Stack Internal Management System** — Node.js + Express + MongoDB Atlas + Next.js

## 🏗️ Project Structure

```
ims-platform/
├── backend/          ← Node.js + Express + MongoDB Atlas
│   ├── server.js     ← Main entry point
│   ├── src/
│   │   ├── config/   ← DB, Redis, Cloudinary, Resend, Sentry
│   │   ├── models/   ← 12 Mongoose schemas
│   │   ├── middleware/ ← Auth, RBAC, Error, Upload, Audit
│   │   ├── routes/   ← 15 API route files
│   │   ├── controllers/ ← 13 controller files
│   │   ├── services/ ← Email, Queue (BullMQ)
│   │   ├── sockets/  ← Socket.IO real-time server
│   │   └── utils/    ← Seed script, date helpers
│   ├── .env.example
│   └── render.yaml   ← Render deployment config
│
└── frontend/         ← Next.js 14 + Tailwind CSS
    ├── app/
    │   ├── login/    ← Login page (glassmorphism + MFA)
    │   ├── dashboard/ ← Role-filtered dashboard + all pages
    │   └── globals.css ← Tailwind design system
    ├── lib/
    │   ├── auth-context.tsx ← JWT + MFA auth state
    │   └── api.ts    ← Axios with auto-refresh interceptor
    └── .env.example
```

## 🚀 Quick Start

### Backend
```bash
cd ims-platform/backend
cp .env.example .env        # Fill in your credentials
npm install
npm run seed                # Create admin + demo users
npm run dev                 # Start on :5000
```

### Frontend
```bash
cd ims-platform/frontend
cp .env.example .env.local  # Set NEXT_PUBLIC_API_URL
npm install
npm run dev                 # Start on :3000
```

## 🔐 Default Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin3641@instaura.live | Instaura364133 |
| HR | hr@instaura.live | HRInstaura@2024 |
| Employee | employee@instaura.live | Employee@2024 |

## 📡 API Endpoints
| Route | Description |
|-------|-------------|
| `/api/auth` | Login, register, logout, MFA, token refresh |
| `/api/users` | User CRUD + photo upload |
| `/api/projects` | Project CRUD + member management |
| `/api/tasks` | Task CRUD with role filtering |
| `/api/clients` | Client CRUD |
| `/api/attendance` | Mark/view attendance + monthly report |
| `/api/hrms` | HR dashboard, attendance/salary reports |
| `/api/salary` | Payroll generation + approval |
| `/api/chat` | Chat rooms + messages |
| `/api/notifications` | Notifications with unread count |
| `/api/files` | File upload/download via Cloudinary |
| `/api/goals` | Goal tracking |
| `/api/jobs` | Recruitment + applications |
| `/api/webhooks` | n8n automation webhooks |
| `/health` | Server + DB health check |

## 🌐 Deployment
- **Backend**: Deploy `ims-platform/backend/` to [Render](https://render.com) using `render.yaml`
- **Frontend**: Deploy `ims-platform/frontend/` to [Vercel](https://vercel.com)

### Required Environment Variables (Backend)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CLOUDINARY_*=...
REDIS_URL=redis://...
RESEND_API_KEY=...
SENTRY_DSN=...
CLIENT_URL=https://your-frontend.vercel.app
```
