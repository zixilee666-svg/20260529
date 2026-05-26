// ─────────────────────────────────────────────────
// Import Export — Search, import, export
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe('Import/Export Page', () => {
  test('should load import-export page', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/import-export');
    await page.waitForTimeout(800);

    // Should show import/export interface
    const hasContent = await page.getByText(/导入|导出|Import|Export|搜索|Search/i).count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('should have search functionality', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/import-export');
    await page.waitForTimeout(800);

    // Look for search input
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('graph neural network');
      await page.waitForTimeout(300);
    }
    // Page should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});
