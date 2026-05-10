import ollama
import chromadb
from sqlalchemy.orm import Session
from sqlalchemy import select
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.db import Email, engine

chroma = chromadb.PersistentClient(path="./chromadb")
collection = chroma.get_or_create_collection("emails")

def search_emails(query: str, top_k: int = 5) -> list:
    """
    Semantic search — finds emails by meaning, not just keywords.
    Example: "TCS application status" finds emails about job applications
    even if they don't contain those exact words.
    """
    print(f"\nSearching for: '{query}'")

    # embed the search query using the same model we used for emails
    response = ollama.embed(model="nomic-embed-text", input=[query])
    query_embedding = response["embeddings"][0]

    # find the most similar emails in ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    if not results["ids"][0]:
        print("No results found.")
        return []

    # fetch full details from SQLite
    hits = []
    with Session(engine) as session:
        for i, msg_id in enumerate(results["ids"][0]):
            email = session.get(Email, msg_id)
            if not email:
                continue
            similarity = round((1 - results["distances"][0][i]) * 100, 1)
            hits.append({
                "subject":    email.subject,
                "sender":     email.sender,
                "date":       email.date.strftime("%b %d %Y") if email.date else "",
                "body":       email.body[:300],
                "similarity": similarity,
            })

    return hits

def search_and_summarise(query: str) -> str:
    """Search emails and ask Mistral to summarise what it found."""
    hits = search_emails(query, top_k=5)
    if not hits:
        return "No relevant emails found."

    # build context for Mistral
    context = ""
    for i, h in enumerate(hits):
        context += f"\nEmail {i+1} (from {h['sender']}, {h['date']}):\n"
        context += f"Subject: {h['subject']}\n"
        context += f"Body: {h['body']}\n"

    prompt = f"""Based on these emails, answer this question: "{query}"

{context}

Give a concise, direct answer in 2-3 sentences."""

    response = ollama.chat(
        model="mistral",
        messages=[{"role": "user", "content": prompt}]
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