# Coral Island Database

A game-companion web app for the farming sim *Coral Island* — browse crops, cave loot,
foraging spots, and NPC gift preferences, with an AI guide.

Monorepo:

```
CIAPP/
  client/   React + Vite frontend (deploy to Vercel)
  server/   Express + PostgreSQL backend (deploy to Railway)
  design_handoff_coral_island/   original design prototypes (reference)
```

## Status

- ✅ **Frontend** — complete and runs standalone on its own sample data
  (login/landing page, Crops / Caves / Foraging / NPCs pages, AI guide chat).
- ✅ **Database** — PostgreSQL schema + seed for crops, cave items, forageables, NPCs.
- 🔜 **API (Express routes + AI search)** — Phase 2 (`server/index.js` + `server/routes/`).
  Until then the frontend uses its local JSON and the AI guide uses a keyword engine.

## Local development

### Frontend
```bash
cd client
npm install
npm run dev          # http://localhost:5173
```

### Database (seed)
```bash
cd server
npm install
# set DATABASE_URL in server/.env first (see .env.example)
npm run seed         # creates tables + inserts all data
```

## Deploy

### Railway — PostgreSQL (+ API later)
1. New project → **Add PostgreSQL**.
2. Copy the database's `DATABASE_URL` (Connect tab).
3. Seed it: locally set `server/.env` `DATABASE_URL` to that value, then
   `cd server && npm run seed` (use `$env:NODE_ENV="production"` on Windows if
   the public URL requires SSL).
4. *(Phase 2)* Deploy the Express API as a service with **Root Directory = `server`**,
   start command `node index.js`, and `DATABASE_URL` + `ANTHROPIC_API_KEY` set as variables.

### Vercel — frontend
1. Import this GitHub repo.
2. **Root Directory = `client`** (Framework preset: Vite — auto-detected).
3. Build command `npm run build`, output `dist`.
4. `client/vercel.json` provides the SPA rewrite so `/login` and `/app` deep-links work.
5. *(Phase 2)* Add `VITE_API_URL` (your Railway API URL) and route `/api/*` to it.

## Environment variables

See [`.env.example`](.env.example). Real secrets go in `server/.env` (git-ignored) or in
the Railway/Vercel dashboards — never committed.
