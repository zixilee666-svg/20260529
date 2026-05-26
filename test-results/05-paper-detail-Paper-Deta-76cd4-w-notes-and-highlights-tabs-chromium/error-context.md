# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-paper-detail.spec.ts >> Paper Detail Page >> should show notes and highlights tabs
- Location: e2e\05-paper-detail.spec.ts:22:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e6]:
        - img [ref=e8]
        - generic [ref=e12]:
          - heading "Academic Hub" [level=1] [ref=e13]
          - paragraph [ref=e14]: 贞德·达尔克
      - navigation [ref=e15]:
        - link "学术广场" [ref=e16] [cursor=pointer]:
          - /url: "#/gallery"
          - img [ref=e17]
          - generic [ref=e20]: 学术广场
        - link "仪表盘" [ref=e22] [cursor=pointer]:
          - /url: "#/dashboard"
          - img [ref=e23]
          - generic [ref=e28]: 仪表盘
        - link "文献库" [ref=e29] [cursor=pointer]:
          - /url: "#/dashboard/library"
          - img [ref=e30]
          - generic [ref=e32]: 文献库
        - link "我的文献库" [ref=e33] [cursor=pointer]:
          - /url: "#/dashboard/my-library"
          - img [ref=e34]
          - generic [ref=e36]: 我的文献库
        - link "个人资料" [ref=e37] [cursor=pointer]:
          - /url: "#/dashboard/materials"
          - img [ref=e38]
          - generic [ref=e41]: 个人资料
        - link "AI 对话" [ref=e42] [cursor=pointer]:
          - /url: "#/dashboard/ai-chat"
          - img [ref=e43]
          - generic [ref=e45]: AI 对话
        - link "我的研究" [ref=e46] [cursor=pointer]:
          - /url: "#/dashboard/research"
          - img [ref=e47]
          - generic [ref=e49]: 我的研究
        - link "导入导出" [ref=e50] [cursor=pointer]:
          - /url: "#/dashboard/import-export"
          - img [ref=e51]
          - generic [ref=e55]: 导入导出
        - link "设置" [ref=e56] [cursor=pointer]:
          - /url: "#/dashboard/settings"
          - img [ref=e57]
          - generic [ref=e60]: 设置
        - link "管理后台" [ref=e62] [cursor=pointer]:
          - /url: "#/admin"
          - img [ref=e63]
          - generic [ref=e65]: 管理后台
      - generic [ref=e66]:
        - generic [ref=e67]:
          - generic [ref=e68]: A
          - generic [ref=e69]:
            - paragraph [ref=e70]: Administrator
            - paragraph [ref=e71]: 管理员
        - generic [ref=e72]:
          - button "切换主题" [ref=e73] [cursor=pointer]:
            - img [ref=e74]
          - button "退出登录" [ref=e76] [cursor=pointer]:
            - img [ref=e77]
    - main [ref=e80]:
      - generic [ref=e83]:
        - img [ref=e85]
        - heading "文献未找到" [level=3] [ref=e88]
        - paragraph [ref=e89]: 请求的文献不存在或已被移除。
        - button "返回文献库" [ref=e91] [cursor=pointer]:
          - img
          - text: 返回文献库
      - generic [ref=e94]:
        - paragraph [ref=e95]:
          - generic [ref=e96]: © 2026 Academic Hub. All rights reserved.
        - generic [ref=e97]:
          - link "粤ICP备2026052655号-1" [ref=e98] [cursor=pointer]:
            - /url: https://beian.miit.gov.cn/
          - generic [ref=e99]: "|"
          - link "公安备案" [ref=e100] [cursor=pointer]:
            - /url: https://beian.mps.gov.cn/#/
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | // ─────────────────────────────────────────────────
  2  | // Paper Detail — View, favorite, notes, highlights
  3  | // ─────────────────────────────────────────────────
  4  | import { test, expect } from './fixtures';
  5  | 
  6  | test.describe.configure({ mode: 'serial' });
  7  | 
  8  | test.describe('Paper Detail Page', () => {
  9  |   test('should load paper detail by ID', async ({ authedPage: page }) => {
  10 |     await page.goto('/#/dashboard/paper/p-001');
  11 |     // Wait for loading to finish (PaperDetailSkeleton visible first, then content)
  12 |     await page.waitForTimeout(3000);
  13 | 
  14 |     // Page should not be blank/crashed
  15 |     await expect(page.locator('body')).toBeVisible();
  16 |     // Should show paper title or error state
  17 |     const bodyText = await page.locator('body').textContent();
  18 |     const hasTitle = bodyText?.includes('Semi-Supervised') || bodyText?.includes('文献未找到');
  19 |     expect(hasTitle).toBeTruthy();
  20 |   });
  21 | 
  22 |   test('should show notes and highlights tabs', async ({ authedPage: page }) => {
  23 |     await page.goto('/#/dashboard/paper/p-001');
  24 |     await page.waitForTimeout(3000);
  25 | 
  26 |     const bodyText = await page.locator('body').textContent();
  27 |     // Should have notes and highlights tabs
  28 |     const hasNotes = bodyText?.includes('笔记');
  29 |     const hasHighlights = bodyText?.includes('高亮标注');
  30 |     // At least one should be present if page loaded
> 31 |     expect(hasNotes || hasHighlights).toBeTruthy();
     |                                       ^ Error: expect(received).toBeTruthy()
  32 |   });
  33 | 
  34 |   test('should handle invalid paper ID gracefully', async ({ authedPage: page }) => {
  35 |     await page.goto('/#/dashboard/paper/invalid-id');
  36 |     await page.waitForTimeout(2000);
  37 | 
  38 |     // Should show empty state, not crash
  39 |     await expect(page.locator('body')).toBeVisible();
  40 |     const bodyText = await page.locator('body').textContent();
  41 |     const hasError = bodyText?.includes('文献未找到') || bodyText?.includes('返回');
  42 |     expect(hasError).toBeTruthy();
  43 |   });
  44 | });
  45 | 
```