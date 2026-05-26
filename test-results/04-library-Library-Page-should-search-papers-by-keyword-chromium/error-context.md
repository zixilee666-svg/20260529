# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-library.spec.ts >> Library Page >> should search papers by keyword
- Location: e2e\04-library.spec.ts:13:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Graph Attention Networks').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Graph Attention Networks').first()

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
        - generic [ref=e84]:
          - generic [ref=e85]:
            - heading "文献库" [level=1] [ref=e86]
            - paragraph [ref=e87]: 共 0 篇文献 · 已筛选 0 篇
          - generic [ref=e88]:
            - button "从资料导入" [ref=e89] [cursor=pointer]:
              - img
              - text: 从资料导入
            - button "刷新" [ref=e90] [cursor=pointer]:
              - img
              - text: 刷新
            - button [ref=e91] [cursor=pointer]:
              - img
            - button [ref=e92] [cursor=pointer]:
              - img
        - generic [ref=e93]:
          - generic [ref=e94]:
            - img [ref=e95]
            - textbox "搜索标题、作者、关键词、会议..." [active] [ref=e98]: GAT
            - button [ref=e99] [cursor=pointer]:
              - img [ref=e100]
          - button "筛选" [ref=e103] [cursor=pointer]:
            - img
            - text: 筛选
            - img
        - generic [ref=e104]:
          - img [ref=e106]
          - heading "没有找到匹配的文献" [level=3] [ref=e108]
          - paragraph [ref=e109]: 未找到与「GAT」匹配的文献，请尝试其他关键词。
          - button "清除搜索" [ref=e111] [cursor=pointer]
      - generic [ref=e114]:
        - paragraph [ref=e115]:
          - generic [ref=e116]: © 2026 Academic Hub. All rights reserved.
        - generic [ref=e117]:
          - link "粤ICP备2026052655号-1" [ref=e118] [cursor=pointer]:
            - /url: https://beian.miit.gov.cn/
          - generic [ref=e119]: "|"
          - link "公安备案" [ref=e120] [cursor=pointer]:
            - /url: https://beian.mps.gov.cn/#/
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | // ─────────────────────────────────────────────────
  2  | // Library — Paper list, search, filter, view modes
  3  | // ─────────────────────────────────────────────────
  4  | import { test, expect } from './fixtures';
  5  | 
  6  | test.describe('Library Page', () => {
  7  |   test('should load paper list from API', async ({ authedPage: page }) => {
  8  |     await page.goto('/#/dashboard/library');
  9  |     await page.waitForTimeout(1000);
  10 |     await expect(page.getByText('Semi-Supervised Classification').first()).toBeVisible();
  11 |   });
  12 | 
  13 |   test('should search papers by keyword', async ({ authedPage: page }) => {
  14 |     await page.goto('/#/dashboard/library');
  15 |     await page.waitForTimeout(1000);
  16 | 
  17 |     // Actual placeholder from LibraryPage.tsx
  18 |     const searchInput = page.getByPlaceholder(/搜索标题、作者、关键词/);
  19 |     await searchInput.fill('GAT');
  20 |     await page.waitForTimeout(300);
  21 | 
  22 |     // Should show GAT paper
> 23 |     await expect(page.getByText('Graph Attention Networks').first()).toBeVisible();
     |                                                                      ^ Error: expect(locator).toBeVisible() failed
  24 |     // Should NOT show unrelated papers (fraud-related)
  25 |     expect(page.getByText('金融欺诈')).not.toBeVisible();
  26 |   });
  27 | 
  28 |   test('should filter papers by tag', async ({ authedPage: page }) => {
  29 |     await page.goto('/#/dashboard/library');
  30 |     await page.waitForTimeout(1000);
  31 | 
  32 |     // Find a tag badge by text content "GNN"
  33 |     const gnnTag = page.locator('[class*="badge"], [class*="Badge"]').filter({ hasText: 'GNN' }).first();
  34 |     if (await gnnTag.isVisible()) {
  35 |       await gnnTag.click();
  36 |       await page.waitForTimeout(300);
  37 |     }
  38 |     // Page should still work
  39 |     await expect(page.locator('body')).toBeVisible();
  40 |   });
  41 | 
  42 |   test('should toggle grid/list view mode', async ({ authedPage: page }) => {
  43 |     await page.goto('/#/dashboard/library');
  44 |     await page.waitForTimeout(1000);
  45 | 
  46 |     // Page should still show papers regardless of view mode
  47 |     await expect(page.getByText('Semi-Supervised Classification').first()).toBeVisible();
  48 |   });
  49 | });
  50 | 
```