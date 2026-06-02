# Ascendance WebApp

Mobile-first PWA reader and admin prototype for **Ascendance - The Trilogy**.

## Run

```powershell
npm start
```

Open:

```text
http://127.0.0.1:5189/
```

## Prototype Backend

The dependency-free Node backend in `server.mjs` serves the static PWA and exposes:

- `GET /api/health`
- `GET /api/state`
- `PUT /api/state`
- `POST /api/payments/verify`
- `POST /api/gifts/code`
- Resource-style draft endpoints for auth, books, purchases, progress, gifts, and community posts.

When the app is served through this backend, reader/admin state syncs to `data/state.json`. If the backend is unavailable, the app falls back to browser local storage.

The Next.js API prototype stores local development state in `data/next-state.json`. On Vercel, that temporary JSON store uses the serverless `/tmp` directory and is not durable. Production should use PostgreSQL.

See:

- `docs/API.md`
- `db/schema.sql`

## Next Production Step

Replace the JSON file storage with PostgreSQL and split the generic state sync into proper authenticated resources:

- users
- books
- sections
- chapters
- purchases
- reading progress
- gifts
- community posts
- comments
- admin users
