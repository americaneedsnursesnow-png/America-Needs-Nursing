<div align="center">

# America Needs Nursing  Frontend

Next.js (App Router) app for the **ann-frontend** package in the [monorepo root](../README.md).

</div>

---

## Contents

| Section | Description |
|--------|-------------|
| [Requirements](#requirements) | What you need locally |
| [Setup](#setup) | Install and environment |
| [Scripts](#scripts) | npm commands |
| [Environment](#environment) | API proxy and sockets |
| [Project layout](#project-layout) | Where things live |

---

## Requirements

| Tool | Notes |
|------|--------|
| Node.js | Match the version your team uses for Next 15 |
| npm | Package manager for this app |
| `ann-backend` | REST and Socket.IO; run separately for full functionality |

Dev server listens on **port 3003** (see `package.json`). Default Nest API is **3001** (see `ann-backend`).

---

## Setup

```bash
cd front-end
npm install
cp .env.example .env
# Or: `cp .env.local.example .env.local` — set `NEXT_PUBLIC_API_BASE_URL` to your Nest origin (default http://127.0.0.1:3001).
npm run dev
```

Open [http://localhost:3003](http://localhost:3003).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Turbopack (`-p 3003`) |
| `npm run build` | Production build (`prebuild` runs clean) |
| `npm start` | Production server on port 3003 |
| `npm run lint` | ESLint (Next.js config) |
| `npm run check:public-pagination` | Public pagination check script |

---

## Environment

Copy **`.env.example`** to **`.env`**, or **`.env.local.example`** to **`.env.local`**. For local development, **`NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001`** is enough: the browser and server use it for REST and Socket.IO (unless you override with `NEXT_PUBLIC_SOCKET_ORIGIN` or `API_UPSTREAM_URL`). Highlights:

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_API_BASE_URL` | Primary Nest **`http(s)://`** origin (REST + Socket.IO fallback); no trailing slash |
| `API_UPSTREAM_URL` | Optional: overrides the Nest URL for the **`/api/nest`** rewrite and server proxy only |
| `NEXT_PUBLIC_SOCKET_ORIGIN` | Optional: Nest origin for Socket.IO if it differs from `NEXT_PUBLIC_API_BASE_URL` |
| `NEXT_PUBLIC_ANN_CLIENT_NAME` | Tenant / client name; must match backend |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js (employer checkout); mode must match backend keys |

In the **browser**, REST uses **`/api/nest`** unless `NEXT_PUBLIC_API_BASE_URL` is a full `http(s)://` URL (see `src/lib/api/env.ts`).

---

## Project layout

| Path | Purpose |
|------|---------|
| `src/app/` | App Router: marketing routes, `(dashboard)/dashboard/*`, API route handlers |
| `src/components/` | Shared UI (e.g. layout shell, header, footer) |
| `src/config/` | Site copy, navigation |
| `src/features/` | Feature-scoped modules (e.g. home hero) |
| `src/hooks/` | Shared React hooks |
| `src/lib/` | Utilities, API/env helpers |
| `src/types/` | Shared TypeScript types |
| `public/` | Static assets; `public/hero/` (see `public/hero/README.txt`) |

Root layout wraps the app with `ConditionalAppShell` in `src/app/layout.tsx`. Header links come from `src/config/navigation.ts`.

---

## Docker

Production-style image: **`Dockerfile`** in this folder (used with the monorepo deploy scripts).
