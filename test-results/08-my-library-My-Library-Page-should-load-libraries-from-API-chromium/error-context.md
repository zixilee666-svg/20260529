# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-my-library.spec.ts >> My Library Page >> should load libraries from API
- Location: e2e\08-my-library.spec.ts:7:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
        - complementary [ref=e84]:
          - generic [ref=e85]:
            - heading "我的文献库" [level=2] [ref=e86]
            - button "新建" [ref=e87] [cursor=pointer]:
              - img
              - text: 新建
          - generic [ref=e89]:
            - img [ref=e91]
            - generic [ref=e93]: 全部文献
            - generic [ref=e94]: "0"
          - button "从资料导入" [ref=e95] [cursor=pointer]:
            - img
            - text: 从资料导入
          - button "创建新文献库" [ref=e96] [cursor=pointer]:
            - img
            - generic [ref=e97]: 创建新文献库
        - generic [ref=e98]:
          - generic [ref=e99]:
            - img [ref=e100]
            - textbox "搜索当前文献库中的论文..." [ref=e103]
          - paragraph [ref=e105]: 全部文献 · 0 篇论文
          - generic [ref=e106]:
            - img [ref=e108]
            - heading "文献库为空" [level=3] [ref=e110]
            - paragraph [ref=e111]: 该文献库中还没有论文，请从文献库导入。
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
  2  | // My Library — Collection management
  3  | // ─────────────────────────────────────────────────
  4  | import { test, expect } from './fixtures';
  5  | 
  6  | test.describe('My Library Page', () => {
  7  |   test('should load libraries from API', async ({ authedPage: page }) => {
  8  |     await page.goto('/#/dashboard/my-library');
  9  |     await page.waitForTimeout(800);
  10 | 
  11 |     // Should show libraries (mock has 4 libraries)
  12 |     // Wait for content to appear
  13 |     const hasContent = await page.locator('text=全部论文').or(page.locator('text=GNN')).count();
> 14 |     expect(hasContent).toBeGreaterThan(0);
     |                        ^ Error: expect(received).toBeGreaterThan(expected)
  15 |   });
  16 | 
  17 |   test('should display paper count in collections', async ({ authedPage: page }) => {
  18 |     await page.goto('/#/dashboard/my-library');
  19 |     await page.waitForTimeout(800);
  20 | 
  21 |     // Should be visible without errors
  22 |     await expect(page.locator('body')).toBeVisible();
  23 |   });
  24 | });
  25 | 
```