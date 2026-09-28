# Pondy Hub

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

## Features

- Rooms filtered by couples / family / friends and member count
- Vehicles: bike, scooter, car — with or without driver
- Boating: seats, time slots, routes
- Cafés / restaurants / roadside with **Open now**
- Beaches with best visit time and seafood spots
- Bars with open/close times
- Food street & White Town photo galleries
- Mock booking confirmations stored in MySQL (no payments)
