# Agentic Flow — Multi-Agent AI Content Generation & Synthesis System

[![System Architecture](https://img.shields.io/badge/System-AGENT--101-blue.svg)](file:///d:/AI_Hackathon/Agentic_Flow_Project_Blueprint.md)
[![Module B Status](https://img.shields.io/badge/Module%20B-100%25%20Completed-success.svg)](file:///d:/AI_Hackathon/MEMBER_B_SPECIFICATION.md)
[![Python Version](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![LLM Model](https://img.shields.io/badge/Groq%20LLM-gpt--oss--120b-orange.svg)](https://groq.com)

**Agentic Flow** is an enterprise-grade AI system designed to transform high-level user topics, descriptions, and reference files into publication-ready documents (`.pptx`, `.docx`, `.md`, `.pdf`).

---

## 📸 Architecture Overview

The system operates via a stateful 7-agent pipeline. **Module B** powers the core cognitive intelligence, reasoning, vector retrieval, and state machine graph:

```
                               ┌────────────────────────────────────────┐
                               │           Web UI Layer (Module A)      │
                               │      (React / Next.js + WebSockets)    │
                               └───────────────────┬────────────────────┘
                                                   │ WebSocket / REST API
                               ┌───────────────────▼────────────────────┐
                               │        FastAPI Gateway Server          │
                               └───────────────────┬────────────────────┘
                                                   │ Async Dispatch
┌──────────────────────────────────────────────────▼──────────────────────────────────────────────────┐
│                           MODULE B: Multi-Agent Cognitive Orchestration Engine                      │
│                                      (LangGraph Stateful Graph)                                     │
│                                                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────────────────────┐  │
│  │ Requirement Agent    │───►│ Planning Agent       │───►│ Reference Analysis Agent (Module C)   │  │
│  └──────────────────────┘    └──────────────────────┘    └──────────────────┬───────────────────┘  │
│                                                                             │                      │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────▼───────────────────┐  │
│  │ Format Gen (Module C)│◄───│ Content Review Agent │◄───│ Content Generation Agent             │  │
│  └──────────────────────┘    └──────────────────────┘    └──────────────────▲───────────────────┘  │
│                                                                             │                      │
│                                                          ┌──────────────────┴───────────────────┐  │
│                                                          │ Research & Enrichment Agent          │  │
│                                                          └──────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 What Was Built (Module B Core Stack)

### 1. Specialized Cognitive Agents (`backend/app/agents/cognitive/`)
* **Agent 1: Requirement Analysis Agent (`requirement_agent.py`)**  
  Parses user inputs, extracts target audience personas, core objectives, deliverables, and constraints into validated `StructuredRequirements` JSON objects.
* **Agent 2: Planning Agent (`planning_agent.py`)**  
  Generates custom multi-section outlines (`ContentPlan`) tailored to requested output formats (`PPT`, `DOCX`, `MD`, `PDF`).
* **Agent 4: Research & Enrichment Agent (`research_agent.py`)**  
  Retrieves grounded domain context from the vector database scoped strictly by `topic_id`. Enforces a strict Zero-Hallucination policy.
* **Agent 5: Content Generation Agent (`generation_agent.py`)**  
  Writes section-by-section markdown using active voice, observable action verbs (*Identify, Synthesize, Compare, Draft, Structure*), markdown header tables, and slide bullet constraints ($\le 5$ per block).
* **Agent 6: Content Review Agent (`review_agent.py`)**  
  Audits readability against Flesch-Kincaid Grade 8–10 standards, flags and shortens sentences $> 22$ words, eliminates redundancies, and returns clean `RefinedContent` alongside `ReviewChangelog` metadata.

### 2. Services & Context Isolation (`backend/app/services/`)
* **LLM Gateway Service (`llm_service.py`)**  
  Integrated with Groq API using model **`gpt-oss-120b`** (with automatic JSON extraction, cleanup, and deterministic fallback parsing).
* **Vector Store Context Manager (`vector_service.py`)**  
  Supports MongoDB Atlas Vector Search / local store with mandatory topic-scoped metadata filtering (`{"topic_id": active_topic_id}`) to guarantee zero cross-topic memory bleed.

### 3. Stateful Graph & Telemetry (`backend/app/orchestration/`)
* **LangGraph Execution Engine (`pipeline_graph.py`)**  
  State machine running graph nodes and conditional branching (evaluating custom template paths vs. fallback fixtures).
* **Async Pipeline Runner & CLI (`pipeline_runner.py`)**  
  Yields `PipelineProgressEvent` telemetry streams (15% ➡️ 30% ➡️ 45% ➡️ 60% ➡️ 75% ➡️ 85%) and pauses at `WAITING_FOR_REVIEW` for human review.

---

## 📁 Repository Directory Structure

```
d:/AI_Hackathon/
├── backend/
│   ├── .env.example                       # Groq API configuration template
│   ├── requirements.txt                   # Backend dependencies
│   ├── app/
│   │   ├── config.py                      # Environment configuration
│   │   ├── agents/
│   │   │   └── cognitive/
│   │   │       ├── requirement_agent.py   # Agent 1
│   │   │       ├── planning_agent.py      # Agent 2
│   │   │       ├── research_agent.py      # Agent 4
│   │   │       ├── generation_agent.py    # Agent 5
│   │   │       └── review_agent.py        # Agent 6
│   │   ├── services/
│   │   │   ├── llm_service.py             # Groq LLM Gateway (gpt-oss-120b)
│   │   │   └── vector_service.py          # Topic-scoped vector store
│   │   └── orchestration/
│   │       ├── pipeline_graph.py          # LangGraph state machine
│   │       └── pipeline_runner.py         # Async progress telemetry & CLI runner
├── shared/
│   └── fixtures/
│       └── sample_template_guidance.json  # Frozen style guidance contract
├── tests/
│   └── test_cognitive_pipeline.py         # 100% passing unit & integration tests
├── Agentic_Flow_Project_Blueprint.md      # Full architecture blueprint
├── MEMBER_B_SPECIFICATION.md              # Module B specification contract
└── README.md                              # Main documentation file
```

---

## ⚙️ Setup & Configuration

### 1. Environment Setup

Copy `.env.example` to `.env` inside `backend/`:

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and insert your **Groq API Key**:

```env
GROQ_API_KEY=your_groq_api_key_here
LLM_MODEL=gpt-oss-120b
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## 🚀 Running the Cognitive Pipeline

### Run Standalone CLI Execution

You can run the full multi-agent cycle directly from your terminal:

```bash
cd backend
python -m app.orchestration.pipeline_runner --title "Autonomous AI Systems in Healthcare" --format "DOCX"
```

### Sample Output Telemetry

```text
======================================================================
>>> STARTING MODULE B STANDALONE COGNITIVE PIPELINE
Title: Autonomous AI Systems in Healthcare
Format: DOCX
======================================================================
[OK]   [15%] Requirement Analysis Agent: Extracted audience persona and core objectives.
[OK]   [30%] Planning Agent: Constructed multi-section document content plan.
[OK]   [45%] Reference Analysis Agent: Loaded visual styling rules and layout guidance profile.
[OK]   [60%] Research & Enrichment Agent: Retrieved grounded topic context from vector store.
[OK]   [75%] Content Generation Agent: Generated section-by-section draft markdown content.
Wait  [85%] Content Review Agent: Reviewed readability grade, shortened long sentences, and verified citations.

----------------------------------------------------------------------
REFINED CONTENT PREVIEW:
# Autonomous AI Systems in Healthcare
...
Reading Grade Level: 9.0
Redundancies Removed: 2
Verified Citations: 4
----------------------------------------------------------------------
```

---

## 🧪 Automated Testing

Execute the unit and integration test suite:

```bash
# Run pytest suite from project root
python -m pytest tests/test_cognitive_pipeline.py
```

Result: **7 passed in 0.68s (100% Success)**.

---

## 📜 Definition of Done (DoD) Verification

- [x] **Requirement Agent**: Outputs validated `StructuredRequirements` JSON.
- [x] **Planning Agent**: Produces multi-format outlines (`PPT`, `DOCX`, `MD`, `PDF`).
- [x] **Research Agent**: Enforces topic-scoped zero-hallucination vector queries.
- [x] **Generation Agent**: Writes active-voice markdown text with tables.
- [x] **Review Agent**: Audits Grade 8–10 readability and generates `ReviewChangelog`.
- [x] **State Machine**: Emits `WAITING_FOR_REVIEW` and yields telemetry frames.
- [x] **Groq Integration**: Supports `gpt-oss-120b` LLM model.
- [x] **Test Coverage**: 7 comprehensive test suites passing.
