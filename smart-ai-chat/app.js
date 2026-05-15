/* ============================================================
   Smart AI Chat Assistant — app.js
   Author  : Dhanush Krishna K
   Project : Task 1 — Smart AI Chat Assistant (Web App)

   FEATURES IMPLEMENTED:
   1. Predefined keyword responses (greetings, farewells)
   2. AI API call via Anthropic Claude for all other inputs
   3. In-session chat history stored in array + displayed in UI
   4. Response caching — repeated questions skip API call
   ============================================================ */


/* ──────────────────────────────────────────────────────────────
   STATE
   chatHistory  : Array of all sent/received messages.
                  Shape: { role: 'user'|'ai', text: string, cached?: boolean }
                  Sent to AI API as conversation context.

   responseCache: Key-value store for caching AI responses.
                  Key   = normalized question string
                  Value = AI response text
                  Resets on page refresh (in-memory only, by design).
   ────────────────────────────────────────────────────────────── */

const chatHistory    = [];
const responseCache  = {};


/* ──────────────────────────────────────────────────────────────
   DOM REFERENCES
   ────────────────────────────────────────────────────────────── */
const chatArea   = document.getElementById('chatArea');
const userInput  = document.getElementById('userInput');
const sendBtn    = document.getElementById('sendBtn');
const emptyState = document.getElementById('emptyState');


/* ──────────────────────────────────────────────────────────────
   KEYWORD LISTS
   ────────────────────────────────────────────────────────────── */
const GREETINGS = ['hi', 'hello', 'hey', 'hii', 'helo', 'howdy', 'hi there', 'good morning', 'good evening'];
const FAREWELLS = ['bye', 'goodbye', 'see you', 'see ya', 'cya', 'take care', 'later', 'good night'];

const GREETING_REPLIES = [
  "Hey there! 👋 Great to see you! How can I help you today?",
  "Hello! 😊 I'm your Smart AI Assistant. What can I do for you?",
  "Hi! Welcome! Feel free to ask me anything. 🤖",
  "Hey! 👋 Good to have you here. What's on your mind?"
];

const FAREWELL_REPLIES = [
  "Goodbye! 👋 It was great chatting with you. Take care!",
  "See you later! 😊 Have a wonderful day!",
  "Bye! Feel free to come back anytime. 🤖",
  "Take care! 👋 Come back whenever you need help!"
];


/* ──────────────────────────────────────────────────────────────
   UTILITY FUNCTIONS
   ────────────────────────────────────────────────────────────── */

/**
 * normalize()
 * Converts user input to a consistent lowercase string
 * so cache lookups work regardless of case/punctuation.
 * e.g. "What is Java?" and "what is java" → same cache key
 */
function normalize(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')   // remove special chars
    .replace(/\s+/g, ' ');         // collapse multiple spaces
}

/**
 * isGreeting() — checks if input is a greeting keyword
 */
function isGreeting(text) {
  return GREETINGS.includes(normalize(text));
}

/**
 * isFarewell() — checks if input contains a farewell keyword
 */
function isFarewell(text) {
  return FAREWELLS.some(f => normalize(text).includes(f));
}

/**
 * getRandom() — picks a random item from an array
 */
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * escapeHtml() — prevents XSS when rendering user input as HTML
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * delay() — returns a Promise that resolves after `ms` milliseconds
 * Used to simulate a realistic response pause for local replies.
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* ──────────────────────────────────────────────────────────────
   RENDER / UI FUNCTIONS
   ────────────────────────────────────────────────────────────── */

/**
 * hideEmptyState()
 * Removes the welcome/empty state from the DOM on first message.
 */
function hideEmptyState() {
  const el = document.getElementById('emptyState');
  if (el) el.remove();
}

/**
 * appendMessage()
 * Creates and appends a message bubble to the chat area.
 *
 * @param {string}  role   - 'user' or 'ai'
 * @param {string}  text   - message content
 * @param {boolean} cached - if true, shows the ⚡ cached badge
 */
function appendMessage(role, text, cached = false) {
  hideEmptyState();

  // Outer wrapper
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? '🧑' : '🤖';

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');

  // Cache badge (shown only when response came from cache)
  if (cached) {
    const tag = document.createElement('span');
    tag.className = 'cached-tag';
    tag.textContent = '⚡ cached';
    bubble.appendChild(tag);
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatArea.appendChild(msg);

  // Auto-scroll to bottom
  chatArea.scrollTop = chatArea.scrollHeight;
}

/**
 * appendTypingIndicator()
 * Shows the three-dot animated loader while waiting for AI response.
 */
function appendTypingIndicator() {
  hideEmptyState();

  const msg = document.createElement('div');
  msg.className = 'msg ai';
  msg.id = 'typing-indicator';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'bubble typing';
  bubble.innerHTML = '<span></span><span></span><span></span>';

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

/**
 * removeTypingIndicator()
 * Removes the typing indicator once the response is ready.
 */
function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}


/* ──────────────────────────────────────────────────────────────
   AI API CALL
   ────────────────────────────────────────────────────────────── */

/**
 * callAI()
 * Sends a request to the Anthropic Claude API with full chat context.
 * Uses the conversation history so Claude remembers the full session.
 *
 * @param  {string} userText - the current user message
 * @return {string}          - Claude's response text
 */
/* ──────────────────────────────────────────────────────────────
   GROQ AI API CALL
   Compatible with Groq OpenAI SDK endpoint
   ────────────────────────────────────────────────────────────── */

async function callAI(userText) {

  const messages = chatHistory
    .filter(m => !m.cached)
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

  const lastMsg = messages[messages.length - 1];

  if (!lastMsg || lastMsg.content !== userText) {
    messages.push({
      role: 'user',
      content: userText
    });
  }

  try {

    const response = await fetch('http://127.0.0.1:8000/smart-ai-chat', {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error('Backend API Error');
    }

    const data = await response.json();

    return data.reply;

  } catch (error) {

    console.error(error);

    return '⚠️ Unable to connect to backend server.';
  }
}


/* ──────────────────────────────────────────────────────────────
   MAIN SEND LOGIC
   This is the core decision tree for handling every user message.
   ────────────────────────────────────────────────────────────── */

/**
 * sendMessage()
 * Called on Send button click or Enter key press.
 *
 * Decision order:
 *   1. Greeting keyword? → local reply (no API call)
 *   2. Farewell keyword? → local reply (no API call)
 *   3. Cache hit?        → return stored response (no API call)
 *   4. None matched?     → call Claude API → cache → display
 */
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // Clear input + disable button while processing
  userInput.value = '';
  userInput.style.height = '46px';
  sendBtn.disabled = true;

  // Show user message in UI
  appendMessage('user', text);
  chatHistory.push({ role: 'user', text });

  // Show typing indicator
  appendTypingIndicator();

  let response;
  let cached = false;
  const key = normalize(text);

  /* ── STEP 1: Greeting check ── */
  if (isGreeting(text)) {
    await delay(500);
    response = getRandom(GREETING_REPLIES);
  }

  /* ── STEP 2: Farewell check ── */
  else if (isFarewell(text)) {
    await delay(400);
    response = getRandom(FAREWELL_REPLIES);
  }

  /* ── STEP 3: Cache hit ── */
  else if (responseCache[key]) {
    await delay(300);
    response = responseCache[key];
    cached = true;
  }

  /* ── STEP 4: AI API call ── */
  else {
    try {
      response = await callAI(text);
      responseCache[key] = response;   // Store in cache for future hits
    } catch (error) {
      console.error('AI API Error:', error);
      response = '⚠️ Sorry, I could not reach the AI service. Please try again.';
    }
  }

  // Remove typing indicator and display response
  removeTypingIndicator();
  appendMessage('ai', response, cached);
  chatHistory.push({ role: 'ai', text: response, cached });

  // Re-enable input
  sendBtn.disabled = false;
  userInput.focus();
}


/* ──────────────────────────────────────────────────────────────
   CHIP SHORTCUT
   Called when user clicks a suggestion chip in the empty state.
   ────────────────────────────────────────────────────────────── */
function sendChip(text) {
  userInput.value = text;
  sendMessage();
}


/* ──────────────────────────────────────────────────────────────
   EVENT LISTENERS
   ────────────────────────────────────────────────────────────── */

/* Enter to send, Shift+Enter for new line */
userInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

/* Auto-resize textarea as user types */
userInput.addEventListener('input', function () {
  this.style.height = '46px';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});
