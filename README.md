# ValidatorAI KCET

ValidatorAI is a Karnataka-only KCET and KEA engineering counselling platform with a separated frontend/backend architecture.

- `frontend/` - Next.js App Router, TypeScript, Tailwind CSS, shadcn-style primitives, Framer Motion, TanStack Query, React Hook Form, Zod, Axios.
- `backend/` - Express.js, TypeScript, MongoDB Atlas, Mongoose, JWT auth, REST APIs, PDF ingestion, AI counselling services.

The frontend never connects to MongoDB directly. All data flows through the backend REST API.

## Architecture

```text
Frontend (Next.js)
        |
        v
REST API (Express)
        |
        v
MongoDB Atlas (Mongoose)
```

## Local Setup

```bash
npm install
copy backend\.env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
```

Backend env:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=replace_with_a_long_random_secret
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
PORT=5000
CLIENT_URL=http://localhost:3000
```

Frontend env:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## KCET Data

The parser is built for KEA UGCET engineering cutoff PDFs with college blocks and category columns such as `GM`, `GMK`, `GMR`, `1G`, `2AG`, `2BG`, `3AG`, `3BG`, `SCG`, `SCK`, `SCR`, `STG`, `STK`, and `STR`.

Seed KEA categories:

```bash
cd backend
npm run seed
```

Ingest Round 1, Round 2, and Extended Round PDFs from `backend/data` or the repository root:

```bash
cd backend
npm run ingest:cutoffs
```

Admins can also upload PDFs from `/admin`.

## API Routes

- `GET /health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/colleges`
- `GET /api/cutoffs`
- `POST /api/predict`
- `POST /api/upload-pdf` admin JWT required
- `POST /api/ai/counsel`
- `POST /api/ai/compare`
- `GET /api/placements`
- `GET /api/trends`
- `GET /api/reviews`
- `POST /api/reviews` JWT required

Responses:

```json
{ "ok": true, "data": {}, "meta": {} }
```

Errors:

```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

## Deployment

Frontend: deploy `frontend/` to Vercel and set `NEXT_PUBLIC_API_URL`.

Backend: deploy `backend/` to Render, Railway, or Fly.io. Set `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `CLIENT_URL`, and `NODE_ENV=production`.

Database: create a MongoDB Atlas cluster, database user, and network access rule for the backend.

## Debugging

- Backend startup validates required env vars before listening.
- MongoDB logs connect, reconnect, disconnect, and runtime errors.
- Validation errors return HTTP `422` with field details.
- Auth uses JWT plus an HTTP-only cookie.
- PDF ingestion returns imported, skipped, and failed row samples.
- No migration setup is needed.
