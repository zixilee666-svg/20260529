import { test, expect } from '@playwright/test';

test('MyLibraryPage does not crash with real backend', async ({ page }) => {
  await page.goto('/#/login');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  
  await page.locator('#login-username').fill('joan');
  await page.locator('#login-password').fill('11223344');
  await page.getByRole('button', { name: '登录' }).click();
  
  await page.waitForURL(/\/#\//, { timeout: 10000 });
  
  // Navigate to My Library
  await page.goto('/#/dashboard/my-library');
  await page.waitForTimeout(2000);
  
  // Verify no crash - page should show library content
  await expect(page.getByText('GNN 核心论文').first()).toBeVisible();
  
  await page.screenshot({ path: 'test-results/mylibrary-real-backend.png', fullPage: true });
});
