# -*- coding: utf-8 -*-
"""把 public/ 目录同步发布到 GitHub（走 REST API，绕过本机 git push 被封的限制）。

用法（在 my-blog 目录下）:
    set GH_TOKEN=ghp_xxxxxxxx
    python tools/publish.py "Site updated: 2026-10-12 20:00:00"

发布内容 = 用 public/ 下的全部文件整体替换远端仓库的树。
只上传内容有变化的 blob，未变的文件直接复用远端已有对象。
"""
import base64
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
OWNER = "Winterwindww"
REPO = "Winterwindww.github.io"
BRANCH = "master"
API = f"https://api.github.com/repos/{OWNER}/{REPO}"
TOKEN = os.environ.get("GH_TOKEN", "")


def call(method, url, payload=None, retries=3):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {TOKEN}")
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("X-GitHub-Api-Version", "2022-11-28")
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read().decode("utf-8")
                return json.loads(body) if body.strip() else {}
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8")[:400]
            if e.code in (500, 502, 503, 429) and attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            raise RuntimeError(f"HTTP {e.code} {method} {url}\n{detail}")
        except (urllib.error.URLError, TimeoutError):
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            raise
    raise RuntimeError("unreachable")


def git_blob_sha(data: bytes) -> str:
    """按 git 对象格式算 sha1，用于和远端已有 blob 比对，避免重复上传。"""
    header = f"blob {len(data)}\0".encode()
    return hashlib.sha1(header + data).hexdigest()


def collect_files():
    files = []
    for base, _dirs, names in os.walk(PUBLIC):
        for n in names:
            full = os.path.join(base, n)
            rel = os.path.relpath(full, PUBLIC).replace("\\", "/")
            with open(full, "rb") as f:
                files.append((rel, f.read()))
    files.sort()
    return files


def remote_blob_shas():
    """收集远端当前 tree 中所有 blob 的 sha，用于复用。"""
    try:
        tree = call("GET", f"{API}/git/trees/{BRANCH}?recursive=1")
    except RuntimeError:
        return set()
    return {e["sha"] for e in tree.get("tree", []) if e.get("type") == "blob"}


def main():
    message = sys.argv[1] if len(sys.argv) > 1 else time.strftime("Site updated: %Y-%m-%d %H:%M:%S")
    if not TOKEN:
        sys.exit("错误：请先设置环境变量 GH_TOKEN")
    if not os.path.isdir(PUBLIC):
        sys.exit(f"错误：找不到 {PUBLIC}，请先执行 hexo generate")

    files = collect_files()
    print(f"public/ 下共 {len(files)} 个文件")

    existing = remote_blob_shas()
    print(f"远端已有 blob {len(existing)} 个，可直接复用")

    todo = []
    entries = []
    for rel, data in files:
        sha = git_blob_sha(data)
        if sha in existing:
            entries.append({"path": rel, "mode": "100644", "type": "blob", "sha": sha})
        else:
            todo.append((rel, data, sha))

    print(f"需要新上传 {len(todo)} 个 blob")

    def upload(item):
        rel, data, _sha = item
        res = call("POST", f"{API}/git/blobs", {
            "content": base64.b64encode(data).decode("ascii"),
            "encoding": "base64",
        })
        return rel, res["sha"]

    if todo:
        with ThreadPoolExecutor(max_workers=8) as pool:
            for rel, sha in pool.map(upload, todo):
                entries.append({"path": rel, "mode": "100644", "type": "blob", "sha": sha})

    entries.sort(key=lambda e: e["path"])

    ref = call("GET", f"{API}/git/ref/heads/{BRANCH}")
    head = ref["object"]["sha"]
    print(f"当前远端 HEAD: {head}")

    tree = call("POST", f"{API}/git/trees", {"tree": entries})
    print(f"新 tree: {tree['sha']}（{len(entries)} 个条目）")

    commit = call("POST", f"{API}/git/commits", {
        "message": message,
        "tree": tree["sha"],
        "parents": [head],
    })
    print(f"新提交: {commit['sha']}")

    call("PATCH", f"{API}/git/refs/heads/{BRANCH}", {"sha": commit["sha"], "force": False})
    print(f"已发布 -> https://github.com/{OWNER}/{REPO}/commit/{commit['sha']}")
    print(f"站点地址: https://winterwindww.github.io/")


if __name__ == "__main__":
    main()
