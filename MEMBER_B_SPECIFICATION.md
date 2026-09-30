# MEMBER B — MODULE SPECIFICATION
**System ID:** `AGENT-101` — Multi-Agent AI Content Generation & Synthesis System  
**Module Name:** `MODULE B: Multi-Agent Cognitive Orchestration Engine`  
**Assigned Developer:** Member B  
**Target Repository Directory:** `backend/app/agents/cognitive/`, `backend/app/orchestration/`, `backend/app/services/`  
**Git Feature Branch:** `feature/module-b-agents`

---

## 1. Executive Mission & Identity
You are responsible for the **cognitive intelligence and reasoning core** of the platform. You implement 5 of the 7 specialized AI agents:
1. **Agent 1: Requirement Analysis Agent**
2. **Agent 2: Planning Agent**
3. **Agent 4: Research & Enrichment Agent**
4. **Agent 5: Content Generation Agent**
5. **Agent 6: Content Review Agent**

You orchestrate these agents inside a stateful **LangGraph** state machine, manage prompts, enforce reading grade standards (Grade 8–10, active voice, $\le$ 22 words/sentence), integrate grounded vector retrieval (RAG) with strict zero-hallucination policies, and emit real-time telemetry events.

> **CRITICAL ARCHITECTURAL PRINCIPLE:**  
> During your sprint, you will develop and test 100% locally on your laptop **without needing Member A's React UI or Member C's binary document compilers**. You will build a terminal CLI runner (`pipeline_runner.py`) and use a frozen mock fixture (`sample_template_guidance.json`) to simulate template intelligence from Member C.

---

## 2. In-Scope Responsibilities & Submodules

### Submodule B.1: LangGraph State Machine & Orchestrator
* **Target Directory:** `backend/app/orchestration/`
* **Core Responsibilities:**
  * Define `PipelineGraphState` (Pydantic / TypedDict) containing:
    * `topic_id`, `title`, `description`, `target_format`, `user_instructions`
    * `structured_requirements` (from Agent 1)
    * `content_plan` (from Agent 2)
    * `template_guidance` (from Agent 3 hook or mock fallback)
    * `knowledge_package` (from Agent 4)
    * `draft_content` (from Agent 5)
    * `refined_content` & `review_changelog` (from Agent 6)
  * Implement conditional branching:
    * If `template_file_path` is present, call Agent 3 hook; otherwise, inject standard default design guidance.
    * After Agent 6, emit `WAITING_FOR_REVIEW` event and yield state for human approval.
  * Implement `pipeline_runner.py`: An async generator that executes the graph node-by-node and yields `PipelineProgressEvent` frames.

### Submodule B.2: Ingestion & Planning Cognitive Agents
* **Target Directory:** `backend/app/agents/cognitive/`
* **Agent 1: Requirement Analysis Agent (`requirement_agent.py`):**
  * Parses raw topic, description, and user instructions.
  * System Prompt: Analyzes audience persona, extracts core objectives, identifies key deliverables, and flags constraints.
  * Output: Validated `StructuredRequirements` JSON.
* **Agent 2: Planning Agent (`planning_agent.py`):**
  * Generates hierarchical document outline tailored to `target_format`:
    * For `PPT`: Generates slide titles, themes, layout types, and bullet point counts.
    * For `DOCX`: Generates document title, H1 chapters, H2 subsections, target word counts per section, and required tables.
    * For `MD`/`PDF`: Generates structured markdown headings and content blocks.
  * Output: Validated `ContentPlan` JSON.

### Submodule B.3: Research & Content Synthesis Agents
* **Target Directory:** `backend/app/agents/cognitive/`
* **Agent 4: Research & Enrichment Agent (`research_agent.py`):**
  * Gathers domain knowledge, fills gaps in the content plan, retrieves relevant facts from local vector store scoped by `{"topic_id": active_topic_id}`.
  * Enforces **Zero Hallucination Policy:** Grounds all factual assertions in retrieved context or verified general knowledge.
  * Output: Validated `KnowledgePackage` JSON.
* **Agent 5: Content Generation Agent (`generation_agent.py`):**
  * Iterates section-by-section across the content plan and writes complete draft text.
  * Follows template guidance (e.g. max 5 bullets per slide, table column structures).
  * Adheres to Writing Style Rules:
    * Active voice and direct phrasing.
    * Observable action verbs (Identify, Synthesize, Compare, Draft, Structure).
    * Structured markdown tables with header rows.
  * Output: Complete `DraftContent` Markdown string.

### Submodule B.4: Content Review & Quality Auditor Agent
* **Target Directory:** `backend/app/agents/cognitive/`
* **Agent 6: Content Review Agent (`review_agent.py`):**
  * Audits draft content against quality metrics:
    * Readability formula (Flesch-Kincaid targeting Grade 8–10).
    * Sentence length audit (flags and shortens sentences $> 22$ words).
    * Tone check (objective, professional, neutral).
    * Redundancy removal and structure validation.
  * Produces:
    * `RefinedContent` (clean Markdown string).
    * `ReviewChangelog` (JSON summarizing: reading ease score, sentences shortened, redundancies removed, citation count).

### Submodule B.5: LLM Gateway & Vector Context Manager
* **Target Directory:** `backend/app/services/`
* **Core Responsibilities:**
  * Implement structured JSON extraction with retry loops.
  * **Vector Store Context Manager (`vector_service.py`):**
    * Primary: **MongoDB Atlas Vector Search** (uses `$vectorSearch` pipeline stage filtering by `{"topic_id": {"$eq": topic_id}}`).
    * Local Fallback: **ChromaDB** with metadata filter `{"topic_id": topic_id}`.
    * Guarantees zero context bleed across topic boundaries.
  * Log agent execution metrics and outputs directly to the `agent_execution_logs` MongoDB collection.

---

## 3. Strict Out-of-Scope (DO NOT IMPLEMENT)
To prevent collisions with teammates, you must NOT write:
1. **Frontend UI & WebSocket Server:** Owned exclusively by Member A (`frontend/` and `backend/app/api/`).
2. **Template File Parsing:** Inspecting binary PPTX slide masters or DOCX XML styles belongs to Member C (`backend/app/parsers/`). You only consume the resulting `TemplateGuidanceProfile` JSON.
3. **Binary Document Compilers:** Writing native `.docx`, `.pptx`, or `.pdf` binary files belongs to Member C (`backend/app/converters/`). You produce clean, validated Markdown.

---

## 4. Frozen Interface Contracts for Module B

### 4.1 Input Contract: Pipeline Run Request
```python
class PipelineRunRequest(BaseModel):
    topic_id: str
    title: str
    description: str
    target_format: Literal["PPT", "DOCX", "MD", "PDF"]
    user_instructions: Optional[str] = None
    template_file_path: Optional[str] = None
```

### 4.2 Consumed Contract: Template Guidance Profile (from Member C)
During parallel development, load this mock from `shared/fixtures/sample_template_guidance.json`:
```json
{
  "template_type": "DOCX",
  "color_palette": {
    "primary_hex": "#1B365D",
    "secondary_hex": "#4B6B94",
    "accent_hex": "#00A3E0",
    "background_hex": "#FFFFFF",
    "text_hex": "#222222"
  },
  "typography": {
    "heading_font": "Calibri",
    "body_font": "Calibri",
    "heading_sizes": { "h1": 20, "h2": 15, "h3": 12, "body": 11 }
  },
  "layout_rules": {
    "slide_layouts_available": [],
    "max_bullets_per_slide": 5,
    "table_header_shading_hex": "#1B365D",
    "callout_box_style": "left_accent_border"
  }
}
```

### 4.3 Output Contract: Pipeline Progress Event (emitted to Member A)
```json
{
  "topic_id": "8e3c1a25-4a62-4217-a068-d0f5bb81d801",
  "agent_name": "Content Review Agent",
  "status": "WAITING_FOR_REVIEW",
  "progress_percent": 85,
  "message": "Draft content reviewed and refined. Waiting for user review and approval.",
  "payload": {
    "refined_content_preview": "# Multi-Agent Clinical Systems\n\n## 1. Executive Summary\n...",
    "reading_grade_level": 9.2,
    "redundancies_removed": 4,
    "verified_citations_count": 8
  },
  "timestamp": "2026-09-30T10:16:45Z"
}
```

### 4.4 Output Contract to Member C: Document Compile Request
```python
class DocumentCompileRequest(BaseModel):
    topic_id: str
    title: str
    target_format: Literal["PPT", "DOCX", "MD", "PDF"]
    refined_content_markdown: str
    template_guidance: dict
    document_control_metadata: dict  # {"version": "v1.0", "author": "AgenticFlow", "date": "2026-09-30"}
```

---

## 5. Independent Development & Testing Guide

### Running Locally on Your Laptop
1. **Setup Python Environment:**
   ```bash
   cd backend
   pip install -r requirements_module_b.txt
   # Ensure OPENAI_API_KEY or GEMINI_API_KEY is exported in your environment
   ```

2. **Run Standalone Pipeline via CLI:**
   You can run the entire 5-agent pipeline right from your terminal without any server running:
   ```bash
   python -m app.orchestration.pipeline_runner \
       --title "Autonomous Multi-Agent AI in Healthcare" \
       --description "Comprehensive technical architecture for clinical triage." \
       --format "DOCX"
   ```

3. **Verifying Your Output:**
   * Watch terminal output as each agent finishes:
     * `[Agent 1: Requirement Analysis]` $\rightarrow$ prints extracted objectives and audience.
     * `[Agent 2: Planning]` $\rightarrow$ prints section tree and word count targets.
     * `[Agent 4: Research]` $\rightarrow$ prints retrieved citations.
     * `[Agent 5: Content Gen]` $\rightarrow$ prints draft markdown.
     * `[Agent 6: Review]` $\rightarrow$ prints reading grade level (target 8–10) and changelog.
   * Verify that the emitted `RefinedContent` string contains clean markdown tables and headers.

---

## 6. Git Workflow for Member B

```bash
# 1. Switch to your feature branch
git checkout -b feature/module-b-agents

# 2. Stage only your assigned files
git add backend/app/orchestration/
git add backend/app/agents/cognitive/
git add backend/app/services/llm_service.py
git add backend/app/services/vector_service.py
git add tests/test_cognitive_pipeline.py

# 3. Commit with semantic convention
git commit -m "feat(agents): implement 5-agent LangGraph cognitive pipeline and review auditor"

# 4. Push to remote
git push -u origin feature/module-b-agents
```

---

## 7. Definition of Done (DoD) Checklist

- [ ] All 5 cognitive agents implemented (Requirement, Planning, Research, Generation, Review).
- [ ] Requirement Analysis Agent outputs valid JSON adhering to schema.
- [ ] Planning Agent produces balanced outlines tailored to target format.
- [ ] Research Agent integrates grounded citations with zero hallucination.
- [ ] Content Generation Agent writes active-voice, structured markdown with tables.
- [ ] Review Agent validates Grade 8–10 readability and emits `ReviewChangelog`.
- [ ] LangGraph state machine handles conditional branching and pauses for review.
- [ ] Progress events yield valid `PipelineProgressEvent` objects matching frozen contract.
- [ ] Standalone CLI runner executes the full pipeline without exceptions.
- [ ] Zero modifications made to `frontend/`, `api/`, `parsers/`, or `converters/`.
- [ ] Feature branch `feature/module-b-agents` pushed to GitHub.
