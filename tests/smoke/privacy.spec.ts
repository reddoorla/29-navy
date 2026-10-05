import { test, expect } from "@playwright/test";

test.describe("/privacy", () => {
  test("renders the DRAFT policy and asks not to be indexed", async ({ page }) => {
    const response = await page.goto("/privacy", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.getByTestId("privacy-draft")).toBeVisible();
    await expect(page.getByTestId("service-netlify")).toBeVisible();
    await expect(page.getByTestId("service-ga4")).toBeVisible();
    await expect(page.getByTestId("service-forms")).toHaveCount(0);
  });

  test("the home page stays indexable and links to it from the contact block", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    const link = page.locator('#contact a[href="/privacy"]');
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  });
});
