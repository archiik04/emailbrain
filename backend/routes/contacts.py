from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
import sys, os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.db import Contact, engine
from agents.outreach import generate_warm_outreach

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.get("/stale")
def get_stale_contacts(days: int = 30):
    now = datetime.now(timezone.utc)
    threshold = now - timedelta(days=days)
    
    stale_contacts = []
    with Session(engine) as session:
        # Contacts with high priority score but old interaction
        contacts = session.execute(
            select(Contact)
            .where(Contact.last_interaction < threshold)
            .where(Contact.priority_score > 0)
            .order_by(Contact.last_interaction.asc())
            .limit(5)
        ).scalars().all()
        
        for c in contacts:
            draft = generate_warm_outreach(c.name or c.email, c.topics)
            stale_contacts.append({
                "email": c.email,
                "name": c.name,
                "last_interaction": c.last_interaction.isoformat() if c.last_interaction else None,
                "priority_score": c.priority_score,
                "topics": c.topics,
                "suggested_draft": draft
            })
            
    return {"stale_contacts": stale_contacts}
