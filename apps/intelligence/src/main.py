# apps/intelligence/src/main.py
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

# 1. Import BOTH Engine Routers
from src.api.routes.evidence_router import router as evidence_router
from src.api.routes.cie_router import router as cie_router
from src.api.routes.rie_router import router as rie_router
from src.api.routes.mie_router import router as mie_router
from src.api.routes.upe_router import router as upe_router
from src.api.routes.ade_router import router as ade_router

app = FastAPI(
    title="CareerOS — Intelligence Engine Services",
    description="Core Intelligence Suite: EIE (Evidence & Evaluation) and CIE (Career Intelligence)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Explicitly Mount BOTH Routers
app.include_router(evidence_router)
app.include_router(cie_router)
app.include_router(rie_router)
app.include_router(mie_router)
app.include_router(upe_router)
app.include_router(ade_router)

@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "CareerOS-Intelligence-Suite",
        "engine":["EIE", "CIE", "RIE"],
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)