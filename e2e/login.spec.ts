import { test, expect } from "@playwright/test";
import { login, waitForApp, signOut, isAppwrite } from "./helpers";

test.describe("Login flow", () => {
  test("redirects to /login when no session", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login");
    await expect(page.locator("form")).toBeVisible();
  });

  test("shows demo mode notice in demo mode", async ({ page }) => {
    test.skip(isAppwrite, "demo only");
    await page.goto("/login");
    await expect(page.locator("text=Demo mode")).toBeVisible();
  });

  test("shows role selector dropdown in demo mode", async ({ page }) => {
    test.skip(isAppwrite, "demo only");
    await page.goto("/login");
    const select = page.locator("select");
    await expect(select).toBeVisible();
    const options = await select.locator("option").allTextContents();
    expect(options).toContain("DPO");
    expect(options).toContain("Auditor");
    expect(options).toContain("Read only");
  });

  test("shows email/password fields in appwrite mode", async ({ page }) => {
    test.skip(!isAppwrite, "appwrite only");
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("shows correct submit button text", async ({ page }) => {
    await page.goto("/login");
    if (isAppwrite) {
      await expect(page.locator("button:has-text('Sign in')")).toBeVisible();
    } else {
      await expect(page.locator("button:has-text('Enter workspace')")).toBeVisible();
    }
  });

  test("login lands on overview", async ({ page }) => {
    await login(page);
    await waitForApp(page);
    await expect(page.locator("h1")).toContainText("Information governance overview");
  });

  test("sidebar shows current role after login", async ({ page }) => {
    await login(page);
    await waitForApp(page);
    await expect(page.locator(".sidebar-foot")).toContainText("DPO");
  });

  test("sign out returns to login page", async ({ page }) => {
    await login(page);
    await waitForApp(page);
    await signOut(page);
    await expect(page.locator("form")).toBeVisible();
  });
});
