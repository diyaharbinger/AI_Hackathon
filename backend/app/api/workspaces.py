import os
import uuid
import datetime
import json
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional
from app.database.mongodb import get_database
from app.orchestration.pipeline_runner import run_pipeline_async

router = APIRouter()

class WorkspaceCreate(BaseModel):
    title: str
    description: str
    target_format: str
    user_instructions: Optional[str] = None

@router.post("")
async def create_workspace(workspace: WorkspaceCreate):
    db = get_database()
    workspace_id = str(uuid.uuid4())
    doc = {
        "_id": workspace_id,
        "title": workspace.title,
        "description": workspace.description,
        "target_format": workspace.target_format,
        "user_instructions": workspace.user_instructions,
        "status": "CREATED",
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow(),
    }
    if db is not None:
        await db.topic_workspaces.insert_one(doc)
    return {"workspace_id": workspace_id, "status": "CREATED"}

@router.get("")
async def get_workspaces():
    db = get_database()
    if db is None:
        return []
    cursor = db.topic_workspaces.find()
    workspaces = await cursor.to_list(length=100)
    for ws in workspaces:
        ws["id"] = ws.pop("_id")
    return workspaces

@router.post("/{topic_id}/templates")
async def upload_template(topic_id: str, file: UploadFile = File(...)):
    # Simply save file to disk as per Spec A
    storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "templates")
    os.makedirs(storage_dir, exist_ok=True)
    file_path = os.path.join(storage_dir, f"{topic_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    db = get_database()
    template_id = str(uuid.uuid4())
    if db is not None:
        await db.reference_templates.insert_one({
            "_id": template_id,
            "topic_id": topic_id,
            "file_name": file.filename,
            "file_type": file.filename.split(".")[-1].upper(),
            "storage_path": file_path,
            "created_at": datetime.datetime.utcnow()
        })
        
    return {
        "template_id": template_id,
        "file_name": file.filename,
        "file_path": file_path
    }

@router.post("/{topic_id}/generate")
async def generate_document(topic_id: str):
    db = get_database()
    if db is not None:
        await db.topic_workspaces.update_one({"_id": topic_id}, {"$set": {"status": "PROCESSING", "updated_at": datetime.datetime.utcnow()}})
    return {"task_id": f"job-{topic_id}", "status": "PROCESSING"}

@router.get("/{topic_id}/status")
async def get_status(topic_id: str):
    db = get_database()
    if db is not None:
        ws = await db.topic_workspaces.find_one({"_id": topic_id})
        if ws:
            return {"status": ws.get("status", "IDLE")}
    return {"status": "UNKNOWN"}

@router.websocket("/{topic_id}/stream")
async def websocket_endpoint(websocket: WebSocket, topic_id: str):
    await websocket.accept()
    db = get_database()
    
    # Retrieve workspace info
    title = "Autonomous Document"
    description = ""
    target_format = "DOCX"
    user_instructions = None
    template_file_path = None
    
    if db is not None:
        ws = await db.topic_workspaces.find_one({"_id": topic_id})
        if ws:
            title = ws.get("title", title)
            description = ws.get("description", description)
            target_format = ws.get("target_format", target_format)
            user_instructions = ws.get("user_instructions")
            
        template = await db.reference_templates.find_one({"topic_id": topic_id})
        if template:
            template_file_path = template.get("storage_path")

    try:
        # Yield progress events from Member B's pipeline
        async for event in run_pipeline_async(
            topic_id=topic_id,
            title=title,
            description=description,
            target_format=target_format,
            user_instructions=user_instructions,
            template_file_path=template_file_path
        ):
            await websocket.send_text(event.model_dump_json())
            
        if db is not None:
            await db.topic_workspaces.update_one({"_id": topic_id}, {"$set": {"status": "WAITING_FOR_REVIEW", "updated_at": datetime.datetime.utcnow()}})
            
    except WebSocketDisconnect:
        print(f"Client disconnected for topic {topic_id}")
    except Exception as e:
        print(f"Pipeline error: {e}")
        await websocket.send_json({"topic_id": topic_id, "status": "FAILED", "message": str(e), "agent_name": "System"})

from fastapi.responses import PlainTextResponse

@router.get("/{topic_id}/export")
async def export_document(topic_id: str):
    # This is a mock export since Member C's compilers are not available
    return PlainTextResponse("Mock binary content for " + topic_id)
