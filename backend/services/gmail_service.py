import subprocess
import json
import os
from dotenv import load_dotenv
from datetime import datetime
from sqlalchemy.orm import Session
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

load_dotenv()

GWS      = os.getenv("GWS_PATH", "gws")
MY_EMAIL = os.getenv("EMAIL_ADDRESS", "")

from models.db import Email, engine
from utils.cleaners import clean_body

def run_gws(args: list) -> str:
    result = subprocess.run(
        [GWS] + args,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    return result.stdout or ""

def get_inbox_ids(max_emails: int = 50) -> list:
    # Recent inbox AND sent mail (sent mail feeds the tone profile and follow-ups).
    raw = run_gws([
        "gmail", "+triage",
        "--max", str(max_emails),
        "--query", "in:inbox OR in:sent",
        "--format", "json",
    ])
    try:
        messages = json.loads(raw).get("messages", [])
    except (json.JSONDecodeError, AttributeError):
        return []
    return [m["id"] for m in messages if m.get("id")]

def _format_address(value) -> str:
    """gws returns addresses as {"name", "email"} objects; store them as 'Name <email>'."""
    if isinstance(value, dict):
        name, addr = value.get("name"), value.get("email", "")
        return f"{name} <{addr}>" if name else addr
    if isinstance(value, list):
        return ", ".join(_format_address(v) for v in value)
    return value or ""

def fetch_email(msg_id: str) -> dict | None:
    try:
        raw = run_gws(["gmail", "+read", "--id", msg_id, "--headers", "--format", "json"])
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None
    if "error" in data:
        return None
    return {
        "from":     _format_address(data.get("from")),
        "to":       _format_address(data.get("to")),
        "subject":  data.get("subject") or "(no subject)",
        "date":     data.get("date", ""),
        "body":     data.get("body_text") or "",
        "threadId": data.get("thread_id") or msg_id,
    }

def send_reply(msg_id: str, body: str) -> bool:
    result = run_gws(["gmail", "+reply", msg_id, "--body", body])
    return "error" not in result.lower()

def store_email(msg_id: str, session) -> bool:
    if session.get(Email, msg_id):
        return False

    data = fetch_email(msg_id)
    if not data:
        return False

    body = clean_body(data.get("body", "") or data.get("snippet", ""))
    if not body:
        return False

    date_str = data.get("date", "")
    try:
        from email.utils import parsedate_to_datetime
        # Store as naive local time; the agents compare against datetime.now().
        date = parsedate_to_datetime(date_str).astimezone().replace(tzinfo=None)
    except:
        date = datetime.now()

    sender  = data.get("from", "")
    subject = data.get("subject", "(no subject)")
    is_sent = MY_EMAIL in sender.lower()

    email = Email(
        message_id   = msg_id,
        subject      = subject,
        sender       = sender,
        date         = date,
        body         = body,
        thread_id    = data.get("threadId", msg_id),
        folder       = "SENT" if is_sent else "INBOX",
        is_sent      = is_sent,
        embedded     = False,
        triage_score = 0,
    )
    session.add(email)
    return True