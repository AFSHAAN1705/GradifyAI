🎓 GradifyAI

«AI-Powered KCET Counselling & College Intelligence Platform for Karnataka Students»

GradifyAI is a comprehensive AI-driven counselling platform designed to help Karnataka students make smarter admission decisions during KCET counselling.

The platform analyzes official KEA cutoff data, student rank, reservation category, preferred branches, district preferences, placement trends, and college intelligence data to predict admission chances and recommend the most suitable engineering colleges.

---

🚀 Key Features

🎯 KCET College Predictor

- Predict eligible colleges based on KCET rank
- Category-wise admission prediction
- Safe, Moderate, and Dream college recommendations
- Branch-specific analysis

🤖 AI Counsellor

- Personalized admission guidance
- College and branch recommendations
- Career-oriented suggestions
- AI-powered counselling assistance

📊 College Intelligence System

- Detailed college profiles
- Placement statistics
- Campus information
- Fee structure
- Accreditation details
- Ranking insights

📈 Placement Analytics

- Average package analysis
- Highest package statistics
- Placement percentage trends
- Recruiter insights
- Branch-wise placement performance

🏫 College Comparison

Compare multiple colleges side-by-side using:

- Placements
- Fees
- Campus facilities
- Rankings
- ROI
- Cutoffs

📍 District-Based Exploration

Explore colleges by district:

- Bengaluru
- Mysuru
- Mangaluru
- Udupi
- Hassan
- Shivamogga
- Tumakuru
- Belagavi
- Hubballi
- Davanagere
  and more.

---

🏗️ System Architecture

Frontend (Next.js)
│
▼
REST API (Express.js)
│
▼
MongoDB Atlas
│
▼
AI Recommendation Engine

---

🛠️ Tech Stack

Frontend

- Next.js 15+
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- TanStack Query
- React Hook Form
- Zod

Backend

- Node.js
- Express.js
- TypeScript
- REST APIs

Database

- MongoDB Atlas
- Mongoose

Authentication

- JWT Authentication
- HTTP-only Cookies

AI

- OpenAI API

Deployment

- Vercel (Frontend)
- Render / Railway / Fly.io (Backend)

---

📂 Project Structure

GradifyAI/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   └── scripts/
│
├── .github/
├── README.md
└── AGENTS.md

📊 KCET Data Processing

GradifyAI supports official KEA engineering cutoff PDFs.

Supported counselling rounds:

- Round 1
- Round 2
- Extended Round
- Future counselling rounds

The parser automatically extracts:

- College Codes
- College Names
- Branch Codes
- Category Cutoffs
- KCET Rank Data

Supported Categories:

- GM
- GMK
- GMR
- 1G
- 2AG
- 2BG
- 3AG
- 3BG
- SCG
- SCK
- SCR
- STG
- STK
- STR

---

🔐 Authentication Features

- User Registration
- Secure Login
- JWT Authentication
- Protected Routes
- Session Management
- Role-Based Access

---

🌐 API Endpoints

Authentication

- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

College Data

- GET /api/colleges
- GET /api/cutoffs

Prediction

- POST /api/predict

AI Services

- POST /api/ai/counsel
- POST /api/ai/compare

Analytics

- GET /api/placements
- GET /api/trends

Reviews

- GET /api/reviews
- POST /api/reviews

Administration

- POST /api/upload-pdf

---

⚙️ Local Development

Clone Repository

git clone https://github.com/AFSHAAN1705/GradifyAI.git
cd GradifyAI

Backend Setup

cd backend
npm install
cp .env.example .env
npm run dev

Frontend Setup

cd frontend
npm install
cp .env.local.example .env.local
npm run dev

---

🔑 Environment Variables

Backend

MONGODB_URI=
JWT_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=
PORT=5000
CLIENT_URL=http://localhost:3000

Frontend

NEXT_PUBLIC_API_URL=http://localhost:5000

---

🚀 Deployment

Frontend

Deploy to Vercel

Backend

Deploy to:

- Render
- Railway
- Fly.io

Database

MongoDB Atlas

---

🎯 Future Roadmap

- AI Placement Predictor
- College Comparison Engine
- Scholarship Recommendation System
- Student Review Platform
- COMEDK Predictor
- JEE College Predictor
- AI Resume Analyzer
- Career Guidance Assistant
- Alumni Insights

---

👨‍💻 Author

Afshaan

Building AI-powered solutions to simplify educational decision-making for students across Karnataka.

---

⭐ If you found this project useful, consider starring the repository.
