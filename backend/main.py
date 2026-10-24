
import logging
import os
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from groq import Groq
from pydantic import BaseModel, Field

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s",
)
logger = logging.getLogger("careerpath-ai")

# Configure GROQ_API_KEY in Render Environment Variables.
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()

# Set this to a model currently available in your Groq account.
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

MAX_MESSAGE_LENGTH = 1000
MAX_HISTORY_MESSAGES = 20
MAX_TOKENS = 800

groq_client = None

if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq client initialized.")
    except Exception:
        logger.exception("Failed to initialize Groq client.")
else:
    logger.warning("GROQ_API_KEY is not set.")

app = FastAPI(
    title="CareerPath AI API",
    description="AI-powered career guidance for students",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1",
        "http://localhost",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "https://career-path-ai-ulxg.onrender.com",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=MAX_MESSAGE_LENGTH)
    career_context: Dict[str, Any] = Field(default_factory=dict)
    history: List[Dict[str, Any]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    response: str

SYSTEM_PROMPT = """
You are CareerPath AI, a practical AI career counselor for college students.

Give beginner-friendly, personalized guidance about career choices, skills,
learning roadmaps, projects, and interview preparation.

Use the student's career context when provided. Be supportive, concise,
honest about uncertainty, and specific about actionable next steps.
Do not guarantee jobs or salaries. Respond in the language the student uses,
including Hinglish when appropriate.
"""

BASE_DIR = Path(__file__).resolve().parent.parent

@app.get("/")
def read_root():
    index_file = BASE_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(index_file)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "ai_configured": groq_client is not None,
        "model": GROQ_MODEL,
    }

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    if groq_client is None:
        raise HTTPException(
            status_code=503,
            detail="Groq API is not configured. Check GROQ_API_KEY in Render.",
        )

    message = request.message.strip()
    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    context = request.career_context or {}
    context_lines = []

    fields = [
        ("Target career", context.get("target_career") or context.get("targetCareer")),
        ("Current level", context.get("current_level") or context.get("currentLevel")),
        ("Available learning time", context.get("learning_time") or context.get("learningTime")),
        ("Career focus", context.get("career_focus") or context.get("focus")),
    ]

    for label, value in fields:
        if value:
            context_lines.append(f"- {label}: {value}")

    system_content = SYSTEM_PROMPT
    if context_lines:
        system_content += (
            "\n\nStudent's career context:\n" + "\n".join(context_lines)
        )

    messages = [{"role": "system", "content": system_content}]

    for item in (request.history or [])[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            messages.append({
                "role": role,
                "content": content.strip()[:MAX_MESSAGE_LENGTH],
            })

    messages.append({"role": "user", "content": message})

    try:
        result = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=MAX_TOKENS,
            temperature=0.7,
        )

        reply = result.choices[0].message.content if result.choices else None

        if not reply or not reply.strip():
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response. Please try again.",
            )

        logger.info("Groq reply received (%d characters).", len(reply))
        return ChatResponse(response=reply.strip())

    except HTTPException:
        raise
    except Exception:
        # Keep credentials and internal provider details out of API responses.
        logger.exception("Groq chat request failed.")
        raise HTTPException(
            status_code=502,
            detail="AI counselor is temporarily unavailable. Check server logs.",
        )

# Mount frontend after API routes.
app.mount(
    "/",
    StaticFiles(directory=BASE_DIR, html=True),
    name="frontend",
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
