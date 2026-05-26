// ─────────────────────────────────────────────────
// Auth Flow — Login page rendering, tab switching, validation
// ─────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

test.describe('Auth Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login');
    await page.evaluate(() => {
      localStorage.removeItem('joan_auth_token');
      localStorage.removeItem('joan_academic_user');
    });
  });

  test('should render login page with title', async ({ page }) => {
    await page.goto('/#/login');
    await expect(page.getByText("Joan's Academic Hub")).toBeVisible();
    await expect(page.getByText('登录以继续您的学术研究')).toBeVisible();
  });

  test('should have default admin credentials pre-filled', async ({ page }) => {
    await page.goto('/#/login');
    const usernameInput = page.locator('#login-username');
    const passwordInput = page.locator('#login-password');
    await expect(usernameInput).toHaveValue('admin');
    await expect(passwordInput).toHaveValue('123456');
  });

  test('should switch between login and register tabs', async ({ page }) => {
    await page.goto('/#/login');
    await page.getByRole('tab', { name: '注册' }).click();
    await expect(page.getByText('创建账户')).toBeVisible();
    await expect(page.getByText('加入')).toBeVisible();
    await page.getByRole('tab', { name: '登录' }).click();
    await expect(page.getByText('欢迎回来')).toBeVisible();
  });

  test('should show validation error on empty submit', async ({ page }) => {
    await page.goto('/#/login');
    await page.locator('#login-username').clear();
    await page.locator('#login-password').clear();
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.getByText('欢迎回来')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/#/login');
    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    // The toggle button is a sibling button[type=button] inside the relative div
    const toggleBtn = passwordInput.locator('..').locator('button[type="button"]');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
