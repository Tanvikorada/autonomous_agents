"""
main.py — FastAPI application entry point.

Run with:
    uvicorn backend.main:app --reload --port 8000
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router

# ── Logging setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Autonomous Multi-Agent Software Engineering System",
    description=(
        "An AI system that takes a problem statement and pipes it through "
        "4 specialized agents: Planner → Coder → Tester → Reviewer."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — allow Next.js dev server ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*" # Allow any frontend domain (Vercel)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routes ────────────────────────────────────────────────────────────
app.include_router(router)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "Autonomous Multi-Agent System is running.",
        "docs": "/docs",
        "health": "/api/health",
    }


# ── Dev entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
