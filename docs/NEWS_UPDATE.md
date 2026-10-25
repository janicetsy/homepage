# AI 资讯每日更新说明（下午 2 点任务）

网站的“AI 资讯”（首页预览 + https://90yu.kdns.fr/news ）完全由一个数据文件驱动：

- **唯一需要更新的文件：** `site/data/news.json`（用脚本合并，不要手改）
- **脚本：** `scripts/news.py`（只用 Python 标准库）
- 推送到 `main` 后，GitHub Actions 会先运行 `scripts/daily.py validate` 和 `scripts/news.py validate`，都通过才部署到 Cloudflare Workers；校验失败则不部署，线上保持上一版。
- 中午的“每日机会”是另一个文件 `site/data/daily.json`，见 `docs/DAILY_UPDATE.md`，两者互不影响。

## 每天的步骤

1. 把当天的资讯写成一个 day 对象（格式见下），保存为 `/tmp/news-day.json`。
2. 在仓库根目录合并并校验：
   ```bash
   cd /workspace/homepage
   git pull --ff-only origin main     # 中午任务可能刚推送过，先同步
   python3 scripts/news.py add /tmp/news-day.json
   ```
   同一日期会被替换（可以重跑），自动从新到旧排序、更新 `updated`、只保留最近 60 天。
3. 提交并推送：
   ```bash
   git add site/data/news.json
   git -c user.name="Ghi Janicr" -c user.email="janicetsy@users.noreply.github.com" commit -m "AI news YYYY-MM-DD"
   GHT="<GitHub token>"; AUTH=$(printf 'x-access-token:%s' "$GHT" | base64 -w0)
   git -c credential.helper= -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $AUTH" push origin main
   ```
   `git pull` 同样需要带上这个 `-c http...extraheader` 参数。推送后约 1 分钟上线。

## day 对象格式

```json
{
  "date": "2026-10-24",
  "summary": "一两句话概括今天的重点。",
  "software": [
    {
      "title": "简短标题",
      "desc": "一两句说明是什么、能做什么",
      "note": "注意事项／适用范围，例如“不是新模型发布”“目前仅美国 Pro 用户”，没有就填空字符串",
      "date": "YYYY-MM-DD（官方发布日期，不确定就填空字符串）",
      "url": "https://官方来源",
      "source": "来源名称，例如 NVIDIA 博客"
    }
  ],
  "github_source": "https://github.com/trending?since=daily",
  "github": [
    {
      "repo": "owner/name",
      "url": "https://github.com/owner/name",
      "desc": "一句话说明",
      "note": "注意事项，例如系统要求、授权、伦理提醒",
      "stars_today": 2716
    }
  ]
}
```

规则：

- 所有字符串字段都必须存在，没有内容就填 `""`。`software[].url` 必须是 https 官方来源；`github[].url` 必须是 `https://github.com/` 链接；`stars_today` 是整数（查看时的“今日新增 Star”），未知填 `null`。
- 没有内容的部分填 `[]`；页面会显示“这一天没有收录……”。
- 首页预览显示 `software` 前 3 条和 `github` 前 4 条，所以请按重要程度、Star 数从高到低排列。

## 内容规则

- 只发布报告里有官方来源链接的条目，保留原报告的注意事项（例如“不是新模型”“地区限制”“需要授权”“克隆声音须取得许可”）。
- **大陆免费 eSIM 试用部分不发布到网站**：与网站的 AI 赚钱/AI 技能主题不符，且属于有时效、有地区限制的优惠。校验会拦截含 “eSIM” 字样的数据。
- 不要出现私人内容（签到、账户、本地文件路径、令牌），校验也会拦截。
