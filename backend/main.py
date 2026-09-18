"""
CareerPath AI — Backend API
============================

A FastAPI backend for the CareerPath AI Career Guidance System.

This version makes REAL calls to the Hugging Face Inference Providers
API using the model `deepseek-ai/DeepSeek-V4.1-Flash`. There is no
placeholder response anywhere in this file — every successful /chat
request is generated live by the Hugging Face model.

The Hugging Face token is read ONLY from the `HF_TOKEN` environment
variable and is never exposed to the frontend.

Flow:
    counselor.html
        ↓
    js/counselor.js
        ↓
    FastAPI  POST /chat          ← this file
        ↓
    huggingface_hub.InferenceClient
        ↓
    deepseek-ai/DeepSeek-V4.1-Flash
        ↓
    FastAPI  POST /chat
        ↓
    js/counselor.js
        ↓
    Chat UI
"""

import logging
import os
from pathlib import Path
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from pydantic import BaseModel, Field


# =====================================================================
# 1. LOGGING
# =====================================================================
# Server-side logging only. Nothing here is exposed to the frontend.

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s",
)
logger = logging.getLogger("careerpath-ai")


# =====================================================================
# 2. CONFIGURATION
# =====================================================================

# Read the Hugging Face token from the environment. Never hardcode it.
HF_TOKEN = os.getenv("HF_TOKEN")

# The DeepSeek model served through Hugging Face Inference Providers.
HF_MODEL = "deepseek-ai/DeepSeek-V4.1-Flash"

# Request limits and generation settings.
MAX_MESSAGE_LENGTH = 1000
MAX_HISTORY_MESSAGES = 20
MAX_TOKENS = 800          # Within the requested 500–800 range.
TEMPERATURE = 0.7
TOP_P = 0.95


# =====================================================================
# 3. APP INSTANCE
# =====================================================================

app = FastAPI(
    title="CareerPath AI API",
    description="Backend API for AI Career Guidance System",
    version="1.0.0",
)


# =====================================================================
# 4. CORS CONFIGURATION
# =====================================================================
# Allows the local frontend (Live Server, etc.) to call this backend
# during development.

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
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# 5. HUGGING FACE CLIENT
# =====================================================================
# The client is created once at startup. If the token is missing, we
# leave the client as None and `/chat` returns a clear configuration
# error instead of crashing.

hf_client: InferenceClient | None = None

if HF_TOKEN:
    try:
        hf_client = InferenceClient(
            provider="auto",
            api_key=HF_TOKEN,
        )
        logger.info("Hugging Face InferenceClient initialised (model=%s).", HF_MODEL)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to initialise InferenceClient: %s", exc)
        hf_client = None
else:
    logger.warning("HF_TOKEN is not set — /chat will return a configuration error.")


# =====================================================================
# 6. REQUEST / RESPONSE MODELS
# =====================================================================

class ChatRequest(BaseModel):
    """
    Payload sent by `counselor.js`.

    Example:
        {
            "message": "How should I prepare for an AI/ML career?",
            "career_context": {
                "target_career": "AI/ML Engineer",
                "current_level": "Beginner",
                "learning_time": "2 hours/day",
                "career_focus": "Skills and roadmap"
            },
            "history": []
        }
    """

    message: str = Field(..., description="The student's question.")
    career_context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Career context used to personalize the answer.",
    )
    history: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Previous messages in the conversation (optional).",
    )


class ChatResponse(BaseModel):
    """Response returned by the `/chat` endpoint."""

    response: str = Field(..., description="The counselor's reply text.")


# =====================================================================
# 7. SYSTEM PROMPT
# =====================================================================

SYSTEM_PROMPT = """You are CareerPath AI, a practical AI career counselor for college students.

Your role:
- Give practical, beginner-friendly career guidance.
- Consider the student's career context (target career, current level, available time, focus).
- Explain skills to learn, learning roadmaps, project suggestions and interview preparation in a clear way.
- Suggest concrete, actionable next steps the student can take.
- Be honest about uncertainty. Clearly distinguish general guidance from certainty.
- Avoid unrealistic salary or job guarantees.

Style:
- Supportive, honest and encouraging.
- Direct and free of unnecessary filler.
- Reasonably concise. Prefer short paragraphs and bullet points when helpful.

Safety:
- Do not claim to guarantee any career outcome.
- Recommend that the student combine this guidance with their own research, interests, abilities and advice from qualified mentors when appropriate.
"""


# =====================================================================
# 8. HELPER — BUILD MESSAGES FOR THE MODEL
# =====================================================================

def build_messages(request: ChatRequest) -> List[Dict[str, str]]:
    """
    Convert the incoming request into the message list expected by the
    Hugging Face chat completion API.

    Order:
        1. System prompt (with career context appended).
        2. Previous conversation history (user / assistant only).
        3. The current user message.
    """

    messages: List[Dict[str, str]] = []

    # --- 1. System prompt + career context -------------------------
    system_content = SYSTEM_PROMPT

    ctx = request.career_context or {}
    context_lines: List[str] = []

    target_career = ctx.get("target_career") or ctx.get("targetCareer")
    current_level = ctx.get("current_level") or ctx.get("currentLevel")
    learning_time = ctx.get("learning_time") or ctx.get("learningTime")
    career_focus = ctx.get("career_focus") or ctx.get("focus")

    if target_career:
        context_lines.append(f"- Target career: {target_career}")
    if current_level:
        context_lines.append(f"- Current level: {current_level}")
    if learning_time:
        context_lines.append(f"- Available learning time: {learning_time}")
    if career_focus:
        context_lines.append(f"- Current focus: {career_focus}")

    if context_lines:
        system_content += (
            "\n\nStudent's career context (use this to personalize your answer):\n"
            + "\n".join(context_lines)
        )

    messages.append({"role": "system", "content": system_content})

    # --- 2. Conversation history -----------------------------------
    # Only allow "user" and "assistant" roles. Keep the most recent
    # messages so the prompt stays within a reasonable size.
    history = request.history or []
    if history:
        trimmed = history[-MAX_HISTORY_MESSAGES:]
        for entry in trimmed:
            if not isinstance(entry, dict):
                continue
            role = entry.get("role")
            content = entry.get("content")
            if role in ("user", "assistant") and isinstance(content, str) and content.strip():
                messages.append({"role": role, "content": content.strip()})

    # --- 3. Current user message -----------------------------------
    messages.append({"role": "user", "content": request.message.strip()})

    return messages


# =====================================================================
# 9. HELPER — EXTRACT THE ASSISTANT TEXT
# =====================================================================

def extract_assistant_text(completion: Any) -> str:
    """
    Pull the generated assistant text out of the Hugging Face response.

    The InferenceClient chat-completion response follows the OpenAI
    shape: completion.choices[0].message.content
    """

    if completion is None:
        return ""

    choices = getattr(completion, "choices", None)
    if not choices:
        return ""

    first_choice = choices[0]

    # Standard OpenAI-compatible shape.
    message = getattr(first_choice, "message", None)
    if message is not None:
        content = getattr(message, "content", None)
        if isinstance(content, str) and content.strip():
            return content.strip()

    # Some providers return `text` instead of `message.content`.
    text = getattr(first_choice, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()

    return ""


# =====================================================================
# 10. ROOT ENDPOINT
# =====================================================================

# Project root directory
BASE_DIR = Path(__file__).resolve().parent.parent


@app.get("/")
def read_root():
    """Serve the CareerPath AI frontend."""
    return FileResponse(BASE_DIR / "index.html")


# =====================================================================
# 11. HEALTH ENDPOINT
# =====================================================================

@app.get("/health")
def health_check() -> Dict[str, str]:
    """Lightweight health probe used by deployment tooling."""
    return {"status": "healthy"}


# =====================================================================
# 12. CHAT ENDPOINT — REAL HUGGING FACE CALL
# =====================================================================

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """
    Receive a student's question, send it to the Hugging Face model,
    and return the AI counselor's reply.

    This endpoint makes a REAL Hugging Face Inference Providers request.
    There is no placeholder or mock response.
    """

    # --- 12.1 Configuration check ----------------------------------
    if not HF_TOKEN or hf_client is None:
        logger.error("Rejected /chat request: HF_TOKEN is missing or client failed to initialise.")
        raise HTTPException(
            status_code=503,
            detail=(
                "The AI counselor is not configured on the server. "
                "Please set the HF_TOKEN environment variable and restart the backend."
            ),
        )

    # --- 12.2 Input validation -------------------------------------
    message = (request.message or "").strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    if len(message) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Message is too long. "
                f"Please keep it under {MAX_MESSAGE_LENGTH} characters."
            ),
        )

    # --- 12.3 Build the conversation -------------------------------
    try:
        messages = build_messages(request)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to build messages: %s", exc)
        raise HTTPException(
            status_code=400,
            detail="The request could not be processed. Please check the message format.",
        )

    # --- 12.4 Call the Hugging Face model --------------------------
    try:
        logger.info(
            "Calling Hugging Face model '%s' with %d message(s).",
            HF_MODEL,
            len(messages),
        )

        completion = hf_client.chat.completions.create(
            model=HF_MODEL,
            messages=messages,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            top_p=TOP_P,
        )

        reply = extract_assistant_text(completion)

        if not reply:
            logger.warning("Hugging Face returned an empty completion.")
            raise HTTPException(
                status_code=502,
                detail="The AI counselor returned an empty response. Please try again.",
            )

        logger.info("Hugging Face reply received (%d characters).", len(reply))
        return ChatResponse(response=reply)

    except HTTPException:
        # Re-raise HTTP exceptions we deliberately created.
        raise

    except Exception as exc:  # noqa: BLE001
        # Log the real error server-side, but never expose tokens or
        # stack traces to the frontend.
        logger.exception("Hugging Face request failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=(
                "The AI counselor is temporarily unavailable. "
                "Please try again in a moment."
            ),
        )


# =====================================================================
# 13. LOCAL DEVELOPMENT ENTRYPOINT
# =====================================================================
  # Serve frontend HTML, CSS, JavaScript and other assets
app.mount(
    "/",
    StaticFiles(directory=BASE_DIR, html=True),
    name="frontend",
)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)