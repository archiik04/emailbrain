import ollama
from sqlalchemy.orm import Session
from sqlalchemy import select
import sys, os
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
            messages=[{
                "role": "user",
                "content": TRIAGE_PROMPT.format(
                    sender=sender,
                    subject=subject,
                    body=body[:500]  # first 500 chars is enough to judge urgency
                )
            }]
        )
        raw = response["message"]["content"].strip()
        score = int(''.join(filter(str.isdigit, raw))[:1] or "5")
        return max(1, min(10, score))  # clamp between 1-10
    except Exception as e:
        print(f"  Scoring failed: {e}")
        return 5  # default to medium if anything goes wrong

def run_triage(limit: int = 50):
    """
    Score the most recent unscored emails.
    Runs on the latest `limit` emails to keep it fast.
    """
    print(f"\nRunning triage on up to {limit} emails...")

    with Session(engine) as session:
        # get most recent emails that haven't been scored yet
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
        for i, email in enumerate(emails):
            score = score_email(email.subject, email.sender, email.body)
            email.triage_score = score
            results.append({
                "message_id":  email.message_id,
                "subject":     email.subject,
                "sender":      email.sender,
                "date":        email.date.isoformat() if email.date else "",
                "score":       score,
            })
            print(f"  [{i+1}/{len(emails)}] Score {score}/10 — {email.subject[:50]}")

        session.commit()

    # sort by score descending so highest urgency is first
    results.sort(key=lambda x: x["score"], reverse=True)
    print(f"\nTriage complete! Top email: {results[0]['subject'][:50]}")
    return results

if __name__ == "__main__":
    scored = run_triage(limit=20)
    print("\n--- YOUR INBOX BY URGENCY ---")
    for e in scored:
        bar = "█" * e["score"] + "░" * (10 - e["score"])
        print(f"  {e['score']}/10 {bar}  {e['subject'][:45]}")