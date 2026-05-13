import re
import ollama
import chromadb
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.db import Email, engine

chroma = chromadb.PersistentClient(path="./chromadb")
collection = chroma.get_or_create_collection("emails")

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
            
            return [
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
            
            return [
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
        return existing_vector_search(query, top_k)

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
    email_list = "\n".join([
        f"- From: {r['sender']} | Subject: {r['subject']} | Date: {r['date']}"
        for r in hits
    ])
    
    SUMMARY_PROMPT = f"""
The user searched for: "{query}"

Here are the matching emails:
{email_list}

Write a 2-3 sentence summary of what these emails contain.
Only describe what is in the list above. 
Do not mention emails that are not listed.
If the list is empty, say "No emails found matching that search."
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