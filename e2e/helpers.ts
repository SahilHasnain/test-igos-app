import { type Page, expect } from "@playwright/test";

export const isAppwrite = process.env.IGOS_E2E_MODE === "appwrite";

const APPWRITE_PASSWORD = "Change-Me-2026!";

const APPWRITE_ROLE_EMAILS: Record<string, string> = {
  "dpo": "dpo@rosa-federation.igos.local",
  "mat-admin": "mat-admin@rosa-federation.igos.local",
  "case-manager": "case-manager@rosa-federation.igos.local",
  "academy-lead": "academy-lead@rosa-federation.igos.local",
  "auditor": "auditor@rosa-federation.igos.local",
  "read-only": "readonly@rosa-federation.igos.local",
};

const ROLE_KEY_MAP: Record<string, string> = {
  "DPO": "dpo",
  "MAT administrator": "mat-admin",
  "Case manager": "case-manager",
  "Academy lead": "academy-lead",
  "Auditor": "auditor",
  "Read only": "read-only",
};

export async function login(page: Page, opts?: { role?: string; email?: string; password?: string }) {
  if (isAppwrite) {
    const roleKey = opts?.role ? ROLE_KEY_MAP[opts.role] ?? opts.role : "dpo";
    const email = opts?.email ?? APPWRITE_ROLE_EMAILS[roleKey] ?? "dpo@rosa-federation.igos.local";
    const password = opts?.password ?? APPWRITE_PASSWORD;
    await loginAsAppwrite(page, email, password);
  } else {
    await loginAsDemo(page, opts?.role);
  }
}

export async function loginAsDemo(page: Page, role = "DPO") {
  await page.goto("/login");
  await page.waitForSelector("select");
  await page.selectOption("select", role);
  await page.click("button:has-text('Enter workspace')");
  await page.waitForURL("/");
}

export async function loginAsAppwrite(page: Page, email?: string, password?: string) {
  const e = email ?? "admin@rosa-federation.igos.local";
  const p = password ?? APPWRITE_PASSWORD;
  await page.goto("/login");
  await page.waitForSelector("input[type='email']");
  await page.fill("input[type='email']", e);
  await page.fill("input[type='password']", p);
  await page.click("button:has-text('Sign in')");
  await page.waitForURL("/");
}

export async function waitForApp(page: Page) {
  await page.waitForSelector(".sidebar nav button");
}

export async function navigateTo(page: Page, viewLabel: string) {
  await page.click(`.sidebar nav button:has-text("${viewLabel}")`);
}

export async function signOut(page: Page) {
  await page.click("button[title='Sign out']");
  await page.waitForURL("**/login");
}

export const ALL_SIDEBAR_VIEWS = [
  "Overview", "SARs", "FOI", "Breaches", "DPIAs",
  "ROPA", "Policies", "Redaction", "AI", "Assets",
  "Records", "Contracts", "Assurance", "Risks", "Audits", "Actions",
] as const;

export const ALL_ROLES = [
  "DPO", "MAT administrator", "Case manager",
  "Academy lead", "Auditor", "Read only",
] as const;
