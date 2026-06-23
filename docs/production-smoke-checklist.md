# Production Smoke Checklist

Run this after every Vercel or Railway deployment that touches auth, AI search,
database migrations, routing, or the admin dashboard.

## 1. Railway API

1. Confirm the Railway deploy logs show `npm start`.
2. Confirm pending migrations ran before `Server listening`.
3. Open `/` on the Railway public URL and expect:

```json
{"status":"ok","app":"Coral Island DB","version":2}
```

4. Open `/api/crops` and confirm JSON rows are returned.

## 2. Vercel Client

1. Confirm the Vercel build uses the `client/` root.
2. Confirm `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`
   are present in the deployment environment.
3. Load `/login`, `/app`, and a direct deep link. The SPA rewrite in
   `client/vercel.json` should keep every route loading the app shell.

## 3. Auth And Admin

1. Log in as a normal user and confirm the app loads.
2. Log in as an admin and open `/admin`.
3. Check Stats, Users, Search Logs, and AI Metrics tabs.
4. If AI Metrics reports the table is missing, run `cd server && node migrate.js`
   against the production `DATABASE_URL`.

## 4. AI Search Without Paid Model Calls

Use DB-only checks first. These should not call Gemini:

1. Ask a direct database question such as `Where does Wakuu live?`.
2. Confirm the answer appears quickly.
3. Check Admin -> AI Metrics and confirm the event source is `direct`.

Do not run an open-ended Gemini-backed prompt unless the person testing has
explicitly accepted that it can spend model credits.

## 5. Approved AI Search

Only after cost approval:

1. Ask one open-ended prompt that requires synthesis.
2. Confirm streaming starts.
3. Press Stop while it is generating.
4. Confirm the UI returns to the send state and Admin -> AI Metrics records an
   `aborted` event.

## 6. Rollback Signals

Rollback or pause deploy promotion if any of these fail:

- Railway health endpoint does not return JSON.
- Vercel serves a blank app shell or deep links 404.
- Admin cannot load metrics after migrations have run.
- AI search calls return 500 for missing `GEMINI_API_KEY`.
- Direct database answers start routing through Gemini unexpectedly.
