# Next.js 15 production image (standalone output). Build args must match docker-compose.yml.
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG API_UPSTREAM_URL=http://ann-backend:3000
ENV API_UPSTREAM_URL=${API_UPSTREAM_URL}

ARG NEXT_PUBLIC_NEST_SOCKET_ORIGIN
ENV NEXT_PUBLIC_NEST_SOCKET_ORIGIN=${NEXT_PUBLIC_NEST_SOCKET_ORIGIN}

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

ARG NEXT_PUBLIC_ANN_CLIENT_NAME=ann
ENV NEXT_PUBLIC_ANN_CLIENT_NAME=${NEXT_PUBLIC_ANN_CLIENT_NAME}

ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

ARG NEXT_PUBLIC_SOCKET_IO_UPGRADE=true
ENV NEXT_PUBLIC_SOCKET_IO_UPGRADE=${NEXT_PUBLIC_SOCKET_IO_UPGRADE}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3003
ENV PORT=3003
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
