<div align="center">

# 🛡️ EduShield AI

### Intelligent Proctoring & Neurodivergent-Inclusive Examination Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.x-61dafb?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1?style=flat&logo=mysql)](https://mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat&logo=docker)](https://docs.docker.com/compose/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[Live Demo](#) · [API Docs](http://localhost:8000/docs) · [Report Issues](https://github.com/NoahReddyG/EduShieldAI/issues)**

</div>

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Technology Stack](#-technology-stack)
5. [Getting Started — Local Development](#-getting-started--local-development)
6. [Docker Compose Deployment](#-docker-compose-deployment)
7. [API Endpoint Reference](#-api-endpoint-reference)
8. [Environment Variables](#-environment-variables)
9. [Database Schema](#-database-schema)
10. [Project Structure](#-project-structure)
11. [Contributing](#-contributing)
12. [License](#-license)

---

## 🌟 Project Overview

**EduShield AI** is a full-stack, privacy-first intelligent proctoring and accessibility platform built for online examinations. It uniquely combines **real-time behavioral integrity monitoring** with **AI-powered neurodivergent accessibility tools** — two capabilities that no existing platform provides in a single integrated product.

> **No video ever leaves the device.** All face detection runs locally in the browser using Google MediaPipe. Only anonymised metadata (flag type, confidence score, timestamp) is transmitted to the backend.

### Who Is It For?

| User Role | Capabilities |
|-----------|-------------|
| **Faculty / Teacher** | Create tests with MCQs & reading passages · Monitor student trust scores in real time · Review per-session integrity reports · Download/print audit reports |
| **Student** | Take AI-proctored exams · Get AI text simplification for complex passages · Use comprehensive accessibility tools · View graded answer review post-exam |

---

## ✨ Key Features

### 🔒 Privacy-First On-Device Proctoring
- **MediaPipe Face Mesh** (468 facial landmarks) runs entirely inside the browser via WebAssembly/WebGL
- Detects: gaze direction, face count, face absence
- **Zero video transmitted** — only metadata flags sent to the API
- Live **Trust Score** (0–100%) displayed in real-time with penalty deductions per anomaly
- Anomaly timeline with timestamps and per-event confidence scores

### 🤖 AI Text Simplification (LLM-Powered)
- Students can highlight any passage text and request AI simplification
- Backed by **Groq API (LLaMA 3.1 8B Instant)** via **LangChain**
- Returns: simplified paragraph in plain language + 3-4 bullet points of key concepts
- Critically: engineered to **never reveal correct exam answers**
- Offline fallback mode when API key is absent

### ♿ WCAG-Compliant Accessibility Layer
- **5-step font size scaling** (100% → 150%) via CSS custom properties
- **OpenDyslexic font toggle** (self-hosted WOFF2, proven to aid dyslexic readers)
- **3 visual themes**: Default Dark · High Contrast (WCAG AAA) · Dyslexia Warm
- **Text-to-Speech** (Web Speech API) with rate/pitch/voice controls
- **Reduced motion mode** (respects `prefers-reduced-motion` OS setting)
- Line spacing and letter spacing adjustments
- All preferences auto-persisted to localStorage

### 📊 Graded Answer Review Reports
- Post-exam report shows: Trust Score + Exam Score (correct/total)
- Per-question answer breakdown with correct/wrong/skipped badges
- Each option highlighted: 🟢 correct · 🔴 your wrong answer · ⚪ unchosen
- Anomaly timeline with penalty deduction calculations
- Print/Download to PDF via browser print API

### 🏫 Role-Based Exam Management
- Faculty creates tests: title, topic, duration, passage, instructions, N×MCQ questions with 4 options each
- Tests are immediately available to all students
- Teacher dashboard: active tests count, total submissions, average trust score, expandable results table

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Browser ["🌐 Browser (Client)"]
        direction TB
        LP[LoginPage\nRole Selection]
        SD[StudentDashboard\nTest Cards]
        TD[TeacherDashboard\nCreate + Results]
        EP[ExamPage\nMCQ + Passage + Timer]
        RP[ReportPage\nTrust Score + Answer Review]
        AT[AccessibilityToolbar\nFont/Theme/TTS/Dyslexic]

        subgraph Proctoring ["📸 On-Device Proctoring"]
            MP[MediaPipe Face Mesh\n468 landmarks · WebGL]
            TS[TrustScore Engine\nGaze · FaceCount · Absence]
            MP --> TS
        end

        EP --> Proctoring
    end

    subgraph DockerCompose ["🐳 Docker Compose Stack"]
        direction TB
        subgraph Nginx ["Nginx Container :80"]
            SPA[Serve React SPA\nClient-side routing]
            PROXY[/api/* Reverse Proxy]
        end

        subgraph BackendContainer ["FastAPI Container :8000"]
            AUTH[/api/v1/auth\nJWT · bcrypt]
            PROC[/api/v1/proctoring\nSessions · Anomalies]
            ACC[/api/v1/accessibility\nLLM Simplify]
            REP[/api/v1/reports\nSession Reports]
            TS_CALC[TrustScoreCalculator\nWeighted penalties]
            LLM[LangChain + Groq\nLLaMA 3.1 8B]

            PROC --> TS_CALC
            ACC --> LLM
        end

        subgraph MySQLContainer ["MySQL 8 Container :3306"]
            DB[(edushield_db\nusers\nexam_sessions\nanomaly_logs)]
        end

        PROXY --> BackendContainer
        BackendContainer --> MySQLContainer
    end

    Browser -->|HTTPS| Nginx
    TS -->|Only Metadata\nNO VIDEO| PROXY
```

---

## 🛠️ Technology Stack

### Frontend

| Library / Tool | Version | Purpose |
|----------------|---------|---------|
| React | 19.x | Component-based SPA framework |
| React Router DOM | 7.x | Client-side routing, protected routes |
| Vite | 8.x | ESM bundler, HMR dev server |
| Axios | 1.x | HTTP client for API calls |
| Lucide React | 1.x | SVG icon system |
| MediaPipe Face Mesh | 0.4.x | On-device 468-point face detection |
| MediaPipe Camera Utils | 0.3.x | Webcam frame loop management |
| Tailwind CSS | 4.x | Supplemental utility styles |
| Web Speech API | Browser-native | Text-to-Speech |
| OpenDyslexic Font | Self-hosted | Dyslexia-friendly typography |

### Backend

| Library / Tool | Version | Purpose |
|----------------|---------|---------|
| FastAPI | ≥0.110.0 | Async REST API framework |
| Uvicorn | ≥0.28.0 | ASGI production server |
| SQLAlchemy | ≥2.0.28 | ORM + connection pool |
| PyMySQL | ≥1.1.0 | MySQL driver |
| Pydantic v2 | ≥2.6.0 | Schema validation, settings |
| python-jose | ≥3.3.0 | JWT encoding/decoding (HS256) |
| passlib[bcrypt] | ≥1.7.4 | Password hashing |
| LangChain | ≥0.1.12 | LLM orchestration pipeline |
| langchain-groq | ≥0.1.0 | Groq API integration |
| python-dotenv | ≥1.0.1 | .env file loading |

---

## 🚀 Getting Started — Local Development

### Prerequisites

- **Node.js** ≥ 20.x and **npm** ≥ 10.x
- **Python** ≥ 3.11
- **MySQL** 8.x running locally (or use Docker)
- A **Groq API key** (free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone https://github.com/NoahReddyG/EduShieldAI.git
cd EduShieldAI
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and fill in your values:
# MYSQL_PASSWORD, GROQ_API_KEY, SECRET_KEY
```

### 3. Start the Backend

```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI (auto-reloads on file changes)
uvicorn backend.main:app --reload --port 8000
```

Backend is now running at **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend is now running at **http://localhost:5173**

---

## 🐳 Docker Compose Deployment

```bash
# 1. Clone and configure
git clone https://github.com/NoahReddyG/EduShieldAI.git
cd EduShieldAI
cp .env.example .env

# 2. Build and launch containers
docker compose up --build -d

# 3. Verify services
docker compose ps
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Authenticate user, return JWT |
| `POST` | `/api/v1/proctoring/sessions` | Create new exam session |
| `POST` | `/api/v1/proctoring/anomalies` | Log proctoring anomaly flag |
| `PATCH` | `/api/v1/proctoring/sessions/{id}` | Update session (close on submit) |
| `POST` | `/api/v1/accessibility/simplify-text` | AI text simplification |
| `GET` | `/api/v1/reports/session/{id}` | Retrieve session report |
| `GET` | `/health` | Health check endpoint |

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MYSQL_USER` | ✅ | `root` | Database username |
| `MYSQL_PASSWORD` | ✅ | `root` | Database password |
| `MYSQL_HOST` | ✅ | `localhost` | Database host |
| `MYSQL_PORT` | ✅ | `3306` | Database port |
| `MYSQL_DB` | ✅ | `edushield_db` | Database name |
| `GROQ_API_KEY` | ✅ | — | Groq LLM API Key |
| `SECRET_KEY` | ✅ | — | JWT Secret Key |

---

## 📄 License

Distributed under the **MIT License**.
