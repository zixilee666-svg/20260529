// ─────────────────────────────────────────────────
// Gallery — Public page (no auth required)
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe('Gallery Page (Public)', () => {
  test('should load gallery without auth', async ({ guestPage: page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(800);

    // Gallery is the home page, should load for everyone
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show gallery heading or content', async ({ guestPage: page }) => {
    await page.goto('/#/gallery');
    await page.waitForTimeout(800);

    // Should have some content
    const hasContent = await page.getByText(/学术|Academic|空间|Space|探索|Gallery/i).count();
    expect(hasContent).toBeGreaterThan(0);
  });
});
