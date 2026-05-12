from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from agents.triage import run_triage

router = APIRouter(prefix="/inbox", tags=["inbox"])

@router.get("")
def get_inbox(limit: int = 30):
    try:
        results = run_triage(limit=limit)
        return {"emails": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))