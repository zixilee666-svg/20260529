// ─────────────────────────────────────────────────
// Admin — Stats, user management, spaces, workbuddy
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe('Admin Page', () => {
  test('should load admin dashboard', async ({ authedPage: page }) => {
    await page.goto('/#/admin');
    // Wait for admin page content to load (replaces loading spinner)
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toBeVisible();
    // Check for admin header or tabs
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('管理后台');
  });

  test('should display system statistics cards', async ({ authedPage: page }) => {
    await page.goto('/#/admin');
    await page.waitForTimeout(2000);

    // Wait for loading to finish
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    // Stats grid should show labels
    expect(bodyText).toContain('用户数');
  });

  test('should show user management tab', async ({ authedPage: page }) => {
    await page.goto('/#/admin');
    await page.waitForTimeout(2000);

    const usersTab = page.getByRole('tab', { name: /用户管理/ });
    await usersTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('用户列表');
  });

  test('should show spaces management tab', async ({ authedPage: page }) => {
    await page.goto('/#/admin');
    await page.waitForTimeout(2000);

    const spacesTab = page.getByRole('tab', { name: /空间管理/ });
    await spacesTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('空间管理');
  });

  test('should deny access to non-admin users', async ({ userPage: page }) => {
    await page.goto('/#/admin');
    await page.waitForTimeout(2000);

    // RequireAdmin redirects non-admin to gallery "/"
    const bodyText = await page.locator('body').textContent();
    // Should show gallery content (redirected away from admin)
    const redirectedToGallery = bodyText?.includes('学术') || !bodyText?.includes('管理后台');
    expect(redirectedToGallery).toBeTruthy();
  });
});
