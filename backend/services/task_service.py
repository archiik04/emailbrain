import json
import os
import ollama
import subprocess
from dotenv import load_dotenv
load_dotenv()

GWS = os.getenv("GWS_PATH", r"C:\Users\HP\AppData\Roaming\npm\gws.cmd")

from utils.prompts import TASKS_PROMPT

def run_gws(args):
    result = subprocess.run(
        [GWS] + args,
        capture_output=True, text=True,
        encoding="utf-8", errors="replace"
    )
    return result.stdout or ""

def extract_and_add_to_tasks(subject: str, body: str) -> dict | None:
    try:
        response = ollama.chat(
            model="mistral",
            messages=[{
                "role": "user",
                "content": TASKS_PROMPT.format(subject=subject, body=body[:500])
            }]
        )
        raw = response["message"]["content"].strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)

        if not data.get("has_tasks") or not data.get("tasks"):
            return None

        for task in data["tasks"]:
            run_gws([
                "tasks", "tasks", "insert",
                "--tasklist", "@default",
                "--title", task,
                "--notes", f"From email: {subject}",
            ])
            print(f"  Added task: {task}")

        return data

    except Exception as e:
        print(f"  Tasks failed: {e}")
        return None