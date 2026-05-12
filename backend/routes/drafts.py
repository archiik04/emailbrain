from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from agents.draft import draft_reply, build_tone_profile

router = APIRouter(prefix="/drafts", tags=["drafts"])

class DraftRequest(BaseModel):
    subject: str
    sender: str
    body: str
    tone_override: str = None

@router.post("")
def draft(req: DraftRequest):
    try:
        text = draft_reply(req.subject, req.sender, req.body, req.tone_override)
        return {"draft": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tone-profile")
def tone_profile():
    try:
        profile = build_tone_profile()
        return {"profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))