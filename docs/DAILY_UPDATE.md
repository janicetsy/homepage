# 每日机会更新说明

网站的“每日机会”（首页预览 + https://90yu.kdns.fr/daily ）完全由一个数据文件驱动：

- **唯一需要更新的文件：** `site/data/daily.json`
- 推送到 `main` 后，GitHub Actions 会先运行 `python3 scripts/daily.py validate`，通过才部署到 Cloudflare Workers；校验失败则不部署，线上保持上一版。

## 每天的步骤

1. 把当天的机会写成一个 day 对象，保存为临时文件，例如 `/tmp/day.json`（格式见下）。
2. 在仓库根目录运行：`python3 scripts/daily.py add /tmp/day.json`
   - 同一日期会被替换（可以重跑），自动按日期从新到旧排序、更新 `updated`、只保留最近 60 天，并做校验。
3. 提交并推送 `site/data/daily.json`：
   ```bash
   git add site/data/daily.json
   git commit -m "Daily picks YYYY-MM-DD"
   git push origin main
   ```

## day 对象格式

```json
{
  "date": "2026-10-24",
  "summary": "一两句话概括今天的情况（也可以写“今天没有核实到新的香港可申请机会”）。",
  "items": [
    {
      "title": "职位或项目名称",
      "org": "公司／平台",
      "category": "job",
      "hk": "yes",
      "hk_note": "地区说明，没有就填空字符串",
      "location": "香港中西区 · 全职",
      "pay": "按原页面写，未披露就写“未披露”",
      "requirements": ["要点 1", "要点 2"],
      "posted": "2026-10-23 或 “查看时显示 1 天前”",
      "deadline": "YYYY-MM-DD 或空字符串",
      "note": "申请方式、状态等补充，没有就填空字符串",
      "url": "https://原职位页",
      "source": "JobsDB"
    }
  ],
  "excluded": [
    { "title": "被排除的项目", "reason": "例如：原页面已不再接受申请" }
  ]
}
```

字段取值：

- `category`：`job`（香港职位）、`remote`（远程 AI 任务）、`freelance`（自由职业）、`followup`（持续跟进）
- `hk`：`yes`（职位在香港或原页面明确开放香港）、`no`（原页面明确不含香港）、`unknown`（未说明／待确认）
- 所有字符串字段都必须存在；没有内容就填 `""`。`url` 必须是 https 原页面。

## 内容规则

- 只发布报告里已核实原页面的机会；薪酬、币种、周期、地区照原页面写，不自行推算。
- 只放“AI 赚钱机会”部分；签到、账户、截图路径等私人内容不能出现（校验会拦截 GLaDOS、签到、本地路径等字样）。
- 措辞面向公开读者：写“申请页需登录，后续表单未核实”，不要写“未代为申请”之类的内部说明。
- 没有新机会的日子也可以发布一天，`items` 留空数组，在 `summary` 里说明。
