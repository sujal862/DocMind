# DocMind - Intelligent Document Workspace

DocMind turns your PDFs into an interactive knowledge base. Upload documents, and the system automatically extracts text, builds semantic embeddings, and constructs a knowledge graph — then lets you ask intelligent questions across all your documents.

![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-4581C3?logo=neo4j&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?logo=amazons3&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

---

## What It Does

1. **Upload** a PDF → stored in AWS S3
2. **Ingest** → text extracted, split into chunks, embedded as vectors (Qdrant), entities & relationships extracted into a knowledge graph (Neo4j)
3. **Ask questions** → system classifies your query, retrieves from the right source (vectors or graph or both), and generates a grounded answer
4. **Remembers you** → Mem0 tracks your preferences across sessions (e.g., "prefers concise answers")

All of this happens automatically through LangGraph orchestration pipelines.

---

## Architecture

```
User → Next.js Frontend → FastAPI Backend → LangGraph Pipelines
                                                    │
                              ┌──────────────────────┼──────────────────────┐
                              │                      │                      │
                         AWS S3                  Qdrant                  Neo4j
                      (PDF Storage)        (Vector Embeddings)     (Knowledge Graph)
                              │                      │                      │
                              └──────────────────────┼──────────────────────┘
                                                     │
                                                 MongoDB
                                            (Document Metadata)
```

### Ingestion Pipeline
```
PDF Upload → Parse Text → Chunk (1000 chars) → Embed (OpenAI) → Extract Entities (GPT-4o-mini) → Build Graph (Neo4j) → Save Metadata
```

### Query Pipeline
```
User Query → Classify Type → Route to Retriever → Generate Answer (GPT-4o-mini) → Store in Memory (Mem0)
```

**4 Query Types:**
| Type | What it does | Data Source |
|------|-------------|-------------|
| Factual | Semantic + lexical search | Qdrant vectors |
| Relationship | Graph traversal | Neo4j |
| Comparison | Hybrid search | Qdrant + Neo4j |
| Summary | Multi-doc sampling | Qdrant |

---

## Tech Stack

**Backend:** FastAPI, LangGraph, LangChain, OpenAI (GPT-4o-mini + text-embedding-3-small), Mem0

**Frontend:** Next.js 16, React 19, Tailwind CSS 4, ReactFlow v12, d3-force

**Databases:** MongoDB (metadata), Qdrant (vectors), Neo4j (knowledge graph)

**Infrastructure:** AWS S3, Docker Compose, Nginx, PM2, GitHub Actions CI/CD

---

## Key Features

- **Automated Knowledge Graph Construction** — Entities and relationships are extracted from documents using structured LLM output and stored in Neo4j with full document provenance tracking
- **Hybrid Retrieval** — Combines semantic vector search (Qdrant) with graph traversal (Neo4j) based on query classification
- **Interactive Graph Visualization** — Force-directed layout using d3-force with custom ReactFlow nodes, click-to-explore entity details
- **AI Memory** — Mem0 integration that learns user preferences and personalizes responses across sessions
- **Document Provenance** — Every entity and relationship tracks which PDFs it came from, enabling precise source attribution
- **Auto-polling Status** — Frontend polls document processing status in real-time (queued → processing → completed)
- **Full Data Reset** — One-click cleanup of all stores (MongoDB, Qdrant, Neo4j, Mem0, S3) for fresh sessions

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- OpenAI API key
- AWS account (for S3)

### 1. Clone and setup environment

```bash
git clone https://github.com/YOUR_USERNAME/DocMind.git
cd DocMind
```

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=docmind
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4jpassword
QDRANT_URL=http://localhost:6333
OPENAI_API_KEY=your-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket-name
```

### 2. Start databases

```bash
docker-compose up -d
```

### 3. Start backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app/main.py
```

### 4. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload` | Upload PDFs (multipart form) |
| GET | `/documents` | List all documents with status |
| DELETE | `/documents/{id}` | Delete document + all related data |
| POST | `/chat` | Send query, get AI-generated answer |
| GET | `/chat/history` | Fetch Mem0 user memories |
| GET | `/graph` | Full knowledge graph (nodes + edges) |
| GET | `/graph/entity/{name}` | Entity neighborhood subgraph |
| DELETE | `/reset` | Wipe all data across all stores |

---

## Project Structure

```
DocMind/
├── backend/
│   ├── app/
│   │   ├── server.py              # FastAPI app + route registration
│   │   ├── config.py              # Environment config (Pydantic Settings)
│   │   ├── api/routes/            # REST endpoints
│   │   ├── graphs/
│   │   │   ├── ingestion.py       # LangGraph ingestion pipeline
│   │   │   ├── query.py           # LangGraph query pipeline
│   │   │   └── nodes/             # Pipeline step implementations
│   │   └── db/                    # Database clients (MongoDB, Qdrant, Neo4j, S3, Mem0)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── context/               # React Context (shared workspace state)
│   │   ├── hooks/                 # Custom hooks (useDocuments, useGraph, useChat)
│   │   ├── components/
│   │   │   ├── layout/            # AppShell, Sidebar
│   │   │   ├── views/             # DocumentsView, GraphExplorer, ChatView
│   │   │   ├── graph/             # ReactFlow canvas, custom nodes, detail panel
│   │   │   └── chat/              # Message bubbles, input
│   │   └── utils/                 # API client, utilities
│   └── package.json
├── nginx/                         # Nginx reverse proxy config
├── docker-compose.yml             # MongoDB + Neo4j + Qdrant
├── ecosystem.config.js            # PM2 process manager config
└── .github/workflows/deploy.yml   # CI/CD pipeline
```

---

## Deployment

Deployed on AWS EC2 with:
- **Nginx** as reverse proxy (routes `/` to frontend, `/api` to backend)
- **PM2** for process management (auto-restart on crash)
- **GitHub Actions** for CI/CD (auto-deploy on push to main)
- **Docker Compose** for database infrastructure
