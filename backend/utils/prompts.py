TRIAGE_PROMPT = """You are an email triage assistant. Score this email's urgency from 1-10.

Rules:
- 9-10: Needs reply TODAY (deadlines, urgent requests, important people)
- 7-8:  Should reply within 24 hours
- 5-6:  Reply within a few days
- 3-4:  Low priority, reply when convenient
- 1-2:  Newsletter, notification, no reply needed

Email:
From: {sender}
Subject: {subject}
Body: {body}

Respond with ONLY a single number 1-10. Nothing else."""

DRAFT_PROMPT = """You are ghostwriting an email reply on behalf of the user.

Their writing style:
- Formality: {formality}
- Typical length: {avg_length}
- How they open: {opener_style}
- How they close: {closer_style}
- Their tone: {tone}
- Phrases they use: {common_phrases}

Email to reply to:
From: {sender}
Subject: {subject}
Body: {body}

Write ONLY the reply email body. No subject line. No preamble."""

CALENDAR_PROMPT = """Does this email contain a meeting, event, deadline, or appointment?

Subject: {subject}
Body: {body}

Respond with JSON only:
{{
  "has_event": true,
  "title": "event title",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "description": "brief description"
}}"""

TASKS_PROMPT = """Does this email require any action from the reader?

Subject: {subject}
Body: {body}

Respond with JSON only:
{{
  "has_tasks": true,
  "tasks": ["task 1", "task 2"]
}}"""

TONE_PROMPT = """Analyse these emails written by the same person and extract their writing style.

{samples}

Respond with ONLY a JSON object:
{{
  "formality": "casual|neutral|formal",
  "avg_length": "short|medium|long",
  "opener_style": "describe how they open emails in 5 words",
  "closer_style": "describe how they close emails in 5 words",
  "tone": "describe overall tone in 5 words",
  "common_phrases": ["phrase1", "phrase2", "phrase3"]
}}"""