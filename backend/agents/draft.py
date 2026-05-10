import ollama
import json
import os
from sqlalchemy.orm import Session
from sqlalchemy import select
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.db import Email, engine

TONE_PROFILE_PATH = os.path.join(os.path.dirname(__file__), "..", "tone_profile.json")

def build_tone_profile() -> dict:
    """
    Analyse your sent emails to learn your writing style.
    Saves result to tone_profile.json
    """
    print("Building tone profile from your sent mail...")

    with Session(engine) as session:
        sent_emails = session.execute(
            select(Email)
            .where(Email.is_sent == True)
            .order_by(Email.date.desc())
            .limit(50)
        ).scalars().all()

    if not sent_emails:
        print("No sent emails found — using default profile.")
        return _default_profile()

    # filter out very short emails (< 20 words) — they skew the profile
    good_samples = [
        e for e in sent_emails
        if len(e.body.split()) >= 20
    ]

    if not good_samples:
        print("Not enough long sent emails — using default profile.")
        return _default_profile()

    # build sample text for Mistral to analyse
    samples = ""
    for i, e in enumerate(good_samples[:10]):
        samples += f"\n--- Email {i+1} ---\n{e.body[:400]}\n"

    prompt = f"""Analyse these emails written by the same person and extract their writing style.

{samples}

Respond with ONLY a JSON object (no markdown, no explanation):
{{
  "formality": "casual|neutral|formal",
  "avg_length": "short|medium|long",
  "opener_style": "describe how they typically open emails in 5 words",
  "closer_style": "describe how they typically close emails in 5 words",
  "tone": "describe overall tone in 5 words",
  "common_phrases": ["phrase1", "phrase2", "phrase3"]
}}"""

    try:
        response = ollama.chat(
            model="mistral",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response["message"]["content"].strip()
        # strip markdown fences if Mistral adds them
        raw = raw.replace("```json", "").replace("```", "").strip()
        profile = json.loads(raw)
        print(f"  Tone: {profile.get('tone')}")
        print(f"  Formality: {profile.get('formality')}")
        print(f"  Length: {profile.get('avg_length')}")
    except Exception as e:
        print(f"  Could not parse profile: {e} — using default.")
        profile = _default_profile()

    # save to disk
    with open(TONE_PROFILE_PATH, "w") as f:
        json.dump(profile, f, indent=2)
    print(f"  Tone profile saved!")
    return profile

def _default_profile() -> dict:
    return {
        "formality": "neutral",
        "avg_length": "medium",
        "opener_style": "friendly and direct",
        "closer_style": "thanks or regards",
        "tone": "professional but approachable",
        "common_phrases": ["please let me know", "thanks", "looking forward"]
    }

def load_tone_profile() -> dict:
    if os.path.exists(TONE_PROFILE_PATH):
        with open(TONE_PROFILE_PATH) as f:
            return json.load(f)
    return build_tone_profile()

def draft_reply(subject: str, sender: str, body: str, tone_override: str = None) -> str:
    """
    Generate a reply that sounds like you.
    tone_override: 'casual', 'neutral', or 'formal' — overrides your profile.
    """
    profile = load_tone_profile()

    formality = tone_override or profile.get("formality", "neutral")

    prompt = f"""You are ghostwriting an email reply on behalf of the user.

Their writing style:
- Formality: {formality}
- Typical length: {profile.get('avg_length', 'medium')}
- How they open: {profile.get('opener_style', 'friendly')}
- How they close: {profile.get('closer_style', 'thanks')}
- Their tone: {profile.get('tone', 'professional')}
- Phrases they use: {', '.join(profile.get('common_phrases', []))}

Email to reply to:
From: {sender}
Subject: {subject}
Body: {body[:600]}

Write ONLY the reply email body. No subject line. No "Here is a draft:" preamble.
Sound exactly like the user based on their style above."""

    response = ollama.chat(
        model="mistral",
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"].strip()

if __name__ == "__main__":
    # step 1: build tone profile from your sent mail
    profile = build_tone_profile()
    print("\nYour writing profile:")
    print(json.dumps(profile, indent=2))

    # step 2: test drafting a reply to your TCS email
    print("\n" + "="*50)
    print("TEST DRAFT — replying to TCS registration email")
    print("="*50)

    test_reply = draft_reply(
        subject="TCS Recruitment: Registration Successful.",
        sender="recruitment.entrylevel@tcs.com",
        body="Dear Candidate, Your registration for TCS recruitment is successful. Your DT Reference ID is DT20268130265. Please keep this for future reference and complete the next steps.",
        tone_override=None  # use your natural tone
    )
    print("\nGenerated draft:")
    print("-" * 40)
    print(test_reply)
    print("-" * 40)

    # step 3: same email but formal tone
    print("\nSame email — FORMAL tone override:")
    print("-" * 40)
    formal = draft_reply(
        subject="TCS Recruitment: Registration Successful.",
        sender="recruitment.entrylevel@tcs.com",
        body="Dear Candidate, Your registration for TCS recruitment is successful.",
        tone_override="formal"
    )
    print(formal)
    print("-" * 40)