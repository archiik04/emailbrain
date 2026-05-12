from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from agents.search import search_emails, search_and_summarise

router = APIRouter(prefix="/search", tags=["search"])

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

@router.post("")
def search(req: SearchRequest):
    try:
        hits    = search_emails(req.query, top_k=req.top_k)
        summary = search_and_summarise(req.query)
        return {"results": hits, "summary": summary, "query": req.query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))