# white_catj's Blog

Hexo 8 + Landscape 主题，发布在 **https://whitecatj.github.io/**

## 仓库结构

| 分支 | 内容 | 你要不要动 |
|---|---|---|
| `main` | Hexo 源：文章 markdown、站点配置、构建脚本 | **平时只改这个分支** |
| `master` | 编译产物（HTML/CSS/JS） | 由 Actions 自动生成，**不要手改** |

往 `main` 推送后，GitHub Actions 会自动编译（1 分钟左右）并把产物发布到 `master`，
GitHub Pages 再从 `master` 更新线上站点。整套流程不需要你本地装任何东西。

## 在网站上写文章（推荐）

1. 打开 <https://github.com/whitecatj/whitecatj.github.io/tree/main/source/_posts>
2. 右上角 **Add file → Create new file**，文件名写成 `文章标题.md`
3. 内容按这个格式写：

````markdown
---
title: "文章标题"
date: 2026-10-12 20:30:00
tags:
  - "题解"
---

这里开始写正文，markdown 语法随便用。

<!-- more -->

摘要标记这行以下的内容，不会出现在首页列表里。
````

4. 拉到底部点 **Commit changes**
5. 等 1 分钟左右，站点自动更新（可以在仓库的 **Actions** 标签页看构建进度）

> 小技巧：在仓库页面按一下 `.` 键，会打开网页版 VS Code，写 markdown 体验接近本地编辑器。

几个注意点：

- `title` 和 `date` 一定要手写（不写 date 的话会用构建时间，日期就乱了）
- 文件名（`文章标题.md`）决定网址的最后一段，比如 `浅谈LCA.md` → `/2026/10/12/浅谈LCA/`；中文会自动转义成 `%E6%B5%85...`，正常现象
- `tags` 里填过的标签会出现在 `/tags/` 页面

## 本地写作（可选）

如果哪天想在本机写：

```bash
cd my-blog
node node_modules/hexo/bin/hexo new "文章标题"     # 新建
node node_modules/hexo/bin/hexo server            # 本地预览 http://localhost:4000
node node_modules/hexo/bin/hexo clean && node node_modules/hexo/bin/hexo generate   # 编译
```

本地改完后把文件 commit 推到 `main` 分支，同样会触发自动发布。

## 目录说明

```
_config.yml                    站点配置（标题、URL、permalink、代码高亮等）
package.json / package-lock.json 依赖清单，Actions 用它们还原环境
source/_posts/*.md             文章源文件（16 篇老文章已迁移到这里）
.github/workflows/deploy.yml   自动构建发布脚本
tools/                         本地工具（迁移脚本、API 发布脚本），不参与构建
```

## 与 2020 年旧站的差异

- 代码块 DOM：新版 Hexo 把行号列与代码列合并在同一表格行内，显示效果相同
- 少数正文里的 `_下划线_` 现在会正确渲染成斜体（旧版原样输出下划线字符）
- 主题静态资源（fancybox、jQuery）是新版打包的，文件名不同，页面表现一致
