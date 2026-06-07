# Autonomous Multi-Agent Software Engineering System

> **Input → AI Agents → Working Code Output**
> A local AI pipeline that plans, codes, tests, and reviews software automatically.

---

## 🏗️ Architecture

```
Problem Statement
      │
      ▼
┌─────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│   Planner   │───▶│   Coder    │───▶│   Tester   │───▶│  Reviewer  │
│  (Plan it)  │    │ (Build it) │    │ (Test it)  │    │ (Review it)│
└─────────────┘    └────────────┘    └────────────┘    └────────────┘
      │                  │                 │                  │
      └──────────────────┴─────────────────┴──────────────────┘
                                 │
                           Structured Output
                    (Plan + Code + Tests + Review)
```

**Stack:**
- **Backend**: FastAPI + LangGraph (Python)
- **LLM**: Groq (`llama3-70b-8192`) or OpenAI (`gpt-4o-mini`)
- **Frontend**: Next.js 14 (dark glassmorphism dashboard)
- **Storage**: In-memory job store (no DB needed)

---

## 📁 Project Structure

```
autonomous-agents/
├── backend/
│   ├── agents/
│   │   ├── planner.py       # Breaks problem into steps
│   │   ├── coder.py         # Generates implementation code
│   │   ├── tester.py        # Generates pytest tests
│   │   └── reviewer.py      # Code review + fixes
│   ├── core/
│   │   ├── orchestrator.py  # LangGraph pipeline
│   │   ├── state.py         # Shared AgentState
│   │   └── llm.py           # LLM factory (Groq/OpenAI)
│   ├── api/
│   │   ├── routes.py        # FastAPI endpoints
│   │   └── models.py        # Pydantic schemas
│   ├── storage/
│   │   └── memory_store.py  # In-memory job store
│   ├── main.py              # FastAPI app entry point
│   └── config.py            # Settings from .env
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router
│       └── components/      # UI components
├── .env                     # Your API keys (NOT committed)
├── .env.example             # Template
└── README.md
```

---

## ⚡ Quick Start (Windows)

### Step 1 — Clone & Setup

```powershell
# Navigate into the project
cd "autonomous agents"

# Copy env template
Copy-Item .env.example .env
```

Edit `.env` and add your Groq API key:
```
GROQ_API_KEY=gsk_your_key_here
LLM_PROVIDER=groq
```
Get a free key at: https://console.groq.com

---

### Step 2 — Backend Setup

```powershell
# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server
python -m uvicorn backend.main:app --reload --port 8000
```

✅ Backend is running at: http://localhost:8000  
📖 Swagger UI at: http://localhost:8000/docs

---

### Step 3 — Frontend Setup

```powershell
# In a NEW terminal (keep backend running)
cd frontend
npm install
npm run dev
```

✅ Frontend is running at: http://localhost:3000

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/run` | Start the pipeline |
| `GET` | `/api/status/{job_id}` | Poll current status |
| `GET` | `/api/result/{job_id}` | Get full result |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/health` | Health check |

### Example: Run pipeline via curl

```powershell
# Start a job
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/run" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"problem": "Build a Python REST API for a todo list with CRUD operations."}'

$jobId = $response.job_id
Write-Host "Job ID: $jobId"

# Check status
Invoke-RestMethod -Uri "http://localhost:8000/api/status/$jobId"

# Get result (after status = "done")
Invoke-RestMethod -Uri "http://localhost:8000/api/result/$jobId"
```

---

## 🧪 Testing the Backend

```powershell
# Make sure venv is active
.\venv\Scripts\activate

# Run with pytest
pip install pytest
pytest backend/ -v
```

---

## ❌ Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `AuthenticationError: 401` | Bad API key | Check `.env` — make sure `GROQ_API_KEY` is correct |
| `ModuleNotFoundError: langgraph` | Not installed | Run `pip install -r backend/requirements.txt` |
| `CORS error in browser` | Frontend blocked | Ensure backend is on port 8000 (CORS is pre-configured) |
| `Address already in use` | Port 8000 taken | Run `uvicorn ... --port 8001` and update frontend `API_BASE` |
| `Status 202 on /result` | Job still running | Wait for `status == "done"` before calling `/result` |
| `next: command not found` | Node not installed | Install Node.js 18+ from https://nodejs.org |
| `uvicorn: command not found` | venv not active | Run `.\venv\Scripts\activate` first |

---

## 🔧 Configuration

Edit `.env` to switch providers:

```env
# Use Groq (free, fast — recommended)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama3-70b-8192

# OR use OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

---

## 🗺️ 7-Day Build Roadmap

| Day | Focus |
|-----|-------|
| Day 1 | ✅ Setup, scaffold, env config |
| Day 2 | ✅ Planner agent + `/api/run` endpoint |
| Day 3 | ✅ Coder + Tester agents |
| Day 4 | ✅ Reviewer agent + full pipeline |
| Day 5 | ✅ Async jobs + status polling |
| Day 6 | ✅ Next.js dashboard frontend |
| Day 7 | Integration tests + README polish |

---

## 🚀 What's Next (Post-MVP)

- [ ] PostgreSQL persistence (swap `memory_store.py`)
- [ ] GitHub PR creation via GitHub API
- [ ] Streaming agent output (Server-Sent Events)
- [ ] Custom system prompts per agent via UI
- [ ] LangSmith tracing for observability
