from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base, AsyncSessionLocal
from sqlalchemy import select
from .models.user import User
from .middleware.auth import get_password_hash

# Import all routers
from .routers import auth, users, projects, tasks, clients, goals, jobs, applications, chat, attendance, hrms, files, health
from .middleware.errors import global_exception_handler
from fastapi.staticfiles import StaticFiles
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure upload directory exists
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR)
        
    # Always ensure all tables exist first (handles fresh SQLite and any missed migrations)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"[startup] Table creation skipped (may already exist): {e}")

    # Seed the hardcoded admin account if not yet created
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(User).filter(User.email == "admin3641@instaura.live"))
            admin = result.scalars().first()
            if not admin:
                hashed_pwd = get_password_hash("Instaura364133")
                new_admin = User(
                    name="Instaura Admin",
                    email="admin3641@instaura.live",
                    password=hashed_pwd,
                    role="admin",  # admin = super admin, same screen
                    is_active=True
                )
                db.add(new_admin)
                await db.commit()
                print("[startup] Admin account created: admin3641@instaura.live")
            else:
                # Ensure the admin always has the correct role
                if admin.role not in ("admin", "superadmin"):
                    admin.role = "admin"
                    await db.commit()
        except Exception as e:
            print(f"[startup] Admin seed error: {e}")
    yield


from .config import settings

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)

# Register Global Exception Handler
app.add_exception_handler(Exception, global_exception_handler)

# Mount static files for uploads access
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(clients.router)
app.include_router(goals.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(chat.router)
app.include_router(attendance.router)
app.include_router(hrms.router)
app.include_router(files.router)
app.include_router(health.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Instaura IMS Python API is running."}
