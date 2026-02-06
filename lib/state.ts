// Global state for warm start matching
// Uses global pattern to persist across hot reloads in dev

export interface WaitingRunner {
  controller: ReadableStreamDefaultController<Uint8Array>;
  deploymentId: string;
  deploymentVersion: string;
  machineCpu: string;
  machineMemory: string;
  controllerId: string;
  workerInstanceName: string;
  connectedAt: number;
}

export interface MatchedRun {
  runId: string;
  controllerId: string;
  workerInstanceName: string;
  deploymentKey: string;
  machineCpu: string;
  machineMemory: string;
  matchedAt: number;
  waitDurationMs: number;
  success: boolean;
}

export interface Config {
  connectionTimeoutMs: number;
  keepaliveMs: number;
  port: number;
  host: string;
}

interface MatchCounters {
  warmStarts: number;
  coldStarts: number;
}

declare global {
  var __warmStartState: {
    waitingRunners: Map<string, WaitingRunner[]>;
    recentMatches: MatchedRun[];
    counters: MatchCounters;
    config: Config;
  };
}

if (!global.__warmStartState) {
  global.__warmStartState = {
    waitingRunners: new Map(),
    recentMatches: [],
    counters: {
      warmStarts: 0,
      coldStarts: 0,
    },
    config: {
      connectionTimeoutMs: parseInt(process.env.CONNECTION_TIMEOUT_MS ?? "30000", 10),
      keepaliveMs: parseInt(process.env.KEEPALIVE_MS ?? "300000", 10),
      port: parseInt(process.env.PORT ?? "8080", 10),
      host: process.env.HOST ?? "0.0.0.0",
    },
  };
}

export const waitingRunners = global.__warmStartState.waitingRunners;
export const recentMatches = global.__warmStartState.recentMatches;
export const counters = global.__warmStartState.counters;
export const config = global.__warmStartState.config;

export function warmStartKey(
  deploymentId: string,
  deploymentVersion: string,
  machineCpu: string,
  machineMemory: string
): string {
  return `${deploymentId}:${deploymentVersion}:${machineCpu}:${machineMemory}`;
}

export function removeWaitingRunner(key: string, runner: WaitingRunner): void {
  const runners = waitingRunners.get(key);
  if (!runners) return;
  const index = runners.indexOf(runner);
  if (index !== -1) runners.splice(index, 1);
  if (runners.length === 0) waitingRunners.delete(key);
}

export function getStats() {
  let totalRunners = 0;
  for (const runners of waitingRunners.values()) {
    totalRunners += runners.length;
  }
  return {
    totalRunners,
    totalDeployments: waitingRunners.size,
    recentMatchesCount: recentMatches.length,
    warmStarts: counters.warmStarts,
    coldStarts: counters.coldStarts,
    totalMatches: counters.warmStarts + counters.coldStarts,
  };
}

export function recordMatch(match: MatchedRun, maxRecentMatches: number): void {
  recentMatches.unshift(match);
  if (recentMatches.length > maxRecentMatches) {
    recentMatches.pop();
  }
  if (match.success) {
    counters.warmStarts++;
  } else {
    counters.coldStarts++;
  }
}

export function clearRecentMatches(): void {
  recentMatches.length = 0;
  // Counters persist until app restart
}
