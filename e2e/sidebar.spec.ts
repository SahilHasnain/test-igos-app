import { test, expect } from "@playwright/test";
import { login, waitForApp, ALL_SIDEBAR_VIEWS, isAppwrite } from "./helpers";

test.describe("Sidebar views", () => {
  test.skip(isAppwrite, "demo only — sidebar nav is identical in both modes");
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForApp(page);
  });

  for (const view of ALL_SIDEBAR_VIEWS) {
    test(`navigates to ${view} and renders content`, async ({ page }) => {
      await page.locator(`.sidebar nav button:has-text("${view}")`).evaluate((el) => (el as HTMLButtonElement).click());
      const h1 = page.locator("h1");
      await expect(h1).not.toBeEmpty();
      const text = await h1.textContent();
      expect(text!.length).toBeGreaterThan(0);
    });
  }

  test("Overview shows metric cards", async ({ page }) => {
    await expect(page.locator(".metric")).toHaveCount(4);
  });

  test("Overview shows priority matters table", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible();
  });

  test("SARs register shows table with correct columns", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("SARs")');
    await expect(page.locator("table thead")).toContainText("Reference");
    await expect(page.locator("table thead")).toContainText("Matter");
    await expect(page.locator("table thead")).toContainText("Risk");
  });

  test("ROPA panel shows table", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("ROPA")');
    await expect(page.locator("table")).toBeVisible();
  });

  test("Policies panel renders", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("Policies")');
    await expect(page.locator("h1")).toContainText("Policy management");
  });

  test("AI governance panel renders", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("AI")');
    await expect(page.locator("h1")).toContainText("AI governance");
  });

  test("Assets panel renders", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("Assets")');
    await expect(page.locator("h1")).toContainText("Information Asset Register");
  });

  test("Records panel renders", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("Records")');
    await expect(page.locator("h1")).toContainText("Records management");
  });

  test("Contracts panel renders", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("Contracts")');
    await expect(page.locator("h1")).toContainText("Contract governance");
  });

  test("Assurance panel renders", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("Assurance")');
    await expect(page.locator("h1")).toContainText("Assurance overview");
  });

  test("Risks panel renders", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("Risks")');
    await expect(page.locator("h1")).toContainText("Information governance risks");
  });

  test("Audits panel renders", async ({ page }) => {
    await page.locator('.sidebar nav button:has-text("Audits")').evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator("h1")).toContainText("Audit programme");
  });

  test("Actions panel renders", async ({ page }) => {
    await page.locator('.sidebar nav button:has-text("Actions")').evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator("h1")).toContainText("Open actions");
  });

  test("Audit view renders for DPO", async ({ page }) => {
    await page.getByRole("button", { name: "≡ Audit" }).evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator("h1")).toContainText("Audit and assurance");
  });

  test("Redaction workspace renders", async ({ page }) => {
    await page.click('.sidebar nav button:has-text("Redaction")');
    await expect(page.locator("h1")).toContainText("AI-assisted review and redaction");
  });
});
