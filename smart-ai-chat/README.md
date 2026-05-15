# Smart AI Chat Assistant
**Task 1 — Web App Project**
Developer: Dhanush Krishna K

---

## Project Structure

```
smart-ai-chat/
│
├── FrontEnd/
│   ├── index.html        ← HTML structure (layout, chat area, input)
│   ├── style.css         ← All CSS (design tokens, layout, animations)
│   └── app.js            ← Frontend logic, UI rendering, API requests
│
├── BackEnd/
│   ├── main.py           ← FastAPI backend server
│   ├── requirements.txt  ← Python dependencies
│   └── .env              ← Groq API key (excluded from GitHub)
│
├── .gitignore
└── README.md
```

```

---

## Features

| Feature | Description |
|---|---|
| Greeting detection | `hi`, `hello`, `hey` → instant local reply, no API call |
| Farewell detection | `bye`, `goodbye` → instant local reply, no API call |
| AI responses | All other inputs → calls Claude API |
| Chat history | All messages stored in array and shown in UI |
| Response caching | Same question asked again → returns cached reply instantly |
| Cache badge | Cached responses show an `⚡ cached` badge |
| History reset | Refreshing the page clears all history (in-memory only) |

---

## How to Run

### Method 1 — Direct (No Setup Needed)
1. Download the `smart-ai-chat` folder
2. Open `index.html` in Chrome, Firefox, Edge, or Safari
3. Start chatting!

### Method 2 — VS Code Live Server

**Frontend Setup**
1. Open the smart-ai-chat folder in VS Code
2. Install the Live Server extension (if not already installed)
3. Right-click FrontEnd/index.html → Open with Live Server
4. Frontend runs at:
  http://127.0.0.1:5500

**Backend Setup**
1. Open a new VS Code terminal
2. Navigate to backend folder:
    cd BackEnd
3. Install dependencies:
    pip install -r requirements.txt
4. Start FastAPI server:
  python -m uvicorn main:app --reload
5. Backend API runs at:
  http://127.0.0.1:8000
  
**Final Architecture**
Frontend (Port 5500)
        ↓
FastAPI Backend (Port 8000)
        ↓
Groq LLM API

---

## Testing Checklist

- [ ] Type `hello` → get a greeting reply (no API call)
- [ ] Type `bye` → get a farewell reply (no API call)
- [ ] Type `What is Java?` → AI responds via Claude
- [ ] Type `What is Java?` again → see `⚡ cached` badge
- [ ] Refresh page → chat history and cache clear

---

## Tech Stack

- **HTML5** — semantic structure
- **CSS3** — custom properties, flexbox, animations
- **Vanilla JavaScript** — no frameworks, no dependencies
- **Anthropic Claude API** — `claude-sonnet-4-20250514` model
- **Python** — backend API development and secure server-side processing
- **FastAPI** — lightweight Python backend framework for REST APIs
- **Groq API** — high-speed LLM inference using llama-3.3-70b-versatile
- **Anthropic Claude API** — claude-sonnet-4-20250514 model (initial implementation)

---

## File Responsibilities

### index.html
- Page structure only
- Links to `style.css` and `app.js`
- No inline styles, no inline scripts

### style.css
- All visual design via CSS variables
- Dark theme, responsive layout
- Animations: message fade-in, typing indicator, pulse dot

### app.js
- `chatHistory[]` — stores all messages for context + UI
- `responseCache{}` — key-value cache for AI responses
- `normalize()` — consistent cache key generation
- `sendMessage()` — main decision tree (greeting → farewell → cache → API)
- `callAI()` — Anthropic API call with full conversation context
- DOM helpers: `appendMessage()`, `appendTypingIndicator()`

### main.py
- FastAPI backend server
- Secure Groq API integration using environment variables
- Handles POST /chat endpoint
- Processes conversation history and forwards requests to LLM API
- Enables CORS for frontend-backend communication
