# CLAUDE.md — QHUB
# Read this entire file before writing any code.

## What This Is

Q's personal daily operations dashboard — a single-page web app that serves as his command center for tracking tasks, missions, revenue, Noctive pipeline, TikTok outreach, and beat production.

This is a personal productivity tool, not a public product. It's built for one user: Samuel Quinn Gilmore (Q), 21-year-old entrepreneur/producer in Temecula CA.

## Why It Exists

Q runs three businesses simultaneously (Noctive Group, TuneofQ, BLACKBOX) and has ADHD. Without a unified dashboard he loses track of what to execute daily. QHUB gives him one place to brain dump, process tasks with AI, track missions, log outreach, and monitor revenue — all in his aesthetic.

## Stack

- **Frontend**: Single HTML file (index.html) — no framework, vanilla JS
- **Backend**: Vercel serverless functions (CommonJS, `/api/` directory)
- **Storage**: Upstash Redis (tasks), localStorage (missions, pipeline, outreach, beats, revenue)
- **AI**: Claude API via Vercel functions (not called from browser — no keys exposed)
- **Hosting**: Vercel (ballyboy004/qhub-site)
- **Live URL**: qhub-pied.vercel.app

## Authentication

All API calls require header: `x-qhub-token: qhub-samuel-2026-noctive`
This is hardcoded in index.html and checked in all Vercel functions against `QHUB_SECRET` env var.

## Environment Variables (Vercel dashboard)

```
ANTHROPIC_API_KEY          ← Claude API
UPSTASH_REDIS_REST_URL     ← Redis instance URL
UPSTASH_REDIS_REST_TOKEN   ← Redis auth token
QHUB_SECRET                ← qhub-samuel-2026-noctive
```

## API Endpoints

```
POST /api/voice     ← Brain dump text → Claude processes → saves tasks to Redis
GET  /api/tasks     ← Fetch tasks from Redis
PATCH /api/tasks    ← Toggle task done/undone
DELETE /api/tasks   ← Delete task or clear done tasks
GET  /api/test      ← Health check — verifies all env vars + Redis ping
```

## Key Files

```
index.html           ← Entire frontend (HTML + CSS + JS, single file)
api/
  voice.js           ← Claude task processor + Redis writer (CommonJS)
  tasks.js           ← Task CRUD (CommonJS)
  test.js            ← Health check endpoint (CommonJS)
package.json         ← No "type": "module" — must stay CommonJS
vercel.json          ← {}
```

## Design System

Matches noctive.io exactly:
- Background: `#0c0c0e`
- Surface: `#131315`
- Surface hover: `#1a1a1c`
- Border: `rgba(255,255,255,0.08)`
- Border hover: `rgba(255,255,255,0.15)`
- Text: `#ffffff`
- Muted: `#52525b`
- Font: IBM Plex Mono (body), Inter 900 (headings/numbers)
- No lime green accent — white is the accent color

## Layout

Two-column grid layout (not vertical stacking):
- Tasks (58%) | Missions (42%) — side by side
- Pipeline — full width
- Outreach (55%) | Beat log (45%) — side by side

Launch bar sits between header and revenue bar — compact pills with tool name + live/local status.

## Sections

1. **Launch bar** — quick links to all tools (Lead Engine, Instantly, Noctive, Network Finder, Influencer Scout, Job Scout)
2. **Revenue bar** — Noctive MRR, Beat Sales, Other, Total (double-click to edit)
3. **Smart tasks** — brain dump textarea → Claude API → prioritized task list (syncs with Redis every 5s)
4. **Daily missions** — 5 missions with +1/-1 buttons, progress bar, resets at midnight
5. **Noctive pipeline** — 5-column kanban: Emailed → Opened → Replied → Demo → Closed
6. **TikTok outreach** — log pages DM'd, track status (Waiting/Quoted/Beat Sent/Posted/Pass)
7. **Beat log** — log beats made, auto-ticks the beat mission

## Rules

- **API functions MUST be CommonJS** (`module.exports`, not `export default`) — Vercel will break otherwise
- **Never call Anthropic API from the browser** — always route through /api/voice
- **Never expose API keys in index.html** — the secret token is fine (it's just an access control, not a credential)
- **No frameworks in index.html** — keep it vanilla JS, single file
- **Surgical changes** — this is a live daily-use tool, don't refactor what works
- **Test with curl before pushing** — especially for API changes

## How to Deploy

```bash
git add .
git commit -m "description"
git push   # Vercel auto-deploys from main
```

## How to Test API

```bash
# Health check
curl https://qhub-pied.vercel.app/api/test \
  -H "x-qhub-token: qhub-samuel-2026-noctive"

# Send a task
curl -X POST https://qhub-pied.vercel.app/api/voice \
  -H "Content-Type: application/json" \
  -H "x-qhub-token: qhub-samuel-2026-noctive" \
  -d '{"text": "test task"}'

# Fetch tasks
curl https://qhub-pied.vercel.app/api/tasks \
  -H "x-qhub-token: qhub-samuel-2026-noctive"
```

## Context: Who Uses This

Q opens QHUB every morning as his first action. It tells him what to focus on, tracks his daily missions, and logs everything he does. It's his war room. Build accordingly — it needs to be fast, reliable, and look sharp.
