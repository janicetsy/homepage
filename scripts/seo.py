#!/usr/bin/env python3
"""搜索引擎相关工具（只用标准库）。

  python3 scripts/seo.py sitemap     # 按 daily.json / news.json 的更新日期生成 site/sitemap.xml
  python3 scripts/seo.py indexnow    # 把主要网址提交给 IndexNow（Bing、Yandex 等共享）

CI 每次部署前运行 sitemap，部署成功后运行 indexnow。
"""
import json, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
HOST = "90yu.kdns.fr"
BASE = f"https://{HOST}"
INDEXNOW_KEY = "b5b6cd14a9a2fbcb4a705554a71ed93f"   # 对应 site/<key>.txt


def updated(name):
    try:
        return json.loads((SITE / "data" / name).read_text(encoding="utf-8")).get("updated", "")
    except Exception:
        return ""


def pages():
    d, n = updated("daily.json"), updated("news.json")
    home = max(x for x in (d, n, "2026-10-24") if x)
    return [
        ("/", home, "daily", "1.0"),
        ("/daily", d or home, "daily", "0.9"),
        ("/news", n or home, "daily", "0.8"),
    ]


def sitemap():
    rows = [f"  <url>\n    <loc>{BASE}{p}</loc>\n    <lastmod>{lm}</lastmod>\n"
            f"    <changefreq>{cf}</changefreq>\n    <priority>{pr}</priority>\n  </url>"
            for p, lm, cf, pr in pages()]
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(rows) + "\n</urlset>\n")
    (SITE / "sitemap.xml").write_text(xml, encoding="utf-8")
    print(f"已生成 site/sitemap.xml（{len(rows)} 个网址）")


def indexnow():
    body = json.dumps({
        "host": HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": f"{BASE}/{INDEXNOW_KEY}.txt",
        "urlList": [BASE + p for p, *_ in pages()],
    }).encode()
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, method="POST",
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print("IndexNow 已提交，HTTP", r.status)
    except urllib.error.HTTPError as e:
        # 202 = 已接收待验证；4xx 时打印原因但不让部署失败
        print("IndexNow 返回 HTTP", e.code, e.read()[:200])
    except Exception as e:
        print("IndexNow 提交失败：", e)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "sitemap":
        sitemap()
    elif cmd == "indexnow":
        indexnow()
    else:
        print(__doc__); sys.exit(2)
