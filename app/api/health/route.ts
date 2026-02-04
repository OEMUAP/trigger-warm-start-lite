import { NextResponse } from "next/server";
import { waitingRunners, getStats } from "@/lib/state";

export async function GET() {
  const stats = getStats();
  return NextResponse.json({
    status: "ok",
    waitingRunners: stats.totalRunners,
    deployments: stats.totalDeployments,
  });
}
