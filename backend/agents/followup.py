import ollama
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.db import Email, FollowUp, engine

def scan_followups(days_threshold: int = 3) -> list:
    """
    Scans your sent mail for emails that never got a reply.
    Flags anything older than days_threshold with no response.
    """
    print(f"\nScanning for unanswered emails older than {days_threshold} days...")

    cutoff = datetime.now() - timedelta(days=days_threshold)

    with Session(engine) as session:
        # get sent emails older than threshold
        sent = session.execute(
            select(Email)
            .where(Email.is_sent == True)
            .where(Email.date < cutoff)
            .order_by(Email.date.desc())
            .limit(100)
        ).scalars().all()

        if not sent:
            print("No sent emails found.")
            return []

        followups = []
        for email in sent:
            # check if anyone replied to this thread
            replied = session.execute(
                select(Email)
                .where(Email.is_sent == False)
                .where(Email.thread_id == email.thread_id)
                .where(Email.date > email.date)
            ).scalars().first()

            if replied:
                continue  # got a reply, skip

            # check if already tracked
            existing = session.get(FollowUp, email.message_id)
            if existing and existing.resolved:
                continue

            days_waiting = (datetime.now() - email.date).days

            # save to followups table if not already there
            if not existing:
                fu = FollowUp(
                    message_id = email.message_id,
                    subject    = email.subject,
                    recipient  = email.sender,
                    sent_date  = email.date,
                    resolved   = False,
                )
                session.merge(fu)

            followups.append({
                "message_id":   email.message_id,
                "subject":      email.subject,
                "recipient":    email.sender,
                "sent_date":    email.date.strftime("%b %d %Y") if email.date else "",
                "days_waiting": days_waiting,
            })

        session.commit()

    # sort by days waiting — longest first
    followups.sort(key=lambda x: x["days_waiting"], reverse=True)
    print(f"Found {len(followups)} emails with no reply.")
    return followups

def resolve_followup(message_id: str):
    """Mark a follow-up as resolved (you got a reply or don't need one)."""
    with Session(engine) as session:
        fu = session.get(FollowUp, message_id)
        if fu:
            fu.resolved = True
            session.commit()
            print(f"Marked as resolved: {fu.subject}")

def generate_nudge(subject: str, recipient: str, days_waiting: int) -> str:
    """Ask Mistral to write a polite follow-up nudge email."""
    prompt = f"""Write a short, polite follow-up email.

Context:
- You sent an email with subject: "{subject}"
- Recipient: {recipient}
- It has been {days_waiting} days with no reply

Write ONLY the email body. Keep it under 4 sentences.
Be friendly, not pushy. Don't start with "I hope this email finds you well"."""

    response = ollama.chat(
        model="mistral",
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"].strip()

if __name__ == "__main__":
    # scan for unanswered emails
    followups = scan_followups(days_threshold=3)

    if not followups:
        print("Great — no pending follow-ups!")
    else:
        print("\n--- EMAILS WAITING FOR REPLY ---")
        for fu in followups[:10]:
            print(f"\n  {fu['days_waiting']} days — {fu['subject'][:50]}")
            print(f"  To: {fu['recipient']}")

        # generate a nudge for the longest-waiting email
        if followups:
            top = followups[0]
            print("\n" + "="*50)
            print(f"NUDGE DRAFT for: {top['subject'][:50]}")
            print("="*50)
            nudge = generate_nudge(
                top["subject"],
                top["recipient"],
                top["days_waiting"]
            )
            print(nudge)