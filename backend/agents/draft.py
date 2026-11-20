import json
import os
import re
from typing import Literal
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.db import Email, engine
from services.context_service import get_relevant_context
from services.llm import llm_precise, llm_writer

TONE_PROFILE_PATH = os.path.join(os.path.dirname(__file__), "..", "tone_profile.json")


class ToneProfile(BaseModel):
    """The user's writing style, learned from their sent mail."""
    formality: Literal["casual", "neutral", "formal"]
    avg_length: Literal["short", "medium", "long"]
    opener_style: str = Field(description="How they typically open emails, in about 5 words")
    closer_style: str = Field(description="How they typically close emails, in about 5 words")
    tone: str = Field(description="Overall tone, in about 5 words")
    common_phrases: list[str] = Field(description="Up to 3 phrases they often use")


TONE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "You analyse writing style. All the emails below were written by the same person."),
    ("human", "{samples}\n\nDescribe this person's writing style."),
])

# LCEL chain: prompt -> local Mistral -> validated ToneProfile.
tone_chain = TONE_PROMPT | llm_precise.with_structured_output(ToneProfile)

DRAFT_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You draft email replies on behalf of the user, in their own voice.\n\n"
     "User's writing style:\n"
     "- Formality: {formality}\n"
     "- Typical length: {avg_length}\n"
     "- Typical opener: {opener_style}\n"
     "- Typical closer: {closer_style}\n"
     "- Tone: {tone}\n"
     "- Phrases they use: {common_phrases}\n"
     "{style_examples}"
     "{context_section}\n"
     "Instructions:\n"
     "- {greeting_rule}\n"
     "- Never use the user's own name as the greeting\n"
     "- Reply directly to the content of the email and match the style above\n"
     "- End with a sign-off from the user's style, just the closing word (e.g. \"Best,\"); no [Your Name] or other placeholders\n"
     "- If local context is given, keep the draft factually consistent with it\n"
     "- Write only the email body. No subject line, no preamble."),
    ("human",
     "The user RECEIVED this email:\n"
     "From: {sender}\nSubject: {subject}\n\n{body}\n\n"
     "Write the user's reply to this sender, as the user. Do not continue or rewrite the sender's email."),
])

# LCEL chain: prompt -> local Mistral -> plain text.
draft_chain = DRAFT_PROMPT | llm_writer | StrOutputParser()

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

    try:
        # Structured output replaces the old "strip ``` fences, then json.loads" parsing.
        profile = tone_chain.invoke({"samples": samples}).model_dump()
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

def extract_first_name(sender: str) -> str:
    """
    Handles formats like:
      "Nathalie Combes <nathalie@canvas8.com>"  → "Nathalie"
      "nathalie.combes@canvas8.com"             → "Nathalie"
      "no-reply@accounts.google.com"            → "" (skip greeting)
      "LinkedIn <messages@linkedin.com>"        → "LinkedIn" (use as-is)
    """
    # Automated senders ("Jobvite Notification <no-reply@jobvite.com>") get no name.
    if re.search(r"no-?reply|notifications?@|newsletters?", sender, re.IGNORECASE):
        return ""

    # Try "Display Name <email>" format first
    name_match = re.match(r'^([^<@]+?)\s*<', sender.strip())
    if name_match:
        full_name = name_match.group(1).strip()
        first_name = full_name.split()[0] if full_name else ""
        return first_name.capitalize()
    
    # Try extracting from email local part: "nathalie.combes@..."
    email_match = re.match(r'^([a-zA-Z]+)[.\-_]?', sender.strip())
    if email_match:
        name = email_match.group(1)
        # Skip obvious non-names
        if name.lower() in ("no", "noreply", "hello", "info", 
                             "support", "team", "mail", "contact"):
            return ""
        return name.capitalize()
    
    return ""

def draft_reply(subject: str, sender: str, body: str, tone_override: str = None) -> str:
    """
    Generate a reply that sounds like you.
    tone_override: 'casual', 'neutral', or 'formal' — overrides your profile.
    """
    sender_name = extract_first_name(sender)
    profile = load_tone_profile()

    local_context = get_relevant_context(body)

    return draft_chain.invoke({
        "formality":      tone_override or profile.get("formality", "neutral"),
        "avg_length":     profile.get("avg_length", "medium"),
        "opener_style":   profile.get("opener_style", "friendly"),
        "closer_style":   profile.get("closer_style", "thanks"),
        "tone":           profile.get("tone", "professional"),
        "common_phrases": ", ".join(profile.get("common_phrases", [])),
        "style_examples": _style_examples(),
        "context_section": f"\nRelevant local context:\n{local_context}\n" if local_context else "",
        "greeting_rule":  (f'Open with "Hi {sender_name},"' if sender_name
                           else 'Open with "Hi," or "Hello," (no name is known)'),
        "sender":  sender,
        "subject": subject,
        "body":    (body or "")[:800],
    }).strip()


def _style_examples(limit: int = 2) -> str:
    """Few-shot examples: the user's most recent real sent emails (20+ words)."""
    with Session(engine) as session:
        sent = session.execute(
            select(Email)
            .where(Email.is_sent == True)
            .order_by(Email.date.desc())
            .limit(20)
        ).scalars().all()
    samples = [e.body[:400] for e in sent if len((e.body or "").split()) >= 20][:limit]
    if not samples:
        return ""
    joined = "\n---\n".join(samples)
    return f"\nExamples of emails the user actually wrote:\n{joined}\n"

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