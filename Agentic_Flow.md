# Agentic Flow - Multi-Agent AI Content Generation System

## Overview
User provides:
- Topic
- Short description
- Output format (PPT, DOCX, MD, PDF, etc.)
- Optional reference documents/templates

## Agentic Workflow

### 1. Requirement Analysis Agent
Input:
- Topic
- Description
- User instructions

Responsibilities:
- Understand objectives
- Identify audience
- Identify deliverables
- Extract constraints

Output:
- Structured requirements

### 2. Planning Agent
Responsibilities:
- Create document outline
- Define sections and subsections
- Determine content depth

Output:
- Content plan

### 3. Reference Analysis Agent
(Optional)

Inputs:
- PPT templates
- DOCX templates
- Research papers
- Existing documents

Responsibilities:
- Extract structure
- Extract formatting patterns
- Extract style and tone
- Identify section hierarchy

Output:
- Template guidance

### 4. Research & Enrichment Agent
Responsibilities:
- Gather domain knowledge
- Fill content gaps
- Add examples and supporting information

Output:
- Knowledge package

### 5. Content Generation Agent
Responsibilities:
- Generate content based on plan
- Follow template guidance
- Maintain consistency

Output:
- Draft content

### 6. Content Review Agent
Responsibilities:
- Improve readability
- Remove redundancy
- Validate structure
- Refine language

Output:
- Refined content

### 7. Format Generation Agent
Responsibilities:
- Convert content into requested format
- PPT
- DOCX
- Markdown
- PDF

Output:
- Final document

## Context Management
- One chat workspace per topic
- Context isolated per topic
- Previous messages retained only within the same topic thread
- No cross-topic contamination

## High-Level Flow

User Input
    ↓
Requirement Analysis Agent
    ↓
Planning Agent
    ↓
Reference Analysis Agent (Optional)
    ↓
Research & Enrichment Agent
    ↓
Content Generation Agent
    ↓
Content Review Agent
    ↓
Format Generation Agent
    ↓
Final Output
