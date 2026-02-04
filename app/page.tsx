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

interface MatchedRun {
  runId: string;
  controllerId: string;
  workerInstanceName: string;
  deploymentKey: string;
  matchedAt: number;
  waitDurationMs: number;
}

interface DashboardData {
  runners: RunnerData[];
  recentMatches: MatchedRun[];
  config: { connectionTimeoutMs: number; keepaliveMs: number; port: number; host: string };
  stats: { totalRunners: number; totalDeployments: number; totalMatches: number };
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

  const getRunnerId = (runner: RunnerData, idx: number) =>
    `${runner.controllerId}-${runner.workerInstanceName}-${idx}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard");
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
  }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background-secondary border border-border rounded-lg p-4">
            <div className="text-foreground-muted text-xs uppercase tracking-wide">Idle Runners</div>
            <div className="text-3xl font-bold text-foreground mt-1">{data.stats.totalRunners}</div>
          </div>
          <div className="bg-background-secondary border border-border rounded-lg p-4">
            <div className="text-foreground-muted text-xs uppercase tracking-wide">Deployments</div>
            <div className="text-3xl font-bold text-foreground mt-1">{data.stats.totalDeployments}</div>
          </div>
          <div className="bg-background-secondary border border-border rounded-lg p-4">
            <div className="text-foreground-muted text-xs uppercase tracking-wide">Recent Matches</div>
            <div className="text-3xl font-bold text-foreground mt-1">{data.stats.totalMatches}</div>
          </div>
        </div>

        {/* Waiting Runners Table */}
        <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Idle Runners</h2>
            <p className="text-foreground-muted text-sm">Runners waiting for work via long-poll</p>
          </div>
          {data.runners.length === 0 ? (
            <div className="p-8 text-center text-foreground-muted">
              <div className="text-4xl mb-2">🏃</div>
              <div>No idle runners currently waiting</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-tertiary">
                  <tr>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3 w-10">Info</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Controller ID</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Instance</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Deployment</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Version</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Machine</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Waiting</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Connected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.runners.map((runner, idx) => {
                    const runnerId = getRunnerId(runner, idx);
                    const isExpanded = expandedRunners.has(runnerId);
                    return (
                      <Fragment key={runnerId}>
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
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{runner.controllerId}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{runner.workerInstanceName}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{runner.deploymentId}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{runner.deploymentVersion}</td>
                          <td className="px-4 py-3 text-sm text-foreground-muted">{runner.machineCpu} CPU / {runner.machineMemory} GB</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={runner.waitingDurationMs > 60000 ? "text-yellow-500" : "text-accent"}>
                              {formatDuration(runner.waitingDurationMs)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground-muted">{formatTime(runner.connectedAt)}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-background-tertiary/30">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="bg-background border border-border rounded-lg p-4 font-mono text-xs">
                                <div className="text-foreground-muted mb-2 text-sm font-semibold">Runner Log Info</div>
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
                                    <div><span className="text-foreground">status:</span> <span className="text-accent">IDLE (long-polling)</span></div>
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
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Recent Matches</h2>
            <p className="text-foreground-muted text-sm">Successfully matched runs to idle runners</p>
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
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Run ID</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Controller</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Instance</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Deployment</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Wait Time</th>
                    <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wide px-4 py-3">Matched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentMatches.map((match, idx) => (
                    <tr key={`${match.runId}-${idx}`} className="hover:bg-background-tertiary/50">
                      <td className="px-4 py-3 font-mono text-sm text-foreground">{match.runId}</td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{match.controllerId}</td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground-muted">{match.workerInstanceName}</td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground">{match.deploymentKey}</td>
                      <td className="px-4 py-3 text-sm text-accent">{formatDuration(match.waitDurationMs)}</td>
                      <td className="px-4 py-3 text-sm text-foreground-muted">{formatTime(match.matchedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-foreground-muted text-sm">
          <p>Trigger.dev Warm Start Service</p>
        </div>
      </div>
    </div>
  );
}
