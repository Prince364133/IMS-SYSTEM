from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base, SessionLocal
from .models.user import User
from .middleware.auth import get_password_hash

# Import all routers
from .routers import auth, users, projects, tasks, clients, goals, jobs, applications, chat, attendance, hrms

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        super_admin = db.query(User).filter(User.email == "admin3641@instaura.live").first()
        if not super_admin:
            hashed_pwd = get_password_hash("Instaura364133")
            new_admin = User(
                name="Super Admin",
                email="admin3641@instaura.live",
                password=hashed_pwd,
                role="superadmin",
                is_active=True
            )
            db.add(new_admin)
            db.commit()
    finally:
        db.close()
    yield

app = FastAPI(title="Instaura IMS API - Python", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,

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

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Instaura IMS Python API is running."}
