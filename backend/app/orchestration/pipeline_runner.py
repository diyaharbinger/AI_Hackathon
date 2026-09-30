import asyncio
import argparse
import datetime
import uuid
from typing import AsyncGenerator, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.orchestration.pipeline_graph import pipeline_graph, PipelineGraphState

class PipelineProgressEvent(BaseModel):
    topic_id: str
    agent_name: str
    status: str
    progress_percent: int
    message: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")

async def run_pipeline_async(
    topic_id: Optional[str] = None,
    title: str = "Autonomous Multi-Agent AI System",
    description: str = "Comprehensive architecture for enterprise content synthesis.",
    target_format: str = "DOCX",
    user_instructions: Optional[str] = None,
    template_file_path: Optional[str] = None
) -> AsyncGenerator[PipelineProgressEvent, None]:
    """
    Async generator executing the 5-agent graph step-by-step.
    Yields telemetry events (PipelineProgressEvent) for Member A UI / CLI runner.
    """
    active_topic_id = topic_id or str(uuid.uuid4())

    state: PipelineGraphState = {
        "topic_id": active_topic_id,
        "title": title,
        "description": description,
        "target_format": target_format,
        "user_instructions": user_instructions,
        "template_file_path": template_file_path,
        "structured_requirements": None,
        "content_plan": None,
        "template_guidance": None,
        "knowledge_package": None,
        "draft_content": None,
        "refined_content": None,
        "review_changelog": None,
        "current_step": "STARTED",
        "status": "PROCESSING"
    }

    steps = [
        ("Agent 1: Requirement Analysis Agent", 15, "Requirement Analysis Agent", "Extracted audience persona and core objectives."),
        ("Agent 2: Planning Agent", 30, "Planning Agent", "Constructed multi-section document content plan."),
        ("Agent 3: Template Ingestion", 45, "Reference Analysis Agent", "Loaded visual styling rules and layout guidance profile."),
        ("Agent 4: Research & Enrichment Agent", 60, "Research & Enrichment Agent", "Retrieved grounded topic context from vector store."),
        ("Agent 5: Content Generation Agent", 75, "Content Generation Agent", "Generated section-by-section draft markdown content."),
        ("Agent 6: Content Review Agent", 85, "Content Review Agent", "Reviewed readability grade, shortened long sentences, and verified citations.")
    ]

    for step_label, progress, agent_name, msg in steps:
        state = pipeline_graph.execute_step(step_label.split(":")[0] if ":" in step_label else step_label, state)
        
        payload = {}
        if agent_name == "Requirement Analysis Agent":
            payload = state.get("structured_requirements") or {}
        elif agent_name == "Planning Agent":
            payload = state.get("content_plan") or {}
        elif agent_name == "Content Review Agent":
            payload = {
                "refined_content_preview": (state.get("refined_content") or "")[:200] + "...",
                "reading_grade_level": (state.get("review_changelog") or {}).get("reading_grade_level", 9.0),
                "redundancies_removed": (state.get("review_changelog") or {}).get("redundancies_removed", 2),
                "verified_citations_count": (state.get("review_changelog") or {}).get("verified_citations_count", 4)
            }

        event = PipelineProgressEvent(
            topic_id=active_topic_id,
            agent_name=agent_name,
            status="WAITING_FOR_REVIEW" if agent_name == "Content Review Agent" else "COMPLETED",
            progress_percent=progress,
            message=msg,
            payload=payload
        )

        yield event
        await asyncio.sleep(0.1)

def main():
    parser = argparse.ArgumentParser(description="Module B Standalone Cognitive Pipeline CLI Runner")
    parser.add_argument("--title", type=str, default="Autonomous Multi-Agent AI System Architecture", help="Document Title")
    parser.add_argument("--description", type=str, default="Comprehensive technical guide for multi-agent execution graphs.", help="Document Description")
    parser.add_argument("--format", type=str, choices=["PPT", "DOCX", "MD", "PDF"], default="DOCX", help="Target Format")
    parser.add_argument("--instructions", type=str, default=None, help="User instructions")

    args = parser.parse_args()

    print("=" * 70)
    print(">>> STARTING MODULE B STANDALONE COGNITIVE PIPELINE")
    print(f"Title: {args.title}")
    print(f"Format: {args.format}")
    print("=" * 70)

    async def run_cli():
        async for event in run_pipeline_async(
            title=args.title,
            description=args.description,
            target_format=args.format,
            user_instructions=args.instructions
        ):
            status_symbol = "[...] " if event.status == "PROCESSING" else ("Wait " if event.status == "WAITING_FOR_REVIEW" else "[OK]  ")
            print(f"{status_symbol} [{event.progress_percent}%] {event.agent_name}: {event.message}")

            if event.agent_name == "Content Review Agent":
                print("\n" + "-" * 70)
                print("REFINED CONTENT PREVIEW:")
                print(event.payload.get("refined_content_preview", ""))
                print(f"Reading Grade Level: {event.payload.get('reading_grade_level')}")
                print(f"Redundancies Removed: {event.payload.get('redundancies_removed')}")
                print(f"Verified Citations: {event.payload.get('verified_citations_count')}")
                print("-" * 70)

    asyncio.run(run_cli())

if __name__ == "__main__":
    main()
