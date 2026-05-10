import re
import keyring
import threading
from datetime import datetime, timedelta
from imap_tools import MailBox, AND
from sqlalchemy.orm import Session
import ollama
import chromadb
import sys
import os

# so we can import from models/
sys.path.append(os.path.dirname(__file__))
from models.db import Email, Contact, FollowUp, engine

# ── ChromaDB setup ─────────────────────────────────────────────
chroma = chromadb.PersistentClient(path="./chromadb")
collection = chroma.get_or_create_collection("emails")

# ── Credential helpers ─────────────────────────────────────────
def save_credentials(account: str, password: str):
    keyring.set_password("emailbrain", account, password)
    print(f"Credentials saved for {account}")

def get_credentials(account: str) -> str:
    return keyring.get_password("emailbrain", account)

# ── Text cleaning ──────────────────────────────────────────────
def clean_body(raw: str) -> str:
    lines = [l for l in raw.splitlines() if not l.strip().startswith(">")]
    text = "\n".join(lines)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text[:2000]

# ── Embed a batch of emails into ChromaDB ─────────────────────
def embed_batch(ids, docs, metas, session):
    try:
        print(f"  Embedding {len(ids)} emails...")
        response = ollama.embed(model="nomic-embed-text", input=docs)
        collection.upsert(
            ids        = ids,
            embeddings = response["embeddings"],
            documents  = docs,
            metadatas  = metas,
        )
        for msg_id in ids:
            row = session.get(Email, msg_id)
            if row:
                row.embedded = True
        print(f"  Embedded {len(ids)} emails OK")
    except Exception as e:
        print(f"  Embedding failed: {e}")

# ── Ingest one folder ──────────────────────────────────────────
def ingest_folder(mailbox, folder: str, since: datetime, is_sent=False):
    print(f"\nFetching '{folder}' since {since.strftime('%Y-%m-%d')}...")

    try:
        mailbox.folder.set(folder)
    except Exception as e:
        print(f"  Could not open folder '{folder}': {e}")
        return

    batch_ids, batch_docs, batch_meta = [], [], []
    count_new = 0

    with Session(engine) as session:
        criteria = AND(date_gte=since.date())

        for msg in mailbox.fetch(criteria, bulk=True, mark_seen=False):
            msg_id = msg.headers.get("message-id", [str(msg.uid)])[0].strip()

            if session.get(Email, msg_id):
                continue  # already have it

            body = clean_body(msg.text or msg.html or "")
            if not body:
                continue

            email = Email(
                message_id   = msg_id,
                subject      = msg.subject or "(no subject)",
                sender       = str(msg.from_),
                date         = msg.date,
                body         = body,
                thread_id    = msg.headers.get("thread-topic", [msg_id])[0],
                folder       = folder,
                is_sent      = is_sent,
                embedded     = False,
                triage_score = 0,
            )
            session.add(email)
            count_new += 1

            batch_ids.append(msg_id)
            batch_docs.append(f"{email.subject}\n\n{body}")
            batch_meta.append({
                "sender": email.sender,
                "date":   email.date.isoformat() if email.date else "",
                "folder": folder,
            })

            if len(batch_ids) >= 32:
                embed_batch(batch_ids, batch_docs, batch_meta, session)
                batch_ids, batch_docs, batch_meta = [], [], []

        if batch_ids:
            embed_batch(batch_ids, batch_docs, batch_meta, session)

        session.commit()

    print(f"  Done — {count_new} new emails saved from '{folder}'")

# ── Full tiered sync ───────────────────────────────────────────
def sync(account: str, imap_host: str):
    password = get_credentials(account)
    if not password:
        raise ValueError(f"No credentials found for {account}. Run save_credentials() first.")

    now = datetime.now()

    print("=" * 50)
    print("TIER 1: Last 90 days (this makes app usable)")
    print("=" * 50)
    with MailBox(imap_host).login(account, password) as mb:
        ingest_folder(mb, "INBOX", since=now - timedelta(days=90))
        ingest_folder(mb, "[Gmail]/Sent Mail", since=now - timedelta(days=90), is_sent=True)
    print("\nTier 1 complete — app is ready to use!")

    def _tier2():
        print("\n" + "=" * 50)
        print("TIER 2: Up to 2 years (background)")
        print("=" * 50)
        with MailBox(imap_host).login(account, password) as mb:
            ingest_folder(mb, "INBOX", since=now - timedelta(days=730))
            ingest_folder(mb, "[Gmail]/Sent Mail", since=now - timedelta(days=730), is_sent=True)
        print("\nTier 2 complete — full history indexed!")

    threading.Thread(target=_tier2, daemon=True).start()

# ── Incremental poll (call every 15 min) ──────────────────────
def poll(account: str, imap_host: str):
    with Session(engine) as session:
        latest = session.query(Email).order_by(Email.date.desc()).first()
        since  = latest.date if latest else datetime.now() - timedelta(days=90)

    password = get_credentials(account)
    with MailBox(imap_host).login(account, password) as mb:
        ingest_folder(mb, "INBOX", since=since)
        ingest_folder(mb, "Sent",  since=since, is_sent=True)