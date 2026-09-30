# Agentic Flow - Multi-Agent AI Content Generation System
## Comprehensive Technical Blueprint & Implementation Guide

---

## 1. Executive Summary & Core Concept

The **Multi-Agent AI Content Generation System** is an enterprise-grade AI platform designed to transform a user's high-level **Topic**, **Short Description**, and **Desired Output Format** (`PPTX`, `DOCX`, `MD`, `PDF`) into fully written, beautifully styled, publication-ready documents. 

### Core Capabilities
1. **Topic-Isolated Chat Workspaces**: Dedicated chat tabs per topic. Each workspace maintains isolated context memory (`topic_id`), eliminating cross-topic contamination.
2. **7-Agent Autonomous Pipeline**: Sequentially plans, analyzes reference templates, enriches domain knowledge, drafts, reviews, and compiles native binary outputs.
3. **Optional Reference Template Ingestion**: Users can upload custom PPTX slide templates, DOCX style guides, or research paper outlines. The system extracts layout structures, heading hierarchies, fonts, and color palettes to format outputs accordingly.
4. **Native Binary Exports**: Produces native Microsoft PowerPoint (`.pptx`), Microsoft Word (`.docx`), clean Markdown (`.md`), and formatted PDF (`.pdf`) deliverables.

---

## 2. System Architecture & Tech Stack

```
                               ┌────────────────────────────────────────┐
                               │           Web UI Layer                 │
                               │   (React / Next.js / Vite + Tailwind)  │
                               └───────────────────┬────────────────────┘
                                                   │ WebSocket / REST API
                               ┌───────────────────▼────────────────────┐
                               │        FastAPI Gateway Server          │
                               │   (Auth, Routing, Task Management)     │
                               └───────────────────┬────────────────────┘
                                                   │ Async Dispatch
┌──────────────────────────────────────────────────▼──────────────────────────────────────────────────┐
│                                 Multi-Agent Orchestration Engine                                     │
│                                (LangGraph / AutoGen Stateful Graph)                                  │
│                                                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────────────────────┐  │
│  │ Requirement Agent    │───►│ Planning Agent       │───►│ Reference Analysis Agent (Optional)  │  │
│  └──────────────────────┘    └──────────────────────┘    └──────────────────┬───────────────────┘  │
│                                                                             │                      │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────▼───────────────────┐  │
│  │ Format Gen Agent     │◄───│ Content Review Agent │◄───│ Content Generation Agent             │  │
│  └──────────┬───────────┘    └──────────────────────┘    └──────────────────▲───────────────────┘  │
│             │                                                               │                      │
│             │                                            ┌──────────────────┴───────────────────┐  │
│             │                                            │ Research & Enrichment Agent          │  │
│             │                                            └──────────────────────────────────────┘  │
└─────────────┼──────────────────────────────────────────────────────────────────────────────────────┘
              │ Outputs (.pptx, .docx, .md, .pdf)
┌─────────────▼──────────────────────────────────────────────────────────────────────────────────────┐
│                                     Data & Storage Layer                                            │
│   ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────────────┐   │
│   │ PostgreSQL (App State) │    │ Redis (Session Memory) │    │ Vector DB (ChromaDB / Qdrant)  │   │
│   └────────────────────────┘    └────────────────────────┘    └────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Selection
| Layer | Framework / Technology | Justification |
| :--- | :--- | :--- |
| **Frontend UI** | React 18 + Vite / Next.js | Modern, fast UI rendering with active tab state management for topic chat workspaces |
| **Backend API** | Python 3.11 + FastAPI | Asynchronous IO, native Python ecosystem for LLMs, python-docx, and python-pptx |
| **Agent Engine** | LangGraph / AutoGen | Stateful graph orchestration supporting conditional branching (e.g. optional reference agent) |
| **LLM Gateway** | LiteLLM / LangChain | Model-agnostic layer supporting OpenAI (GPT-4o), Anthropic (Claude 3.5), and Google (Gemini) |
| **Document Parsers** | `python-docx`, `python-pptx`, `pdfplumber` | Extracts XML style properties, master slides, placeholders, font families, and color hexes |
| **Binary Exports** | `python-docx`, `python-pptx`, `weasyprint` | Generates native binary PPTX and DOCX without needing desktop Microsoft Office installed |
| **Context Storage** | PostgreSQL + Redis + Qdrant | Relational metadata + high-speed isolated session cache + vector store per `topic_id` |

---

## 3. Database Schema & Data Models

### 3.1 `TopicWorkspace`
```sql
CREATE TABLE topic_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_format VARCHAR(20) NOT NULL CHECK (target_format IN ('PPT', 'DOCX', 'MD', 'PDF')),
    status VARCHAR(50) DEFAULT 'IDLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 `ReferenceTemplate`
```sql
CREATE TABLE reference_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topic_workspaces(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('PPT', 'DOCX', 'MD', 'PDF')),
    storage_path TEXT NOT NULL,
    parsed_rules_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 `ChatMessage`
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topic_workspaces(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL, -- 'USER', 'SYSTEM', 'AGENT_REQUIREMENT', 'AGENT_REVIEW', etc.
    content TEXT NOT NULL,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4 `AgentExecutionLog`
```sql
CREATE TABLE agent_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topic_workspaces(id) ON DELETE CASCADE,
    agent_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'STARTED', 'COMPLETED', 'FAILED'
    input_payload JSONB,
    output_payload JSONB,
    execution_time_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Exhaustive 7-Agent Specifications

### 4.1 Requirement Analysis Agent
- **Purpose**: Parse raw user topic and description, extract target audience, objectives, deliverables, and constraints.
- **Input**: `{ topic: string, description: string, user_instructions: string }`
- **System Prompt Standard**:
  > You are the Requirement Analysis Agent. Analyze the user topic and description. Output a JSON object containing: `objective`, `target_audience`, `key_deliverables`, `tone`, and `constraints`.
- **Output JSON Schema**:
  ```json
  {
    "objective": "Detailed objective statement",
    "target_audience": "Target audience persona",
    "key_deliverables": ["Deliverable 1", "Deliverable 2"],
    "tone": "Professional / Instructional / Technical",
    "constraints": ["Constraint 1", "Constraint 2"]
  }
  ```

### 4.2 Planning Agent
- **Purpose**: Build section hierarchy, chapter structure, slide outline, and token budget.
- **Input**: Requirement Analysis JSON + Output Format (`PPT`/`DOCX`/`MD`/`PDF`).
- **Output JSON Schema**:
  ```json
  {
    "title": "Document Title",
    "sections": [
      {
        "section_id": "S1",
        "heading": "Introduction",
        "key_points": ["Point 1", "Point 2"],
        "target_word_count": 300
      }
    ]
  }
  ```

### 4.3 Reference Analysis Agent (Optional)
- **Purpose**: Ingest uploaded template file, extract visual styles, font families, color palettes, slide layouts, and section patterns.
- **Input**: Path to uploaded template file (`.pptx`, `.docx`, `.md`).
- **Processing Logic**:
  - For `.pptx`: Inspects `prs.slide_layouts`, extracts shape placeholders, color schemes, font names.
  - For `.docx`: Inspects `doc.styles`, header XML, shading fill hex codes (`#E8F1F0`), margin dimensions.
- **Output**: `TemplateGuidanceProfile` JSON.

### 4.4 Research & Enrichment Agent
- **Purpose**: Gather domain context, query web APIs or local vector DB, validate facts, and enrich outlines with technical detail.
- **Input**: Content Plan + Topic Brief.
- **Output**: Enriched Knowledge Package JSON with grounded references and key statistics.

### 4.5 Content Generation Agent
- **Purpose**: Write raw section-by-section text, markdown tables, code blocks, and slide content.
- **Input**: Content Plan + Template Guidance Profile + Knowledge Package.
- **Output**: Complete Draft Content Markdown string.

### 4.6 Content Review Agent
- **Purpose**: Audit draft against safety rules, readability grade, tone consistency, redundancy removal, and fact verification.
- **Input**: Complete Draft Content Markdown string.
- **Output**: Refined & Approved Markdown Content string + Review Changelog.

### 4.7 Format Generation Agent
- **Purpose**: Convert refined markdown content into native binary target file (`.pptx`, `.docx`, `.md`, `.pdf`).
- **Input**: Refined Markdown Content + Target Format + Template Guidance.
- **Output**: Final Binary Document File on disk.

---

## 5. Topic Context Management & Isolation Engine

To guarantee zero context contamination across multiple topics:
1. **Scoped Storage Key**: All Redis keys are prefixed with `topic:{topic_id}:...`.
2. **Vector DB Metadata Filter**: All similarity searches apply a mandatory metadata filter:
   ```python
   results = vector_db.query(
       query_text=prompt,
       filter={"topic_id": active_topic_id},
       top_k=5
   )
   ```
3. **Session Memory Purge**: Switching tabs in the UI resets the local conversational prompt window to load only messages associated with the selected `topic_id`.

---

## 6. REST & WebSocket API Specification

### 6.1 Create Topic Workspace
- **`POST /api/v1/workspaces`**
- **Request Body**:
  ```json
  {
    "title": "Quantum Computing Essentials",
    "description": "A comprehensive introductory guide for enterprise software engineers.",
    "target_format": "DOCX"
  }
  ```
- **Response**: `201 Created` with `{ "workspace_id": "uuid-v4", "status": "CREATED" }`

### 6.2 Upload Reference Template
- **`POST /api/v1/workspaces/{topic_id}/templates`**
- **Multipart Data**: `file: BinaryFile`
- **Response**: `{ "template_id": "uuid-v4", "file_name": "Corporate_Theme.docx", "parsed": true }`

### 6.3 Trigger Generation Pipeline
- **`POST /api/v1/workspaces/{topic_id}/generate`**
- **Response**: `{ "task_id": "job-uuid", "status": "PROCESSING" }`

### 6.4 Real-time Agent Progress WebSocket
- **`WS /api/v1/workspaces/{topic_id}/stream`**
- **Emitted Payload**:
  ```json
  {
    "agent": "Requirement Analysis Agent",
    "status": "COMPLETED",
    "progress_percent": 14,
    "message": "Requirements extracted successfully."
  }
  ```

---

## 7. Folder & Directory Code Structure

```
d:/AI_Hackathon/agentic-flow-system/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entry point
│   │   ├── config.py                   # System environment settings
│   │   ├── api/                        # REST & WebSocket routers
│   │   │   ├── endpoints/
│   │   │   │   ├── workspaces.py
│   │   │   │   ├── templates.py
│   │   │   │   └── generation.py
│   │   ├── agents/                     # 7 Specialized AI Agents
│   │   │   ├── requirement_agent.py
│   │   │   ├── planning_agent.py
│   │   │   ├── reference_agent.py
│   │   │   ├── research_agent.py
│   │   │   ├── generation_agent.py
│   │   │   ├── review_agent.py
│   │   │   └── format_agent.py
│   │   ├── converters/                 # Binary output compilers
│   │   │   ├── docx_builder.py
│   │   │   ├── pptx_builder.py
│   │   │   ├── pdf_builder.py
│   │   │   └── md_builder.py
│   │   ├── database/                   # DB models & vector store setup
│   │   └── services/                   # LLM gateway & task queue
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WorkspaceTabs.jsx       # Topic chat window tabs
│   │   │   ├── ChatWindow.jsx          # Isolated topic chat thread
│   │   │   ├── AgentStepper.jsx        # Real-time pipeline visualizer
│   │   │   └── FileUploader.jsx        # Template upload component
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── docs/
    ├── AGENT-101_SystemBrief-StyleGuide_v1.0.docx
    └── Agentic_Flow_Project_Blueprint.md
```

---

## 8. Implementation Roadmap & Milestones

| Milestone | Key Deliverables | Timeline |
| :--- | :--- | :--- |
| **Phase 1: Foundation & APIs** | Setup FastAPI backend, PostgreSQL/Redis schemas, LLM integration, basic REST routes | Week 1 - 2 |
| **Phase 2: 7-Agent Core Pipeline** | Implement Requirement, Planning, Research, Generation, and Review agents with LangGraph | Week 3 - 4 |
| **Phase 3: Parsers & Binary Builders** | Build Reference Analysis parser and native `python-docx` / `python-pptx` file converters | Week 5 - 6 |
| **Phase 4: Topic Workspace UI** | React frontend with tabbed topic workspaces, WebSocket agent progress streaming | Week 7 - 8 |
| **Phase 5: QA, Safety & Launch** | Security auditing, context isolation testing, WCAG accessibility checks, production deployment | Week 9 - 10 |

---

## 9. Definition of Done (DoD)

1. **Functional Completion**: All 7 agents execute sequentially or conditionally without failure.
2. **Format Validity**: Output `.pptx` opens seamlessly in PowerPoint, `.docx` opens in Word, `.md` renders cleanly, `.pdf` renders correctly.
3. **Template Match**: Visual styles of uploaded templates match output deliverables by 90%+.
4. **Context Isolation**: Verification tests confirm zero memory leakage between distinct topic IDs.
5. **Latency Target**: Generation completes under 180 seconds for standard outputs.
