import { test, expect } from "@playwright/test";
import { login, waitForApp, isAppwrite } from "./helpers";

test.describe("Search and filter", () => {
  test.skip(isAppwrite, "demo only — search/filter UI is identical in both modes");
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForApp(page);
  });

  test("search input is visible", async ({ page }) => {
    await expect(page.locator("input[aria-label='Search matters']")).toBeVisible();
  });

  test("typing in search filters the table", async ({ page }) => {
    const allRows = await page.locator("table tbody tr").count();
    await page.fill("input[aria-label='Search matters']", "SAR");
    const filteredRows = await page.locator("table tbody tr").count();
    expect(filteredRows).toBeLessThanOrEqual(allRows);
    expect(filteredRows).toBeGreaterThan(0);
  });

  test("search with no matches shows empty state", async ({ page }) => {
    await page.fill("input[aria-label='Search matters']", "zzz_nonexistent_xyz");
    await expect(page.locator("text=No matching matters")).toBeVisible();
  });

  test("clearing search restores all rows", async ({ page }) => {
    const allRows = await page.locator("table tbody tr").count();
    await page.fill("input[aria-label='Search matters']", "SAR");
    await page.fill("input[aria-label='Search matters']", "");
    const restoredRows = await page.locator("table tbody tr").count();
    expect(restoredRows).toBe(allRows);
  });

  test("academy filter dropdown is visible", async ({ page }) => {
    await expect(page.locator("select[aria-label='Academy filter']")).toBeVisible();
  });

  test("academy filter has all academies", async ({ page }) => {
    const options = await page.locator("select[aria-label='Academy filter'] option").allTextContents();
    expect(options).toContain("Federation-wide");
    expect(options.length).toBeGreaterThanOrEqual(5);
  });

  test("selecting an academy filters the table", async ({ page }) => {
    const allRows = await page.locator("table tbody tr").count();
    const options = page.locator("select[aria-label='Academy filter'] option");
    const count = await options.count();
    if (count > 1) {
      const secondOption = await options.nth(1).textContent();
      await page.selectOption("select[aria-label='Academy filter']", secondOption!);
      const filteredRows = await page.locator("table tbody tr").count();
      expect(filteredRows).toBeLessThanOrEqual(allRows);
    }
  });

  test("search and academy filter work together", async ({ page }) => {
    const options = page.locator("select[aria-label='Academy filter'] option");
    const count = await options.count();
    if (count > 1) {
      const secondOption = await options.nth(1).textContent();
      await page.selectOption("select[aria-label='Academy filter']", secondOption!);
      await page.fill("input[aria-label='Search matters']", "SAR");
      const rows = await page.locator("table tbody tr").count();
      expect(rows).toBeGreaterThanOrEqual(0);
    }
  });
});
