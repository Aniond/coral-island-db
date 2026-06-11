---
name: coral-island-db
description: >
  Expert co-developer skill for the coral-island-db monorepo — a React + Vite frontend
  on Vercel, Express + PostgreSQL backend on Railway, and Supabase auth. Use this skill
  whenever the user is working on coral-island-db, mentions any of its routes, components,
  schema tables, seed data, deploy config, or asks about fixing, adding, or debugging
  anything in CIAPP. Also triggers for: Express route errors, Vite env var issues,
  Railway deploy problems, Supabase auth failures, Anthropic AI search issues, or
  any task involving crops/caves/foraging/NPCs/collectibles/cooking/crafting data.
  Always apply this skill when the user says "coral island", "CIAPP", or references
  the client/server monorepo structure.
---

# Coral Island DB — Co-Developer Skill

Expert co-developer for the `coral-island-db` game-companion monorepo. Peer-to-peer
tone. High data-density. No fluff. Atomic changes only.

---

## Architecture Snapshot

```
CIAPP/
  client/          React + Vite SPA → Vercel
  server/          Express + PostgreSQL → Railway
  design_handoff_coral_island/   pixel-accurate UI prototypes (read-only reference)
```

### Backend routes (all live in `server/routes/`)
| File | Mount | Notes |
|------|-------|-------|
| `crops.js` | `GET /api/crops` | `?season=&town_rank=&type=` — season uses ILIKE for combos |
| `caves.js` | `GET /api/caves` | `?cave=&item_type=` |
| `foraging.js` | `GET /api/forageables` | `?season=&area=` |
| `collectibles.js` | `GET /api/collectibles` | `?category=` |
| `crafting.js` | `GET /api/crafting` | |
| `cooking.js` | `GET /api/cooking` | |
| `npcs.js` | `GET /api/npcs` | |
| `search.js` | `POST /api/search` | Streams Anthropic response; requires Bearer token |
| `admin.js` | `GET|PATCH /api/admin/*` | `requireAdmin` middleware; manages users, limits, logs |

### Frontend key files (`client/src/`)
| File | Purpose |
|------|---------|
| `data/api.js` | All fetch calls + DB→UI row mappers; uses `API_BASE` from `lib/apiBase.js` |
| `lib/apiBase.js` | `API_BASE` constant built from `VITE_API_URL`; `timeoutSignal()` (30s) |
| `lib/supabase.js` | Supabase client init (anon key) |
| `lib/authToken.js` | `refreshAccessToken()` — retries 401s once |
| `contexts/AuthContext.jsx` | Session state + `isAdmin` flag via `/api/admin/me` |
| `components/AISearch.jsx` | Floating chat panel; streams from `POST /api/search` |

### Schema tables
`crops`, `cave_items`, `forageables`, `collectibles`, `cooking_recipes`,
`crafting_recipes`, `npcs`, `search_logs`, `user_roles`, `app_settings`, `schema_migrations`

### Key env vars
| Var | Where | Purpose |
|-----|-------|---------|
| `DATABASE_URL` | Railway | PostgreSQL connection |
| `ANTHROPIC_API_KEY` | Railway | AI search |
| `SUPABASE_URL` | Railway | Auth verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Railway | Admin auth operations |
| `PORT` | Railway (auto) | Express listen port (fallback 3001) |
| `VITE_API_URL` | Vercel | Railway backend URL — **baked at build time** |
| `VITE_SUPABASE_URL` | Vercel | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel | Supabase publishable key |

---

## Behavioral Rules

- **Data layer**: All pages fetch from the live API via `client/src/data/api.js`.
  The only static data left is `data/mineUnlocks.json` and `data/roadmap.js` — keep those.
- **Atomic changes**: One feature/fix per commit block. Flag structural changes before writing.
- **npm scope**: Install only inside `client/` or `server/`. No root-level installs.
- **No fragments**: Output complete, production-ready files. No `// ... rest of file` shortcuts.
- **Git hygiene**: Always end a task block with the git commit command.

---

## Dev Commands

```bash
# Frontend dev server
cd client && npm run dev           # http://localhost:5173

# Seed the database
cd server && npm run seed          # drops + recreates all data tables

# Build frontend
cd client && npm run build

# Run migrations
cd server && node migrate.js

# Start backend locally
cd server && node index.js         # or: npm run dev (nodemon)
```

---

## Common Fix Patterns

### "Failed to fetch" on frontend
Diagnosis order:
1. Is `VITE_API_URL` present in the Vercel build logs? (It's baked at build time — missing = undefined)
2. Hit `$VITE_API_URL/api/crops` directly — is Railway responding?
3. Check CORS in `server/index.js` — is the Vercel domain in the `origin` array?
4. If env var was added after deploy: trigger redeploy with `git commit --allow-empty -m "trigger redeploy" && git push`

### Railway "Application not found"
- Service has no public domain → Railway dashboard → service → Settings → Networking → Generate Domain
- Server not listening on `process.env.PORT` → verify `const PORT = process.env.PORT || 3001`
- Dockerfile builder not picked up → check `server/railway.toml` specifies `[build] builder = "dockerfile"`

### Supabase auth crash on server startup
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` missing → `server/lib/supabase.js` uses lazy init proxy, won't crash server but will 500 on first auth call
- Add both vars to Railway Variables tab

### AI search not streaming
- `ANTHROPIC_API_KEY` missing on Railway → 500 from `/api/search`
- Token expired → `client/src/lib/authToken.js` handles one refresh+retry on 401
- Daily limit hit → 429 with human-readable message from `server/lib/settings.js`

### Vercel runtime logs show nothing
Expected — it's a static Vite build with no serverless functions. Use **build logs** instead.

### VITE_API_URL added but still broken
Vercel bakes env vars at build time. Adding the var without redeploying = still undefined in the bundle.
Force a redeploy: `git commit --allow-empty -m "redeploy" && git push`

---

## Adding a New Data Page Workflow

(The original JSON→API migration is complete — all pages are on the live API.)
When adding a new data-backed page:

1. **Schema + seed**: Add the table to `server/` schema/seed and a migration if prod data exists
2. **Route**: Add `server/routes/<name>.js` and mount it in `server/index.js`
3. **Mapper**: Add `fetch*()` + `map*()` in `client/src/data/api.js`
4. **Page component**: Fetch via the mapper; follow existing page patterns and theme tokens
5. **AI context**: Add the table to the AI search context so `/api/search` can query it
6. **Test**: `npm run dev` in `/client` with the backend on `localhost:3001`
7. **Commit**: `git add -A && git commit -m "feat: add <Name> page" && git push`

---

## UI/UX Reference Rules

When making frontend changes:
1. Read `design_handoff_coral_island/README.md` for token system and component specs
2. Use the exact color tokens from `client/src/lib/theme.js` — do not introduce new hex values
3. Verify `client/vercel.json` SPA rewrites are intact after any routing changes
4. Mobile layout uses bottom tab bar — do not put floating UI elements in the bottom-right on mobile

### Design tokens (key values)
```js
primary:     '#0f766e'  // teal-600
primaryDark: '#134e4a'  // teal-900 (sidebar bg)
accent:      '#f97316'  // orange-500 (CTAs, active nav)
pageBg:      '#fefce8'  // yellow-50 (sandy cream)
cardBorder:  '#99f6e4'  // teal-300
```

---

## Verification Checklist

After any change, run through the applicable checks:

### Backend change
- [ ] `node --check server/routes/<changed>.js` — syntax OK
- [ ] `cd server && node index.js` — server boots without error
- [ ] `curl http://localhost:3001/` returns `{"status":"ok","app":"Coral Island DB","version":2}`
- [ ] Hit the affected endpoint directly: `curl http://localhost:3001/api/<route>`
- [ ] If schema/seed changed: `npm run seed` completes without errors
- [ ] If migration added: `node migrate.js` runs cleanly and records in `schema_migrations`

### Frontend change
- [ ] `cd client && npm run build` — Vite build succeeds (0 errors)
- [ ] `npm run dev` — page loads at `http://localhost:5173`
- [ ] Affected page renders data correctly (not blank, not erroring)
- [ ] Mobile layout intact — check at 390px viewport width
- [ ] `client/vercel.json` SPA rewrites still present

### Auth / Supabase change
- [ ] Server boots without Supabase env vars (lazy init means no crash)
- [ ] Login flow completes and `AuthContext` sets `session` + `isAdmin` correctly
- [ ] Token expiry path: expired token → `refreshAccessToken()` → retry succeeds

### Deploy
- [ ] `git push` → Vercel build log shows `VITE_API_URL` present in env
- [ ] Vercel deployment reaches `READY` state
- [ ] Railway deployment shows healthy (green) service
- [ ] Production smoke test: load app → crops page → AI search query

### AI search change
- [ ] `POST /api/search` with valid Bearer token returns streaming text
- [ ] 401 returned without token
- [ ] 400 returned for query > 500 chars
- [ ] 429 returned when daily limit exceeded
- [ ] Client disconnect aborts stream (check server logs show "client disconnected")
