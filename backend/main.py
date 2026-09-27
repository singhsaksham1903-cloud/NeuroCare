from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import test_database_connection

from routes.game_sessions import router as game_sessions_router
from routes.recommendation import router as recommendation_router
from routes.memories import router as memories_router
from routes.reminders import router as reminders_router
from routes.auth import router as auth_router
from routes.caregiver_links import router as caregiver_links_router


app = FastAPI(
    title="Cognicare NER API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=[
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS",
    ],
    allow_headers=[
    "Authorization",
    "Content-Type",
    ],
)


app.include_router(game_sessions_router)
app.include_router(recommendation_router)
app.include_router(memories_router)
app.include_router(reminders_router)
app.include_router(auth_router)
app.include_router(caregiver_links_router)


@app.get("/")
def root():
    return {
        "message": "Cognicare NER API is running",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }


@app.get("/db-health")
def database_health():
    try:
        test_database_connection()

        return {
            "status": "connected",
            "database": "cognicare",
        }

    except Exception as error:
        return {
            "status": "error",
            "message": str(error),
        }