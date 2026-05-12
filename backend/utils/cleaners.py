import re

def clean_body(raw: str) -> str:
    if not raw:
        return ""
    lines = [l for l in raw.splitlines() if not l.strip().startswith(">")]
    text = "\n".join(lines)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text[:2000]