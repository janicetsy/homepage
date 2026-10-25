# Ghi Janicr 个人主页

线上地址：https://90yu.kdns.fr

推广远程线上工作与 AI 技能项目的静态个人主页，纯 HTML / CSS / JS，无需构建。

## 目录

- `site/` 网站文件（`index.html`、`style.css`、`script.js` 等）
- `site/data/daily.json` 每日 AI 机会数据（首页预览和 /daily 页面读取它）
- `scripts/daily.py` 每日数据合并与校验；`docs/DAILY_UPDATE.md` 每日更新说明
- `site/data/news.json` AI 资讯与 GitHub 热门数据（首页预览和 /news 页面读取它）
- `scripts/news.py` 资讯数据合并与校验；`docs/NEWS_UPDATE.md` 资讯更新说明
- `wrangler.jsonc` Cloudflare Workers 静态网站配置（绑定 90yu.kdns.fr）
- `.github/workflows/deploy.yml` 推送到 `main` 后自动部署到 Cloudflare Workers

## 自动部署

仓库需要两个 Actions Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。
之后每次修改并推送到 `main`，网站会在一两分钟内自动更新。

## 修改内容

- 文字与平台列表：`site/index.html`
- 样式与配色：`site/style.css`（顶部 `:root` 变量）
- 联系邮箱：在 `site/index.html` 搜索 `mailto:` 修改
