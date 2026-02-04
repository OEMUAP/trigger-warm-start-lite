import { NextResponse } from "next/server";
import { config } from "@/lib/state";

export async function GET() {
  return NextResponse.json({
    connectionTimeoutMs: config.connectionTimeoutMs,
    keepaliveMs: config.keepaliveMs,
  });
}
