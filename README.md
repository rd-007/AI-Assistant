# 🚀 RD's Assistant

### A Modern Multi-Input AI Interface Powered by NVIDIA LLMs

> A production-style AI assistant built with **React + Vite**, designed to handle **text, file, and image inputs** with a resilient architecture that adapts to real-world API limitations.

---

## ✨ Overview

RSD AI Assistant is a clean, high-performance AI interface that demonstrates **practical system design** — not just API usage.

Instead of relying on fragile free endpoints, this project uses:

* **NVIDIA LLM APIs** for stable text generation
* **Client-side preprocessing** for file handling
* **Fallback strategies** for unsupported features

This ensures the app remains functional even under real-world constraints.

---

## 🧠 Key Highlights

* ⚡ **Fast & Responsive UI** – Built using Vite + React
* 🧩 **Modular Architecture** – Clean separation of components & logic
* 📄 **Universal File Processing** – Works across all models via text conversion
* 🖼 **Image Handling with Fallback Logic** – Graceful degradation for unsupported models
* 🔐 **Secure API Integration** – Environment-based key management
* 🎯 **Scalable Design** – Easy to extend with new providers or models

---

## 🏗️ Architecture

```id="arch1"
User Input (Text / File / Image)
        ↓
Preprocessing Layer
(File → Text | Image → Fallback Prompt)
        ↓
Prompt Construction
        ↓
NVIDIA API (LLM)
        ↓
Response Parsing
        ↓
UI Rendering
```

---

## 📁 Project Structure

```id="struct1"
src/
│
├── components/           # UI components
│   ├── AssistantResponse.jsx
│   ├── ErrorBanner.jsx
│   ├── Header.jsx
│   ├── PromptForm.jsx
│   └── QuickActions.jsx
│
├── constants/            # Config & API logic
│   ├── api.js
│   └── models.js
│
├── App.jsx               # Core logic & state management
├── main.jsx
└── index.css
```

---

## ⚙️ Tech Stack

* **Frontend:** React (Vite)
* **Styling:** Tailwind CSS
* **Icons:** React Icons
* **AI Backend:** NVIDIA NIM APIs
* **State Management:** React Hooks

---

## 🔑 Environment Setup

Create a `.env` file:

```id="env1"
NVIDIA_API_KEY=your_nvidia_api_key_here
```

> Restart the development server after adding environment variables.

---

## 📦 Installation & Run

```bash id="install1"
git clone <your-repo-url>
cd your-project-name
npm install
npm run dev
```

---

## 🔍 Feature Breakdown

### 💬 Chat System

* Handles dynamic prompts
* Supports structured responses
* Includes typing animation effect

---

### 📄 File Upload Handling

* Reads file content in browser
* Truncates large files safely
* Injects into prompt as structured text

---

### 🖼 Image Handling

* Attempts vision processing (if supported)
* Falls back to descriptive prompt generation
* Ensures zero crashes for unsupported models

---

### ⚡ Smart Prompt Engineering

* Combines multiple inputs into a single optimized prompt
* Maintains context clarity
* Prevents token overflow

---

## 🧠 Engineering Decisions

### 1. **Client-Side File Processing**

Instead of relying on model-specific file APIs:
→ Files are converted to text
→ Works across all models

---

### 2. **Fallback-Based Image Handling**

Instead of failing when vision isn’t available:
→ Generates contextual prompt
→ Maintains UX continuity

---

### 3. **Provider Stability Focus**

Switched from unstable free endpoints to:
→ NVIDIA APIs for reliability

---

## ⚠️ Limitations

* ❌ Native image understanding depends on model capability
* ❌ No streaming responses (yet)
* ⚠️ API usage may be rate-limited on free tier

---

## 🔮 Future Enhancements

* 🔁 Streaming responses (real-time typing)
* 💾 Chat history persistence
* 🧠 Multi-model routing system
* 🖼 Full vision model integration
* 📊 Token usage tracking
* 🌐 Multi-provider support (OpenRouter + NVIDIA hybrid)

---

## 🧑‍💻 Author

**Rajit Dakhane**
Computer Engineering Student
Focused on building practical, real-world AI systems

---

## 📌 What Makes This Project Stand Out

This isn’t just an AI wrapper.

It demonstrates:

* **System resilience under API limitations**
* **Practical engineering trade-offs**
* **Clean frontend architecture**
* **Real-world AI integration patterns**

---

## ⭐ Final Thought

> Good AI apps don’t just use models —
> they are designed to survive when models fail.

---
