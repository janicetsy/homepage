#!/usr/bin/env python3
"""AI 资讯数据工具（只用标准库）。

用法：
  python3 scripts/news.py validate                 # 校验 site/data/news.json
  python3 scripts/news.py add path/to/day.json     # 合并一天的数据（同日期则替换），再校验
  python3 scripts/news.py add -                    # 从标准输入读取 day 对象

day 对象格式见 docs/NEWS_UPDATE.md。
"""
import json, re, sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site" / "data" / "news.json"
MAX_DAYS = 60
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
REPO_RE = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
SOFT_STR = ["title", "desc", "note", "date", "url", "source"]
GH_STR = ["repo", "url", "desc", "note"]
# 私人或与主题无关的内容不得出现在公开网站上
FORBIDDEN = ["glados", "签到", "/workspace/", "/home/ubuntu", "{{secret", "ghp_", "github_pat_", "cfat_", "esim"]


def https_ok(u, host=None):
    p = urlparse(u or "")
    if p.scheme != "https" or not p.netloc:
        return False
    return host is None or p.netloc.lower() in {host, "www." + host}


def check_day(day, errs, where):
    if not isinstance(day, dict):
        errs.append(f"{where}: 必须是对象"); return
    if not DATE_RE.match(str(day.get("date", ""))):
        errs.append(f"{where}.date 必须是 YYYY-MM-DD")
    if not isinstance(day.get("summary", ""), str):
        errs.append(f"{where}.summary 必须是字符串")
    sw, gh = day.get("software"), day.get("github")
    if not isinstance(sw, list):
        errs.append(f"{where}.software 必须是数组（没有就填 []）"); sw = []
    if not isinstance(gh, list):
        errs.append(f"{where}.github 必须是数组（没有就填 []）"); gh = []
    for i, it in enumerate(sw):
        w = f"{where}.software[{i}]"
        if not isinstance(it, dict):
            errs.append(f"{w}: 必须是对象"); continue
        for k in SOFT_STR:
            if not isinstance(it.get(k), str):
                errs.append(f"{w}.{k} 缺失或不是字符串（没有就填空字符串）")
        if not it.get("title"):
            errs.append(f"{w}.title 不能为空")
        if not https_ok(it.get("url")):
            errs.append(f"{w}.url 必须是 https 官方来源链接")
        if it.get("date") and not DATE_RE.match(it["date"]):
            errs.append(f"{w}.date 为空或 YYYY-MM-DD")
    for i, it in enumerate(gh):
        w = f"{where}.github[{i}]"
        if not isinstance(it, dict):
            errs.append(f"{w}: 必须是对象"); continue
        for k in GH_STR:
            if not isinstance(it.get(k), str):
                errs.append(f"{w}.{k} 缺失或不是字符串（没有就填空字符串）")
        if not REPO_RE.match(it.get("repo", "") or ""):
            errs.append(f"{w}.repo 必须是 owner/name")
        if not https_ok(it.get("url"), "github.com"):
            errs.append(f"{w}.url 必须是 https://github.com/ 仓库链接")
        s = it.get("stars_today")
        if s is not None and (not isinstance(s, int) or isinstance(s, bool) or s < 0):
            errs.append(f"{w}.stars_today 必须是非负整数或 null")
    src = day.get("github_source", "")
    if not isinstance(src, str) or (src and not https_ok(src, "github.com")):
        errs.append(f"{where}.github_source 为空或 https://github.com/trending 链接")


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
    if len(sys.argv) < 2 or sys.argv[1] not in {"validate", "add"} or (sys.argv[1] == "add" and len(sys.argv) < 3):
        print(__doc__); sys.exit(2)
    doc = json.loads(DATA.read_text(encoding="utf-8"))
    if sys.argv[1] == "add":
        raw = sys.stdin.read() if sys.argv[2] == "-" else Path(sys.argv[2]).read_text(encoding="utf-8")
        day = json.loads(raw)
        day.setdefault("software", [])
        day.setdefault("github", [])
        day.setdefault("github_source", "https://github.com/trending?since=daily")
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
