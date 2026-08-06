# NohiAI Chat API (Nohitatu)

FastAPI backend for the Nohitatu website chat widget. Uses OpenAI (`gpt-4o-mini` by default) plus a lightweight keyword RAG layer over `knowledge/`.

All chatbot code for this site lives in this workspace only:

- Backend: `chatbot/`
- Widget: `js/chatbot.js`, `css/chatbot.css` (included from site HTML)

## Port note

**The backend runs on port 8010 by design** so it does not conflict with other apps that commonly use port 8000. Override with `PORT` / `uvicorn --port` on the server, or `window.NOHI_CHAT_API` / `#chatbot-container[data-api]` on the widget.

## Setup

```bash
cd chatbot
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...
```

## Run

```bash
uvicorn main:app --reload --port 8010
```

Or:

```bash
python main.py
```

(`python main.py` also defaults to port 8010; set `PORT` in `.env` to change it.)

Health checks:

- `GET http://localhost:8010/health`
- `GET http://localhost:8010/api/health`

Chat:

```bash
curl -X POST http://localhost:8010/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"What services does Nohitatu offer?\",\"conversation_history\":[]}"
```

## Widget configuration

On marketing pages, the shared widget (`js/chatbot.js`) resolves the API base URL as:

1. `window.NOHI_CHAT_API` (recommended for production; also for local overrides)
2. `#chatbot-container` `data-api` attribute
3. Default: `http://localhost:8010`

Example before the widget script (production or custom local port):

```html
<script>
  window.NOHI_CHAT_API = "https://chat-api.your-domain.com";
  // or: window.NOHI_CHAT_API = "http://localhost:9000";
</script>
<script src="js/chatbot.js?v=..."></script>
```

Or on the container:

```html
<div id="chatbot-container" class="chatbot-container" data-api="http://localhost:9000">
```

If you change the API port, set both the uvicorn/`PORT` side and the widget override so they match.

## Knowledge / RAG

- `knowledge/chunks.json` — structured retrieval chunks
- `knowledge/company.md` — human-readable corpus for editors
- `rag.py` — keyword scoring; replace with ChromaDB/embeddings later without changing `/api/chat`

## Safety defaults

- CORS limited to nohitatu.com, www, and localhost variants
- Conversation history capped (last 20); roles limited to `user` / `assistant`
- Message length limits and light per-IP rate limiting
- Production-safe error messages (no raw exception leaks)

## Deploy next steps

1. Host this API (container, Railway, Fly, Azure, etc.)
2. Set `OPENAI_API_KEY` and `APP_ENV=production` in the host env
3. Point the website widget at the production base URL via `window.NOHI_CHAT_API`
4. Keep `.env` out of git (see repo `.gitignore`)
