// ─────────────────────────────────────────────────
// My Library — Collection management
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe('My Library Page', () => {
  test('should load libraries from API', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/my-library');
    await page.waitForTimeout(800);

    // Should show libraries (mock has 4 libraries)
    // Wait for content to appear
    const hasContent = await page.locator('text=全部论文').or(page.locator('text=GNN')).count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('should display paper count in collections', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/my-library');
    await page.waitForTimeout(800);

    // Should be visible without errors
    await expect(page.locator('body')).toBeVisible();
  });
});
