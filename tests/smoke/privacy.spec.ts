import { test, expect } from "@playwright/test";

test.describe("/privacy", { tag: "@smoke" }, () => {
  test("renders the DRAFT policy and asks not to be indexed", async ({ page }) => {
    const response = await page.goto("/privacy", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.getByTestId("privacy-draft")).toBeVisible();
    await expect(page.getByTestId("service-netlify")).toBeVisible();
    await expect(page.getByTestId("service-ga4")).toBeVisible();
    await expect(page.getByTestId("service-forms")).toHaveCount(0);
    const text = await page.locator("article").innerText();
    expect(text).toContain('Worthe Real Estate Group ("we") runs this website');
    expect(text).toContain("Effective October 6, 2026");
    await expect(page.locator('article a[href="mailto:29navy@worthe.com"]')).toBeVisible();
  });

  test("the home page stays indexable and links to it from the contact block", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    const link = page.locator('#contact a[href="/privacy"]');
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  });
});
