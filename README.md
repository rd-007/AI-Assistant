<div align="center">

# ⚡ RD's Assistant

### An AI Interface That Actually Survives Production

**Chat · Vision · Documents — One Interface, Three Superpowers**

[![Built with React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Powered by NVIDIA](https://img.shields.io/badge/NVIDIA-NIM_APIs-76B900?style=flat-square&logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![Styled with Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Built with Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)

---

*Most AI wrappers call an API and pray. This one is built to survive when things go wrong.*

</div>

---

## 🎯 What Is This?

An AI assistant that routes **text, images, and documents** through NVIDIA's LLM infrastructure — with the kind of resilience, security, and architecture you'd expect from production software, not a weekend hackathon.

> **The difference?** This doesn't just *use* AI models — it's *engineered around their failure modes*.

---

## 🧠 How It Works

```
┌─────────────────────────────────────────────────┐
│                   USER INPUT                    │
│         Text  ·  Image  ·  Document             │
└──────────────────┬──────────────────────────────┘
                   │
          ┌────────▼────────┐
          │  Smart Router   │ ← Detects input type
          └──┬─────┬─────┬──┘
             │     │     │
     ┌───────▼┐ ┌──▼──┐ ┌▼────────┐
     │  Chat  │ │Vision│ │Document │
     │  Lane  │ │ Lane │ │  Lane   │
     └───┬────┘ └──┬──┘ └──┬──────┘
         │         │       │
         │    ┌────▼───┐   │
         │    │Nemotron│   ├──→ Nemotron Parse
         │    │  VL    │   │    (PDF/DOCX → Text)
         │    └────┬───┘   │           │
         │         │       │    ┌──────▼──────┐
    ┌────▼─────────▼───────▼────▼──────────┐  │
    │       NVIDIA NIM API Gateway         │  │
    │  (Proxied · Validated · Rate-Limited)│  │
    └──────────────┬───────────────────────┘  │
                   │                          │
          ┌────────▼────────┐                 │
          │ Response Parser │ ←───────────────┘
          │ + Markdown Render│
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │   Threaded UI   │
          │  with History   │
          └─────────────────┘
```

---

## ✨ Features

### 💬 Multi-Turn Chat
Not just single-shot Q&A. The assistant remembers your conversation context — ask follow-ups, refine ideas, iterate naturally.

### 🖼️ Vision Analysis
Drop an image, get analysis. Powered by **Nemotron VL 12B** with graceful fallback if the model doesn't support the input.

### 📄 Document Intelligence
Upload PDFs, DOCX, PPTX — the document pipeline extracts text via **Nemotron Parse**, then routes it through the chat model for summarization, Q&A, or analysis.

### 🧵 Threaded Conversations
Multiple persistent chat threads. Branch your ideas. Switch contexts without losing work. All stored locally.

### 🔒 Security-First Architecture
- Server-side API proxy (keys never touch the browser)
- Input validation with model whitelisting
- Rate limiting (20 req/min per IP)
- CORS protection
- XSS sanitization on all rendered content
- Request body size limits (5MB cap)
- Optional auth tokens for serverless endpoints

### ⚡ Performance
- Request cancellation via `AbortController`
- 30-second upstream timeouts
- Async file I/O (non-blocking)
- Smart localStorage persistence (blobs stripped, quota-safe)

---

## 🏗️ Architecture

```
├── api/                    # Vercel serverless functions
│   ├── chat.js             # Chat completions endpoint
│   ├── document-parse.js   # Document parsing endpoint
│   └── health.js           # Health check
│
├── lib/
│   └── nvidiaProxy.mjs     # Shared proxy logic, rate limiting, validation
│
├── src/
│   ├── components/
│   │   ├── AssistantResponse.jsx   # Message display + markdown rendering
│   │   ├── ErrorBanner.jsx         # Error UI
│   │   ├── Header.jsx              # App header + model/lane indicator
│   │   ├── PromptForm.jsx          # Input form with file/image upload
│   │   ├── QuickActions.jsx        # Preset prompt shortcuts
│   │   ├── ThreadSidebar.jsx       # Thread management sidebar
│   │   └── markdown/
│   │       ├── CodeBlock.jsx           # Code rendering + copy button
│   │       └── markdownComponents.jsx  # Custom markdown element styles
│   │
│   ├── constants/
│   │   ├── api.js          # API URLs, file limits, extensions
│   │   └── models.js       # Model definitions + routing config
│   │
│   ├── App.jsx             # Core state management + routing logic
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
│
├── server.mjs              # Production Node.js server (static + API)
├── vercel.json             # Vercel deployment config
└── vite.config.js          # Vite + Tailwind + dev proxy
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · Vite 7 · Tailwind CSS v4 |
| **UI** | React Icons · React Markdown · Remark GFM |
| **Security** | Rehype Sanitize · Server-side proxy |
| **Backend** | Node.js (native HTTP) · Vercel Serverless |
| **AI** | NVIDIA NIM APIs (Llama 3.1 · Nemotron · Nemotron VL) |
| **State** | React Hooks · localStorage (with safe persistence) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- An NVIDIA API key ([get one here](https://build.nvidia.com))

### Setup

```bash
# Clone
git clone https://github.com/rd-007/AI-Assistant.git
cd AI-Assistant

# Install
npm install

# Configure
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY

# Run
npm run dev
```

This starts both the Vite dev server and the API proxy concurrently. Open [http://localhost:5173](http://localhost:5173).

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:web` | Start Vite dev server only |
| `npm run dev:api` | Start API proxy server only |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NVIDIA_API_KEY` | ✅ | Your NVIDIA NIM API key |
| `APP_SECRET_TOKEN` | Optional | Shared secret for endpoint auth |
| `ALLOWED_ORIGIN` | Optional | CORS allowed origin (defaults to `*`) |
| `PORT` | Optional | Server port (defaults to `8787`) |

---

## 🤖 Supported Models

| Model | Type | Use Case |
|---|---|---|
| **Llama 3.1 8B Instruct** | Chat | General text, code, reasoning |
| **Nemotron Nano 8B** | Chat | Fast responses, lightweight tasks |
| **Nemotron Nano 12B VL** | Vision + Chat | Image analysis, visual Q&A |
| **Nemotron Parse** | Document | PDF/DOCX/PPTX text extraction |

---

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables (`NVIDIA_API_KEY`, `APP_SECRET_TOKEN`)
4. Deploy — Vercel auto-detects Vite + serverless functions

### Self-Hosted

```bash
npm run build
npm run start
```

The production server serves the static frontend from `dist/` and handles API routes — no reverse proxy needed.

---

## 🧠 Engineering Decisions

<details>
<summary><strong>Why a server-side proxy instead of direct API calls?</strong></summary>

API keys in the browser are a security disaster. The proxy keeps keys server-side, adds validation, rate limiting, and gives you a single point to monitor/control all API traffic.
</details>

<details>
<summary><strong>Why client-side file processing?</strong></summary>

Text files are read and inlined into prompts directly — this works across all models without needing model-specific file upload APIs. Documents go through Nemotron Parse for extraction first.
</details>

<details>
<summary><strong>Why localStorage instead of a database?</strong></summary>

For a personal assistant, localStorage keeps things simple — no backend database, no auth flow, no user management. The persistence layer strips large blobs and handles quota errors gracefully.
</details>

<details>
<summary><strong>Why rate limiting on a personal project?</strong></summary>

Because once it's deployed, it's public. One script kiddie can burn through your API credits in minutes without it.
</details>

---

## ⚠️ Limitations

- **No streaming** — Responses arrive as a single payload (streaming planned)
- **Vision is model-dependent** — Only Nemotron VL supports image input
- **localStorage cap** — ~5-10MB limit; heavy users should periodically clear old threads
- **Single-user** — No authentication or multi-user support

---

## 🗺️ Roadmap

- [ ] 🔁 Streaming responses (real-time token rendering)
- [ ] 🧠 System prompt customization
- [ ] 📊 Token usage tracking & cost estimation
- [ ] 🔍 Thread search
- [ ] 📱 Mobile-optimized layout
- [ ] 🌐 Multi-provider support (NVIDIA + OpenRouter hybrid)
- [ ] 💾 IndexedDB migration for larger storage

---

## 👤 Author

**Rajit Dakhane**
Computer Engineering Student · Building practical AI systems that survive real-world usage.

[![GitHub](https://img.shields.io/badge/GitHub-rd--007-181717?style=flat-square&logo=github)](https://github.com/rd-007)

---

<div align="center">

*Good AI apps don't just call models — they're engineered to survive when models fail.*

**⭐ Star this repo if you found it useful**

</div>
