# KisaanKonnect - Smart Agriculture Assistant

KisaanKonnect is a digital agriculture platform that helps farmers with AI-driven insights, crop guidance, plant disease detection, market awareness, and an offline agriculture chatbot.

## Project Structure

- `kisaan-frontend/`: React app built with Vite
- `kisaan-backend/`: Express API, auth, MongoDB, file uploads, and AI orchestration
- `kisaan-llm-service/`: Python RAG service for agriculture Q&A using PDFs, FAISS, HuggingFace embeddings, and Ollama

## Core Features

1. Crop advisory and fertilizer recommendations
2. Plant disease detection with a PyTorch CNN
3. Kisaan Mitra AI chatbot grounded in agriculture documents
4. Market trends and mandi information
5. Government schemes and support discovery

## Tech Stack

- Frontend: React, Vite, Zustand
- Backend: Node.js, Express, MongoDB, Mongoose
- AI services: Python, FastAPI, PyTorch, FAISS, LangChain, Ollama

## Prerequisites

- Node.js 18 or higher
- Python 3.10 or higher
- npm and pip
- MongoDB Atlas or local MongoDB
- Ollama installed locally if you use the chatbot service
- Docker Desktop if you want to use the compose setup

## Secrets and Local Files

Keep these files local and out of git:
- `kisaan-backend/.env`
- `kisaan-frontend/.env`
- `kisaan-llm-service/.env`
- any `*.env.local` files
- build output such as `dist/`
- uploaded files in `kisaan-backend/uploads/`
- model weights such as `*.pth`, `*.pt`, `*.pkl`, `*.h5`
- generated vector stores in `kisaan-llm-service/vectorstore/`

## One-Time Setup

### 1) Install Python dependencies

```bash
cd Kisaan-Konnect
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2) Install Node dependencies

```bash
cd kisaan-backend
npm install

cd ..\kisaan-frontend
npm install
```

### 3) Configure the backend

Edit `kisaan-backend/.env` with your MongoDB and app secrets. The backend reads this file directly.

## Run Locally

### Terminal A - LLM service

```bash
cd Kisaan-Konnect
.venv\Scripts\activate
cd kisaan-llm-service
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Terminal B - Backend

```bash
cd Kisaan-Konnect\kisaan-backend
npm run dev
```

### Terminal C - Frontend

```bash
cd Kisaan-Konnect\kisaan-frontend
npm run dev
```

If PowerShell blocks `npm`, use:

```bash
npm.cmd run dev
```

## Docker

Docker is supported with:
- `docker-compose.yml`
- `kisaan-backend/Dockerfile`
- `kisaan-frontend/Dockerfile`
- `kisaan-llm-service/Dockerfile`

The compose setup uses `kisaan-backend/.env` directly.

The current compose file assumes:
- backend API on `http://localhost:5000`
- frontend on `http://localhost:8080`
- LLM service on `http://localhost:8000`
- Ollama reachable from the LLM container at `http://host.docker.internal:11434`

Run:

```bash
docker compose up --build
```

Ports:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5000`
- LLM service: `http://localhost:8000`

## Health Checks

- LLM health: `http://127.0.0.1:8000/health`
- Backend health: `http://127.0.0.1:5000/health`
- Frontend: `http://127.0.0.1:5173` in dev, `http://localhost:8080` in Docker

## Notes

- The backend waits for MongoDB before serving requests.
- Auth uses MongoDB-backed users and JWTs.
- Disease detection uses `kisaan-backend/ai_models/disease/final_model.pth`.
- The disease model expects the 15-class PlantVillage mapping in `class_indices.json`.
- The frontend routes are code-split to keep the bundle size lower.
- The chatbot and image analysis flows still depend on the LLM service running on port `8000`.
- The LLM service container loads PDFs from `kisaan-llm-service/data/` and stores vectors in `kisaan-llm-service/vectorstore/`.
- If Docker Desktop is unstable on Windows, reset Docker Desktop before trying the compose stack again.

## License

This project is intended for educational and smart agriculture use cases.
