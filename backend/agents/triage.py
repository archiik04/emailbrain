import os
import sys

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.db import Email, engine
from services.context_service import has_local_context
from services.llm import llm_precise


class TriageScore(BaseModel):
    """Urgency score for one email."""
    score: int = Field(ge=1, le=10, description="Urgency from 1 (no reply needed) to 10 (reply today)")


TRIAGE_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You are an email triage assistant. Score each email's urgency from 1 to 10.\n\n"
     "Rules:\n"
     "- 9-10: Needs reply TODAY (deadlines, urgent requests, important people)\n"
     "- 7-8:  Should reply within 24 hours\n"
     "- 5-6:  Reply within a few days\n"
     "- 3-4:  Low priority, reply when convenient\n"
     "- 1-2:  Newsletter, notification, no reply needed"),
    ("human", "From: {sender}\nSubject: {subject}\nBody: {body}"),
])

# LCEL chain: prompt -> local Mistral -> schema-validated TriageScore.
# with_structured_output makes Ollama constrain generation to the JSON schema,
# so a "10" can no longer be mis-parsed (the old first-digit parser turned it into 1).
triage_chain = TRIAGE_PROMPT | llm_precise.with_structured_output(TriageScore)


def score_email(subject: str, sender: str, body: str) -> int:
    """Score one email's urgency with the triage chain (falls back to 5 on failure)."""
    try:
        result = triage_chain.invoke({
            "sender": sender,
            "subject": subject,
            "body": (body or "")[:500],
        })
        return result.score
    except Exception as exc:
        print(f"  Scoring failed: {exc}")
        return 5


def serialize_email(email: Email) -> dict:
    preview = (email.body or "").replace("\n", " ").strip()[:160]
    return {
        "message_id": email.message_id,
        "subject": email.subject,
        "sender": email.sender,
        "date": email.date.isoformat() if email.date else "",
        "score": email.triage_score,
        "body": email.body or "",
        "preview": preview,
        "warning_flag": email.warning_flag,
        "has_context": has_local_context(email.body or "")
    }


def fetch_scored_inbox(limit: int = 30):
    """
    Return all inbox emails ordered by date (latest first).
    Unscored emails (score=0) are included so the UI is never empty.
    """
    with Session(engine) as session:
        emails = session.execute(
            select(Email)
            .where(Email.is_sent == False)
            .order_by(Email.date.desc())   # latest first regardless of score
            .limit(limit)
        ).scalars().all()
        return [serialize_email(email) for email in emails]  # inside session


def run_triage(limit: int = 50):
    """
    Score the most recent unscored emails.
    Runs on the latest `limit` emails to keep it fast.
    """
    print(f"\nRunning triage on up to {limit} emails...")

    with Session(engine) as session:
        emails = session.execute(
            select(Email)
            .where(Email.triage_score == 0)
            .where(Email.is_sent == False)
            .order_by(Email.date.desc())
            .limit(limit)
        ).scalars().all()

        if not emails:
            print("No unscored emails found.")
            return []

        results = []
        for index, email in enumerate(emails):
            score = score_email(email.subject, email.sender, email.body)
            email.triage_score = score
            results.append(serialize_email(email))
            print(f"  [{index + 1}/{len(emails)}] Score {score}/10 - {email.subject[:50]}")

        session.commit()

    results.sort(key=lambda item: item["score"], reverse=True)
    print(f"\nTriage complete! Top email: {results[0]['subject'][:50]}")
    return results


if __name__ == "__main__":
    scored = run_triage(limit=20)
    print("\n--- YOUR INBOX BY URGENCY ---")
    for email in scored:
        bar = "#" * email["score"] + "-" * (10 - email["score"])
        print(f"  {email['score']}/10 {bar}  {email['subject'][:45]}")
