import { test, expect } from "@playwright/test";
import { login, waitForApp, isAppwrite } from "./helpers";

test.describe("Matter lifecycle", () => {
  test.skip(isAppwrite, "demo only — lifecycle UI is identical in both modes");
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForApp(page);
  });

  test("New matter button is visible for DPO", async ({ page }) => {
    await expect(page.locator("button:has-text('New matter')")).toBeVisible();
  });

  test("clicking New matter opens modal with form fields", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    const modal = page.locator("form.modal[role='dialog']");
    await expect(modal).toBeVisible();
    await expect(modal.locator("select[name='type']")).toBeVisible();
    await expect(modal.locator("input[name='title']")).toBeVisible();
    await expect(modal.locator("select[name='academy']")).toBeVisible();
    await expect(modal.locator("textarea[name='summary']")).toBeVisible();
  });

  test("create matter modal has correct module options", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    const options = await page.locator("form.modal select[name='type'] option").allTextContents();
    expect(options).toContain("SARs");
    expect(options).toContain("FOI");
    expect(options).toContain("Breaches");
    expect(options).toContain("DPIAs");
  });

  test("cancel closes create modal", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    await expect(page.locator("form.modal[role='dialog']")).toBeVisible();
    await page.click("button:has-text('Cancel')");
    await expect(page.locator("form.modal[role='dialog']")).not.toBeVisible();
  });

  test("creating a matter opens detail drawer", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    await page.fill("input[name='title']", "Test E2E Matter");
    await page.click("button:has-text('Create matter')");
    const drawer = page.locator("aside.drawer[role='dialog']");
    await expect(drawer).toBeVisible();
    await expect(drawer.locator("#matter-title")).toContainText("Test E2E Matter");
  });

  test("drawer shows tabs: Summary, Tasks, Documents, Audit", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    await page.fill("input[name='title']", "Tab Test");
    await page.click("button:has-text('Create matter')");
    const drawer = page.locator("aside.drawer[role='dialog']");
    for (const tab of ["Summary", "Tasks", "Documents", "Audit"]) {
      await expect(drawer.locator(`.tabs button:has-text("${tab}")`)).toBeVisible();
    }
  });

  test("clicking Summary tab shows case summary", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    await page.fill("input[name='title']", "Summary Test");
    await page.click("button:has-text('Create matter')");
    const drawer = page.locator("aside.drawer[role='dialog']");
    await drawer.locator(".tabs button:has-text('Summary')").click();
    await expect(drawer.locator("h3:has-text('Case summary')")).toBeVisible();
  });

  test("clicking Tasks tab shows outstanding tasks", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    await page.fill("input[name='title']", "Tasks Test");
    await page.click("button:has-text('Create matter')");
    const drawer = page.locator("aside.drawer[role='dialog']");
    await drawer.locator(".tabs button:has-text('Tasks')").click();
    await expect(drawer.locator("h3:has-text('Outstanding tasks')")).toBeVisible();
  });

  test("clicking Documents tab shows evidence repository", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    await page.fill("input[name='title']", "Docs Test");
    await page.click("button:has-text('Create matter')");
    const drawer = page.locator("aside.drawer[role='dialog']");
    await drawer.locator(".tabs button:has-text('Documents')").click();
    await expect(drawer.locator("h3:has-text('Evidence repository')")).toBeVisible();
  });

  test("clicking Audit tab shows activity timeline", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    await page.fill("input[name='title']", "Audit Tab Test");
    await page.click("button:has-text('Create matter')");
    const drawer = page.locator("aside.drawer[role='dialog']");
    await drawer.locator(".tabs button:has-text('Audit')").click();
    await expect(drawer.locator(".audit-row")).not.toHaveCount(0);
  });

  test("close button dismisses drawer", async ({ page }) => {
    await page.click("button:has-text('New matter')");
    await page.fill("input[name='title']", "Close Test");
    await page.click("button:has-text('Create matter')");
    const drawer = page.locator("aside.drawer[role='dialog']");
    await expect(drawer).toBeVisible();
    await drawer.locator("button[aria-label='Close matter details']").click();
    await expect(drawer).not.toBeVisible();
  });

  test("clicking table row opens drawer with correct matter", async ({ page }) => {
    const firstRow = page.locator("table tbody tr").first();
    const matterId = await firstRow.locator("code").textContent();
    await firstRow.click();
    const drawer = page.locator("aside.drawer[role='dialog']");
    await expect(drawer).toBeVisible();
    await expect(drawer.locator("code")).toContainText(matterId!);
  });

  test("Advance workflow button is enabled for DPO", async ({ page }) => {
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.click();
    const drawer = page.locator("aside.drawer[role='dialog']");
    const advanceBtn = drawer.locator("button:has-text('Advance workflow')");
    await expect(advanceBtn).toBeVisible();
    await expect(advanceBtn).toBeEnabled();
  });
});
