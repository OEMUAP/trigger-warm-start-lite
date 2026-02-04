FROM node:20-slim AS base
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# --- Build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Production ---
FROM base AS production
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV CONNECTION_TIMEOUT_MS=30000
ENV KEEPALIVE_MS=300000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 8080

CMD ["node", "server.js"]
