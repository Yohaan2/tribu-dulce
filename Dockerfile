# ============================================================
# Stage 1: Instalar dependencias
# ============================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
# Stage 2: Compilar la aplicación
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

ARG JWT_SECRET
ENV JWT_SECRET=${JWT_SECRET}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ============================================================
# Stage 3: Imagen de producción (standalone, mínima)
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tzdata

ENV TZ=America/Caracas
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
