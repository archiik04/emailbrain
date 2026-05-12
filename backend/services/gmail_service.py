import subprocess
import json
import os
from dotenv import load_dotenv
from datetime import datetime
from sqlalchemy.orm import Session
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

load_dotenv()

GWS      = os.getenv("GWS_PATH", r"C:\Users\HP\AppData\Roaming\npm\gws.cmd")
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
    raw = run_gws(["gmail", "+triage"])
    lines = raw.strip().split("\n")
    data_lines = [
        l for l in lines
        if "─" not in l
        and "date" not in l.lower()
        and "from" not in l.lower()
        and l.strip()
    ]
    msg_ids = []
    for line in data_lines[:max_emails]:
        for part in line.split():
            if len(part) == 16 and all(c in "0123456789abcdef" for c in part):
                msg_ids.append(part)
                break
    return msg_ids

def fetch_email(msg_id: str) -> dict | None:
    try:
        raw = run_gws(["gmail", "+read", msg_id])
        return json.loads(raw)
    except:
        return None

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
        date = parsedate_to_datetime(date_str)
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