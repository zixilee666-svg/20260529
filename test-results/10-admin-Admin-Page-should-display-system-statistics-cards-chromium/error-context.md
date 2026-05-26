# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 10-admin.spec.ts >> Admin Page >> should display system statistics cards
- Location: e2e\10-admin.spec.ts:18:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "用户数"
Received string:    "
    Academic Hub贞德·达尔克学术广场仪表盘文献库我的文献库个人资料AI 对话我的研究导入导出设置管理后台AAdministrator管理员Academic Hub管理后台系统管理与监控面板刷新总用户0+0 本周文献数0项目数0KV 用量2.4 MB24h 请求1,247可用性99.97%活跃用户0本周新增0本月新增0管理员0系统概览用户管理空间管理WorkBuddy最近活动系统最近操作日志系统健康状态API 服务Edge Functions正常KV 存储EdgeOne KV正常Cloud FunctionsNode.js Runtime正常ArXiv 搜索外部服务正常性能指标平均响应时间45ms错误率0.03%© 2026 Academic Hub. All rights reserved.粤ICP备2026052655号-1|公安备案加载管理数据失败加载管理数据失败·········
"
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
          - img [ref=e86]
          - generic [ref=e88]:
            - heading "管理后台" [level=1] [ref=e89]
            - paragraph [ref=e90]: 系统管理与监控面板
          - button "刷新" [ref=e91] [cursor=pointer]:
            - img
            - text: 刷新
        - generic [ref=e92]:
          - generic [ref=e94]:
            - generic [ref=e95]:
              - img [ref=e97]
              - generic [ref=e102]: 总用户
            - paragraph [ref=e103]: "0"
            - paragraph [ref=e104]: +0 本周
          - generic [ref=e106]:
            - generic [ref=e107]:
              - img [ref=e109]
              - generic [ref=e112]: 文献数
            - paragraph [ref=e113]: "0"
          - generic [ref=e115]:
            - generic [ref=e116]:
              - img [ref=e118]
              - generic [ref=e120]: 项目数
            - paragraph [ref=e121]: "0"
          - generic [ref=e123]:
            - generic [ref=e124]:
              - img [ref=e126]
              - generic [ref=e130]: KV 用量
            - paragraph [ref=e131]: 2.4 MB
          - generic [ref=e133]:
            - generic [ref=e134]:
              - img [ref=e136]
              - generic [ref=e139]: 24h 请求
            - paragraph [ref=e140]: 1,247
          - generic [ref=e142]:
            - generic [ref=e143]:
              - img [ref=e145]
              - generic [ref=e148]: 可用性
            - paragraph [ref=e149]: 99.97%
        - generic [ref=e150]:
          - generic [ref=e153]:
            - generic [ref=e154]:
              - paragraph [ref=e155]: 活跃用户
              - paragraph [ref=e156]: "0"
            - img [ref=e157]
          - generic [ref=e164]:
            - generic [ref=e165]:
              - paragraph [ref=e166]: 本周新增
              - paragraph [ref=e167]: "0"
            - img [ref=e168]
          - generic [ref=e173]:
            - generic [ref=e174]:
              - paragraph [ref=e175]: 本月新增
              - paragraph [ref=e176]: "0"
            - img [ref=e177]
          - generic [ref=e181]:
            - generic [ref=e182]:
              - paragraph [ref=e183]: 管理员
              - paragraph [ref=e184]: "0"
            - img [ref=e185]
        - generic [ref=e187]:
          - tablist [ref=e188]:
            - tab "系统概览" [selected] [ref=e189] [cursor=pointer]:
              - img [ref=e190]
              - text: 系统概览
            - tab "用户管理" [ref=e192] [cursor=pointer]:
              - img [ref=e193]
              - text: 用户管理
            - tab "空间管理" [ref=e198] [cursor=pointer]:
              - img [ref=e199]
              - text: 空间管理
            - tab "WorkBuddy" [ref=e202] [cursor=pointer]:
              - img [ref=e203]
              - text: WorkBuddy
          - tabpanel "系统概览" [ref=e206]:
            - generic [ref=e207]:
              - generic [ref=e209]:
                - generic [ref=e210]:
                  - img [ref=e211]
                  - text: 最近活动
                - generic [ref=e213]: 系统最近操作日志
              - generic [ref=e215]:
                - generic [ref=e217]:
                  - img [ref=e218]
                  - text: 系统健康状态
                - generic [ref=e221]:
                  - generic [ref=e222]:
                    - generic [ref=e223]:
                      - generic [ref=e224]:
                        - text: API 服务
                        - paragraph [ref=e225]: Edge Functions
                      - generic [ref=e226]: 正常
                    - generic [ref=e227]:
                      - generic [ref=e228]:
                        - text: KV 存储
                        - paragraph [ref=e229]: EdgeOne KV
                      - generic [ref=e230]: 正常
                    - generic [ref=e231]:
                      - generic [ref=e232]:
                        - text: Cloud Functions
                        - paragraph [ref=e233]: Node.js Runtime
                      - generic [ref=e234]: 正常
                    - generic [ref=e235]:
                      - generic [ref=e236]:
                        - text: ArXiv 搜索
                        - paragraph [ref=e237]: 外部服务
                      - generic [ref=e238]: 正常
                  - generic [ref=e239]:
                    - heading "性能指标" [level=4] [ref=e240]
                    - generic [ref=e241]:
                      - generic [ref=e243]:
                        - generic [ref=e244]: 平均响应时间
                        - generic [ref=e245]: 45ms
                      - generic [ref=e249]:
                        - generic [ref=e250]: 错误率
                        - generic [ref=e251]: 0.03%
      - generic [ref=e256]:
        - paragraph [ref=e257]:
          - generic [ref=e258]: © 2026 Academic Hub. All rights reserved.
        - generic [ref=e259]:
          - link "粤ICP备2026052655号-1" [ref=e260] [cursor=pointer]:
            - /url: https://beian.miit.gov.cn/
          - generic [ref=e261]: "|"
          - link "公安备案" [ref=e262] [cursor=pointer]:
            - /url: https://beian.mps.gov.cn/#/
  - region "Notifications alt+T":
    - list:
      - listitem [ref=e263]:
        - button "Close toast" [ref=e264] [cursor=pointer]:
          - img [ref=e265]
        - img [ref=e269]
        - generic [ref=e272]: 加载管理数据失败
      - listitem [ref=e273]:
        - button "Close toast" [ref=e274] [cursor=pointer]:
          - img [ref=e275]
        - img [ref=e279]
        - generic [ref=e282]: 加载管理数据失败
```

# Test source

```ts
  1  | // ─────────────────────────────────────────────────
  2  | // Admin — Stats, user management, spaces, workbuddy
  3  | // ─────────────────────────────────────────────────
  4  | import { test, expect } from './fixtures';
  5  | 
  6  | test.describe('Admin Page', () => {
  7  |   test('should load admin dashboard', async ({ authedPage: page }) => {
  8  |     await page.goto('/#/admin');
  9  |     // Wait for admin page content to load (replaces loading spinner)
  10 |     await page.waitForTimeout(2000);
  11 | 
  12 |     await expect(page.locator('body')).toBeVisible();
  13 |     // Check for admin header or tabs
  14 |     const bodyText = await page.locator('body').textContent();
  15 |     expect(bodyText).toContain('管理后台');
  16 |   });
  17 | 
  18 |   test('should display system statistics cards', async ({ authedPage: page }) => {
  19 |     await page.goto('/#/admin');
  20 |     await page.waitForTimeout(2000);
  21 | 
  22 |     // Wait for loading to finish
  23 |     await expect(page.locator('body')).toBeVisible();
  24 |     const bodyText = await page.locator('body').textContent();
  25 |     // Stats grid should show labels
> 26 |     expect(bodyText).toContain('用户数');
     |                      ^ Error: expect(received).toContain(expected) // indexOf
  27 |   });
  28 | 
  29 |   test('should show user management tab', async ({ authedPage: page }) => {
  30 |     await page.goto('/#/admin');
  31 |     await page.waitForTimeout(2000);
  32 | 
  33 |     const usersTab = page.getByRole('tab', { name: /用户管理/ });
  34 |     await usersTab.click();
  35 |     await page.waitForTimeout(500);
  36 |     await expect(page.locator('body')).toBeVisible();
  37 |     const bodyText = await page.locator('body').textContent();
  38 |     expect(bodyText).toContain('用户列表');
  39 |   });
  40 | 
  41 |   test('should show spaces management tab', async ({ authedPage: page }) => {
  42 |     await page.goto('/#/admin');
  43 |     await page.waitForTimeout(2000);
  44 | 
  45 |     const spacesTab = page.getByRole('tab', { name: /空间管理/ });
  46 |     await spacesTab.click();
  47 |     await page.waitForTimeout(500);
  48 |     await expect(page.locator('body')).toBeVisible();
  49 |     const bodyText = await page.locator('body').textContent();
  50 |     expect(bodyText).toContain('空间管理');
  51 |   });
  52 | 
  53 |   test('should deny access to non-admin users', async ({ userPage: page }) => {
  54 |     await page.goto('/#/admin');
  55 |     await page.waitForTimeout(2000);
  56 | 
  57 |     // RequireAdmin redirects non-admin to gallery "/"
  58 |     const bodyText = await page.locator('body').textContent();
  59 |     // Should show gallery content (redirected away from admin)
  60 |     const redirectedToGallery = bodyText?.includes('学术') || !bodyText?.includes('管理后台');
  61 |     expect(redirectedToGallery).toBeTruthy();
  62 |   });
  63 | });
  64 | 
```