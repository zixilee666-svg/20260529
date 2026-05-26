// ─────────────────────────────────────────────────
// Dashboard — Stats, papers, projects, heatmap
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe('Dashboard Page', () => {
  test('should load and display statistics cards', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard');
    await page.waitForTimeout(1000);

    // Actual labels from DashboardPage.tsx StatCard components
    await expect(page.getByText('文献总量').first()).toBeVisible();
    await expect(page.getByText('本周阅读').first()).toBeVisible();
    await expect(page.getByText('收藏文献').first()).toBeVisible();
  });

  test('should display recent papers from API', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Semi-Supervised Classification').first()).toBeVisible();
  });

  test('should display research projects section', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard');
    await page.waitForTimeout(1000);
    await expect(page.getByText('HGNN 金融欺诈检测综述').first()).toBeVisible();
  });

  test('should show reading heatmap', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard');
    await page.waitForTimeout(1000);
    await expect(page.getByText('一').first()).toBeVisible();
    await expect(page.getByText('日').first()).toBeVisible();
  });

  test('should navigate to paper detail on click', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard');
    await page.waitForTimeout(1000);
    const paperLink = page.getByText('Semi-Supervised Classification').first();
    await paperLink.click();
    await page.waitForTimeout(500);
    // Dashboard links to /paper/:id (not /dashboard/paper/:id)
    await expect(page).toHaveURL(/\/#\/paper\//);
  });
});
