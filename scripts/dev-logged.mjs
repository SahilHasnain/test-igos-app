#!/usr/bin/env node
/**
 * Wraps `next dev` and tee's all stdout+stderr to logs/dev.log.
 * Usage: node scripts/dev-logged.mjs [--port 3000]
 *
 * The log file is truncated on each run so I can just read it.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LOG_DIR = join(ROOT, "logs");
const LOG_FILE = join(LOG_DIR, "dev.log");

mkdirSync(LOG_DIR, { recursive: true });
writeFileSync(LOG_FILE, ""); // truncate

const args = process.argv.slice(2);
const child = spawn("npx", ["next", "dev", ...args], {
  cwd: ROOT,
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
  env: { ...process.env },
});

const ts = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const stamp = (chunk) => {
  const line = chunk.toString();
  const tagged = line
    .split("\n")
    .map((l) => (l.trim() ? `[${ts()}] ${l}` : l))
    .join("\n");
  appendFileSync(LOG_FILE, tagged);
  process.stdout.write(tagged);
};

child.stdout.on("data", stamp);
child.stderr.on("data", stamp);

child.on("close", (code) => {
  const msg = `\n[${ts()}] Process exited with code ${code}\n`;
  appendFileSync(LOG_FILE, msg);
  process.stdout.write(msg);
  process.exit(code ?? 1);
});
