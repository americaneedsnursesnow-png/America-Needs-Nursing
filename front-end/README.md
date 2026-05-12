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
cp .env.local.example .env.local
# Edit .env.local -- especially API_UPSTREAM_URL and NEXT_PUBLIC_SOCKET_ORIGIN.
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

Copy **`.env.local.example`** to **`.env.local`** and adjust. Highlights:

| Variable | Role |
|----------|------|
| `API_UPSTREAM_URL` | Nest URL for the Next **`/api/nest`** proxy and for server-side fetch when `NEXT_PUBLIC_API_BASE_URL` is unset |
| `NEXT_PUBLIC_API_BASE_URL` | If a full **`https://?`** URL, the **browser** calls Nest directly (skips `/api/nest`); requires Nest **`CORS_ORIGINS`** to include your site |
| `NEXT_PUBLIC_SOCKET_ORIGIN` | Nest origin for Socket.IO in the browser |
| `NEXT_PUBLIC_ANN_CLIENT_NAME` | Tenant / client name; must match backend |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js (employer checkout); mode must match backend keys |

In the **browser**, REST uses **`/api/nest`** unless `NEXT_PUBLIC_API_BASE_URL` is a full `http(s)://` URL (see `src/lib/api/env.ts`). Comments in `.env.local.example` explain 503s and Stripe pitfalls.

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
