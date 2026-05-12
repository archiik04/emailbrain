import os
import sys

import ollama
from sqlalchemy import select
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.db import Email, engine

TRIAGE_PROMPT = """You are an email triage assistant. Score this email's urgency from 1-10.

Rules:
- 9-10: Needs reply TODAY (deadlines, urgent requests, important people)
- 7-8:  Should reply within 24 hours
- 5-6:  Reply within a few days
- 3-4:  Low priority, reply when convenient
- 1-2:  Newsletter, notification, no reply needed

Email:
From: {sender}
Subject: {subject}
Body: {body}

Respond with ONLY a single number 1-10. Nothing else."""


def score_email(subject: str, sender: str, body: str) -> int:
    """Ask Mistral to score one email's urgency."""
    try:
        response = ollama.chat(
            model="mistral",
            messages=[
                {
                    "role": "user",
                    "content": TRIAGE_PROMPT.format(
                        sender=sender,
                        subject=subject,
                        body=body[:500],
                    ),
                }
            ],
        )
        raw = response["message"]["content"].strip()
        score = int("".join(filter(str.isdigit, raw))[:1] or "5")
        return max(1, min(10, score))
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
    }


def fetch_scored_inbox(limit: int = 30):
    """
    Return already-scored inbox emails quickly so the UI can load fast.
    """
    with Session(engine) as session:
        emails = session.execute(
            select(Email)
            .where(Email.is_sent == False)
            .where(Email.triage_score > 0)
            .order_by(Email.triage_score.desc(), Email.date.desc())
            .limit(limit)
        ).scalars().all()

    return [serialize_email(email) for email in emails]


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
