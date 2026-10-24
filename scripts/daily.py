#!/usr/bin/env python3
"""每日机会数据工具（只用标准库）。

用法：
  python3 scripts/daily.py validate                 # 校验 site/data/daily.json
  python3 scripts/daily.py add path/to/day.json     # 把一天的数据合并进去（同日期则替换），再校验

day.json 是单个“day”对象，格式见 docs/DAILY_UPDATE.md。
"""
import json, re, sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site" / "data" / "daily.json"
MAX_DAYS = 60
CATEGORIES = {"job", "remote", "freelance", "followup"}
HK = {"yes", "no", "unknown"}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ITEM_STR = ["title", "org", "category", "hk", "hk_note", "location", "pay",
            "posted", "deadline", "note", "url", "source"]
# 私人内容不得出现在公开网站上
FORBIDDEN = ["glados", "签到", "/workspace/", "/home/ubuntu", "{{secret", "ghp_", "github_pat_", "cfat_"]


def check_day(day, errs, where):
    if not isinstance(day, dict):
        errs.append(f"{where}: 必须是对象"); return
    d = day.get("date", "")
    if not DATE_RE.match(str(d)):
        errs.append(f"{where}.date 必须是 YYYY-MM-DD")
    if not isinstance(day.get("summary", ""), str):
        errs.append(f"{where}.summary 必须是字符串")
    items = day.get("items")
    if not isinstance(items, list):
        errs.append(f"{where}.items 必须是数组"); items = []
    for i, it in enumerate(items):
        w = f"{where}.items[{i}]"
        if not isinstance(it, dict):
            errs.append(f"{w}: 必须是对象"); continue
        for k in ITEM_STR:
            if k not in it:
                errs.append(f"{w}.{k} 缺失（没有就填空字符串）")
            elif not isinstance(it[k], str):
                errs.append(f"{w}.{k} 必须是字符串")
        if not it.get("title"):
            errs.append(f"{w}.title 不能为空")
        if it.get("category") not in CATEGORIES:
            errs.append(f"{w}.category 必须是 {sorted(CATEGORIES)}")
        if it.get("hk") not in HK:
            errs.append(f"{w}.hk 必须是 {sorted(HK)}")
        u = urlparse(it.get("url", ""))
        if u.scheme != "https" or not u.netloc:
            errs.append(f"{w}.url 必须是 https 原页面链接")
        dl = it.get("deadline", "")
        if dl and not DATE_RE.match(dl):
            errs.append(f"{w}.deadline 为空或 YYYY-MM-DD")
        req = it.get("requirements", [])
        if not isinstance(req, list) or not all(isinstance(x, str) for x in req):
            errs.append(f"{w}.requirements 必须是字符串数组")
    ex = day.get("excluded", [])
    if not isinstance(ex, list):
        errs.append(f"{where}.excluded 必须是数组")
    else:
        for j, x in enumerate(ex):
            if not isinstance(x, dict) or not isinstance(x.get("title"), str) or not isinstance(x.get("reason", ""), str):
                errs.append(f"{where}.excluded[{j}] 需要 title / reason 字符串")


def validate(doc):
    errs = []
    if doc.get("schema") != 1:
        errs.append("schema 必须是 1")
    days = doc.get("days")
    if not isinstance(days, list) or not days:
        errs.append("days 必须是非空数组"); return errs
    for n, day in enumerate(days):
        check_day(day, errs, f"days[{n}]")
    dates = [d.get("date") for d in days if isinstance(d, dict)]
    if len(dates) != len(set(dates)):
        errs.append("days 中有重复日期")
    if dates != sorted(dates, reverse=True):
        errs.append("days 必须按日期从新到旧排列")
    if doc.get("updated") != dates[0]:
        errs.append("updated 必须等于最新一天的 date")
    if len(days) > MAX_DAYS:
        errs.append(f"最多保留 {MAX_DAYS} 天（运行 add 会自动裁剪）")
    blob = json.dumps(doc, ensure_ascii=False).lower()
    for bad in FORBIDDEN:
        if bad.lower() in blob:
            errs.append(f"包含不应公开的内容：{bad}")
    return errs


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in {"validate", "add"}:
        print(__doc__); sys.exit(2)
    doc = json.loads(DATA.read_text(encoding="utf-8"))
    if sys.argv[1] == "add":
        day = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
        day.setdefault("excluded", [])
        days = [d for d in doc.get("days", []) if d.get("date") != day.get("date")]
        days.append(day)
        days.sort(key=lambda d: d.get("date", ""), reverse=True)
        doc["days"] = days[:MAX_DAYS]
        doc["updated"] = doc["days"][0]["date"]
        doc["schema"] = 1
    errs = validate(doc)
    if errs:
        print("校验失败：")
        for e in errs:
            print("  -", e)
        sys.exit(1)
    if sys.argv[1] == "add":
        DATA.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"已写入 {DATA.relative_to(ROOT)}：{doc['updated']}，共 {len(doc['days'])} 天")
    else:
        print(f"校验通过：最新 {doc['updated']}，共 {len(doc['days'])} 天")


if __name__ == "__main__":
    main()
