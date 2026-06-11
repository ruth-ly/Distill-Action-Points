# Distill — meeting notes → clean action points

An AI-powered app that turns messy meeting notes into structured, accountable action items. Paste raw notes (bullet soup, half-sentences, all welcome) and Distill extracts:

- **Who** owns each task, grouped by person
- **What** needs to be done, rewritten as clear imperatives
- **When** it's due, with priority levels
- **What's missing** — unowned tasks, vague deadlines ("soon", "ASAP"), and open questions are flagged with amber "ask the team" prompts

## How it works

The intelligence of this app lives in a single, carefully engineered **system prompt** (see `api/distill.js`). It demonstrates four core prompt-engineering techniques: specificity, few-shot examples, structured JSON output, and reasoning-before-answering.

The architecture keeps secrets server-side:

```
Browser (React UI)  →  /api/distill (Vercel function, holds API key)  →  Anthropic API
```

The browser never sees the API key or the system prompt.

## Tech

- React + Vite
- Vercel serverless function (`api/distill.js`)
- Anthropic Messages API (Claude)

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Get an Anthropic API key at https://console.anthropic.com
3. Go to https://vercel.com → **Add New Project** → import your GitHub repo (Vercel auto-detects Vite)
4. In the project settings, add an environment variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key
5. Click **Deploy** — done. Your app is live at `your-project.vercel.app`

## Run locally

```bash
npm install
npm install -g vercel
vercel dev        # runs frontend + the API function together
```

Set `ANTHROPIC_API_KEY` in a `.env` file first (never commit it — it's already in `.gitignore`).

## Status

Built as part of my AI/ML learning journey — phase 2 (prompt engineering) project. Next: rebuilding the core logic in Python (phase 3) and adding RAG over past meeting archives (phase 4).
