# BookKeeping Omnichannel

A runnable full-stack MVP for the Precision Ledger bookkeeping workspace. The reference screens in the supplied archive informed the visual system: dark slate surfaces, hairline borders, Plus Jakarta Sans headings, emerald income, rose expenses, and indigo automation.

## Run locally

```powershell
node server.js
```

Open http://localhost:3000.

The API is intentionally dependency-free for the first commit:

- `POST /api/login`
- `GET /api/dashboard`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/bots`
- `GET /api/users`

Transactions are persisted in Neon PostgreSQL when `DATABASE_URL` is configured. Copy `.env.example` to `.env`, replace the placeholder with the connection string from Neon, and restart the server. The server creates the `transactions` table on startup and seeds the demo rows once when the table is empty.

```powershell
Copy-Item .env.example .env
# Edit .env and set DATABASE_URL to your Neon connection string
npm install
node server.js
```

## Access configuration

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your local `.env` file for administrator access. The administrator has full control, including creating transactions, inviting users, adding categories, deleting records, and reconnecting bots.

Viewer access is optional. Set `VIEWER_USERNAME` and `VIEWER_PASSWORD` in `.env` only if you need a read-only account. New users created by the administrator must provide a password of at least 8 characters. Production authentication should move all accounts into the database with hashed passwords.

Sessions are stored in browser local storage for this MVP. Production authentication should replace this with secure, persisted sessions or short-lived access tokens.

Never commit `.env`. It is ignored by Git; use `.env.example` as the safe configuration template.

## Deploying to Vercel

Import the repository into Vercel with the Framework Preset set to `Other`. Leave Build Command and Output Directory empty. The `api/[...path].js` function exposes the existing `/api/*` routes, while the files in `public/` are served as the frontend.

Add `DATABASE_URL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` as Vercel environment variables. Add `VIEWER_USERNAME` and `VIEWER_PASSWORD` only when viewer access is needed. Do not add `PORT`; Vercel assigns it automatically.
