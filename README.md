# America Needs Nursing

Monorepo for the **America Needs Nursing** platform: a **Next.js** web app and **NestJS** API with PostgreSQL, Redis, TypeORM, background jobs (BullMQ), Stripe, and real-time chat (Socket.IO).

## Contents

- [Packages](#packages)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Deployment](#deployment)
- [Further reading](#further-reading)

## Packages

- **Frontend** — [`front-end/`](front-end/) — Next.js 15 (App Router), Tailwind; npm package `ann-frontend`.
- **Backend** — [`ann-backend/`](ann-backend/) — NestJS 11 API; npm package `ann-backend`.

## Prerequisites

- **Node.js** — use a current LTS (project Dockerfiles use Node 22).
- **npm** — install dependencies in each package directory.
- **Docker** — optional but recommended for local PostgreSQL, Redis, and pgAdmin via Compose.

## Local development

### 1. Database and Redis (Docker)

From `ann-backend/`:

```bash
cd ann-backend
cp .env.example .env
# Set DATABASE_PASSWORD and align DATABASE_* with docker-compose (default Postgres port mapping is 5433→5432).
docker compose up -d
```

Compose starts **PostgreSQL** (host port **5433**), **Redis** (**6379**), and **pgAdmin** (**5050**). See [`ann-backend/docker-compose.yml`](ann-backend/docker-compose.yml) and comments in [`.env.example`](ann-backend/.env.example).

### 2. Backend API

```bash
cd ann-backend
npm install
npm run migration:run   # when you need schema updates (see TypeORM scripts in package.json)
npm run start:dev       # default http://localhost:3001
```

Configure `NODE_ENV`, JWT, database, Redis, CORS / `FRONTEND_URL` (local defaults in `.env.example` use **http://localhost:3003** for the Next dev server), email, Stripe, and other settings in `ann-backend/.env` (start from `.env.example`).

### 3. Frontend

```bash
cd front-end
cp .env.example .env
# Optional: use `.env.local` instead — `cp .env.local.example .env.local`
# Defaults target local Nest at http://127.0.0.1:3001 (see `NEXT_PUBLIC_API_BASE_URL`).
npm install
npm run dev             # http://localhost:3003
```

The app talks to Nest via **`NEXT_PUBLIC_API_BASE_URL`** (browser + server) or same-origin **`/api/nest`** when that is unset. Socket.IO uses the same base URL when socket-specific vars are unset (see `src/lib/api/env.ts`). Details: [`front-end/README.md`](front-end/README.md).

## Deployment

Pushes to **`main`** trigger [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): an SSH job connects to the server, runs `git pull`, `npm install`, and `npm run build` in `ann-backend/` and `front-end/`, then **`pm2 reload ann-backend`** for the API.

Required GitHub **secrets**: `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY`. The workflow assumes the repo lives on the server at **`/var/www/America-Needs-Nursing`** (adjust the workflow if your path differs).

**Docker:** production-oriented images are defined in [`ann-backend/Dockerfile`](ann-backend/Dockerfile) and [`front-end/Dockerfile`](front-end/Dockerfile) for alternative or manual container deploys.

## Further reading

- [Frontend README](front-end/README.md) — env vars, scripts, layout.
- [Backend README](ann-backend/README.md) — Nest CLI commands and tests (starter template; run commands from `ann-backend/`).
