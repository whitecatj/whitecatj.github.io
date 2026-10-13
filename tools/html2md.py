# -*- coding: utf-8 -*-
"""把旧站（Hexo + Landscape）生成的 HTML 反向转换为 Hexo 的 markdown 源。

用法: python tools/html2md.py
输出: source/_posts/<slug>.md
"""
import os
import re
from datetime import datetime, timedelta, timezone

from bs4 import BeautifulSoup, NavigableString
from markdownify import MarkdownConverter

SNAPSHOT = r"C:/Users/PC/WorkBuddy/2026-10-12-10-19-16/blog-snapshot/winterwindww.github.io-b17a5511"
OUTDIR = r"C:/Users/PC/Desktop/my-blog/source/_posts"
TZ = timezone(timedelta(hours=8))  # 原站服务器按 UTC+8

POST_DIR_RE = re.compile(r"^\d{4}/\d{2}/\d{2}/.+$")


def yaml_str(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def collect_posts():
    posts = []
    for root, _dirs, files in os.walk(SNAPSHOT):
        if "index.html" not in files:
            continue
        rel = os.path.relpath(root, SNAPSHOT).replace("\\", "/")
        if POST_DIR_RE.match(rel):
            posts.append((rel, os.path.join(root, "index.html")))
    posts.sort()
    return posts


def extract_entry(entry):
    """返回 (markdown 正文, 代码块列表)"""
    # 1) 去掉标题锚点链接
    for a in entry.select("a.headerlink"):
        a.decompose()

    # 2) Pygments figure/table 代码块 -> 占位符
    blocks = []
    for fig in entry.select("figure.highlight"):
        classes = [c for c in (fig.get("class") or []) if c != "highlight"]
        lang = classes[0] if classes else ""
        code_lines = [pre.get_text() for pre in fig.select("td.code pre")]
        if not code_lines:                      # 兜底：直接取 figure 文本
            code_lines = fig.get_text().splitlines()
        blocks.append((lang, "\n".join(code_lines)))
        fig.replace_with(NavigableString(f"\n[[[CODEBLOCK_{len(blocks) - 1}]]]\n"))

    # 3) <!-- more --> 标记
    more = entry.find("a", id="more")
    if more is not None:
        more.replace_with(NavigableString("\n[[[MORE]]]\n"))

    # 4) 通用标签 -> markdown
    md = MarkdownConverter(
        heading_style="ATX",
        bullets="-",
        escape_asterisks=False,
        escape_underscores=False,
    ).convert_soup(entry)

    # 5) 占位符还原（放在最后，避免被转义）
    md = md.replace("[[[MORE]]]", "<!-- more -->")
    for i, (lang, code) in enumerate(blocks):
        fence = "```" if lang in ("", "plain") else f"```{lang}"
        md = md.replace(f"[[[CODEBLOCK_{i}]]]", f"{fence}\n{code}\n```")

    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    return md + "\n", blocks


def parse_post(path):
    with open(path, encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    art = soup.find("article", class_="article-type-post")
    if art is None:
        return None

    title_el = art.select_one("h1.article-title")
    title = title_el.get_text(strip=True) if title_el else ""

    time_el = art.select_one("time[datetime]")
    date_str = ""
    if time_el is not None:
        dt = datetime.fromisoformat(time_el["datetime"].replace("Z", "+00:00"))
        date_str = dt.astimezone(TZ).strftime("%Y-%m-%d %H:%M:%S")

    tags = [a.get_text(strip=True) for a in art.select("ul.article-tag-list a")]

    entry = art.select_one("div.article-entry")
    body, blocks = extract_entry(entry) if entry is not None else ("", [])

    return {"title": title, "date": date_str, "tags": tags, "body": body, "blocks": blocks}


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    posts = collect_posts()
    print(f"发现 {len(posts)} 篇文章\n")

    for rel, path in posts:
        slug = rel.split("/")[-1]
        info = parse_post(path)
        if info is None:
            print(f"  [跳过] {rel} (未找到 article 节点)")
            continue

        fm = ["---", f"title: {yaml_str(info['title'])}", f"date: {info['date']}"]
        if info["tags"]:
            fm.append("tags:")
            fm += [f"  - {yaml_str(t)}" for t in info["tags"]]
        fm.append("---")

        content = "\n".join(fm) + "\n\n" + info["body"]
        out = os.path.join(OUTDIR, f"{slug}.md")
        with open(out, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)

        print(f"  {rel}")
        print(f"      -> {slug}.md | title={info['title']} | date={info['date']} "
              f"| tags={info['tags']} | 代码块={len(info['blocks'])} | 正文={len(info['body'])}字")


if __name__ == "__main__":
    main()
