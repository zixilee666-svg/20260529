# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-dashboard.spec.ts >> Dashboard Page >> should display research projects section
- Location: e2e\03-dashboard.spec.ts:23:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('HGNN 金融欺诈检测综述').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('HGNN 金融欺诈检测综述').first()

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
            - generic [ref=e86]:
              - heading "欢迎回来，研究者 ⚖️" [level=1] [ref=e87]
              - button "刷新数据" [ref=e88] [cursor=pointer]:
                - img [ref=e89]
            - paragraph [ref=e94]: 以圣洁纯粹之心，行理性严谨之事
          - generic [ref=e95]:
            - img [ref=e96]
            - paragraph [ref=e100]: "\"在求知的道路上，严谨是我们最坚实的铠甲。\""
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e104]:
              - generic [ref=e105]: 最近添加
              - link "查看全部 →" [ref=e106] [cursor=pointer]:
                - /url: "#/library"
            - paragraph [ref=e108]:
              - text: 暂无文献，
              - link "导入文献" [ref=e109] [cursor=pointer]:
                - /url: "#/import"
              - text: 开始你的学术之旅
          - generic [ref=e110]:
            - generic [ref=e112]: 收藏精选
            - paragraph [ref=e114]: 暂无收藏文献
        - generic [ref=e115]:
          - generic [ref=e117]:
            - generic [ref=e118]: 研究项目
            - link "管理项目 →" [ref=e119] [cursor=pointer]:
              - /url: "#/research"
          - paragraph [ref=e121]:
            - text: 暂无研究项目，
            - link "创建第一个项目" [ref=e122] [cursor=pointer]:
              - /url: "#/research"
      - generic [ref=e125]:
        - paragraph [ref=e126]:
          - generic [ref=e127]: © 2026 Academic Hub. All rights reserved.
        - generic [ref=e128]:
          - link "粤ICP备2026052655号-1" [ref=e129] [cursor=pointer]:
            - /url: https://beian.miit.gov.cn/
          - generic [ref=e130]: "|"
          - link "公安备案" [ref=e131] [cursor=pointer]:
            - /url: https://beian.mps.gov.cn/#/
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | // ─────────────────────────────────────────────────
  2  | // Dashboard — Stats, papers, projects, heatmap
  3  | // ─────────────────────────────────────────────────
  4  | import { test, expect } from './fixtures';
  5  | 
  6  | test.describe('Dashboard Page', () => {
  7  |   test('should load and display statistics cards', async ({ authedPage: page }) => {
  8  |     await page.goto('/#/dashboard');
  9  |     await page.waitForTimeout(1000);
  10 | 
  11 |     // Actual labels from DashboardPage.tsx StatCard components
  12 |     await expect(page.getByText('文献总量').first()).toBeVisible();
  13 |     await expect(page.getByText('本周阅读').first()).toBeVisible();
  14 |     await expect(page.getByText('收藏文献').first()).toBeVisible();
  15 |   });
  16 | 
  17 |   test('should display recent papers from API', async ({ authedPage: page }) => {
  18 |     await page.goto('/#/dashboard');
  19 |     await page.waitForTimeout(1000);
  20 |     await expect(page.getByText('Semi-Supervised Classification').first()).toBeVisible();
  21 |   });
  22 | 
  23 |   test('should display research projects section', async ({ authedPage: page }) => {
  24 |     await page.goto('/#/dashboard');
  25 |     await page.waitForTimeout(1000);
> 26 |     await expect(page.getByText('HGNN 金融欺诈检测综述').first()).toBeVisible();
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  27 |   });
  28 | 
  29 |   test('should show reading heatmap', async ({ authedPage: page }) => {
  30 |     await page.goto('/#/dashboard');
  31 |     await page.waitForTimeout(1000);
  32 |     await expect(page.getByText('一').first()).toBeVisible();
  33 |     await expect(page.getByText('日').first()).toBeVisible();
  34 |   });
  35 | 
  36 |   test('should navigate to paper detail on click', async ({ authedPage: page }) => {
  37 |     await page.goto('/#/dashboard');
  38 |     await page.waitForTimeout(1000);
  39 |     const paperLink = page.getByText('Semi-Supervised Classification').first();
  40 |     await paperLink.click();
  41 |     await page.waitForTimeout(500);
  42 |     // Dashboard links to /paper/:id (not /dashboard/paper/:id)
  43 |     await expect(page).toHaveURL(/\/#\/paper\//);
  44 |   });
  45 | });
  46 | 
```