import json
import os
import ollama
import subprocess
from dotenv import load_dotenv
load_dotenv()

GWS = os.getenv("GWS_PATH", "gws")

from utils.prompts import CALENDAR_PROMPT

def run_gws(args):
    result = subprocess.run(
        [GWS] + args,
        capture_output=True, text=True,
        encoding="utf-8", errors="replace"
    )
    return result.stdout or ""

def extract_and_add_to_calendar(subject: str, body: str, msg_id: str) -> dict | None:
    try:
        response = ollama.chat(
            model="mistral",
            messages=[{
                "role": "user",
                "content": CALENDAR_PROMPT.format(subject=subject, body=body[:500])
            }]
        )
        raw = response["message"]["content"].strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)

        if not data.get("has_event"):
            return None

        event_date = data.get("date", "")
        event_time = data.get("time", "09:00")
        title      = data.get("title", subject)
        desc       = data.get("description", "")

        if not event_date:
            return None

        start    = f"{event_date}T{event_time}:00"
        end_hour = int(event_time.split(":")[0]) + 1
        end      = f"{event_date}T{end_hour:02d}:{event_time.split(':')[1]}:00"

        run_gws([
            "calendar", "events", "insert",
            "--calendarId", "primary",
            "--summary", title,
            "--description", f"{desc}\n\nFrom email: {msg_id}",
            "--start.dateTime", start,
            "--start.timeZone", "Asia/Kolkata",
            "--end.dateTime", end,
            "--end.timeZone", "Asia/Kolkata",
        ])

        print(f"  Added to calendar: {title} on {event_date}")
        return data

    except Exception as e:
        print(f"  Calendar failed: {e}")
        return None