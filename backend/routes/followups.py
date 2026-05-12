from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from agents.followup import scan_followups, resolve_followup, generate_nudge

router = APIRouter(prefix="/followups", tags=["followups"])

class ResolveRequest(BaseModel):
    message_id: str

class NudgeRequest(BaseModel):
    subject: str
    recipient: str
    days_waiting: int

@router.get("")
def followups(days: int = 3):
    try:
        results = scan_followups(days_threshold=days)
        return {"followups": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/nudge")
def nudge(req: NudgeRequest):
    try:
        text = generate_nudge(req.subject, req.recipient, req.days_waiting)
        return {"nudge": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resolve")
def resolve(req: ResolveRequest):
    try:
        resolve_followup(req.message_id)
        return {"status": "resolved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))