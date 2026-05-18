from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes.inbox     import router as inbox_router
from routes.search    import router as search_router
from routes.drafts    import router as drafts_router
from routes.followups import router as followups_router
from routes.contacts  import router as contacts_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Email Brain API starting...")
    yield
    print("Email Brain API shutting down...")

app = FastAPI(title="Email Brain API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "tauri://localhost",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inbox_router)
app.include_router(search_router)
app.include_router(drafts_router)
app.include_router(followups_router)
app.include_router(contacts_router)

@app.get("/")
def root():
    return {"status": "Email Brain v2 running"}


@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8765, reload=True)
