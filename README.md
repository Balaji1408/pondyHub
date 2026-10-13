# Pondy Tripora

BookMyShow-style landing site for Pondicherry stays, vehicle rentals, boating, cafés, beaches, bars, food streets, and White Town.

- **Frontend:** React + TypeScript + Tailwind + TanStack Query (`frontend/`)
- **Backend:** Node.js + Express + TypeScript (`backend/`)
- **Database:** MySQL `hub_1` (user `root`, no password)

## 1. Database setup (phpMyAdmin)

1. Open [phpMyAdmin](http://localhost/phpmyadmin/) and select (or create) database **`hub_1`**.
2. Import in order:
   - [`backend/sql/schema.sql`](backend/sql/schema.sql)
   - [`backend/sql/seed.sql`](backend/sql/seed.sql)

Or from the backend folder (MySQL must be running, user `root`, no password):

```bash
cd backend
npm run db:setup
```

## 2. Backend

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:4000` — health: `GET /api/health`

Credentials are in `backend/.env` (`root` / empty password / `hub_1`).

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` — `/api` is proxied to the backend.

## Deploying to Netlify

Netlify serves the React app and runs the Express API as one serverless function
([`backend/netlify/functions/api.ts`](backend/netlify/functions/api.ts)) behind `/api/*`.
The database must be reachable from the internet (e.g. TiDB Cloud). All build settings
live in [`netlify.toml`](netlify.toml).

1. Seed the hosted database once from your machine: put its credentials in `backend/.env`
   and run `npm run db:setup` in `backend/`.
2. Netlify → **Add new site → Import an existing project** → pick this repo
   (leave base directory empty; build command and publish folder come from `netlify.toml`).
3. **Site configuration → Environment variables** → add `DB_HOST`, `DB_PORT`, `DB_USER`,
   `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`, `ADMIN_USER`, `ADMIN_PASSWORD`,
   `ADMIN_SECRET` (long random string) and `GOOGLE_MAPS_API_KEY`.
4. Deploy, then check `https://<site>.netlify.app/api/health` returns `{ "ok": true }`.

On Netlify, admin-uploaded room photos are stored in Netlify Blobs (store `uploads`);
locally they are still written to `backend/uploads/`.

To point the Android app at the live site, set `server.url` in
[`mobile/capacitor.config.json`](mobile/capacitor.config.json) to your `https://<site>.netlify.app/`.

## Features

- Rooms filtered by couples / family / friends and member count
- Vehicles: bike, scooter, car — with or without driver
- Boating: seats, time slots, routes
- Cafés / restaurants / roadside with **Open now**
- Beaches with best visit time and seafood spots
- Bars with open/close times
- Food street & White Town photo galleries
- Mock booking confirmations stored in MySQL (no payments)
