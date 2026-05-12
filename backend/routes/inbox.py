from fastapi import APIRouter, HTTPException
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from agents.triage import fetch_scored_inbox, run_triage

router = APIRouter(prefix="/inbox", tags=["inbox"])

@router.get("")
def get_inbox(limit: int = 30, refresh: bool = False):
    try:
        if not refresh:
            ranked = fetch_scored_inbox(limit=limit)
            if ranked:
                return {"emails": ranked, "count": len(ranked), "source": "cached"}

        batch_size = limit if refresh else min(limit, 10)
        results = run_triage(limit=batch_size)
        return {"emails": results, "count": len(results), "source": "triaged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
