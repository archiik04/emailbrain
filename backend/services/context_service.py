import os
import pypdf

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")

def load_local_context() -> str:
    """Reads all .txt and .pdf files in the assets folder into a single context string."""
    if not os.path.exists(ASSETS_DIR):
        os.makedirs(ASSETS_DIR, exist_ok=True)
        return ""

    context_parts = []
    for filename in os.listdir(ASSETS_DIR):
        filepath = os.path.join(ASSETS_DIR, filename)
        if filename.endswith(".txt"):
            with open(filepath, "r", encoding="utf-8") as f:
                context_parts.append(f"--- {filename} ---\n{f.read()}")
        elif filename.endswith(".pdf"):
            try:
                reader = pypdf.PdfReader(filepath)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                context_parts.append(f"--- {filename} ---\n{text}")
            except Exception as e:
                print(f"Error reading PDF {filename}: {e}")

    return "\n\n".join(context_parts)

def get_relevant_context(query: str) -> str:
    """
    Check files for relevant keywords. For a small set of files, returning 
    the whole text is fine if it fits in VRAM, or we could do a simple keyword search.
    Since we need 'proactive intelligence and deep context grounding', returning
    the full local context is the most robust approach for small personal contexts.
    """
    context = load_local_context()
    return context

def has_local_context(body: str) -> bool:
    """Fast heuristic to check if the email body relates to any local asset."""
    context = load_local_context().lower()
    if not context:
        return False
    # Check for common project-specific keywords. For a real app we'd extract these
    # dynamically or use vector search, but a simple heuristic works for 'Antigravity Mode' MVP.
    # We look for overlapping 6+ char words that are prominent in the context.
    import re
    words = set(re.findall(r'\b[a-z]{6,}\b', body.lower()[:1000]))
    context_words = set(re.findall(r'\b[a-z]{6,}\b', context))
    overlap = words.intersection(context_words)
    return len(overlap) >= 2

