# Warm Start Service

A standalone warm start matchmaking service for Trigger.dev runners. Eliminates container cold boot time by reusing idle runner containers.

## How It Works

```
┌─────────────┐     GET /warm-start     ┌─────────────┐
│   Runner    │ ───────────────────────▶│ Warm Start  │
│   (idle)    │◀─────────────────────── │   Service   │
└─────────────┘     (receives run)      └─────────────┘
                                              ▲
┌─────────────┐    POST /warm-start           │
│ Supervisor  │ ──────────────────────────────┘
└─────────────┘     (push dequeued run)
```

1. Runner completes a task → calls `GET /warm-start` (long-poll)
2. Supervisor dequeues a run → calls `POST /warm-start`
3. Service matches by deployment ID/version → returns run to waiting runner
4. Runner executes task → loops back to step 1

## Quick Start

### Using Docker (Recommended)

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/oemuap/warm-start-service:latest

# Run with default settings (port 8080)
docker run -p 8080:8080 ghcr.io/oemuap/warm-start-service:latest

# Run with custom configuration
docker run -p 8080:8080 \
  -e CONNECTION_TIMEOUT_MS=60000 \
  -e KEEPALIVE_MS=600000 \
  ghcr.io/oemuap/warm-start-service:latest

# Optional: Run on a different port (e.g., 3000)
docker run -p 3000:8080 ghcr.io/oemuap/warm-start-service:latest
```

Dashboard: http://localhost:8080 (or your custom port)

### Using Docker Compose

```bash
docker compose up
```

See [docker-compose.yml](docker-compose.yml) for a complete Trigger.dev deployment example.

### Local Development

```bash
npm install
npm run dev
```

## Dashboard

The dashboard provides real-time visibility into:
- Idle runners waiting for work
- Recent matches (run → runner)
- Configuration settings

Access at `http://localhost:<PORT>` (default: 8080)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with stats |
| `/connect` | GET | Timeout configuration |
| `/warm-start` | GET | Long-poll endpoint for runners |
| `/warm-start` | POST | Push dequeued run for matching |
| `/` | GET | Dashboard UI |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `CONNECTION_TIMEOUT_MS` | 30000 | Per-request HTTP timeout |
| `KEEPALIVE_MS` | 300000 | Max idle wait time (5 min) |

## Runner Headers

Runners identify themselves via headers on `GET /warm-start`:

```
x-trigger-deployment-id: dep_abc123
x-trigger-deployment-version: 20240101.1
x-trigger-workload-controller-id: ctrl_xyz789
x-trigger-machine-cpu: 1
x-trigger-machine-memory: 2
x-trigger-worker-instance-name: worker-1
```

## Deployment Recommendations

Deploy one warm-start service instance **per region** or **per supervisor**:

```
Region: us-east-1                    Region: eu-west-1
┌─────────────────────┐              ┌─────────────────────┐
│ warm-start-service  │              │ warm-start-service  │
│    (us-east-1)      │              │    (eu-west-1)      │
└─────────────────────┘              └─────────────────────┘
         ▲                                    ▲
         │                                    │
┌────────┴────────┐              ┌────────────┴────────┐
│   Supervisor    │              │     Supervisor      │
│   + Runners     │              │     + Runners       │
│  (us-east-1)    │              │    (eu-west-1)      │
└─────────────────┘              └─────────────────────┘
```

**Why per-region/per-supervisor?**
- Runners connect via long-poll and must reach the service quickly
- Matching is in-memory; each instance has its own pool of waiting runners
- Low latency between supervisor ↔ warm-start ↔ runners is critical

**Configuration per deployment:**
```bash
# US East supervisor
docker run -p 8080:8080 \
  -e KEEPALIVE_MS=300000 \
  ghcr.io/oemuap/warm-start-service:latest

# EU West supervisor (longer keepalive for fewer cold starts)
docker run -p 8080:8080 \
  -e KEEPALIVE_MS=600000 \
  ghcr.io/oemuap/warm-start-service:latest
```

## Building from Source

```bash
# Build Docker image locally
docker build -t warm-start-service .

# Run locally built image
docker run -p 8080:8080 warm-start-service
```

## License

MIT
