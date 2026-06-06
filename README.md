<div align="center">

# 🎓 GradifyAI

### AI-Powered KCET College Prediction & Admission Intelligence Platform

<p align="center">
  <img src="./screenshots/dashboard.png" alt="GradifyAI Dashboard" width="100%" />
</p>

<p align="center">
  <strong>
    Intelligent counselling. Real KEA data. AI-driven insights.
  </strong>
</p>

<p align="center">
  GradifyAI transforms historical Karnataka CET cutoff data into a modern, AI-powered admission intelligence system that helps students make smarter counselling decisions with confidence.
</p>

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/Gemini-AI-8E75B2?style=for-the-badge&logo=google" />
</p>

<br/>

</div>

---

# ✨ What is GradifyAI?

GradifyAI is a production-grade AI admission intelligence platform built specifically for **KCET counselling**.

The platform combines:

* Historical KEA cutoff analysis
* AI-powered recommendation systems
* Real-time prediction engines
* Interactive analytics dashboards
* College comparison systems
* Placement intelligence
* Geographic filtering
* Conversational AI guidance

to deliver a next-generation counselling experience for Karnataka engineering aspirants.

Instead of manually searching PDFs and comparing thousands of cutoff rows, students can interact with **SAM (Smart Admission Manager)** — an intelligent AI assistant capable of understanding rank, branch preference, district preference, placement goals, and counselling strategies.

---

# 🚀 Core Features

## 🤖 SAM — Smart Admission Manager

An AI-powered counselling assistant built using **Gemini 2.5 Flash** with OpenAI fallback support.

### Capabilities

* Context-aware counselling conversations
* Rank-based recommendation generation
* Branch comparison
* Placement-focused suggestions
* District-aware filtering
* Counselling strategy guidance
* Round-wise prediction support

<p align="center">
  <img src="./screenshots/sam-ai-chatbot.png" alt="SAM Chatbot" width="90%" />
</p>

---

## 📊 Advanced Analytics Dashboard

Beautiful real-time dashboards built using Recharts and Framer Motion.

### Includes

* Tier distribution analysis
* Rank spread visualization
* Placement trend analysis
* Cutoff growth patterns
* Branch popularity metrics
* College-level analytics

<p align="center">
  <img src="./screenshots/dashboard.png" alt="Analytics Dashboard" width="100%" />
</p>

---

## 🏢 College Intelligence System

Search and compare engineering colleges using advanced filters.

### Supported Filters

* District
* City
* Branch
* Category
* Autonomous status
* Placement statistics
* NAAC grade
* College tier

<p align="center">
  <img src="./screenshots/college-list.png" alt="College Directory" width="100%" />
</p>

---

## 🌿 Branch & Category Management

Powerful administrative management system for branches, categories, and KCET data.

<p align="center">
  <img src="./screenshots/branch-list.png" alt="Branch List" width="100%" />
</p>

<p align="center">
  <img src="./screenshots/category-list.png" alt="Category List" width="100%" />
</p>

---

## 🔐 Authentication & Security

Secure JWT-based authentication system with protected admin routes.

### Features

* JWT authentication
* Session validation
* Protected admin APIs
* Secure route middleware
* Role-based access control

<p align="center">
  <img src="./screenshots/login-page.png" alt="Login Page" width="100%" />
</p>

---

# 🛠️ Technology Stack

## Frontend

| Technology    | Purpose          |
| ------------- | ---------------- |
| Next.js 16    | App Router & SSR |
| React 19      | UI Rendering     |
| TypeScript    | Type Safety      |
| Tailwind CSS  | Styling          |
| Framer Motion | Animations       |
| Zustand       | Global State     |
| Recharts      | Analytics Charts |

---

## Backend

| Technology | Purpose        |
| ---------- | -------------- |
| Node.js    | Runtime        |
| Express.js | REST API       |
| TypeScript | Backend Safety |
| Zod        | Validation     |
| Multer     | File Uploads   |

---

## Database & Infrastructure

| Technology          | Purpose              |
| ------------------- | -------------------- |
| MongoDB Atlas       | Primary Database     |
| Mongoose            | ODM                  |
| pdf-parse           | PDF Extraction       |
| BulkWrite Pipelines | High-speed ingestion |

---

## Artificial Intelligence

| Provider            | Usage              |
| ------------------- | ------------------ |
| Gemini 2.5 Flash    | Primary AI Engine  |
| OpenAI GPT-4.1-mini | Fallback AI Engine |

---

# ⚡ Data Ingestion Engine

One of GradifyAI’s biggest strengths is its custom-built KEA cutoff ingestion pipeline.

The system automatically:

* Reads uploaded KEA PDFs
* Extracts structured cutoff rows
* Detects colleges & branches
* Cleans malformed OCR text
* Maps categories correctly
* Bulk inserts thousands of rows into MongoDB

### Pipeline Features

* High-speed bulk ingestion
* OCR cleanup logic
* Parser normalization
* Duplicate prevention
* Intelligent branch mapping
* Multi-year support

---

# 📂 Project Structure

```bash
GradifyAI/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── server.ts
│   │
│   ├── uploads/
│   ├── dist/
│   ├── logs/
│   └── .env
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── store/
│   ├── styles/
│   ├── public/
│   └── types/
│
├── screenshots/
├── docs/
├── README.md
└── docker-compose.yml
```

---

# ⚙️ Environment Variables

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

GEMINI_API_KEY=your_gemini_api_key

OPENAI_API_KEY=optional_openai_key
```

---

# 🚀 Local Development Setup

## Backend Setup

```bash
cd backend

npm install

npm run build

npm run seed

npm run import-pdfs

npm run dev
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# 📈 Performance & Scalability

GradifyAI is architected with scalability and maintainability in mind.

### Highlights

* Modular monorepo architecture
* Repository pattern for database abstraction
* Type-safe APIs
* AI-provider failover handling
* Optimized MongoDB indexing
* Bulk ingestion pipelines
* Server-side rendering support
* Fully responsive UI

---

# 🧠 Future Roadmap

### Upcoming Features

* KCET counselling simulation
* AI-generated preference ordering
* Voice-based SAM interaction
* Real-time seat availability
* College sentiment analysis
* Mobile application
* Multi-exam support (COMEDK, JEE, NEET)
* AI-powered career guidance

---

# ⚠️ Disclaimer

GradifyAI is an independent analytics platform and is **NOT affiliated with KEA** or any government counselling authority.

All predictions and insights are generated using historical data and AI analysis and should be used only as guidance.

---

# 👨‍💻 Contribution

Contributions, suggestions, issue reports, and feature requests are welcome.

If you'd like to improve GradifyAI:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Submit a Pull Request

---

# 📸 Screenshots

## 📊 Analytics Dashboard

![Analytics Dashboard](./screenshots/dashboard.png)

---

## 🏢 College Directory & Intelligence

![College Directory & Intelligence](./screenshots/college-list.png)

---

## 🌿 Branch Management System

![Branch Management System](./screenshots/branch-list.png)

---

## 🗂️ Category & Reservation Management

![Category & Reservation Management](./screenshots/category-list.png)

---

## 🔐 Secure Authentication Interface

![Secure Authentication Interface](./screenshots/login-page.png)

---

## 🤖 SAM — Smart Admission Manager AI Chatbot

![SAM — Smart Admission Manager AI Chatbot](./screenshots/sam-ai-chatbot.png)

<div align="center">

### ⭐ If you like this project, consider starring the repository.

Built with passion using Next.js, MongoDB, Gemini AI, and modern full-stack engineering.

</div>
