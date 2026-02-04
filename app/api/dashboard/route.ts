import { NextResponse } from "next/server";
import { waitingRunners, recentMatches, config, getStats } from "@/lib/state";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  const runners = [];

  for (const [key, runnerList] of waitingRunners.entries()) {
    for (const runner of runnerList) {
      runners.push({
        deploymentId: runner.deploymentId,
        deploymentVersion: runner.deploymentVersion,
        machineCpu: runner.machineCpu,
        machineMemory: runner.machineMemory,
        controllerId: runner.controllerId,
        workerInstanceName: runner.workerInstanceName,
        connectedAt: runner.connectedAt,
        waitingDurationMs: now - runner.connectedAt,
      });
    }
  }

  // Sort by waiting duration (longest first)
  runners.sort((a, b) => b.waitingDurationMs - a.waitingDurationMs);

  return NextResponse.json({
    runners,
    recentMatches: recentMatches.slice(0, 50),
    config,
    stats: getStats(),
    timestamp: now,
  });
}
