from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import sys, os
sys.path.append(os.path.dirname(__file__))

from agents.triage import run_triage
from agents.search import search_emails, search_and_summarise
from agents.draft import draft_reply, build_tone_profile
from agents.followup import scan_followups, resolve_followup, generate_nudge
from ingestion import sync, poll

# Request models
class DraftRequest(BaseModel):
    subject: str
    sender: str
    body: str
    tone_override: str = None

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

class SyncRequest(BaseModel):
    account: str
    imap_host: str = "imap.gmail.com"

class NudgeRequest(BaseModel):
    subject: str
    recipient: str
    days_waiting: int

class ResolveRequest(BaseModel):
    message_id: str

# App setup 
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Email Brain API starting up...")
    yield
    print("Email Brain API shutting down...")

app = FastAPI(title="Email Brain API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420",  # Tauri dev port
                   "http://localhost:3000",   # React dev port
                   "tauri://localhost"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes

@app.get("/")
def root():
    return {"status": "Email Brain is running", "version": "1.0.0"}

@app.get("/triage")
def triage(limit: int = 50):
    """Get inbox sorted by urgency score."""
    try:
        results = run_triage(limit=limit)
        return {"emails": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
def search(req: SearchRequest):
    """Semantic search across all emails."""
    try:
        hits = search_emails(req.query, top_k=req.top_k)
        summary = search_and_summarise(req.query)
        return {"results": hits, "summary": summary, "query": req.query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/draft")
def draft(req: DraftRequest):
    """Generate a reply draft in your tone."""
    try:
        text = draft_reply(req.subject, req.sender, req.body, req.tone_override)
        return {"draft": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/followups")
def followups(days: int = 3):
    """Get emails waiting for a reply."""
    try:
        results = scan_followups(days_threshold=days)
        return {"followups": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/followups/nudge")
def nudge(req: NudgeRequest):
    """Generate a follow-up nudge email."""
    try:
        text = generate_nudge(req.subject, req.recipient, req.days_waiting)
        return {"nudge": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/followups/resolve")
def resolve(req: ResolveRequest):
    """Mark a follow-up as resolved."""
    try:
        resolve_followup(req.message_id)
        return {"status": "resolved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync")
def trigger_sync(req: SyncRequest):
    """Trigger a full email sync."""
    try:
        sync(req.account, req.imap_host)
        return {"status": "sync complete"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tone-profile")
def tone_profile():
    """Get or build your writing tone profile."""
    try:
        profile = build_tone_profile()
        return {"profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8765, reload=True)