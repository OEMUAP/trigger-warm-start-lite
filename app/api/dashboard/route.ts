import { NextRequest, NextResponse } from "next/server";
import { waitingRunners, recentMatches, config, getStats, clearRecentMatches } from "@/lib/state";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10)));

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

  // Paginate recent matches
  const totalMatches = recentMatches.length;
  const totalPages = Math.ceil(totalMatches / limit);
  const offset = (page - 1) * limit;
  const paginatedMatches = recentMatches.slice(offset, offset + limit);

  return NextResponse.json({
    runners,
    recentMatches: paginatedMatches,
    pagination: {
      page,
      limit,
      totalMatches,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    config,
    stats: getStats(),
    timestamp: now,
  });
}

export async function DELETE() {
  clearRecentMatches();
  return NextResponse.json({ success: true, message: "Recent matches cleared" });
}
