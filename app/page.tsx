"use client";

import { Fragment, useEffect, useState } from "react";

interface RunnerData {
  deploymentId: string;
  deploymentVersion: string;
  machineCpu: string;
  machineMemory: string;
  controllerId: string;
  workerInstanceName: string;
  connectedAt: number;
  waitingDurationMs: number;
}

interface ExecutingRunnerData {
  controllerId: string;
  workerInstanceName: string;
  deploymentId: string;
  deploymentVersion: string;
  machineCpu: string;
  machineMemory: string;
  runId: string;
  matchedAt: number;
  executingDurationMs: number;
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className || "w-5 h-5"}
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronIcon({ expanded, className }: { expanded: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`${className || "w-4 h-4"} transition-transform ${expanded ? "rotate-180" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className || "w-5 h-5"}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className || "w-5 h-5"}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className || "w-5 h-5"}
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface MatchedRun {
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

interface Pagination {
  page: number;
  limit: number;
  totalMatches: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DashboardData {
  runners: RunnerData[];
  executingRunners: ExecutingRunnerData[];
  recentMatches: MatchedRun[];
  pagination: Pagination;
  config: { connectionTimeoutMs: number; keepaliveMs: number; port: number; host: string };
  stats: { totalRunners: number; totalExecutingRunners: number; totalDeployments: number; totalMatches: number; warmStarts: number; coldStarts: number };
  timestamp: number;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRunners, setExpandedRunners] = useState<Set<string>>(new Set());
  const [expandedExecuting, setExpandedExecuting] = useState<Set<string>>(new Set());
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const toggleRunnerInfo = (runnerId: string) => {
    setExpandedRunners((prev) => {
      const next = new Set(prev);
      if (next.has(runnerId)) {
        next.delete(runnerId);
      } else {
        next.add(runnerId);
      }
      return next;
    });
  };

  const toggleMatchInfo = (matchId: string) => {
    setExpandedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  };

  const toggleExecutingInfo = (runnerId: string) => {
    setExpandedExecuting((prev) => {
      const next = new Set(prev);
      if (next.has(runnerId)) {
        next.delete(runnerId);
      } else {
        next.add(runnerId);
      }
      return next;
    });
  };

  const getExecutingId = (runner: ExecutingRunnerData, idx: number) =>
    `${runner.controllerId}-${runner.runId}-${idx}`;

  const getRunnerId = (runner: RunnerData, idx: number) =>
    `${runner.controllerId}-${runner.workerInstanceName}-${idx}`;

  const getMatchId = (match: MatchedRun, idx: number) =>
    `${match.runId}-${match.matchedAt}-${idx}`;

  const clearMatches = async () => {
    setClearing(true);
    try {
      await fetch("/api/dashboard", { method: "DELETE" });
      setPage(1);
    } catch (err) {
      console.error("Failed to clear matches:", err);
    } finally {
      setClearing(false);
      setShowClearModal(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard?page=${page}&limit=100`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [page]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              Warm Start Service
            </h1>
            <p className="text-foreground-muted text-sm mt-1">
              Real-time runner matchmaking dashboard
            </p>
          </div>
          <div className="text-right text-sm text-foreground-muted">
            <div>Last updated: {formatTime(data.timestamp)}</div>
            <div className="text-accent">Auto-refresh: 2s</div>
          </div>
        </div>

        {/* Config Card */}
        <div className="bg-background-secondary border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-foreground-muted text-xs uppercase tracking-wide">Host</div>
              <div className="text-foreground font-mono">{data.config.host}:{data.config.port}</div>
            </div>
            <div>
              <div className="text-foreground-muted text-xs uppercase tracking-wide">Connection Timeout</div>
              <div className="text-foreground font-mono">{formatDuration(data.config.connectionTimeoutMs)}</div>
            </div>
            <div>
              <div className="text-foreground-muted text-xs uppercase tracking-wide">Keepalive</div>
              <div className="text-foreground font-mono">{formatDuration(data.config.keepaliveMs)}</div>
            </div>
            <div>
              <div className="text-foreground-muted text-xs uppercase tracking-wide">Status</div>
              <div className="text-accent font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-background-secondary border border-border rounded-lg p-4">
            <div className="text-foreground-muted text-xs uppercase tracking-wide">Waiting</div>
            <div className="text-3xl font-bold text-yellow-500 mt-1">{data.stats.totalRunners}</div>
          </div>
          <div className="bg-background-secondary border border-border rounded-lg p-4">
            <div className="text-foreground-muted text-xs uppercase tracking-wide">Executing</div>
            <div className="text-3xl font-bold text-blue-500 mt-1">{data.stats.totalExecutingRunners}</div>
          </div>
          <div className="bg-background-secondary border border-border rounded-lg p-4">
            <div className="text-foreground-muted text-xs uppercase tracking-wide">Deployments</div>
            <div className="text-3xl font-bold text-foreground mt-1">{data.stats.totalDeployments}</div>
          </div>
          <div className="bg-background-secondary border border-border rounded-lg p-4">
            <div className="text-foreground-muted text-xs uppercase tracking-wide">Total Matches</div>
            <div className="text-3xl font-bold text-foreground mt-1">{data.stats.totalMatches}</div>
          </div>
          <div className="bg-background-secondary border border-border rounded-lg p-4">
            <div className="text-foreground-muted text-xs uppercase tracking-wide">Warm Starts</div>
            <div className="text-3xl font-bold text-green-500 mt-1">{data.stats.warmStarts}</div>
          </div>
          <div className="bg-background-secondary border border-border rounded-lg p-4">
            <div className="text-foreground-muted text-xs uppercase tracking-wide">Cold Starts</div>
            <div className="text-3xl font-bold text-red-500 mt-1">{data.stats.coldStarts}</div>
          </div>
        </div>

        {/* Active Runners Table */}
        <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Active Runners</h2>
            <p className="text-foreground-muted text-sm">Runners currently waiting or executing tasks</p>
          </div>
          {data.runners.length === 0 && data.executingRunners.length === 0 ? (
            <div className="p-8 text-center text-foreground-muted">
              <div className="text-4xl mb-2">🏃</div>
              <div>No active runners</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-tertiary">
                  <tr>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3 w-10">Info</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Controller ID</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Instance</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Deployment</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Run ID</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Machine</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Executing Runners */}
                  {data.executingRunners.map((runner, idx) => {
                    const runnerId = getExecutingId(runner, idx);
                    const isExpanded = expandedExecuting.has(runnerId);
                    return (
                      <Fragment key={`exec-${runnerId}`}>
                        <tr className="hover:bg-background-tertiary/50 bg-blue-500/5">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleExecutingInfo(runnerId)}
                              className="p-1 rounded hover:bg-background-tertiary text-foreground-muted hover:text-accent transition-colors"
                              title="View runner details"
                            >
                              {isExpanded ? (
                                <ChevronIcon expanded={isExpanded} className="w-5 h-5" />
                              ) : (
                                <InfoIcon className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                              Executing
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{runner.controllerId}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{runner.workerInstanceName}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{runner.deploymentId}:{runner.deploymentVersion}</td>
                          <td className="px-4 py-3 font-mono text-sm text-accent">{runner.runId}</td>
                          <td className="px-4 py-3 text-sm text-foreground-muted">{runner.machineCpu} CPU / {runner.machineMemory} GB</td>
                          <td className="px-4 py-3 text-sm text-blue-400">{formatDuration(runner.executingDurationMs)}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-background-tertiary/30">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="bg-background border border-border rounded-lg p-4 font-mono text-xs">
                                <div className="text-foreground-muted mb-2 text-sm font-semibold">Executing Runner Details</div>
                                <div className="space-y-1 text-foreground-muted">
                                  <div><span className="text-accent">controller_id:</span> {runner.controllerId}</div>
                                  <div><span className="text-accent">worker_instance_name:</span> {runner.workerInstanceName}</div>
                                  <div><span className="text-accent">deployment_id:</span> {runner.deploymentId}</div>
                                  <div><span className="text-accent">deployment_version:</span> {runner.deploymentVersion}</div>
                                  <div><span className="text-accent">run_id:</span> {runner.runId}</div>
                                  <div><span className="text-accent">machine_cpu:</span> {runner.machineCpu}</div>
                                  <div><span className="text-accent">machine_memory:</span> {runner.machineMemory} GB</div>
                                  <div className="border-t border-border my-2 pt-2">
                                    <div><span className="text-foreground">matched_at:</span> {new Date(runner.matchedAt).toISOString()}</div>
                                    <div><span className="text-foreground">executing_duration:</span> {runner.executingDurationMs}ms ({formatDuration(runner.executingDurationMs)})</div>
                                    <div><span className="text-foreground">status:</span> <span className="text-blue-400">EXECUTING</span></div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {/* Waiting Runners */}
                  {data.runners.map((runner, idx) => {
                    const runnerId = getRunnerId(runner, idx);
                    const isExpanded = expandedRunners.has(runnerId);
                    return (
                      <Fragment key={`wait-${runnerId}`}>
                        <tr className="hover:bg-background-tertiary/50">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleRunnerInfo(runnerId)}
                              className="p-1 rounded hover:bg-background-tertiary text-foreground-muted hover:text-accent transition-colors"
                              title="View runner details"
                            >
                              {isExpanded ? (
                                <ChevronIcon expanded={isExpanded} className="w-5 h-5" />
                              ) : (
                                <InfoIcon className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                              Waiting
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{runner.controllerId}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{runner.workerInstanceName}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{runner.deploymentId}:{runner.deploymentVersion}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground-muted">-</td>
                          <td className="px-4 py-3 text-sm text-foreground-muted">{runner.machineCpu} CPU / {runner.machineMemory} GB</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={runner.waitingDurationMs > 60000 ? "text-yellow-500" : "text-yellow-400"}>
                              {formatDuration(runner.waitingDurationMs)}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-background-tertiary/30">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="bg-background border border-border rounded-lg p-4 font-mono text-xs">
                                <div className="text-foreground-muted mb-2 text-sm font-semibold">Waiting Runner Details</div>
                                <div className="space-y-1 text-foreground-muted">
                                  <div><span className="text-accent">x-trigger-workload-controller-id:</span> {runner.controllerId}</div>
                                  <div><span className="text-accent">x-trigger-deployment-id:</span> {runner.deploymentId}</div>
                                  <div><span className="text-accent">x-trigger-deployment-version:</span> {runner.deploymentVersion}</div>
                                  <div><span className="text-accent">x-trigger-machine-cpu:</span> {runner.machineCpu}</div>
                                  <div><span className="text-accent">x-trigger-machine-memory:</span> {runner.machineMemory}</div>
                                  <div><span className="text-accent">x-trigger-worker-instance-name:</span> {runner.workerInstanceName}</div>
                                  <div className="border-t border-border my-2 pt-2">
                                    <div><span className="text-foreground">deployment_key:</span> {runner.deploymentId}:{runner.deploymentVersion}</div>
                                    <div><span className="text-foreground">connected_at:</span> {new Date(runner.connectedAt).toISOString()}</div>
                                    <div><span className="text-foreground">waiting_duration:</span> {runner.waitingDurationMs}ms ({formatDuration(runner.waitingDurationMs)})</div>
                                    <div><span className="text-foreground">status:</span> <span className="text-yellow-400">WAITING (long-polling)</span></div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Matches Table */}
        <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent Matches</h2>
              <p className="text-foreground-muted text-sm">Warm starts and cold starts (no idle runner)</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Pagination in header */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setPage(1)}
                    disabled={!data.pagination.hasPrevPage}
                    className="px-2.5 py-1 text-xs font-medium bg-background-tertiary text-foreground-muted rounded-l border border-border hover:bg-background hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!data.pagination.hasPrevPage}
                    className="px-2.5 py-1 text-xs font-medium bg-background-tertiary text-foreground-muted border-y border-border hover:bg-background hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold bg-background text-foreground border border-border">
                    {data.pagination.page} / {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data.pagination.hasNextPage}
                    className="px-2.5 py-1 text-xs font-medium bg-background-tertiary text-foreground-muted border-y border-border hover:bg-background hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPage(data.pagination.totalPages)}
                    disabled={!data.pagination.hasNextPage}
                    className="px-2.5 py-1 text-xs font-medium bg-background-tertiary text-foreground-muted rounded-r border border-border hover:bg-background hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowClearModal(true)}
                disabled={clearing || data.recentMatches.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                {clearing ? "Clearing..." : "Clear All"}
              </button>
            </div>
          </div>
          {data.recentMatches.length === 0 ? (
            <div className="p-8 text-center text-foreground-muted">
              <div className="text-4xl mb-2">🎯</div>
              <div>No matches yet</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-tertiary">
                  <tr>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3 w-10">Status</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3 w-10">Info</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Run ID</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Controller</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Instance</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Deployment</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Wait Time</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentMatches.map((match, idx) => {
                    const matchId = getMatchId(match, idx);
                    const isExpanded = expandedMatches.has(matchId);
                    return (
                      <Fragment key={matchId}>
                        <tr className={`hover:bg-background-tertiary/50 ${!match.success ? "bg-red-500/5" : ""}`}>
                          <td className="px-4 py-3">
                            {match.success ? (
                              <CheckIcon className="w-5 h-5 text-green-500" />
                            ) : (
                              <XIcon className="w-5 h-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleMatchInfo(matchId)}
                              className="p-1 rounded hover:bg-background-tertiary text-foreground-muted hover:text-accent transition-colors"
                              title="View match details"
                            >
                              {isExpanded ? (
                                <ChevronIcon expanded={isExpanded} className="w-5 h-5" />
                              ) : (
                                <InfoIcon className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{match.runId}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{match.controllerId || "-"}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{match.workerInstanceName || "-"}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{match.deploymentKey}</td>
                          <td className="px-4 py-3 text-sm text-accent">{match.success ? formatDuration(match.waitDurationMs) : "-"}</td>
                          <td className="px-4 py-3 text-sm text-foreground-muted">{formatTime(match.matchedAt)}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-background-tertiary/30">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="bg-background border border-border rounded-lg p-4 font-mono text-xs">
                                <div className="text-foreground-muted mb-2 text-sm font-semibold">
                                  {match.success ? "Warm Start Details" : "Cold Start Details (No Idle Runner)"}
                                </div>
                                <div className="space-y-1 text-foreground-muted">
                                  <div><span className="text-accent">run_id:</span> {match.runId}</div>
                                  <div><span className="text-accent">status:</span> <span className={match.success ? "text-green-500" : "text-red-500"}>{match.success ? "WARM START" : "COLD START"}</span></div>
                                  {match.success && (
                                    <>
                                      <div><span className="text-accent">controller_id:</span> {match.controllerId}</div>
                                      <div><span className="text-accent">worker_instance_name:</span> {match.workerInstanceName}</div>
                                    </>
                                  )}
                                  <div><span className="text-accent">deployment_key:</span> {match.deploymentKey}</div>
                                  <div><span className="text-accent">machine_cpu:</span> {match.machineCpu}</div>
                                  <div><span className="text-accent">machine_memory:</span> {match.machineMemory} GB</div>
                                  <div className="border-t border-border my-2 pt-2">
                                    <div><span className="text-foreground">timestamp:</span> {new Date(match.matchedAt).toISOString()}</div>
                                    {match.success && (
                                      <div><span className="text-foreground">wait_duration:</span> {match.waitDurationMs}ms ({formatDuration(match.waitDurationMs)})</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Footer with pagination */}
          {data.pagination.totalMatches > 0 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-foreground-muted">
                Showing <span className="font-medium text-foreground">{((data.pagination.page - 1) * data.pagination.limit) + 1}</span> - <span className="font-medium text-foreground">{Math.min(data.pagination.page * data.pagination.limit, data.pagination.totalMatches)}</span> of <span className="font-medium text-foreground">{data.pagination.totalMatches.toLocaleString()}</span> matches
              </div>
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(1)}
                    disabled={!data.pagination.hasPrevPage}
                    className="px-3 py-1.5 text-sm font-medium bg-background-tertiary text-foreground rounded-l-lg border border-border hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!data.pagination.hasPrevPage}
                    className="px-3 py-1.5 text-sm font-medium bg-background-tertiary text-foreground border-y border-border hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="px-4 py-1.5 text-sm font-medium bg-background text-foreground border border-border">
                    {data.pagination.page} / {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data.pagination.hasNextPage}
                    className="px-3 py-1.5 text-sm font-medium bg-background-tertiary text-foreground border-y border-border hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPage(data.pagination.totalPages)}
                    disabled={!data.pagination.hasNextPage}
                    className="px-3 py-1.5 text-sm font-medium bg-background-tertiary text-foreground rounded-r-lg border border-border hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-foreground-muted text-sm">
          <p>Trigger.dev Warm Start Service</p>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Clear All Matches?</h3>
            <p className="text-foreground-muted text-sm mb-6">
              This will clear all recent match history from the cache. The warm start and cold start counters will be preserved until the service restarts.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="px-4 py-2 text-sm bg-background-tertiary text-foreground rounded-lg hover:bg-background transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={clearMatches}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" />
                {clearing ? "Clearing..." : "Clear All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
