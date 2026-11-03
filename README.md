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
The database must be reachable from the internet (e.g. TiDB Cloud / PlanetScale /
Aiven). Build settings live in [`netlify.toml`](netlify.toml) (root of the repo —
leave Netlify **base directory** empty).

1. Seed / migrate the hosted database once from your machine: put its credentials in
   `backend/.env` (with `DB_SSL=true` if required) and run `npm run db:setup` in
   `backend/`. On first API boot Netlify also runs `ensureSchema()` (adds `guide`,
   owner tables, etc. if missing).
2. Netlify → **Add new site → Import an existing project** → pick this repo
   (or connect the `deploy` branch). Base directory: empty. Build command and publish
   folder come from `netlify.toml`.
3. **Site configuration → Environment variables** (Production + Deploy previews):

   | Variable | Notes |
   | --- | --- |
   | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Hosted MySQL |
   | `DB_SSL` | `true` for most cloud MySQL |
   | `ADMIN_USER`, `ADMIN_PASSWORD` | Bootstrap first `super_admin` only |
   | `ADMIN_SECRET` | Long random string (signs login tokens) |
   | `CUSTOMER_DEFAULT_PASSWORD` | e.g. `Pondy@123` |
   | `GOOGLE_MAPS_API_KEY` | Optional — server Place Photos / ratings |
   | `VITE_GOOGLE_MAPS_API_KEY` | Optional — owner map picker (build-time) |

4. Trigger a deploy (push to the connected branch or **Deploy site**). Then check
   `https://<site>.netlify.app/api/health` returns `{ "ok": true }`.
5. Smoke-test `/guide`, `/owner/register`, and `/admin` (super admin → Guide tab).

Admin login is stored in the `users` table (not hard-coded). The first API start creates a
`super_admin` from `ADMIN_USER` / `ADMIN_PASSWORD`. That super admin can create more admins
from the dashboard **Admins** tab and edit the public guest guide.

On Netlify, admin-uploaded room photos are stored in Netlify Blobs (store `uploads`);
locally they are still written to `backend/uploads/`.

### Room owners

- Register at `/owner/register` (pick a listed room or a Google Maps location).
- Admin **Owners** tab → Accept / Reject; **Reset password** restores `Pondy@123` and
  forces a new password on next login.
- Approved owners sign in at `/owner/login`, then manage rooms at `/owner`.
- Owner-created rooms stay `pending` until admin publishes them (Owners tab → Rooms
  awaiting publish).

## Android app (Google Play)

[`mobile/`](mobile/) is a Capacitor 8 wrapper (`com.pondytripora.app`) that loads the URL in
`server.url` of [`mobile/capacitor.config.json`](mobile/capacitor.config.json).

Release builds are signed with the upload key `mobile/android/pondytripora-upload.jks`, whose
passwords live in `mobile/android/keystore.properties`. Both are git-ignored — back them up;
every future Play update must be signed with the same key.

1. Bump `versionCode` (and `versionName`) in `mobile/android/app/build.gradle`.
2. `cd mobile && npm run aab` (needs JDK 21+ as `JAVA_HOME`).
3. Upload `mobile/android/app/build/outputs/bundle/release/app-release.aab` in Play Console.

## Features

- Rooms filtered by couples / family / friends and member count
- Vehicles: bike, scooter, car — with or without driver
- Boating: seats, time slots, routes
- Cafés / restaurants / roadside with **Open now**
- Beaches with best visit time and seafood spots
- Bars with open/close times
- Food street & White Town photo galleries
- Mock booking confirmations stored in MySQL (no payments)
- Room-owner registration with admin approval, password change/reset, and pending listings
