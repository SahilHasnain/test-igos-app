#!/usr/bin/env node
/**
 * Creates JWT for DPO user via admin API, then runs check-api.mjs.
 * Usage: node scripts/check-api-auth.mjs
 */

const ENDPOINT = "https://hostsuite.teamhup.com/v1";
const PROJECT_ID = "6a634bef0032eadf6e46";
const API_KEY = "standard_4c0d03a816b20a8eaa0fa650454bff2f7270eca013b837b98f28e8eb5c02071a5d8da2ed2a8b56b9e23d686d48c66bfa9df928843f3aeba9f664cf86a95a8b18a100619a4df906bba879b97384f95bcfaf64847eb9f029607d453ef9350d259df5ee73152d38f8b8c16ded414b45951ad6301314b8a50cd7bdc8ea008db561b4";

// Step 1: Find user ID from email
console.log("Looking up DPO user...");
const usersRes = await fetch(`${ENDPOINT}/users?search=dpo@rosa-federation.igos.local`, {
  headers: { "x-appwrite-project": PROJECT_ID, "x-appwrite-key": API_KEY },
});
const usersData = await usersRes.json();
const user = usersData.users?.[0];
if (!user) { console.error("User not found"); process.exit(1); }
console.log(`Found user: ${user.email} (${user.$id})`);

// Step 2: Create JWT via admin API
console.log("Creating JWT...");
const jwtRes = await fetch(`${ENDPOINT}/users/${user.$id}/jwts`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-appwrite-project": PROJECT_ID, "x-appwrite-key": API_KEY },
});
const jwtData = await jwtRes.json();
if (jwtRes.status !== 201) {
  console.error("JWT creation failed:", jwtData.message || JSON.stringify(jwtData));
  process.exit(1);
}
const jwt = jwtData.jwt;
console.log(`JWT obtained (${jwt.length} chars)\n`);

// Step 3: Run check-api with JWT
const { execSync } = await import("node:child_process");
execSync(`node scripts/check-api.mjs "${jwt}"`, { stdio: "inherit", cwd: process.cwd() });
