# CLAUDE.md

Guidance for Claude Code when working with this codebase.

## Project Overview

**Warm Start Service** - A matchmaking service that connects idle Trigger.dev runners to incoming task runs, eliminating container cold boot time.

Built with **Next.js 15** (App Router) + **React 19** + **Tailwind CSS**.

## Architecture

```
┌─────────────────┐     GET /warm-start       ┌──────────────────────┐
│     Runner      │ ─────────────────────────▶│                      │
│  (idle, waiting)│     (long-poll)           │   Warm Start Service │
└─────────────────┘                           │                      │
                                              │  - Next.js 15        │
┌─────────────────┐    POST /warm-start       │  - In-memory state   │
│   Supervisor    │ ─────────────────────────▶│  - Dashboard UI      │
│ (dequeues runs) │     (push run)            │                      │
└─────────────────┘                           └──────────────────────┘
```

## Flow Summary

1. **Runner completes a task** → calls `GET /warm-start` with identity headers
2. **Connection held open** → runner waits for up to `KEEPALIVE_MS` (5 min default)
3. **Supervisor dequeues a run** → calls `POST /warm-start` with the dequeued message
4. **Service matches** by `deploymentId:deploymentVersion` → writes to runner's stream
5. **Runner receives work** → executes the task, then loops back to step 1

## Detailed Flow

### Warm Start Success (Runner Reused)

```
┌────────┐          ┌─────────────────┐          ┌────────────┐
│ Runner │          │ Warm Start Svc  │          │ Supervisor │
└───┬────┘          └────────┬────────┘          └─────┬──────┘
    │                        │                         │
    │  1. GET /warm-start    │                         │
    │  (with identity hdrs)  │                         │
    │───────────────────────>│                         │
    │                        │                         │
    │     [connection held   │                         │
    │      open, waiting]    │                         │
    │                        │                         │
    │                        │   2. POST /warm-start   │
    │                        │   (dequeuedMessage)     │
    │                        │<────────────────────────│
    │                        │                         │
    │                        │   3. Match found!       │
    │                        │   { didWarmStart: true }│
    │                        │────────────────────────>│
    │                        │                         │
    │  4. dequeuedMessage    │                         │
    │  (written to stream)   │                         │
    │<───────────────────────│                         │
    │                        │                         │
    │  5. Execute task       │                         │
    │  ..................    │                         │
    │                        │                         │
    │  6. Loop: GET /warm-start (wait for next task)   │
    │───────────────────────>│                         │
```

### Cold Start (No Idle Runner)

```
┌────────┐          ┌─────────────────┐          ┌────────────┐
│ Runner │          │ Warm Start Svc  │          │ Supervisor │
└───┬────┘          └────────┬────────┘          └─────┬──────┘
    │                        │                         │
    │                        │   1. POST /warm-start   │
    │                        │   (dequeuedMessage)     │
    │                        │<────────────────────────│
    │                        │                         │
    │                        │   2. No match           │
    │                        │   { didWarmStart: false }
    │                        │────────────────────────>│
    │                        │                         │
    │                        │   3. Supervisor creates new container
    │                        │                         │
    │  4. Container starts   │                         │
    │  (cold boot ~2-5s)     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
    │                        │                         │
    │  5. Execute task       │                         │
    │  ..................    │                         │
    │                        │                         │
    │  6. GET /warm-start    │                         │
    │  (now idle, waiting)   │                         │
    │───────────────────────>│                         │
```

### Runner Timeout (No Work Received)

```
┌────────┐          ┌─────────────────┐
│ Runner │          │ Warm Start Svc  │
└───┬────┘          └────────┬────────┘
    │                        │
    │  1. GET /warm-start    │
    │───────────────────────>│
    │                        │
    │     [waiting...]       │
    │     [5 min passes]     │
    │                        │
    │  2. Connection closes  │
    │  (KEEPALIVE_MS timeout)│
    │<───────────────────────│
    │                        │
    │  3. Runner exits       │
    │  (container stops)     │
```

### Complete Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           RUNNER LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  START   │───>│ EXECUTE  │───>│   IDLE   │───>│   EXIT   │          │
│  │(cold boot)│   │  TASK    │    │(long-poll)│   │(timeout) │          │
│  └──────────┘    └──────────┘    └────┬─────┘    └──────────┘          │
│                        ^              │                                 │
│                        │              │ warm start                      │
│                        │              │ match                           │
│                        └──────────────┘                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Internal State Flow

```
1. Runner connects (GET /warm-start):
   ┌─────────────────────────────────────────────────────────┐
   │ waitingRunners.get("dep_abc:v1")                        │
   │   └─> [ runner1, runner2, NEW_RUNNER ]  (push to list)  │
   └─────────────────────────────────────────────────────────┘

2. Supervisor pushes run (POST /warm-start):
   ┌─────────────────────────────────────────────────────────┐
   │ waitingRunners.get("dep_abc:v1")                        │
   │   └─> [ runner1, runner2 ]  (shift first = FIFO)        │
   │                                                         │
   │ runner1.controller.enqueue(dequeuedMessage)             │
   │ runner1.controller.close()                              │
   │                                                         │
   │ recentMatches.unshift({ runId, controllerId, ... })     │
   └─────────────────────────────────────────────────────────┘

3. Runner disconnects:
   ┌─────────────────────────────────────────────────────────┐
   │ request.signal "abort" event triggered                  │
   │   └─> removeWaitingRunner(key, runner)                  │
   └─────────────────────────────────────────────────────────┘
```

## URL Rewrites

The supervisor and runner call `/warm-start`, `/connect`, `/health` (without `/api` prefix).
Next.js rewrites handle this in `next.config.js`:

```js
rewrites() {
  return [
    { source: '/warm-start', destination: '/api/warm-start' },
    { source: '/connect', destination: '/api/connect' },
    { source: '/health', destination: '/api/health' },
  ];
}
```

## File Structure

```
warm-start-service/
├── app/
│   ├── api/
│   │   ├── health/route.ts      # GET health check
│   │   ├── connect/route.ts     # GET timeout config
│   │   ├── warm-start/route.ts  # GET long-poll, POST matching
│   │   └── dashboard/route.ts   # GET dashboard data
│   ├── layout.tsx               # Root layout (dark mode)
│   ├── page.tsx                 # Dashboard UI (client component)
│   └── globals.css
├── lib/
│   └── state.ts                 # Global state (Map + config)
├── next.config.js               # Standalone output + rewrites
├── tailwind.config.ts
└── Dockerfile
```

## Key Implementation

**Long-polling with ReadableStream** (`app/api/warm-start/route.ts`):
- GET creates a ReadableStream, stores controller in `waitingRunners` Map
- POST finds matching runner, writes to its controller, closes stream
- Client disconnect triggers `request.signal.addEventListener("abort")`

**Global State** (`lib/state.ts`):
- Uses `global.__warmStartState` pattern for hot-reload persistence
- `waitingRunners: Map<deploymentId:version, WaitingRunner[]>`
- `recentMatches: MatchedRun[]` (last 50)

**Matching Logic**:
- Key = `${deploymentId}:${deploymentVersion}`
- FIFO: first runner in queue gets the next matching run
- Machine specs don't need matching (runners are deployment-specific)

## Commands

```bash
npm run dev      # Start dev server on :8080
npm run build    # Production build (standalone output)
npm run start    # Start production server
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `CONNECTION_TIMEOUT_MS` | 30000 | Per-request timeout |
| `KEEPALIVE_MS` | 300000 | Max idle wait (5 min) |

## Runner Identity Headers

Runners identify themselves via headers on `GET /warm-start`:

```
x-trigger-deployment-id: dep_abc123
x-trigger-deployment-version: 20240101.1
x-trigger-workload-controller-id: ctrl_xyz789
x-trigger-machine-cpu: 1
x-trigger-machine-memory: 2
x-trigger-worker-instance-name: worker-1
```

## API Request/Response Formats

**GET /connect:**
```json
{ "connectionTimeoutMs": 30000, "keepaliveMs": 300000 }
```

**POST /warm-start request:**
```json
{
  "dequeuedMessage": {
    "deployment": { "friendlyId": "dep_abc123" },
    "backgroundWorker": { "version": "20240101.1" },
    "run": { "friendlyId": "run_xyz789" },
    ...
  }
}
```

**POST /warm-start response:**
```json
{ "didWarmStart": true }  // or false if no match
```

**GET /warm-start (when matched):**
Returns the full `dequeuedMessage` object as stream.

## Testing Locally

```bash
# Terminal 1: Start service
npm run dev

# Terminal 2: Simulate runner waiting
curl -N -H "x-trigger-deployment-id: dep_test" \
       -H "x-trigger-deployment-version: v1" \
       -H "x-trigger-workload-controller-id: ctrl_1" \
       http://localhost:8080/warm-start

# Terminal 3: Push a run (runner receives this)
curl -X POST http://localhost:8080/warm-start \
  -H "Content-Type: application/json" \
  -d '{"dequeuedMessage":{"deployment":{"friendlyId":"dep_test"},"backgroundWorker":{"version":"v1"},"run":{"friendlyId":"run_123"}}}'
```

## Docker

```bash
docker build -t warm-start-service .
docker run -p 8080:8080 warm-start-service
```

Uses Next.js standalone output for minimal image size.

## Notes

- State is in-memory only - restarting loses all waiting runners
- Multiple runners per deployment are stored in a list (FIFO matching)
- Dashboard auto-refreshes every 2 seconds
- Recent matches are capped at 50 entries
