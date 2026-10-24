# Ghi Janicr 个人主页

推广远程线上工作与 AI 技能项目的静态个人主页，纯 HTML / CSS / JS，无需构建。

## 目录

- `site/` 网站文件（`index.html`、`style.css`、`script.js` 等）
- `.github/workflows/deploy.yml` 推送到 `main` 后自动部署到 Cloudflare Pages

## 自动部署

仓库需要两个 Actions Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。
之后每次修改并推送到 `main`，网站会在一两分钟内自动更新。

## 修改内容

- 文字与平台列表：`site/index.html`
- 样式与配色：`site/style.css`（顶部 `:root` 变量）
- 联系邮箱：在 `site/index.html` 搜索 `hello@example.com` 替换
