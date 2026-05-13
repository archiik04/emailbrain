from fastapi import APIRouter, HTTPException
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from agents.triage import fetch_scored_inbox, run_triage

router = APIRouter(prefix="/inbox", tags=["inbox"])

@router.get("")
def get_inbox(limit: int = 30, refresh: bool = False):
    try:
        if refresh:
            results = run_triage(limit=limit)
            return {"emails": results, "count": len(results), "source": "triaged"}

        emails = fetch_scored_inbox(limit=limit)
        return {"emails": emails, "count": len(emails), "source": "cached"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
