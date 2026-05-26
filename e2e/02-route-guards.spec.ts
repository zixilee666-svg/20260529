// ─────────────────────────────────────────────────
// Route Guards — Auth redirect & admin role checks
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe('Route Guards', () => {
  test('unauthenticated user redirected to /#/login', async ({ guestPage: page }) => {
    await page.goto('/#/dashboard');
    await expect(page).toHaveURL(/\/#\/login/);
  });

  test('authenticated user can access dashboard', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/#\/dashboard/);
  });

  test('admin user can access admin page', async ({ authedPage: page }) => {
    await page.goto('/#/admin');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/#\/admin/);
  });

  test('regular user redirected from admin page', async ({ userPage: page }) => {
    await page.goto('/#/admin');
    await page.waitForTimeout(500);
    // RequireAdmin redirects to "/" which becomes GalleryPage
    // GalleryPage may append query params, so just check we're NOT on admin
    await expect(page).not.toHaveURL(/\/#\/admin/);
  });
});
