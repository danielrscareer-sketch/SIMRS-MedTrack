"""
FastAPI application entry point for SIMRS MedTrack — SaaS Fakultas Kedokteran.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import auth, stase, logbook, tugas, dosen, admin
from app.core.config import settings
import os
import sys

# Ensure Vercel compatibility
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks (if any)
    yield
    # Shutdown tasks (if any)

app = FastAPI(
    title="SIMRS MedTrack — SaaS Fakultas Kedokteran",
    description=(
        "Sistem Informasi Manajemen Rumah Sakit khusus Fakultas Kedokteran. "
        "Mengelola rotasi stase klinis, pencatatan logbook SOAP medis harian, "
        "bimbingan pembimbing klinik (dosen/dokter spesialis), penugasan akademik, "
        "dan rekapitulasi nilai akhir oleh bagian TU secara terpadu."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS MIDDLEWARE ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ROUTERS REGISTRATION ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(stase.router)
app.include_router(logbook.router)
app.include_router(tugas.router)
app.include_router(dosen.router)
app.include_router(admin.router)

# ── HEALTH CHECK ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status":  "healthy",
        "service": "SIMRS MedTrack API",
        "version": "2.0.0",
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Welcome to SIMRS MedTrack — SaaS Fakultas Kedokteran API",
        "docs":    "/docs",
        "health":  "/health",
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
