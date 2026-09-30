# MEMBER A — MODULE SPECIFICATION
**System ID:** `AGENT-101` — Multi-Agent AI Content Generation & Synthesis System  
**Module Name:** `MODULE A: Topic Workspace Platform & Real-Time Gateway Layer`  
**Assigned Developer:** Member A  
**Target Repository Directory:** `frontend/` and `backend/app/api/`, `backend/app/core/`, `backend/app/database/`  
**Git Feature Branch:** `feature/module-a-platform`

---

## 1. Executive Mission & Identity
You are responsible for the **entire interactive user experience** and the **central API gateway platform**. You deliver the web portal where users create topic workspaces, switch between isolated topics without context leakage, upload reference presentation/document templates, monitor real-time multi-agent execution via WebSockets, review generated content drafts, and download finished deliverables.

> **CRITICAL ARCHITECTURAL PRINCIPLE:**  
> During your sprint, you will develop and test 100% locally on your laptop **without needing Member B's live agent pipeline or Member C's document compilers**. You will implement a built-in `MockPipelineService` in FastAPI that emits realistic agent telemetry and serves sample download files.

---

## 2. In-Scope Responsibilities & Submodules

### Submodule A.1: Topic Workspace Tabbed Management
* **Target Directory:** `frontend/src/components/workspaces/`
* **Core Responsibilities:**
  * Render a top navigation bar supporting multiple active topic tabs.
  * Provide an intuitive "New Topic" modal collecting:
    * `title` (string, required)
    * `description` (text, required)
    * `target_format` (radio selector cards: `PPT`, `DOCX`, `MD`, `PDF`, required)
    * `user_instructions` (text, optional)
  * **Strict Context Isolation in UI:** When the user switches between tabs, active conversation memory, stepper state, and document vaults in the browser must instantly switch to the selected `topic_id`. No state or messages from Topic X may ever bleed into Topic Y.
* **Key Components:**
  * `WorkspaceTabs.jsx` — Tab bar with add, close, and active status indicators.
  * `WorkspaceModal.jsx` — Form dialog for creating new workspaces.
  * `WorkspaceContext.jsx` — Global React Context managing workspaces and active workspace ID.

### Submodule A.2: Real-Time Agent Stepper & Interactive Review Panel
* **Target Directory:** `frontend/src/components/pipeline/`
* **Core Responsibilities:**
  * **Visual Stepper (`AgentStepper.jsx`):** Display the 7-stage agent execution pipeline:
    1. Requirement Analysis Agent
    2. Planning Agent
    3. Reference Analysis Agent (Optional indicator)
    4. Research & Enrichment Agent
    5. Content Generation Agent
    6. Content Review Agent
    7. Format Generation Agent
  * Connect to the WebSocket stream (`/api/v1/workspaces/{topic_id}/stream`) and dynamically transition stages between `WAITING`, `STARTED`, `PROCESSING`, and `COMPLETED`.
  * **Human-in-the-Loop Review Panel (`ReviewPanel.jsx`):** When the backend emits `WAITING_FOR_REVIEW`, display a markdown preview of the refined content, readability score, and an "Approve & Compile" action button or feedback submission box.
  * **Deliverable Vault (`DeliverableVault.jsx`):** When execution completes, render a deliverable card showing file name, file format badge, size in KB, and a direct "Download Deliverable" button.

### Submodule A.3: Reference File Uploader
* **Target Directory:** `frontend/src/components/upload/`
* **Core Responsibilities:**
  * Drag-and-drop file upload zone supporting `.pptx`, `.docx`, `.pdf`, `.md`.
  * Validate allowed file types and max file size (e.g., 25MB).
  * Post multipart form data to `/api/v1/workspaces/{topic_id}/templates`.
  * Display uploaded template chips with a delete/remove button.
* **Key Component:** `TemplateUploader.jsx`.

### Submodule A.4: FastAPI Gateway & MongoDB Atlas Data Hub
* **Target Directory:** `backend/app/api/`, `backend/app/core/`, `backend/app/database/`
* **Core Responsibilities:**
  * Implement the FastAPI main application entry point (`backend/app/main.py`) with CORS middleware and JSON error handlers.
  * **MongoDB Atlas Async Driver (`backend/app/database/mongodb.py`):**
    * Connect via `motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URI"))`.
    * Expose shared database instance helper `get_database()`.
  * **MongoDB Collections & Schemas:**
    * `topic_workspaces`: `_id` (str/UUID), `title` (str), `description` (str), `target_format` (str: `PPT`, `DOCX`, `MD`, `PDF`), `user_instructions` (str), `status` (str: `IDLE`, `PROCESSING`, `WAITING_FOR_REVIEW`, `COMPLETED`, `FAILED`), `created_at` (datetime), `updated_at` (datetime).
    * `reference_templates`: `_id`, `topic_id`, `file_name`, `file_type`, `storage_path`, `parsed_guidance` (dict, stores Agent 3's `TemplateGuidanceProfile` natively without SQL migrations), `created_at`.
    * `chat_messages`: `_id`, `topic_id`, `sender_type` (`USER`, `SYSTEM`, `AGENT_REQUIREMENT`, etc.), `content`, `metadata` (dict), `created_at`.
    * `agent_execution_logs`: `_id`, `topic_id`, `agent_name`, `status`, `execution_time_ms`, `input_payload` (dict), `output_payload` (dict), `created_at`.
  * **Topic Context Isolation Engine:**
    * All queries MUST filter strictly by `{"topic_id": active_topic_id}`.
    * Cache session state in Redis or in-memory dictionary scoped with `topic:{topic_id}:*` to guarantee physical context partitioning.
  * Implement REST routers:
    * `POST /api/v1/workspaces` — Insert workspace document into MongoDB.
    * `GET /api/v1/workspaces` — Fetch all active workspaces.
    * `POST /api/v1/workspaces/{id}/templates` — Save uploaded file to disk and record document in MongoDB.
    * `POST /api/v1/workspaces/{id}/generate` — Dispatch generation job.
    * `GET /api/v1/workspaces/{id}/status` — Poll current status.
    * `GET /api/v1/workspaces/{id}/export` — Download generated binary deliverable.
  * Implement WebSocket router:
    * `WS /api/v1/workspaces/{id}/stream` — Broadcast progress events to the client.

### Submodule A.5: Standalone Mock Pipeline Service
* **Target Directory:** `backend/app/services/mock_pipeline_service.py`
* **Core Responsibilities:**
  * Allow Member A to run the full application end-to-end without Member B or C.
  * Yields the exact 7 `PipelineProgressEvent` frames over WebSocket spaced 1.5 seconds apart.
  * Simulates the `WAITING_FOR_REVIEW` pause at Step 6 with sample markdown content.
  * Serves sample pre-canned `.docx` and `.pptx` files from `backend/storage/mock/` for download testing.

---

## 3. Strict Out-of-Scope (DO NOT IMPLEMENT)
To prevent collisions with teammates, you must NOT write:
1. **AI Prompts & LangGraph State Machine:** Owned exclusively by Member B (`backend/app/orchestration/` and `backend/app/agents/cognitive/`).
2. **Template Parsing Logic:** You only save uploaded files to `storage/templates/`. Extracting slide masters and XML styles belongs to Member C (`backend/app/parsers/`).
3. **Binary Document Rendering:** Creating `.pptx` shapes or `.docx` XML belongs to Member C (`backend/app/converters/`).

---

## 4. Frozen Interface Contracts for Module A

### 4.1 REST API Routes
```http
POST /api/v1/workspaces
Content-Type: application/json
{
  "title": "Autonomous AI Multi-Agent Systems",
  "description": "Enterprise overview of multi-agent architectures.",
  "target_format": "DOCX",
  "user_instructions": "Focus on security."
}
Response 201 Created:
{
  "workspace_id": "8e3c1a25-4a62-4217-a068-d0f5bb81d801",
  "status": "CREATED"
}
```

```http
POST /api/v1/workspaces/{topic_id}/templates
Content-Type: multipart/form-data
Body: file: <binary_data>
Response 200 OK:
{
  "template_id": "7f2a1b94-22e1-4829-8731-b8d141e99a02",
  "file_name": "Corporate_Style.docx",
  "file_path": "/storage/templates/8e3c1a25_Corporate_Style.docx"
}
```

```http
POST /api/v1/workspaces/{topic_id}/generate
Content-Type: application/json
{}
Response 202 Accepted:
{
  "task_id": "job-8e3c1a25",
  "status": "PROCESSING"
}
```

```http
GET /api/v1/workspaces/{topic_id}/export
Response 200 OK: Binary File Stream (.docx / .pptx / .pdf / .md)
```

### 4.2 WebSocket Progress Frame Specification
Endpoint: `WS /api/v1/workspaces/{topic_id}/stream`
```json
{
  "topic_id": "8e3c1a25-4a62-4217-a068-d0f5bb81d801",
  "agent_name": "Requirement Analysis Agent",
  "status": "COMPLETED",
  "progress_percent": 14,
  "message": "Requirements extracted: 4 deliverables, 2 constraints.",
  "payload": null,
  "timestamp": "2026-09-30T10:15:30Z"
}
```
*Possible `status` values:* `STARTED`, `PROCESSING`, `COMPLETED`, `WAITING_FOR_REVIEW`, `FAILED`.

---

## 5. Independent Development & Testing Guide

### Running Locally on Your Laptop
1. **Start Backend with Mock Service:**
   ```bash
   cd backend
   pip install -r requirements_module_a.txt
   uvicorn app.main:app --reload --port 8000
   ```
2. **Start Frontend Dev Server:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Verification Steps:**
   * Open `http://localhost:5173`.
   * Click "New Topic Workspace" and create "Topic 1 (DOCX)" and "Topic 2 (PPT)".
   * Switch between Topic 1 and Topic 2. Verify tabs toggle smoothly and chat/stepper states are completely isolated.
   * In Topic 1, drag-and-drop a sample file (`.docx`). Verify the chip appears.
   * Click "Start Autonomous Generation".
   * Observe the 7-step visual stepper animate in real time via the WebSocket connection.
   * At Step 6, verify the `ReviewPanel` appears with a markdown preview.
   * Click "Approve & Compile".
   * Observe completion and click "Download Deliverable". Verify the sample file downloads cleanly.

---

## 6. Git Workflow for Member A

```bash
# 1. Switch to your feature branch
git checkout -b feature/module-a-platform

# 2. Stage only your assigned files
git add frontend/
git add backend/app/main.py
git add backend/app/config.py
git add backend/app/api/
git add backend/app/core/
git add backend/app/database/
git add backend/app/services/mock_pipeline_service.py

# 3. Commit with semantic convention
git commit -m "feat(platform): implement topic workspace UI and FastAPI gateway with mock pipeline"

# 4. Push to remote
git push -u origin feature/module-a-platform
```

---

## 7. Definition of Done (DoD) Checklist

- [ ] React UI boots cleanly on Vite with zero console errors.
- [ ] Topic tab manager supports creating and switching between multiple workspaces.
- [ ] Switching tabs resets active conversation view and enforces context isolation.
- [ ] Template uploader validates file extensions (`.pptx`, `.docx`, `.pdf`, `.md`) and saves to disk.
- [ ] WebSocket client connects to `/api/v1/workspaces/{topic_id}/stream` and updates `AgentStepper`.
- [ ] `ReviewPanel` displays draft markdown and captures user approval.
- [ ] Deliverable vault provides working download links for finished files.
- [ ] MongoDB Atlas connection configured via motor and collections (topic_workspaces, reference_templates, chat_messages, agent_execution_logs) verified.
- [ ] Topic context isolation enforced with `{"topic_id": active_topic_id}` MongoDB filters and Redis/memory key prefixes.
- [ ] Swagger API docs available at `http://localhost:8000/docs`.
- [ ] Zero modifications made to Member B's cognitive agents or Member C's compilers.
- [ ] Feature branch `feature/module-a-platform` pushed to GitHub.
