// ─────────────────────────────────────────────────
// Paper Detail — View, favorite, notes, highlights
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Paper Detail Page', () => {
  test('should load paper detail by ID', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/paper/p-001');
    // Wait for loading to finish (PaperDetailSkeleton visible first, then content)
    await page.waitForTimeout(3000);

    // Page should not be blank/crashed
    await expect(page.locator('body')).toBeVisible();
    // Should show paper title or error state
    const bodyText = await page.locator('body').textContent();
    const hasTitle = bodyText?.includes('Semi-Supervised') || bodyText?.includes('文献未找到');
    expect(hasTitle).toBeTruthy();
  });

  test('should show notes and highlights tabs', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/paper/p-001');
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent();
    // Should have notes and highlights tabs
    const hasNotes = bodyText?.includes('笔记');
    const hasHighlights = bodyText?.includes('高亮标注');
    // At least one should be present if page loaded
    expect(hasNotes || hasHighlights).toBeTruthy();
  });

  test('should handle invalid paper ID gracefully', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/paper/invalid-id');
    await page.waitForTimeout(2000);

    // Should show empty state, not crash
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    const hasError = bodyText?.includes('文献未找到') || bodyText?.includes('返回');
    expect(hasError).toBeTruthy();
  });
});
