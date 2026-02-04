FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public

FROM node:20-slim
WORKDIR /app
USER node
COPY --from=build --chown=node:node /app/.next/standalone ./
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]
