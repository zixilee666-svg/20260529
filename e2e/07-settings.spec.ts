// ─────────────────────────────────────────────────
// Settings — Profile, theme toggle, citation format
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe('Settings Page', () => {
  test('should load settings page', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/settings');
    await page.waitForTimeout(1000);
    await expect(page.getByText(/设置|个人|Settings|Profile/i).first()).toBeVisible();
  });

  test('should show citation format options', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/settings');
    await page.waitForTimeout(1000);
    const hasCitation = await page.getByText(/APA|BibTeX|IEEE|GB\/T|引用格式/i).count();
    expect(hasCitation).toBeGreaterThan(0);
  });

  test('should show theme toggle in appearance tab', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/settings');
    await page.waitForTimeout(1000);
    // Click appearance tab
    const appearanceTab = page.getByRole('tab', { name: /外观|Appearance/i });
    if (await appearanceTab.isVisible()) {
      await appearanceTab.click();
      await page.waitForTimeout(300);
    }
    // Now look for theme labels
    const hasTheme = await page.getByText(/浅色|深色|跟随系统|主题设置/i).count();
    expect(hasTheme).toBeGreaterThan(0);
  });

  test('should show version in about tab', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/settings');
    await page.waitForTimeout(1000);
    // Click about tab
    const aboutTab = page.getByRole('tab', { name: /关于|About/i });
    if (await aboutTab.isVisible()) {
      await aboutTab.click();
      await page.waitForTimeout(300);
    }
    await expect(page.getByText('v2.0.0').first()).toBeVisible();
  });
});
