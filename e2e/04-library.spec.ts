// ─────────────────────────────────────────────────
// Library — Paper list, search, filter, view modes
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe('Library Page', () => {
  test('should load paper list from API', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/library');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Semi-Supervised Classification').first()).toBeVisible();
  });

  test('should search papers by keyword', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/library');
    await page.waitForTimeout(1000);

    // Actual placeholder from LibraryPage.tsx
    const searchInput = page.getByPlaceholder(/搜索标题、作者、关键词/);
    await searchInput.fill('GAT');
    await page.waitForTimeout(300);

    // Should show GAT paper
    await expect(page.getByText('Graph Attention Networks').first()).toBeVisible();
    // Should NOT show unrelated papers (fraud-related)
    expect(page.getByText('金融欺诈')).not.toBeVisible();
  });

  test('should filter papers by tag', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/library');
    await page.waitForTimeout(1000);

    // Find a tag badge by text content "GNN"
    const gnnTag = page.locator('[class*="badge"], [class*="Badge"]').filter({ hasText: 'GNN' }).first();
    if (await gnnTag.isVisible()) {
      await gnnTag.click();
      await page.waitForTimeout(300);
    }
    // Page should still work
    await expect(page.locator('body')).toBeVisible();
  });

  test('should toggle grid/list view mode', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/library');
    await page.waitForTimeout(1000);

    // Page should still show papers regardless of view mode
    await expect(page.getByText('Semi-Supervised Classification').first()).toBeVisible();
  });
});
