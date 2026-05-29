# Build & Run

## Backend (D:\GradifyAI\backend)
```bash
cd backend
npm run build          # tsc -p tsconfig.json → dist/
npm run seed           # node dist/scripts/seed-database.js
npm run dev            # node --watch dist/server.js
npm run import-pdfs    # node dist/scripts/import-pdfs.js
```

## Frontend (D:\GradifyAI\frontend)
```bash
cd frontend
npm run dev            # next dev -p 3000
```

## Order
1. `npm run build` (backend)
2. `npm run seed` (backend) — seeds categories, branches, admin user, knowledge base
3. `npm run dev` (backend) — starts server on port 5000
4. Place KEA cutoff PDFs in `backend/uploads/`
5. `npm run import-pdfs` (backend) — imports cutoffs from PDFs
6. `npm run dev` (frontend) — starts on port 3000

## SAM Chatbot — Architecture

### Data Flow
```
Frontend (chat-container.tsx)
  → apiFetch POST /api/ai/chat
    → optionalAuth middleware
      → validate(chatSchema) — Zod validation, nullable-safe
        → chatController
          → chatWithSam (chat.service.ts)
            → 1. detectSentiment(text)
            → 2. extractContext(text, existing)
            → 3. loadCollegeData(context) — queries cutoffs, colleges, placements
            → 4. buildContextPrompt(context, data)
            → 5. callGemini(prompt, context, history) — with retry + timeout
            → 6. callOpenAI(prompt, context, history) — fallback
            → 7. fallbackResponse(text, context, data) — rule-based with real data
            → 8. save conversation (with memory context)
```

### AI Provider Chain
1. **Gemini 2.5 Flash** — 20s timeout, 2 retries with exponential backoff
2. **OpenAI gpt-4.1-mini** — same retry logic, fallback tier
3. **Fallback engine** — rule-based responses using live MongoDB cutoff/placement data

### Key Files
- `backend/src/services/chat.service.ts` — core chat engine
- `backend/src/controllers/chat.controller.ts` — route handlers
- `backend/src/validators/ai.validator.ts` — Zod schemas (nullable-safe)
- `backend/src/routes/ai.routes.ts` — all `/api/ai/*` routes + `/api/ai/health`
- `backend/src/models/conversation.model.ts` — conversation with context snapshots
- `backend/src/models/knowledge-base.model.ts` — 8-category training data
- `frontend/features/ai-chat/chat-container.tsx` — main chat UI + health check
- `frontend/features/ai-chat/chat-message.tsx` — markdown + visual cards + voice + summary toggle
- `frontend/features/ai-chat/chat-input.tsx` — auto-resize + suggestions + mic + upload
- `frontend/features/ai-chat/chat-store.ts` — Zustand store with persistence
- `frontend/features/ai-chat/chat-panel.tsx` — floating button + modal + premium UI
- `frontend/features/ai-chat/visual-cards.tsx` — RankMeter, ProbabilityCard, TierDonut, RecommendationCards, StrategyCards, ComparisonTable, ActionButtons
- `frontend/features/ai-chat/voice-input.tsx` — Speech-to-Text (English/Hindi/Kannada)
- `frontend/features/ai-chat/voice-response.tsx` — Text-to-Speech with speed control
- `frontend/features/ai-chat/file-upload.tsx` — File/Image/Video upload with drag & drop
- `frontend/features/ai-chat/analytics-dashboard.tsx` — Recharts charts (bar, pie, line)

## Premium Features (Implemented May 2026)

### 1. Voice Input (Speech-to-Text)
- Mic button in input area
- Supports English (en-IN), Hindi (hi-IN), Kannada (kn-IN)
- Language toggle via Languages icon
- Continuous recognition with interim results
- Visual feedback with pulsing red animation when recording
- Falls back gracefully if Web Speech API not supported

### 2. Voice Response (Text-to-Speech)
- Speaker button on every assistant message
- Speed control: 0.5x, 0.75x, 1x, 1.25x, 1.5x
- Strips markdown formatting before speaking
- Cancel current speech on re-click
- Auto-stops on speech end

### 3. File Upload (PDF/DOCX/TXT)
- Upload button in input area with dropdown menu
- Backend parses PDF (via pdf-parse) and TXT files
- Sends parsed content to SAM for analysis
- 50 MB file size limit
- Drag & drop support
- Progress indicator during upload
- Handles images and video (stored, with limited AI analysis for video)

### 4. Image Upload
- Dedicated image upload option
- Stores images in uploads/ directory
- Serves via `/uploads/` static route
- Displays image preview in chat
- SAM receives context about uploaded image

### 5. Video Upload
- Supports MP4, MOV, AVI via same multer config
- 50 MB limit
- Stores and serves via `/uploads/`
- Returns confirmation that video is stored

### 6. Quick Summary + Detailed Analysis
- Every long assistant response (>200 chars) shows a "Quick Summary" line
- Collapsible "Show detailed analysis" toggle
- Summary = first 2 sentences of response
- Analysis = remaining content

### 7. Recommendation Cards
- Visual cards for top college recommendations
- Shows: college name + code, branch, tier badge, cutoff, avg package, placement %
- Confidence bar (0-100% match)
- Tags for quick reference
- Animated entry with staggered delays

### 8. Emotional Intelligence
- Enhanced system prompt with tone-adaptive responses
- Anxiety: starts with reassurance
- Confusion: structured pros/cons
- Excitement: matches enthusiasm
- Encouragement on rank sharing
- Sentiment metadata tracked in conversation

### 9. Strategy Generator
- Strategy cards showing Round 1, Round 2, Extended Round
- Each round shows choices with numbered items
- Risk badges (LOW/MEDIUM/HIGH)
- Reasoning for each choice
- Triggered by "Generate Strategy" action button

### 10. College Comparison
- ComparisonTable component with sortable columns
- Fields: College, Location, NAAC, Avg Package, Placement %
- Row hover effects
- Responsive horizontal scroll on mobile
- Triggered by "Compare Colleges" action button

### 11. Session Memory
- Zustand persist middleware saves userContext to localStorage
- Remembered across page refreshes: rank, category, district, branches
- MongoDB conversation context snapshots
- Context auto-extracted from messages via regex

### 12. Visual Analytics Dashboard
- Collapsible dashboard via BarChart3 icon in header
- Recharts integration:
  - Bar charts for placement comparison
  - Pie charts for tier distribution
  - Line charts for cutoff trends
  - Horizontal bar charts for branch distribution
- Custom tooltip styling matching theme
- Empty state with icon when no data

### 13. AI Thinking Experience
- Enhanced typing indicator with:
  - Animated bouncing dots
  - Rotating status messages (8 variants)
  - Progress bar (0-90% simulated)
  - Stage indicators (Context → Data → Analysis)
- Smooth AnimatePresence transitions

### 14. Premium UI (ChatGPT-level)
- Glassmorphism: `backdrop-blur-xl`, `bg-[var(--surface)]/80`
- Gradient border effects via pseudo-elements
- Spring animations on panel open/close (damping: 22, stiffness: 280)
- Hover scale animations on floating button (1.08)
- Notification dot with infinite pulse on floating button
- Dark backdrop with blur on modal
- Smooth theme transitions

### 15. AI Knowledge Expansion
- Enhanced system prompt covers:
  - KCET + COMED-K counselling differences
  - College tier classification (Tier 1/1.5/2/2.5/3)
  - Category-wise cutoff movement (GM, 1G, 2AG, 2BG, 3AG, 3BG, SCG, STG)
  - Career paths (software, data science, core, govt, higher studies)
  - Branch future scope (CSE/ISE/AIML for IT, ECE for VLSI, etc.)
  - Fee structure comparison (govt quota vs management vs COMED-K)
  - Placement trends and top recruiters

### 16. Placement Intelligence
- Every college recommendation includes placement data
- Cards show: Avg Package (LPA), Highest Package (LPA), Placement %
- Placement comparison mini-chart (bar chart embedded in messages)
- Placement data loaded from PlacementModel aggregation
- "Placement Analysis" action button for deep dive

## Upload Endpoints (Backend)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/upload/file` | Upload PDF/DOCX/TXT for SAM analysis |
| POST | `/api/ai/upload/image` | Upload image for SAM context |
| POST | `/api/ai/upload/video` | Upload video (storage only) |
| GET | `/uploads/:filename` | Static file serving |

## Diagnostic Endpoint
```
GET /api/ai/health → {
  geminiConfigured: bool,
  geminiModel: "gemini-2.5-flash",
  openaiConfigured: bool,
  openaiModel: "gpt-4.1-mini",
  mode: "ai" | "fallback"
}
```

## Memory System
- Zustand store persisted to localStorage (`gradifyai-sam-chat`)
- Per-conversation context in MongoDB with pre-save null cleaning
- Context auto-extracted from messages (rank/category/district/branch via regex)
- Request context merged with conversation context server-side

## Notes
- esbuild EPERM on Windows; all scripts use `node dist/...js` (not `tsx`)
- Admin: `mafshaan1705@gmail.com` / `Samra005`
- MongoDB must be running on `localhost:27017`
- Prediction uses 4 tiers with dynamic rank radius
- `npm run postinstall` auto-builds after `npm install`

## Theme System
- 3 modes: dark, light, amoled
- Toggle in navbar; saved to localStorage (`gradifyai-theme`)
- Dark mode uses GitHub-style #0d1117 background
- Smooth transitions on all colors/borders

## Prediction Logic
- Dynamic search radius based on input rank:
  - rank ≤ 10,000: ±3,000
  - rank ≤ 30,000: ±6,000
  - rank ≤ 60,000: ±10,000
  - rank > 60,000: ±15,000
- Filter uses `$gte`/`$lte` on `rankClose` for efficient DB query
- Limit: 2000 candidates max
- 4 tiers: dream / competitive / moderate / safe

## AI Providers (optional)
Set in `backend/.env`:
- `GEMINI_API_KEY=AIza...` — Gemini (checked first)
- `OPENAI_API_KEY=sk-...` — OpenAI (fallback)
- Fallback advice always available with real DB data
- Health check at `/api/ai/health`

## Search
- Text indexes on: name, code, city, district, branch name, branch aliases
- Search matches: college name, code, city, district, branch code, branch name, affiliated university
- Shows ALL matching colleges (no 8-item limit)
- Recent searches in localStorage

## Cutoff Columns
- "Last Closing Rank" instead of "Closing Rank"
- Opening Rank, Seat Type, Quota in detail table

## College Detail Modal
Shows: code, district, NAAC grade, autonomous, hostel, campus, branches with cutoff table, placement packages, recruiters

## PDF Parser
- Handles wrapped/multiline branch rows
- 80+ branch aliases: CSBS, AIML, AI&DS, DS, IOT, CSM, CSD, Cyber Security, CS, Robotics, etc.
- Sets district from city name
- Dynamic college creation from PDF data
- No hardcoded college list
