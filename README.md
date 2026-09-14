# 🎯 Interactive Quiz & Exam Platform

An end-to-end, high-performance interactive quiz and real-time multiplayer examination platform built with **FastAPI**, **React (TypeScript)**, **PostgreSQL**, **Redis**, and **LangChain AI**.

---

## 1. Project Overview

**Quizz App** is a comprehensive educational and assessment platform designed for educators, students, and competitive quiz enthusiasts. The system supports real-time multiplayer quiz lobbies, AI-powered quiz generation from documents (PDF/Text), automated paper generation, and detailed analytics.

> 📖 **User Documentation:** For step-by-step instructions for Users (Participants/Hosts) and Super Admins, please refer to the [User Guide](docs/USER_GUIDE.md).

### Key Objectives:
- **Interactive Real-Time Quizzing:** Live multiplayer game rooms powered by WebSockets and Redis pub/sub.
- **AI-Powered Quiz Generation:** Automated question generation from PDF files or text prompts using **LangChain** and **Google Gemini AI** with hybrid retrieval (FAISS + BM25).
- **Comprehensive Exam Management:** Support for timed exams, randomized question papers, automatic grading, and detailed performance breakdown.
- **Role-Based Access Control:** Streamlined system roles for Super Admins and Users (with integrated Participant and Room Host capabilities).

---

## 2. Tech Stack

### **Backend Framework & Services**
- **Core Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database:** [PostgreSQL 15](https://www.postgresql.org/) with [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async/ORM) & [Alembic](https://alembic.sqlalchemy.org/) for migrations
- **Caching & Real-Time:** [Redis 7](https://redis.io/) (Lobby state management & WebSocket Pub/Sub)
- **AI & RAG Engine:** [LangChain](https://www.langchain.com/), `FAISS`, `rank-bm25`, Google Gemini (`langchain-google-genai`)
- **Authentication:** JWT (JSON Web Tokens) with `passlib` (bcrypt)
- **Media Storage:** Cloudinary integration for image uploads
- **Task Scheduling:** `APScheduler` for background cleanup and scheduled jobs

### **Frontend Architecture**
- **Framework:** [React 18](https://react.dev/) with [TypeScript 5](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling & UI:** [Tailwind CSS v3](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **State & Routing:** Context API + Custom Hooks, [React Router v7](https://reactrouter.com/)
- **Charts & Data Visualization:** [Recharts](https://recharts.org/)

### **DevOps & Deployment**
- **Containerization:** Docker & Docker Compose
- **Web Server & Reverse Proxy:** Nginx

---

## 3. Getting Started & Installation

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18+ recommended) & **npm**
- **Python** (v3.10+) & `pip`
- **Docker** & **Docker Compose** (Optional, recommended for quick setup)
- **PostgreSQL** (v15+) & **Redis** (v7+) (If running locally without Docker)

---

### Option A: Running with Docker Compose (Recommended)

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/tohieungoan/Quizz_App.git
   cd Quizz_App
   ```

2. **Environment Configuration:**
   Copy `.env.example` to `.env` in the `backend` folder:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *Edit `backend/.env` with your database credentials, Gemini API key, Cloudinary keys, etc.*

3. **Launch Containers:**
   ```bash
   docker-compose up --build -d
   ```

4. **Access the Application:**
   - **Frontend UI:** `http://localhost:5173`
   - **Backend API Docs (Swagger):** `http://localhost:8000/docs`

---

### Option B: Manual Local Setup

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables
cp .env.example .env

# Run Alembic Database Migrations
alembic upgrade head

# Start Development Server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

---

## 4. Key Features & Usage

### 🎮 1. Real-Time Multiplayer Lobby
- **Room Creation:** Host live quiz rooms with custom time limits, max player limits, and pin codes.
- **WebSocket Synchronization:** Instant player join/leave notifications, live countdown timers, and synchronized question progression.
- **Live Leaderboard:** Real-time scoring updates after each question.

### 🤖 2. AI Quiz & Paper Generator (RAG Powered)
- **Document Processing:** Upload PDF/text files to extract knowledge chunks into vector stores (FAISS + BM25 hybrid search).
- **Auto Question Creation:** Prompt AI to create multiple-choice questions categorized by difficulty levels (Easy, Medium, Hard).
- **Automated Exam Paper Generation:** Assemble diverse quiz sets according to subject blueprints.

### 📝 3. Comprehensive Quiz & Exam System
- Single choice, multiple choice, and true/false question types.
- Detailed score breakdown, time spent per question, and historical exam attempts.

### 📊 4. Analytics & Dashboard
- Student performance charts using **Recharts**.
- Host overview on class scores, pass/fail rates, and question difficulty metrics.

---

## 5. Project Structure

```
quizz_app/
├── backend/                  # FastAPI Backend Application
│   ├── app/
│   │   ├── api/              # API route endpoints (v1)
│   │   ├── core/             # Security, config, database session setup
│   │   ├── crud/             # Database CRUD operations
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic (AI generator, RAG, WebSockets)
│   │   └── utils/            # Helper functions (Cloudinary upload, etc.)
│   ├── alembic/              # Database migration scripts
│   ├── tests/                # Pytest unit and integration test suites
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 # React + TypeScript Frontend Application
│   ├── src/
│   │   ├── assets/           # Media assets and static files
│   │   ├── components/       # Shared UI components (Modals, Buttons, Layouts)
│   │   ├── features/         # Feature-specific modules (Auth, Quiz, Lobby)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page-level components
│   │   ├── services/         # Axios API clients & WebSocket connection handlers
│   │   ├── types/            # TypeScript interfaces & type definitions
│   │   ├── utils/            # Helper functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml        # Docker composition for DB, Redis, Backend & Frontend
├── nginx.conf                # Nginx proxy configuration
└── README.md                 # Project documentation
```
