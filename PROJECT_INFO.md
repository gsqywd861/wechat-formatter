# 公众号AI排版助手 — 项目资料汇总

> 记录时间：2026-05-02
> 记录人：Jarvis

---

## 一、项目概述

| 项目 | 内容 |
|------|------|
| 项目名称 | 公众号AI排版助手 (WeChat Formatter) |
| 功能 | Markdown转微信排版，AI一键优化排版结构，80+套模板 |
| 本地目录 | `/Users/wangdong/workspace/clawbot/wechat-formatter` |
| 技术栈 | Next.js 16.2.4 (App Router) + React 19 + Tailwind CSS 4 + TypeScript |

---

## 二、源代码管理

| 项目 | 内容 |
|------|------|
| GitHub 仓库地址 | `https://github.com/gsqywd861/wechat-formatter` |
| 远程仓库 (origin) | `https://github.com/gsqywd861/wechat-formatter.git` |
| 默认分支 | `main` |
| Git 用户名 | `gsqywd` |
| Git 邮箱 | `gsqywd@users.noreply.github.com` |
| GitHub PAT Token | `ghp_***` (已记录在本地，请勿提交到 Git) |

---

## 三、部署平台

### 3.1 Cloudflare Workers（主部署）

| 项目 | 内容 |
|------|------|
| 平台 | Cloudflare Workers |
| 账户邮箱 | wd861@msn.cn |
| 账户名 | Wd861@msn.cn's Account |
| Account ID | `f7b557e9d4336308f80599c462c783a3` |
| Worker 名称 | `wechat-ai-formatter` |
| Worker 访问地址 | ~~`https://wechat-ai-formatter.wd861.workers.dev`~~ (国内不可用) |
| 自定义域名 | ~~`https://gsqywd.cn.mt`~~ (已停用) → **`https://wechat-formatter-d4c.pages.dev`** ✅ (Cloudflare Pages) |
| 部署命令 | `npm run cf:build && npm run cf:deploy` |
| 配置文件 | `wrangler.jsonc` (项目根目录) |

### 3.2 GitHub Pages（域名验证用途）

| 项目 | 内容 |
|------|------|
| Pages URL | `https://gsqywd861.github.io/wechat-formatter/` |
| 自定义域名 | `gsqywd.cn.mt` (已停用，改 Cloudflare Pages) |
| 构建来源 | `main` 分支，根目录 `/` |

---

## 四、域名与DNS

| 项目 | 内容 |
|------|------|
| 访问域名 | `gsqywd.cn.mt` (已停用) → `wechat-formatter-d4c.pages.dev` |
| DNS 提供商 | **DNSHE**（`my.dnshe.com`） |
| DNSHE API 地址 | `https://api005.dnshe.com/index.php?m=domain_hub` |
| DNSHE API Key | `cfsd_***` (已记录在本地) |
| DNSHE API Secret | `4354***` (已记录在本地) |
| Cloudflare Zone | `cn.mt` (Zone ID: `a7e6a9b32fb12f809d31763504012fd8`) |
| Cloudflare Nameservers | `edna.ns.cloudflare.com` / `ned.ns.cloudflare.com` |

### DNSHE API 使用方法
```bash
# 认证方式：Header（密钥已记录在本地）
X-API-Key: <API Key>
X-API-Secret: <API Secret>

# 子域名ID：392681
# 域名：gsqywd.cn.mt（已停用，切到 Cloudflare Pages）

## 部署平台 · 当前使用：Cloudflare Pages（2026-05-04 起）

| 项目 | 内容 |
|------|------|
| 平台 | Cloudflare Pages |
| Pages 域名 | `https://wechat-formatter-d4c.pages.dev` |
| 部署方式 | `npm run build && npx wrangler pages deploy .open-next` |
```

---

## 五、线上地址汇总

| 用途 | URL | 状态 |
|------|-----|------|
| 主站（推荐） | `https://wechat-formatter-d4c.pages.dev` | ✅ Cloudflare Pages |
| Cloudflare Worker | `https://wechat-ai-formatter.wd861.workers.dev` | ❌ 国内不可用 |
| GitHub Pages | `https://gsqywd861.github.io/wechat-formatter/` | ❌ 无API路由 |
| GitHub 仓库 | `https://github.com/gsqywd861/wechat-formatter` | ✅ |

---

## 六、常用命令

```bash
# 本地开发
cd /Users/wangdong/workspace/clawbot/wechat-formatter
npm run dev

# 构建和部署到 Cloudflare Workers
npm run cf:build
npm run cf:deploy

# Git 操作
git push origin main
```

---

## 七、项目配置

| 文件 | 说明 |
|------|------|
| `wrangler.jsonc` | Cloudflare Workers 部署配置 |
| `next.config.ts` | Next.js 配置 + Cloudflare 开发模式 |
| `.dev.vars` | 开发环境密钥（本地使用） |
| `lib/site-config.ts` | 站点品牌、URL 等 SEO 常量 |
| `package.json` | 项目依赖和脚本 |

---

> ⚠️ **注意：** API Key 和 Token 已记录在此文件中，请妥善保管，勿公开分享。
