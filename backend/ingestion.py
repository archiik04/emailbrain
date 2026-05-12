import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
load_dotenv()

from models.db import Email, engine
from services.gmail_service import get_inbox_ids, store_email
from services.embedding_service import embed_batch

def sync(max_emails: int = 50):
    print("=" * 50)
    print(f"Syncing up to {max_emails} emails via gws...")
    print("=" * 50)

    msg_ids = get_inbox_ids(max_emails)
    print(f"Found {len(msg_ids)} emails to process...")

    if not msg_ids:
        print("No emails found.")
        return 0

    batch_ids, batch_docs, batch_meta = [], [], []
    count_new = 0

    with Session(engine) as session:
        for i, msg_id in enumerate(msg_ids):
            print(f"  [{i+1}/{len(msg_ids)}] {msg_id}...")
            stored = store_email(msg_id, session)

            if stored:
                count_new += 1
                email = session.get(Email, msg_id)
                if email:
                    batch_ids.append(msg_id)
                    batch_docs.append(f"{email.subject}\n\n{email.body}")
                    batch_meta.append({
                        "sender": email.sender,
                        "date":   email.date.isoformat() if email.date else "",
                        "folder": email.folder,
                    })

            if len(batch_ids) >= 32:
                embed_batch(batch_ids, batch_docs, batch_meta, session)
                batch_ids, batch_docs, batch_meta = [], [], []

        if batch_ids:
            embed_batch(batch_ids, batch_docs, batch_meta, session)

        session.commit()

    print(f"\nDone! {count_new} new emails saved.")
    return count_new

if __name__ == "__main__":
    sync(max_emails=50)