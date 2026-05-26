import { test, expect } from '@playwright/test';

test('real backend login and dashboard', async ({ page }) => {
  const requests: any[] = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      requests.push({ url: req.url(), method: req.method() });
    }
  });
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      requests.push({ url: res.url(), status: res.status() });
    }
  });

  await page.goto('/#/login');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  
  await page.locator('#login-username').fill('joan');
  await page.locator('#login-password').fill('11223344');
  await page.getByRole('button', { name: '登录' }).click();
  
  await page.waitForURL(/\/#\//, { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Navigate to dashboard
  await page.goto('/#/dashboard');
  await page.waitForTimeout(3000);
  
  console.log('API requests:', JSON.stringify(requests, null, 2));
  await page.screenshot({ path: 'test-results/real-api-dashboard.png', fullPage: true });
  
  const bodyText = await page.locator('body').textContent();
  console.log('Body text preview:', bodyText?.slice(0, 500));
});
