# Instaura IMS — Modern Production Platform

> **The Ultimate Internal Management System** — Node.js + Next.js + MongoDB Atlas + Multi-AI (Gemini/Groq/OpenAI) + Dual Storage (Cloudinary/Google Drive)

## ✨ Premium Features

- **🚀 Two-Step Intelligent Setup**: First-time installation features a dynamic database connection wizard and secure Admin initialization.
- **🤖 Multi-AI Core**: Built-in support for Google Gemini, OpenAI, and Groq with real-time AI context-aware insights.
- **📦 Advanced Inventory**: Automated low-stock alerts and transaction history tracking.
- **☁️ Dual Storage Strategy**: Switch seamlessly between Cloudinary and Google Drive with local storage fallbacks.
- **📧 Dynamic Email Engine**: Automated welcome, project assignment, and salary generation emails with fully configurable SMTP/Resend.
- **📊 Real-time Dashboard**: Live status tracking and weekly growth analytics.
- **📖 Integrated Help Center**: Complete interactive documentation and system guides built directly into the dashboard.
- **💰 Custom Salary Workflow**: Automated drafting, HR reviews, and automated dispatch of salary slips based on dynamic absence calculations.
- **📂 Secure Document Management**: Centralized file storage with forced Google Drive integration for strict compliance.
- **🧹 Bulk Data Management**: Advanced administrative tools for full system reset or date-range data purging.

## 🏗️ Project Structure

```
ims-platform/
├── backend/          ← Node.js + Express + MongoDB Atlas
│   ├── src/
│   │   ├── config/   ← DB, Redis, Cloudinary, Drive, Resend, Sentry
│   │   ├── models/   ← 14+ Mongoose schemas (includes CompanyConfig, AuditLogs)
│   │   ├── routes/   ← 30+ API route sections
│   │   └── services/ ← AI, Email, Google Drive, File Storage
│   └── render.yaml   ← Render deployment configuration
│
└── frontend/         ← Next.js 14 (App Router) + Tailwind CSS
    ├── app/
    │   ├── signup/   ← Dynamic DB Setup + Admin Creation
    │   ├── dashboard/ ← Multi-role interface + Help Center
    │   └── login/    ← Glassmorphism Auth
    └── lib/
        ├── auth-context.tsx ← RBAC & JWT State
        └── settings-context.tsx ← White-label & System Config
```

## 🚀 Quick Start (Production Mode)

The system is now **Setup-Ready**. You don't need to manually configure the `.env` for the database.

### 1. Backend Start
```bash
cd ims-platform/backend
npm install
npm run dev                 # Start on :5000
```

### 2. Frontend Launch
```bash
cd ims-platform/frontend
npm install
npm run dev                 # Start on :3000
```

### 3. Initialize System
1. Open `http://localhost:3000/signup`.
2. Enter your **MongoDB Atlas** credentials (Username, Password, Cluster URL).
3. Once connected, create your **Primary Admin** account.
4. Log in and access the full system!

## 🔐 Default Role Structure
- **Admin**: Full system control, AI/Storage config, Data management.
- **HR**: Recruitment, Payroll approval, Attendance reports.
- **Manager**: Project oversight and task management.
- **Employee**: Attendance, Tasks, and personal Payroll Slips.
- **Client**: Project tracking and document viewing.

## 🌐 Deployment
- **Backend**: Use `render.yaml` for one-click deployment to [Render](https://render.com).
- **Frontend**: Connect your GitHub repository to [Vercel](https://vercel.com).

---
© 2026 Instaura. All Rights Reserved.
