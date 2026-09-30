from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.api.workspaces import router as workspaces_router
import os

app = FastAPI(
    title="Agentic Flow API",
    description="Multi-Agent Content Generation System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

app.include_router(workspaces_router, prefix="/api/v1/workspaces", tags=["workspaces"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Agentic Flow API"}
