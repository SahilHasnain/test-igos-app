import { test, expect } from "@playwright/test";
import { login, waitForApp, ALL_ROLES, isAppwrite } from "./helpers";

test.describe("Role-based access", () => {
  test.skip(isAppwrite, "demo only — role logic is identical in both modes");
  for (const role of ALL_ROLES) {
    test(`${role} can log in and see sidebar`, async ({ page }) => {
      await login(page, { role });
      await waitForApp(page);
      const buttons = await page.locator(".sidebar nav button").count();
      expect(buttons).toBeGreaterThan(5);
    });
  }

  test("DPO sees Audit view in sidebar", async ({ page }) => {
    await login(page, { role: "DPO" });
    await waitForApp(page);
    await expect(page.getByRole("button", { name: "≡ Audit" })).toBeVisible();
  });

  test("MAT administrator sees Audit view", async ({ page }) => {
    await login(page, { role: "MAT administrator" });
    await waitForApp(page);
    await expect(page.getByRole("button", { name: "≡ Audit" })).toBeVisible();
  });

  test("Auditor sees Audit view", async ({ page }) => {
    await login(page, { role: "Auditor" });
    await waitForApp(page);
    await expect(page.getByRole("button", { name: "≡ Audit" })).toBeVisible();
  });

  test("Case manager does NOT see Audit view", async ({ page }) => {
    await login(page, { role: "Case manager" });
    await waitForApp(page);
    await expect(page.getByRole("button", { name: "≡ Audit" })).not.toBeVisible();
  });

  test("Academy lead does NOT see Audit view", async ({ page }) => {
    await login(page, { role: "Academy lead" });
    await waitForApp(page);
    await expect(page.getByRole("button", { name: "≡ Audit" })).not.toBeVisible();
  });

  test("Read only does NOT see Audit view", async ({ page }) => {
    await login(page, { role: "Read only" });
    await waitForApp(page);
    await expect(page.getByRole("button", { name: "≡ Audit" })).not.toBeVisible();
  });

  test("DPO sees New matter button", async ({ page }) => {
    await login(page, { role: "DPO" });
    await waitForApp(page);
    await expect(page.locator("button:has-text('New matter')")).toBeVisible();
  });

  test("Auditor does NOT see New matter button", async ({ page }) => {
    await login(page, { role: "Auditor" });
    await waitForApp(page);
    await expect(page.locator("button:has-text('New matter')")).not.toBeVisible();
  });

  test("Read only does NOT see New matter button", async ({ page }) => {
    await login(page, { role: "Read only" });
    await waitForApp(page);
    await expect(page.locator("button:has-text('New matter')")).not.toBeVisible();
  });

  test("Case manager sees New matter button", async ({ page }) => {
    await login(page, { role: "Case manager" });
    await waitForApp(page);
    await expect(page.locator("button:has-text('New matter')")).toBeVisible();
  });

  test("DPO sees Advance workflow enabled in drawer", async ({ page }) => {
    await login(page, { role: "DPO" });
    await waitForApp(page);
    await page.locator("table tbody tr").first().click();
    const drawer = page.locator("aside.drawer[role='dialog']");
    await expect(drawer.locator("button:has-text('Advance workflow')")).toBeEnabled();
  });

  test("Auditor sees Advance workflow disabled in drawer", async ({ page }) => {
    await login(page, { role: "Auditor" });
    await waitForApp(page);
    await page.locator("table tbody tr").first().click();
    const drawer = page.locator("aside.drawer[role='dialog']");
    await expect(drawer.locator("button:has-text('Advance workflow')")).toBeDisabled();
  });

  test("Read only sees Advance workflow disabled in drawer", async ({ page }) => {
    await login(page, { role: "Read only" });
    await waitForApp(page);
    await page.locator("table tbody tr").first().click();
    const drawer = page.locator("aside.drawer[role='dialog']");
    await expect(drawer.locator("button:has-text('Advance workflow')")).toBeDisabled();
  });

  test("sidebar shows correct role label for each role", async ({ page }) => {
    const expectedLabels = isAppwrite
      ? ["DPO", "MAT administrator", "Case manager", "Academy lead", "Auditor", "Read only"]
      : ["DPO", "MAT administrator", "Case manager", "Academy lead", "Auditor", "Read only"];
    for (const role of expectedLabels) {
      await login(page, { role });
      await waitForApp(page);
      await expect(page.locator(".sidebar-foot")).toContainText(role);
    }
  });
});
