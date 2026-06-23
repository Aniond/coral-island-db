# CIAPP — Coral Island Database

Game-companion web app for *Coral Island*. Monorepo: `client/` (React + Vite → Vercel),
`server/` (Express + PostgreSQL → Railway), Supabase auth, Gemini-powered AI search.

## Skills — use them

- **`coral-island-db`** (`.agents/skills/coral-island-db/SKILL.md`) — architecture map,
  route/file/schema/env-var reference, fix patterns, and verification checklists.
  Read it before any non-trivial change to client or server.
- **`coral-island-db-theme`** (`.agents/skills/coral-island-db-theme/SKILL.md`) — design
  tokens and 11 themes for styling any artifact. Default to the Coral Island theme.

## Hard rules

- **Never call the Gemini API / AI search "to test" without flagging the cost first** —
  it spends real credits. "AI search failed" in prod usually means the account is out of
  credits, not a bug.
- Use exact color tokens from `client/src/lib/theme.js` — no new hex values in the client.
- npm installs only inside `client/` or `server/`, never at the repo root.
- Don't break `client/vercel.json` SPA rewrites when touching routing.
- Verify before declaring done: client changes → `npm run build` passes; server changes →
  boots and the endpoint answers (see skill checklists).

## Quick commands

```bash
cd client && npm run dev      # frontend, http://localhost:5173
cd server && node index.js    # backend, http://localhost:3001
cd server && npm run seed     # rebuild + reseed all data tables (destructive)
cd server && node migrate.js  # run pending migrations
```

## Prod ops

Frontend on Vercel (`VITE_*` vars are baked at build time — redeploy after changing them).
Backend + Postgres on Railway (`railway run` to use prod env locally). Detailed gotchas
live in the `coral-island-db` skill and Codex's memory directory.
