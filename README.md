# Instaura IMS - Full-Stack Internal Management System

> **Inventory Management System for Instaura** — Node.js + Express + MongoDB Atlas + Next.js

---

## 🏗️ Architecture

```
Web Client (Next.js)  ──HTTP/REST──▶  Node.js + Express API  ──▶  MongoDB Atlas
```

---

## 📁 Project Structure

The project is organized into two main platforms:

### 1. Web Platform (`ims-platform/`)
The primary internal management system.

- **Backend (`ims-platform/backend/`)**: Node.js + Express API
  - **Models**: User, Project, Task, Client, Goal, Job, Application, Chat, Attendance, etc.
  - **Auth**: JWT verification with role-based access control.
  - **Real-time**: Socket.IO for chat and notifications.
- **Frontend (`ims-platform/frontend/`)**: Next.js 14 Web Dashboard
  - **Design**: Tailwind CSS with sleek glassmorphism themes.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd ims-platform/backend
cp .env.example .env        # Fill in your MONGO_URI and JWT_SECRET
npm install
npm run dev                 # Start server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd ims-platform/frontend
cp .env.example .env.local  # Set NEXT_PUBLIC_API_URL
npm install
npm run dev                 # Start dashboard on http://localhost:3000
```

---

## 🔐 Default Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin3641@instaura.live | Instaura364133 |
| HR | hr@instaura.live | HRInstaura@2024 |
| Employee | employee@instaura.live | Employee@2024 |

---

## 🛡️ Auth Flow

```
User Starts → Frontend App → AuthGuard Checks JWT
  ├── JWT Valid → Redirect to Dashboard
  └── No JWT    → Redirect to Login
        ├── User Login  → API Call → Store Token → Dashboard
        └── User Signup → API Call → Store Token → Dashboard
```

---

## 🌐 Deployment
- **Backend**: Deploy `ims-platform/backend/` to [Render](https://render.com).
- **Frontend**: Deploy `ims-platform/frontend/` to [Vercel](https://vercel.com).

---

## 👤 Author
Made for **Instaura** — [github.com/Prince364133/IMS-SYSTEM](https://github.com/Prince364133/IMS-SYSTEM)
