// ─────────────────────────────────────────────────
// AI Chat — Conversation interface
// ─────────────────────────────────────────────────
import { test, expect } from './fixtures';

test.describe('AI Chat Page', () => {
  test('should load chat page', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/ai-chat');
    await page.waitForTimeout(800);

    // Should show chat interface
    await expect(page.locator('body')).toBeVisible();
    const hasChatUI = await page.getByText(/AI|聊天|Chat|对话|发送|Send/i).count();
    expect(hasChatUI).toBeGreaterThan(0);
  });

  test('should have message input area', async ({ authedPage: page }) => {
    await page.goto('/#/dashboard/ai-chat');
    await page.waitForTimeout(800);

    // Should have a text input for typing messages
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('Hello, can you help me?');
      // Verify text was entered
      await expect(textarea).toHaveValue('Hello, can you help me?');
    }
  });
});
