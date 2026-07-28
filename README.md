# Vaidi — Rural Health Companion

**Vaidi** (from Sanskrit *vaidya*, meaning healer) is a rural healthcare access platform built for tribal belt communities in Gujarat's Dangs, Narmada, and Chhota Udepur districts. It connects community members with AI-guided health triage and teleconsultation scheduling, and gives ASHA/PHC workers a clean tool for follow-up tracking and medicine stock management.

Built for the IBM Hackathon — powered by **IBM Granite 3.3 8B Instruct** via **watsonx.ai**.

---

## What Each Agent Does

| Agent | What it does |
|---|---|
| **Triage Agent** | Conversational symptom collection — asks one focused question at a time in English or Gujarati. Knows when to escalate to emergency (108) vs. gather more info. |
| **Severity Classification Agent** | Takes the full conversation and outputs a structured severity band (Routine / Needs Attention / Urgent) with plain-language explanation and self-care guidance in both languages. |
| **Teleconsult Scheduling Agent** | Shows available doctors by specialty, lets patients book a time slot (simulated), and generates AI-personalized pre-consultation preparation tips. |
| **Follow-up & Stock Agent** | Gives ASHA workers AI-generated visit advice for overdue patients. Manages medicine stock levels with visual status indicators. |

> ⚠ Teleconsultation scheduling is simulated with mock data. No real telehealth integration is included. This is a hackathon demo.

---

## Setup

### Prerequisites
- Node.js 18+
- npm

### 1. Configure credentials

```bash
cp .env.example server/.env
```

Edit `server/.env` and fill in:
```
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_URL=https://au-syd.ml.cloud.ibm.com
JWT_SECRET=generate_a_long_random_string_here
```

> Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 2. Install dependencies

```bash
# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

### 3. Run

**Windows:**
```
start.bat
```

**Mac / Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Manual (two terminals):**
```bash
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npm run dev
```

Open **http://localhost:5173**

---

## Demo Credentials

| Role | Phone | Password |
|---|---|---|
| Patient | `9876543210` | `demo1234` |
| Patient | `9876543211` | `demo1234` |
| Health Worker (ASHA) | `9000000001` | `worker123` |
| Health Worker (ANM) | `9000000002` | `worker123` |

---

## Demo Flows

### Patient Flow
1. Login as patient → land on home screen
2. Tap "How are you feeling today?" to start triage
3. Describe symptoms — Vaidi asks focused follow-up questions
4. After 4–6 exchanges, tap **"Assess My Condition"**
5. View severity result with self-care guidance
6. For Attention/Urgent cases: book a teleconsultation slot
7. See pre-consultation preparation advice

### Health Worker Flow
1. Login as health worker → land on dashboard
2. See overdue follow-ups, critical stock counts
3. Navigate to **Follow-up Register** — expand patients, get AI visit advice, mark visited
4. Navigate to **Medicine Stock** — see visual stock levels, update quantities

---

## Architecture

```
vaidi/
├── server/           Node.js + Express
│   ├── agents/       IBM Granite LLM agents (watsonxClient, triage, severity, teleconsult, followup)
│   ├── routes/       auth, triage, teleconsult, worker
│   ├── middleware/   JWT auth, rate limiting, validation
│   ├── db/           lowdb JSON store with seed data
│   └── index.js
└── client/           React + Vite + Tailwind CSS
    └── src/
        ├── pages/    Login, PatientHome, Triage, SeverityResult, Teleconsult, WorkerDashboard, FollowupList, StockManagement
        ├── components/ Layout, SeverityBadge, ThinkingIndicator, LanguageToggle, ProtectedRoute
        ├── context/  AuthContext (JWT), LanguageContext (EN/GU)
        └── i18n/     English + Gujarati translations
```

---

## Security Notes
- Passwords stored with bcrypt (salt rounds: 12)
- JWT tokens expire in 12 hours
- Role-based route guards on both server and client
- Rate limiting: 15 AI calls/min per user, 10 auth attempts per 15 min
- Input validation and sanitization on all forms
- No secrets in source code — all from `.env`

---

## Deployment (Manual)

### Render (recommended for demo)

1. Push to GitHub
2. Create a **Web Service** for `server/` — set environment variables in the Render dashboard
3. Create a **Static Site** for `client/` — set `VITE_API_URL` to your server URL, build command `npm run build`, publish directory `dist`

Or use a single Render Web Service with the server serving the built client:
```bash
# In server/.env, set:
NODE_ENV=production
# Build client first: cd client && npm run build
# Then the server serves client/dist as static files
```

---

*Vaidi is a hackathon demo. It is not a substitute for emergency medical care. In a real emergency, always call 108.*
