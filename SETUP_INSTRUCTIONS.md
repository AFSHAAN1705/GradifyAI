# GradifyAI — Complete Setup Guide

AI-powered KCET counselling & college intelligence platform.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running on `localhost:27017`

### 1. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Seed Database
```bash
cd backend && npm run seed
```
Creates: 33 KCET categories, 36 branches, admin/demo users, knowledge base entries.

### 3. Start Backend
```bash
cd backend && npm run dev
```
Listens on `http://localhost:5000`.

### 4. Start Frontend
```bash
cd frontend && npm run dev
```
Opens at `http://localhost:3000`.

## SAM AI Counsellor

SAM powers the chatbot. Three modes:

| Mode | Requires | Behaviour |
|------|----------|-----------|
| **Gemini** (best) | `GEMINI_API_KEY` in `.env` | Full AI counselling via Gemini 2.5 Flash |
| **OpenAI** (fallback) | `OPENAI_API_KEY` in `.env` | AI via OpenAI Responses API |
| **Fallback** | Neither | Rule-based + real cutoff data from DB |

### Check AI Health
```
GET http://localhost:5000/api/ai/health
```
Returns `{ geminiConfigured, openaiConfigured, mode: "ai"|"fallback" }`

### Test Chat
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What colleges can I get with rank 25000?","context":{"rank":25000,"category":"GM"}}'
```

### Relevant Server Logs
All SAM activity prefixed with `[SAM]`:
- `[SAM] GEMINI_API_KEY: AIza...` — key status on startup
- `[SAM] Calling Gemini (gemini-2.5-flash)...` — API call attempt
- `[SAM] Gemini response OK (1234 chars)` — successful response
- `[SAM] Gemini HTTP 403: ...` — API error with body
- `[SAM] Using fallback response` — no AI provider available

## Troubleshooting

### Chat returns "I encountered an error"
1. `GET http://localhost:5000/api/ai/health` — check if AI is configured
2. Check backend terminal for `[SAM]` error logs
3. Verify `GEMINI_API_KEY` is uncommented in `backend/.env`
4. Run `cd backend && npm run build` to rebuild TypeScript
5. Restart backend

### Port conflict
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```
