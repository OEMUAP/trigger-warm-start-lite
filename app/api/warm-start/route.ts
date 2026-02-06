import { NextRequest, NextResponse } from "next/server";
import {
  waitingRunners,
  warmStartKey,
  removeWaitingRunner,
  recordMatch,
  type WaitingRunner,
} from "@/lib/state";

const MAX_RECENT_MATCHES = 100000;
const DEBUG = process.env.DEBUG_LOGGING === "true" || process.env.DEBUG_LOGGING === "1";

function debugLog(message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[${new Date().toISOString()}] [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : "");
  }
}

interface DequeuedMessage {
  deployment?: { friendlyId?: string };
  backgroundWorker?: { version?: string };
  run?: {
    friendlyId?: string;
    machine?: { cpu?: number; memory?: number };
  };
  [key: string]: unknown;
}

// GET /api/warm-start - Runner long-polls here while idle
export async function GET(request: NextRequest) {
  const deploymentId = request.headers.get("x-trigger-deployment-id");
  const deploymentVersion = request.headers.get("x-trigger-deployment-version");
  const controllerId = request.headers.get("x-trigger-workload-controller-id");
  const machineCpu = request.headers.get("x-trigger-machine-cpu") ?? "0";
  const machineMemory = request.headers.get("x-trigger-machine-memory") ?? "0";
  const workerInstanceName = request.headers.get("x-trigger-worker-instance-name") ?? "unknown";

  debugLog("GET /warm-start - Runner connecting", {
    deploymentId,
    deploymentVersion,
    controllerId,
    machineCpu,
    machineMemory,
    workerInstanceName,
  });

  if (!deploymentId || !deploymentVersion || !controllerId) {
    debugLog("GET /warm-start - Missing required headers");
    return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
  }

  const key = warmStartKey(deploymentId, deploymentVersion, machineCpu, machineMemory);

  // Create a stream that stays open until we get work or timeout
  const stream = new ReadableStream({
    start(controller) {
      const runner: WaitingRunner = {
        controller,
        deploymentId,
        deploymentVersion,
        machineCpu,
        machineMemory,
        controllerId,
        workerInstanceName,
        connectedAt: Date.now(),
      };

      console.log(
        `[${new Date().toISOString()}] [warm-start] Runner ${controllerId} waiting (${key}, instance: ${workerInstanceName})`
      );

      // Add to waiting runners
      const runners = waitingRunners.get(key) ?? [];
      runners.push(runner);
      waitingRunners.set(key, runners);

      // Cleanup on abort (client disconnect)
      request.signal.addEventListener("abort", () => {
        removeWaitingRunner(key, runner);
        console.log(`[${new Date().toISOString()}] [warm-start] Runner ${controllerId} disconnected (${key})`);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// POST /api/warm-start - Supervisor pushes a dequeued message
export async function POST(request: NextRequest) {
  const body = await request.json();
  const dequeuedMessage: DequeuedMessage = body.dequeuedMessage;

  debugLog("POST /warm-start - Incoming workload", { body });

  if (!dequeuedMessage) {
    debugLog("POST /warm-start - Missing dequeuedMessage");
    return NextResponse.json({ didWarmStart: false, error: "Missing dequeuedMessage" }, { status: 400 });
  }

  const deploymentId = dequeuedMessage.deployment?.friendlyId;
  const deploymentVersion = dequeuedMessage.backgroundWorker?.version;
  const machineCpu = String(dequeuedMessage.run?.machine?.cpu ?? "0");
  const machineMemory = String(dequeuedMessage.run?.machine?.memory ?? "0");

  debugLog("POST /warm-start - Parsed workload", {
    runId: dequeuedMessage.run?.friendlyId,
    deploymentId,
    deploymentVersion,
    machineCpu,
    machineMemory,
  });

  if (!deploymentId) {
    console.log(`[${new Date().toISOString()}] [warm-start] No deployment ID in message`);
    return NextResponse.json({ didWarmStart: false });
  }

  const key = warmStartKey(deploymentId, deploymentVersion ?? "", machineCpu, machineMemory);
  const runners = waitingRunners.get(key);

  debugLog("POST /warm-start - Looking for runners", {
    key,
    availableRunners: runners?.length ?? 0,
    allKeys: Array.from(waitingRunners.keys()),
  });

  if (!runners || runners.length === 0) {
    const runId = dequeuedMessage.run?.friendlyId ?? "unknown";
    console.log(
      `[${new Date().toISOString()}] [warm-start] No idle runners for key: ${key} (cpu: ${machineCpu}, mem: ${machineMemory})`
    );
    debugLog("POST /warm-start - COLD START", { runId, key });
    // Track failed match (cold start)
    recordMatch({
      runId,
      controllerId: "",
      workerInstanceName: "",
      deploymentKey: key,
      machineCpu,
      machineMemory,
      matchedAt: Date.now(),
      waitDurationMs: 0,
      success: false,
    }, MAX_RECENT_MATCHES);
    return NextResponse.json({ didWarmStart: false });
  }

  // FIFO: pick the first idle runner
  const runner = runners.shift()!;
  if (runners.length === 0) {
    waitingRunners.delete(key);
  }

  const waitDurationMs = Date.now() - runner.connectedAt;
  const runId = dequeuedMessage.run?.friendlyId ?? "unknown";

  console.log(
    `[${new Date().toISOString()}] [warm-start] Matched run ${runId} to runner ${runner.controllerId} (waited ${waitDurationMs}ms)`
  );
  debugLog("POST /warm-start - WARM START", {
    runId,
    controllerId: runner.controllerId,
    workerInstanceName: runner.workerInstanceName,
    waitDurationMs,
    remainingRunners: runners.length,
  });

  // Track the match (warm start)
  recordMatch({
    runId,
    controllerId: runner.controllerId,
    workerInstanceName: runner.workerInstanceName,
    deploymentKey: key,
    machineCpu: runner.machineCpu,
    machineMemory: runner.machineMemory,
    matchedAt: Date.now(),
    waitDurationMs,
    success: true,
  }, MAX_RECENT_MATCHES);

  // Send the dequeued message to the waiting runner
  try {
    const encoder = new TextEncoder();
    runner.controller.enqueue(encoder.encode(JSON.stringify(dequeuedMessage)));
    runner.controller.close();
    return NextResponse.json({ didWarmStart: true });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [warm-start] Failed to send message to runner:`, error);
    return NextResponse.json({ didWarmStart: false });
  }
}
