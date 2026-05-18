import ollama

def generate_warm_outreach(name: str, topics: str) -> str:
    """Generates a casual check-in draft for a stale contact."""
    prompt = f"""You are writing a short, casual check-in email to {name}.
You haven't spoken in a while. 
Their interests/topics: {topics}

Write a short, friendly message checking in and mentioning one of their interests to reconnect.
Keep it casual and concise (2-3 sentences).
Do not include a subject line.
"""
    response = ollama.chat(
        model="mistral",
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"].strip()
