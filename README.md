<<<<<<< HEAD
# Instaura IMS

> Inventory Management System for Instaura — Flutter Mobile App + Node.js/MongoDB Backend

---

## 🏗️ Architecture

```
Flutter App (Mobile)  ──HTTP/REST──▶  Node.js + Express API  ──▶  MongoDB Atlas
```

---

## 📁 Folder Structure

```
INSTAURA-WEB/
├── backend/                    # Node.js + Express + MongoDB API
│   ├── server.js               # Entry point
│   ├── package.json
│   ├── .env.example            # Copy to .env and fill in values
│   ├── middleware/
│   │   └── auth.js             # JWT verification
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── Client.js
│   │   ├── Goal.js
│   │   ├── Job.js
│   │   ├── Application.js
│   │   └── Chat.js
│   └── routes/                 # Express REST endpoints
│       ├── auth.js             # POST /api/auth/login, /register, GET /api/auth/me
│       ├── users.js            # /api/users
│       ├── projects.js         # /api/projects
│       ├── tasks.js            # /api/tasks
│       ├── clients.js          # /api/clients
│       ├── goals.js            # /api/goals
│       ├── jobs.js             # /api/jobs
│       ├── applications.js     # /api/applications
│       └── chat.js             # /api/chat
│
└── flutter_app/                # Flutter mobile app
    ├── pubspec.yaml
    └── lib/
        ├── main.dart           # Entry point + GoRouter
        ├── alt_nav_model.dart  # FlutterFlow nav model
        ├── flutter_flow/       # FlutterFlow bridge layer
        ├── services/
        │   ├── api_service.dart    # HTTP client (JWT injected)
        │   └── auth_service.dart   # Auth state + token storage
        ├── pages/
        │   ├── auth/           # Login, Register, Auth Guard
        │   ├── home/           # Dashboard
        │   ├── projects/       # Projects CRUD + Tasks
        │   ├── people/         # Team, Clients, Goals, Jobs
        │   ├── chat/           # DM + Group chat
        │   ├── ams/            # Attendance Management
        │   └── webflow/        # Webflow embed
        └── widgets/
            └── nav_wrapper.dart    # Sidebar navigation wrapper
```

---

## 🚀 Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env → fill in MONGO_URI and JWT_SECRET

npm install
npm run dev
# Server runs on http://localhost:5000
```

### Key REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Current user (Bearer token) |
| GET | `/api/projects` | All projects (paginated) |
| POST | `/api/projects` | Create project |
| GET | `/api/tasks?projectId=X` | Tasks by project |
| GET | `/api/chat` | All conversations |
| POST | `/api/chat/:id/messages` | Send message |

---

## 📱 Flutter App Setup

> **Requires Flutter SDK 3.x and Dart 3.x**

```bash
cd flutter_app
flutter pub get
flutter run
```

### Configure API URL

In `lib/services/api_service.dart`, change `kBaseUrl` to your backend URL:

```dart
// Dev (Android emulator) — 10.0.2.2 maps to localhost
const String kBaseUrl = 'http://10.0.2.2:5000/api';

// Production
const String kBaseUrl = 'https://your-backend.onrender.com/api';
```

---

## 📋 Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email/password auth |
| Home | `/home` | Dashboard + stats |
| Projects | `/projects` | Projects list |
| Project Detail | `/projects/:id` | Full project view |
| Tasks | `/projects/:id/tasks` | Task list with filter |
| Team | `/team` | All employees |
| Employee | `/team/:id` | Profile + goals |
| Clients | `/clients` | Client list |
| Chat | `/chat` | DM + group conversations |
| AMS | `/ams` | Attendance management |
| Jobs | `/jobs` | Job postings panel |
| Webflow | `/webflow` | Instaura website embed |

---

## 🛡️ Auth Flow

```
App Start → /auth (AuthGuard)
  ├── JWT found → /home
  └── No JWT   → /login
        ├── Login  → POST /api/auth/login → store JWT → /home
        └── Register → POST /api/auth/register → store JWT → /home
```

---

## 🌐 Deployment

### Backend (Render)
1. Create new Web Service on [render.com](https://render.com)
2. Root directory: `backend`
3. Start command: `npm start`
4. Environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`

### Flutter (Android)
```bash
flutter build apk --release
```

---

## 👤 Author

Made for **Instaura** — [github.com/Prince364133/INSTAURA-WEB](https://github.com/Prince364133/INSTAURA-WEB)
=======
# IMS-SYSTEM
>>>>>>> ed37f47ad24c87a90855d96e3305941e15eceabd
