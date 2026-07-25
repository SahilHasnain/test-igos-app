import { NextResponse } from "next/server";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

let logDir = "";
try {
  logDir = join(process.cwd(), "logs");
  mkdirSync(logDir, { recursive: true });
} catch { /* best effort */ }

function logError(method: string, path: string, status: number, error: unknown) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : "";
  const line = `[${ts}] ${status} ${method} ${path} → ${msg}\n${stack ? stack.split("\n").slice(1, 4).join("\n") + "\n" : ""}`;
  try { appendFileSync(join(logDir, "api-errors.log"), line + "\n"); } catch { /* best effort */ }
  console.error(`[API ERROR] ${status} ${method} ${path}: ${msg}`);
}

function statusFromMessage(message: string): number {
  if (message.includes("permission")) return 403;
  if (message.includes("required") || message.includes("membership") || message.includes("outside")) return 400;
  if (message.includes("not found") || message.includes("Not found")) return 404;
  if (message.includes("Invalid") || message.includes("expired") || message.includes("JWT")) return 401;
  return 500;
}

export function apiError(method: string, path: string, cause: unknown) {
  const message = cause instanceof Error ? cause.message : "Unexpected error";
  const status = statusFromMessage(message);
  logError(method, path, status, cause);
  return NextResponse.json({ error: message }, { status });
}

export function apiOk(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

export function parseSearchParams(url: URL, keys: string[]) {
  const result: Record<string, string | undefined> = {};
  for (const key of keys) result[key] = url.searchParams.get(key) ?? undefined;
  return result;
}
