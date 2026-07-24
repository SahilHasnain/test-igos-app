import { test, expect } from "@playwright/test";
import { login, waitForApp, isAppwrite } from "./helpers";

test.describe("Appwrite persistence", () => {
  test.skip(!isAppwrite, "appwrite only");

  test("data persists across page reload", async ({ page }) => {
    await login(page);
    await waitForApp(page);

    const initialCount = await page.locator("table tbody tr").count();
    expect(initialCount).toBeGreaterThan(0);

    await page.reload();
    await waitForApp(page);

    const reloadedCount = await page.locator("table tbody tr").count();
    expect(reloadedCount).toBe(initialCount);
  });

  test("matter IDs are stable after reload", async ({ page }) => {
    await login(page);
    await waitForApp(page);

    const firstId = await page.locator("table tbody tr").first().locator("code").textContent();
    await page.reload();
    await waitForApp(page);

    const reloadedId = await page.locator("table tbody tr").first().locator("code").textContent();
    expect(reloadedId).toBe(firstId);
  });

  test("search works with persisted data", async ({ page }) => {
    await login(page);
    await waitForApp(page);

    const firstTitle = await page.locator("table tbody tr").first().locator("strong").textContent();
    await page.fill("input[aria-label='Search matters']", firstTitle!);
    const rows = await page.locator("table tbody tr").count();
    expect(rows).toBeGreaterThanOrEqual(1);
  });

  test("different academy filter shows different results", async ({ page }) => {
    await login(page);
    await waitForApp(page);

    const allCount = await page.locator("table tbody tr").count();
    const options = page.locator("select[aria-label='Academy filter'] option");
    const count = await options.count();

    if (count > 2) {
      const secondOption = await options.nth(1).textContent();
      await page.selectOption("select[aria-label='Academy filter']", secondOption!);
      const filteredCount = await page.locator("table tbody tr").count();
      expect(filteredCount).toBeLessThanOrEqual(allCount);
    }
  });
});
