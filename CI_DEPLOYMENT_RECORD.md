# GitHub → Cloudflare Pages 部署记录

> 项目：公众号AI排版助手 (wechat-formatter)
> 生产域名：https://wechat-formatter-d4c.pages.dev
> GitHub：https://github.com/gsqywd861/wechat-formatter

---

## 部署架构

```
Git Push → GitHub Actions → npm run cf:build → wrangler pages deploy → Cloudflare Pages
                 ↑                                       ↑
            (自动触发)                      (CLOUDFLARE_API_TOKEN 认证)
```

**Cloudflare 内置 CI 已关闭**，只走 GitHub Actions。

---

## 关键配置

### GitHub Secrets

| Name | 说明 | 来源 |
|------|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | Cloudflare Dashboard → API Tokens |

**Token 权限**：`Cloudflare Pages: Edit` + `Workers: Edit`（所有账户）

### Cloudflare 项目

| 配置 | 值 |
|------|-----|
| Account ID | `f7b557e9d4336308f80599c462c783a3` |
| 项目名 | `wechat-formatter` |
| 生产分支 | `main` |
| KV 绑定 | `config_store` → `32420498d6664ee1bcbd2922ea3f9ac6` |

### wrangler.jsonc

```json
{
  "name": "wechat-formatter",
  "pages_build_output_dir": ".open-next",
  "compatibility_date": "2026-05-01",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "kv_namespaces": [
    {
      "binding": "config_store",
      "id": "32420498d6664ee1bcbd2922ea3f9ac6"
    }
  ]
}
```

### GitHub Actions 工作流 (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run cf:build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: f7b557e9d4336308f80599c462c783a3
          command: pages deploy .open-next --project-name wechat-formatter --branch main
```

### 构建脚本 (`package.json`)

```json
"cf:build": "opennextjs-cloudflare build && cp _worker.js .open-next/_worker.js && mv .open-next/assets/_next .open-next/ 2>/dev/null; mv .open-next/assets/*.png .open-next/ 2>/dev/null; mv .open-next/assets/*.svg .open-next/ 2>/dev/null; rm -rf .open-next/assets 2>/dev/null"
```

构建步骤：Next.js 编译 → OpenNext 打包 → 替换 _worker.js → 整理资产目录

### _worker.js 关键要点

自定义 Cloudflare Pages Functions 入口，最关键的修正是 **`env.ASSETS.fetch()` 必须传 URL 字符串**：

```js
// ✅ 正确方式
const assetUrl = new URL(url.pathname, "https://assets.local");
const assetResponse = await env.ASSETS.fetch(assetUrl.toString());

// ❌ 错误方式（会导致 404）
const assetResponse = await env.ASSETS.fetch(request);
```

所有相对路径的 ES module 导入由 Workerd 原生解析，**不需要 esbuild 打包**。

---

## 常用命令

```bash
# 本地构建
npm run cf:build

# 手动部署到生产
npx wrangler pages deploy .open-next --project-name wechat-formatter --branch main

# 手动部署到预览（临时 URL）
npx wrangler pages deploy .open-next --project-name wechat-formatter
```

---

## 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| JS/CSS 返回 404 | `env.ASSETS.fetch(request)` 传 Request 对象 | 改传 URL 字符串 |
| 部署报错 "Dynamic require of fs" | esbuild 打包了 Next.js 内部代码 | 移除 esbuild，用原生 ES module |
| 内置 CI 覆盖手动部署 | GitHub 集成自动触发 Cloudflare 构建 | API 关闭 `deployments_enabled: false` |
| git push 失败 (HTTPS) | Token 过期或缺少 scope | 生成新 token，勾选 `repo` + `workflow` |
| git push 失败 (SSH) | 私钥有密码 | `ssh-add ~/.ssh/id_ed25519` 添加到 agent |

---

## 账号信息

| 平台 | 说明 |
|------|------|
| GitHub | gsqywd861 |
| Cloudflare | Wd861@msn.cn's Account (ID: f7b557e9d4336308f80599c462c783a3) |
| Wrangler OAuth | `~/.wrangler/config/default.toml` |
