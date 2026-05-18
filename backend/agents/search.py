import re
from datetime import datetime, timezone
import ollama
import chromadb
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.db import Email, engine

chroma = chromadb.PersistentClient(path="./chromadb")
collection = chroma.get_or_create_collection("emails")

def apply_recency_boost(results: list) -> list:
    """
    Boosts score for recent emails so newer ones 
    rank higher when similarity scores are close.
    
    Boost logic:
      - Email from last 7 days  → score × 2.0
      - Email from last 30 days → score × 1.5
      - Email from last 90 days → score × 1.2
      - Older than 90 days      → score × 1.0 (no boost)
    """
    now = datetime.now(timezone.utc)
    
    for result in results:
        try:
            # Parse date from result dict
            date_str = result.get("date", "")
            if not date_str:
                continue
                
            email_date = datetime.fromisoformat(date_str)
            
            # Make timezone-aware if naive
            if email_date.tzinfo is None:
                email_date = email_date.replace(tzinfo=timezone.utc)
            
            days_old = (now - email_date).days
            
            if days_old <= 7:
                boost = 2.0
            elif days_old <= 30:
                boost = 1.5
            elif days_old <= 90:
                boost = 1.2
            else:
                boost = 1.0
                
            result["score"] = round(result["score"] * boost, 3)
            result["days_old"] = days_old  # useful for debugging
            
        except Exception:
            continue
    
    return results

def parse_intent(query: str) -> dict:
    """
    Detect structured intent from natural language queries.
    Returns { "type": "sender"|"subject"|"semantic", 
              "value": extracted_term }
    """
    q = query.lower().strip()
    
    # "from [name]" / "emails from [name]" / "fetch emails from [name]" / "messages from [name]"
    sender_match = re.search(
        r'(?:emails?\s+|messages?\s+)?from\s+([a-zA-Z][\w\s]{1,30}?)(?:\s|$)', q
    )
    if sender_match:
        return {"type": "sender", "value": sender_match.group(1).strip()}
    
    # "about [topic]" / "regarding [topic]"
    subject_match = re.search(
        r'(?:about|regarding|subject|titled)\s+["\']?(.+?)["\']?(?:\s|$)', q
    )
    if subject_match:
        return {"type": "subject", "value": subject_match.group(1).strip()}
    
    # Everything else → semantic vector search
    return {"type": "semantic", "value": query}

def existing_vector_search(query: str, top_k: int) -> list:
    print(f"  [semantic search fallback]")
    response = ollama.embed(model="nomic-embed-text", input=[query])
    query_embedding = response["embeddings"][0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    if not results["ids"][0]:
        return []

    hits = []
    with Session(engine) as session:
        for i, msg_id in enumerate(results["ids"][0]):
            email = session.get(Email, msg_id)
            if not email:
                continue
            similarity = round((1 - results["distances"][0][i]) * 100, 1)
            hits.append({
                "message_id": email.message_id,
                "subject":    email.subject,
                "sender":     email.sender,
                "date":       email.date.isoformat() if email.date else "",
                "preview":    (email.body or "")[:160],
                "score":      similarity / 100.0,
            })
    return hits

def search_emails(query: str, top_k: int = 15) -> list:
    print(f"\nSearching for: '{query}'")
    intent = parse_intent(query)
    
    if intent["type"] == "sender":
        name = intent["value"]
        print(f"  [sender search] -> LIKE %{name}%")
        with Session(engine) as session:
            emails = session.execute(
                select(Email)
                .where(
                    or_(
                        Email.sender.ilike(f"%{name}%"),
                    )
                )
                .order_by(Email.date.desc())
                .limit(top_k)
            ).scalars().all()
            
            results = [
                {
                    "message_id": e.message_id,
                    "subject":    e.subject,
                    "sender":     e.sender,
                    "date":       e.date.isoformat() if e.date else "",
                    "preview":    (e.body or "")[:160],
                    "score":      1.0,
                }
                for e in emails
            ]
            
    elif intent["type"] == "subject":
        keyword = intent["value"]
        print(f"  [subject search] -> LIKE %{keyword}%")
        with Session(engine) as session:
            emails = session.execute(
                select(Email)
                .where(Email.subject.ilike(f"%{keyword}%"))
                .order_by(Email.date.desc())
                .limit(top_k)
            ).scalars().all()
            
            results = [
                {
                    "message_id": e.message_id,
                    "subject":    e.subject,
                    "sender":     e.sender,
                    "date":       e.date.isoformat() if e.date else "",
                    "preview":    (e.body or "")[:160],
                    "score":      1.0,
                }
                for e in emails
            ]
            
    else:
        results = existing_vector_search(query, top_k)
        
    # Apply recency boost and sort
    results = apply_recency_boost(results)
    results.sort(key=lambda x: x["score"], reverse=True)
    return results

def search_and_summarise(query: str) -> str:
    """Search emails and ask Mistral to summarise what it found."""
    # Re-use the smart search, getting slightly fewer results for the context window
    hits = search_emails(query, top_k=5)
    
    intent = parse_intent(query)
    
    if not hits:
        if intent["type"] == "sender":
            return f"No emails found from {intent['value'].capitalize()}."
        return "No emails found matching that search."

    # Format strictly to prevent hallucinating un-returned emails
    today = datetime.now().strftime("%B %d, %Y")
    email_list = "\n".join([
        f"- [{r['date'][:10]}] From: {r['sender']} | Subject: {r['subject']}"
        for r in hits
    ])
    
    SUMMARY_PROMPT = f"""
Today's date is {today}.
The user searched for: "{query}"

Here are the most relevant matching emails (newest first):
{email_list}

Write a 2-3 sentence summary. 
Mention specific dates when relevant.
Highlight the most RECENT matches first.
If all results are older than 60 days, note that no recent emails matched.
Only describe emails in the list above.
"""

    response = ollama.chat(
        model="mistral",
        messages=[{"role": "user", "content": SUMMARY_PROMPT}]
    )
    return response["message"]["content"].strip()

if __name__ == "__main__":
    # test with a few queries relevant to your inbox
    queries = [
        "TCS recruitment and registration",
        "internship opportunities",
        "security alerts",
    ]

    for query in queries:
        print("\n" + "=" * 50)
        print(f"QUERY: {query}")
        print("=" * 50)

        hits = search_emails(query, top_k=3)
        for h in hits:
            print(f"\n  {h['similarity']}% match")
            print(f"  From: {h['sender']}")
            print(f"  Subject: {h['subject']}")
            print(f"  Date: {h['date']}")

        print("\nAI SUMMARY:")
        print(search_and_summarise(query))