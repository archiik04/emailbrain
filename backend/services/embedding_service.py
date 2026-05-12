import ollama
import chromadb

chroma = chromadb.PersistentClient(path="./chromadb")
collection = chroma.get_or_create_collection("emails")

def embed_batch(ids: list, docs: list, metas: list, session):
    try:
        print(f"  Embedding {len(ids)} emails...")
        response = ollama.embed(model="nomic-embed-text", input=docs)
        collection.upsert(
            ids=ids,
            embeddings=response["embeddings"],
            documents=docs,
            metadatas=metas,
        )
        from models.db import Email
        for msg_id in ids:
            row = session.get(Email, msg_id)
            if row:
                row.embedded = True
        print(f"  Embedded {len(ids)} OK")
    except Exception as e:
        print(f"  Embedding failed: {e}")

def embed_query(query: str) -> list:
    response = ollama.embed(model="nomic-embed-text", input=[query])
    return response["embeddings"][0]

def search_similar(query_embedding: list, top_k: int = 5) -> dict:
    return collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )