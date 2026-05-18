import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
load_dotenv()

from models.db import Email, engine
from services.gmail_service import get_inbox_ids, store_email
from services.embedding_service import embed_batch, collection
from datetime import datetime, timezone, timedelta
import ollama

def check_for_conflict(new_doc: str, old_doc: str) -> bool:
    prompt = f"""Compare these two emails. They are semantically similar.
Email 1 (New): {new_doc}
Email 2 (Old): {old_doc}
Do they contain conflicting time or date entities? For example, did a deadline or meeting time change?
Answer ONLY 'YES' or 'NO'.
"""
    try:
        response = ollama.chat(model="mistral", messages=[{"role": "user", "content": prompt}])
        return "YES" in response["message"]["content"].upper()
    except:
        return False

def detect_conflicts(batch_ids, batch_docs, batch_meta, session):
    now = datetime.now(timezone.utc)
    threshold = now - timedelta(days=7)
    
    # We need embeddings to query ChromaDB. Since embed_batch upserts, we can query ChromaDB directly
    # Wait, we can get embeddings by querying the DB since they were just upserted.
    results = collection.get(ids=batch_ids, include=["embeddings"])
    embeddings = results.get("embeddings", [])
    if not embeddings:
        return

    for i, msg_id in enumerate(batch_ids):
        if i >= len(embeddings) or not embeddings[i]:
            continue
            
        matches = collection.query(
            query_embeddings=[embeddings[i]],
            n_results=4,
            include=["documents", "metadatas", "distances"]
        )
        
        if not matches["ids"] or not matches["ids"][0]:
            continue
            
        new_doc = batch_docs[i]
        conflict_found = False
        
        for j, match_id in enumerate(matches["ids"][0]):
            if match_id == msg_id:
                continue
                
            match_meta = matches["metadatas"][0][j]
            match_date_str = match_meta.get("date", "")
            if not match_date_str:
                continue
            
            try:
                match_date = datetime.fromisoformat(match_date_str)
                if match_date.tzinfo is None:
                    match_date = match_date.replace(tzinfo=timezone.utc)
                if match_date < threshold:
                    continue # Older than 7 days
            except:
                continue
                
            old_doc = matches["documents"][0][j]
            # Semantic distance check to ensure it's very similar
            distance = matches["distances"][0][j]
            if distance > 0.3: # Roughly 70% similar
                continue
                
            if check_for_conflict(new_doc, old_doc):
                conflict_found = True
                break
                
        if conflict_found:
            email = session.get(Email, msg_id)
            if email:
                email.warning_flag = True

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
                detect_conflicts(batch_ids, batch_docs, batch_meta, session)
                batch_ids, batch_docs, batch_meta = [], [], []

        if batch_ids:
            embed_batch(batch_ids, batch_docs, batch_meta, session)
            detect_conflicts(batch_ids, batch_docs, batch_meta, session)

        session.commit()

    print(f"\nDone! {count_new} new emails saved.")
    return count_new

if __name__ == "__main__":
    sync(max_emails=50)