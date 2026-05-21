<div align="center">

# EmailBrain

**Warm, focused email intelligence for daily work.**

Your email. Your GPU. Your rules.

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tauri](https://img.shields.io/badge/Tauri-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

</div>


EmailBrain is a private, local-first AI email assistant that runs entirely on your machine. It connects to your inbox via IMAP, runs AI models on your GPU, and gives you smart triage, one-click drafts that sound like you, semantic search, and follow-up tracking — with **zero data leaving your computer**.


### Inbox Command Center
<img width="2559" height="1180" alt="image" src="https://github.com/user-attachments/assets/73a965e9-fb87-45d2-ac42-e5b3da0a77c2" />


### Semantic Search
<img width="2559" height="1178" alt="image" src="https://github.com/user-attachments/assets/45d7714b-34cd-4644-ae32-9b12ffcd7d9c" />


### Draft Composer
<img width="2559" height="1175" alt="image" src="https://github.com/user-attachments/assets/a4151941-3ba0-44b0-9912-80d2f4b8e1d9" />



## Features

### 📥 Inbox Command Center
Browse your inbox like a marketplace of decisions. Emails are scored and sorted by urgency so you never open a raw inbox again. An AI assistant sits alongside every thread — ready to summarize, answer questions, or generate a reply on the spot.

### 🔍 Semantic Search
Ask your inbox anything in plain English. EmailBrain embeds your emails locally using `nomic-embed-text` and queries a ChromaDB vector index to synthesize a direct answer.

```
"What deadlines are buried in my inbox?"
"Summarize every recruiter thread from this week."
"Which conversations still need a reply?"
```

### ✍️ Draft Composer
One-click drafts powered by Mistral 7B on your GPU. The draft agent learns your writing style from your own sent mail — so replies sound like you, not like ChatGPT. Tone selector: **Casual / Auto / Formal**. Never sends automatically — you always review first.

### 🔁 Follow-up Tracker
Watches emails you sent that never got a reply. Nudges you at configurable intervals (default: 3 days).

> *"You emailed Sarah 5 days ago about the contract — no reply yet."*


## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Desktop shell | Tauri (Rust + WebView) | Lightweight (~10MB), Windows native |
| Frontend | React + Tailwind CSS | Fast to build, good ecosystem |
| Backend | Python + FastAPI | All AI libs are Python-first |
| Agent framework | LangChain | Orchestrates multi-step agent loops |
| Local LLM | Ollama + Mistral 7B | Free, runs on RTX 4060 via CUDA |
| Embeddings | nomic-embed-text (Ollama) | Local, fast, fits in VRAM alongside Mistral |
| Vector DB | ChromaDB (embedded) | No server needed, persists to disk |
| Metadata DB | SQLite | Simple, embedded, zero config |
| Email ingestion | imap-tools | Handles Gmail/Outlook quirks |
| Credential storage | keyring | Uses Windows Credential Manager |


## Hardware Requirements

Developed and tested on:

- **GPU:** NVIDIA RTX 4060 (8GB VRAM)
- **OS:** Windows 11 + WSL2

| Model | VRAM | Speed |
|---|---|---|
| Mistral 7B | ~5GB | 60–80 tok/sec |
| nomic-embed-text | ~1GB | fast batches |
| Both together | ~6GB | comfortable |

> ⚠️ Do not load 13B+ models — they will overflow 8GB VRAM.


## Getting Started

### Step 1 — Enable WSL2

```bash
wsl --install
# Restart, then open Ubuntu from Start Menu
```

### Step 2 — Install Python in WSL2

```bash
sudo apt update && sudo apt install python3 python3-pip -y
```

### Step 3 — Install Ollama on Windows *(not WSL)*

Download from [ollama.com](https://ollama.com), then pull the required models:

```bash
ollama pull mistral
ollama pull nomic-embed-text
```

### Step 4 — Verify GPU is active

```bash
nvidia-smi                        
ollama run mistral "say hello"    # should respond in <2s
```

### Step 5 — Install Python dependencies

```bash
pip install imap-tools sqlalchemy chromadb ollama \
            langchain fastapi uvicorn keyring --break-system-packages
```

### Step 6 — Install Node.js + Tauri

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
npm install -g @tauri-apps/cli
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Step 7 — Run

```bash
git clone https://github.com/archiik04/emailbrain.git
cd emailbrain

# Terminal 1 — backend
cd backend && uvicorn main:app --port 8765

# Terminal 2 — frontend
npm run tauri dev
```


## Project Structure

```
emailbrain/
├── backend/
│   ├── main.py              ← FastAPI server (localhost:8765)
│   ├── ingestion.py         ← IMAP fetch, parse, deduplicate
│   ├── agents/
│   │   ├── triage.py        ← urgency scoring
│   │   ├── draft.py         ← reply generation
│   │   ├── search.py        ← semantic search
│   │   └── followup.py      ← unanswered thread scanner
│   ├── models/
│   │   └── db.py            ← SQLAlchemy models
│   ├── tone_profile.json    ← your writing style (auto-generated)
│   └── requirements.txt
├── src/
│   ├── App.jsx
│   └── views/
│       ├── Inbox.jsx
│       ├── Draft.jsx
│       ├── Search.jsx
│       └── Followups.jsx
├── src-tauri/               ← Tauri Rust shell
├── docs/                    ← screenshots
├── chromadb/                ← auto-created
└── emailbrain.db            ← auto-created
```

## Privacy

Every part of EmailBrain runs on your machine. Email content, embeddings, your writing style, and LLM inference all stay local. IMAP credentials are stored in the OS keychain — never written to disk as plaintext. Nothing is sent to an external API.


## Roadmap

- [x] Inbox triage with urgency scoring
- [x] AI draft generation with tone profiling
- [x] Semantic search over full inbox
- [x] Follow-up tracker
- [ ] Contact intelligence (role, topics, reply time)
- [ ] Gmail OAuth
- [ ] Outlook / Exchange support
- [ ] Multi-account support
- [ ] Calendar integration
- [ ] Attachment summarisation (PDFs, docs)
- [ ] Mobile companion app
