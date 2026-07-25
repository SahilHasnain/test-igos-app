#!/usr/bin/env node
/**
 * Quick API health check — hits every endpoint and prints status + body.
 * Usage: node scripts/check-api.mjs [jwt-token]
 */
const BASE = "http://localhost:3000";
const MAT_ID = "6a63587f00198ae0d719";
const MATTER_ID = "SAR-2026-0178";
const JWT = process.argv[2] || "";

const headers = {};
if (JWT) headers["Authorization"] = `Bearer ${JWT}`;

const endpoints = [
  ["GET",  `/api/health`],
  ["GET",  `/api/matters?matId=${MAT_ID}`],
  ["GET",  `/api/matters`],
  ["GET",  `/api/governance/dpia/${MATTER_ID}?matId=${MAT_ID}`],
  ["GET",  `/api/governance/ropa?matId=${MAT_ID}`],
  ["GET",  `/api/governance/policies?matId=${MAT_ID}`],
  ["GET",  `/api/governance/ai-systems?matId=${MAT_ID}`],
  ["GET",  `/api/governance/assets?matId=${MAT_ID}`],
  ["GET",  `/api/governance/records?matId=${MAT_ID}`],
  ["GET",  `/api/governance/contracts?matId=${MAT_ID}`],
  ["GET",  `/api/governance/suppliers?matId=${MAT_ID}`],
  ["GET",  `/api/redaction?matId=${MAT_ID}&matterId=${MATTER_ID}`],
  ["GET",  `/api/assurance/actions?matId=${MAT_ID}`],
  ["GET",  `/api/assurance/programmes?matId=${MAT_ID}`],
  ["GET",  `/api/assurance/findings?matId=${MAT_ID}`],
  ["GET",  `/api/assurance/risks?matId=${MAT_ID}`],
];

console.log(`\nChecking ${endpoints.length} endpoints${JWT ? " (with JWT)" : " (no auth)"}\n`);

for (const [method, path] of endpoints) {
  try {
    const res = await fetch(`${BASE}${path}`, { method, headers });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
    const ok = res.status >= 200 && res.status < 300;
    const icon = ok ? "✓" : "✗";
    console.log(`${icon} ${res.status} ${method} ${path}`);
    if (ok) {
      const keys = typeof body === "object" && body ? Object.keys(body) : [];
      console.log(`  → ${keys.length ? keys.join(", ") : JSON.stringify(body).slice(0, 120)}`);
    } else {
      console.log(`  → ${typeof body === "string" ? body.slice(0, 200) : JSON.stringify(body)}`);
    }
  } catch (err) {
    console.log(`✗ ERR ${method} ${path}`);
    console.log(`  → ${err.message}`);
  }
}
console.log("");
