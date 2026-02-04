# Warm Start Service

A standalone warm start matchmaking service for Trigger.dev runners built with Next.js.

## Quick Start

```bash
npm install
npm run dev
```

Dashboard: http://localhost:8080

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/connect` | GET | Timeout config |
| `/api/warm-start` | GET | Long-poll for runners |
| `/api/warm-start` | POST | Push run for matching |
| `/` | GET | Dashboard UI |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `CONNECTION_TIMEOUT_MS` | 30000 | Per-request timeout |
| `KEEPALIVE_MS` | 300000 | Max idle wait (5 min) |

## Docker

```bash
docker build -t warm-start-service .
docker run -p 8080:8080 warm-start-service
```
