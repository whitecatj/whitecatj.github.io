# white_catj's Blog

Hexo 8 + 自定义主题 winterwind，发布在 **https://winterwindww.github.io/**

## 仓库结构

| 分支 | 内容 | 你要不要动 |
|---|---|---|
| `main` | Hexo 源：文章 markdown、站点配置、构建脚本 | **平时只改这个分支** |
| `master` | 编译产物（HTML/CSS/JS） | 由 Actions 自动生成，**不要手改** |

往 `main` 推送后，GitHub Actions 会自动编译（1 分钟左右）并把产物发布到 `master`，
GitHub Pages 再从 `master` 更新线上站点。整套流程不需要你本地装任何东西。

## 网页后台 <https://winterwindww.github.io/admin/>

写文章、传图片都在这里做，不用碰 git。

1. 第一次打开要粘贴一个 GitHub Token（页面上有拿 token 的图文步骤，Fine-grained token，
   只勾选本仓库，**Contents 权限设为 Read and write**）
2. Token 只存在你自己这台浏览器里，换设备要重新粘一次
3. 支持：文章列表 / 新建 / 编辑 / 删除、Markdown 预览、语法速查、图片上传、优先级、构建状态

保存时它直接提交到 `main` 分支，同样会触发 Actions 自动发布。

## 文章优先级（置顶）

在文章 front-matter 里加一个 `sticky` 字段，数字越大越靠前：

```markdown
---
title: "文章标题"
date: 2026-10-12 20:30:00
sticky: 10          # 不写或写 0 就是普通文章
tags:
  - "题解"
---
```

首页的排序规则是**先按 `sticky` 从大到小，`sticky` 相同的再按日期从新到旧**；
被置顶的文章，日期旁边会显示一个「置顶」小标签。

`priority` 和 `sticky` 是同义词，写哪个都行（两个都写时以 `sticky` 为准），
后台里对应的输入框叫「优先级」。

> 只影响首页列表。`/archives/` 归档页仍然保持纯时间倒序，作为「全部文章按时间翻」的入口。

## 上传图片

后台的正文区域支持三种上传方式，传完会自动把 markdown 插到光标处：

- 点「＋ 上传图片」选文件（可以多选）
- 把图片直接拖进正文框
- 复制图片后在正文框里 `Ctrl+V`
- 切到「图片」页签能看到所有已上传的图，点一下插入，hover 右上角可以删

图片存在 `source/images/uploads/`，站点路径是 `/images/uploads/xxx.png`。
超过 1600px 或 1.2MB 的图会先在浏览器里压缩再传，避免仓库被大图撑爆。
上传只是提交图片，**文章本身还要再点一次「保存并发布」**。

## 首页摘要（`<!-- more -->`）

首页列表里，每篇文章默认显示**整篇正文**。长文章想只露个开头，就在正文里放一条
摘要分隔线。它是 Hexo 的约定写法 —— 一个独占一行的 HTML 注释：

```markdown
开头这一段会出现在首页……

<!-- more -->

剩下的内容只在文章详情页可见。
```

三种情况：

| 分隔线怎么写 | 首页显示什么 |
|---|---|
| 不写 | 整篇正文 |
| 写在正文中间 | 分隔线以上的内容 + 「阅读全文」链接 |
| 写在正文最前面 | 只有标题，完全不显示正文 |

**不用手打**：后台正文上方有「✂ 摘要分隔」按钮，把光标放到想断开的地方点一下就行，
快捷键是 `Ctrl+Shift+M`；正文下方的灰条会实时告诉你首页会长什么样。

两个坑后台已经帮你兜住了：

- **分隔线必须独占一行、前后各留一个空行。** 它是在 markdown 渲染成 HTML **之后**
  按字符串切分的，紧贴着文字写会切出残缺的 HTML，首页排版就乱了 —— 保存时会自动补好。
- 一篇里只认**第一条**，多余的会被清掉。

直接在 GitHub 上手写 markdown 时，`<!--more-->`、`<!-- more -->` 都能识别，
但建议统一写成 `<!-- more -->`。

## 在网站上写文章（推荐）

1. 打开 <https://github.com/Winterwindww/Winterwindww.github.io/tree/main/source/_posts>
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
_config.yml                      站点配置（标题、URL、permalink、代码高亮等）
package.json / package-lock.json 依赖清单，Actions 用它们还原环境
source/_posts/*.md               文章源文件
source/admin/index.html          网页后台（单文件，skip_render 原样拷贝，不经 Hexo 渲染）
source/images/uploads/           后台上传的图片
source/images/                   头像、背景图
themes/winterwind/               主题源码（layout / css / js）
scripts/                         构建期脚本（优先级归一化、KaTeX 前台渲染），随 Hexo 自动加载
.github/workflows/deploy.yml     自动构建发布脚本
```

## 与 2020 年旧站的差异

- 代码块 DOM：新版 Hexo 把行号列与代码列合并在同一表格行内，显示效果相同
- 少数正文里的 `_下划线_` 现在会正确渲染成斜体（旧版原样输出下划线字符）
- 主题静态资源（fancybox、jQuery）是新版打包的，文件名不同，页面表现一致

## 冬风主题

站点名称在 _config.yml 的 title 中修改，签名在 subtitle 中修改；当前为 Infinity，设为空字符串即可隐藏。头像与背景分别位于 source/images/avatar.jpg 和 source/images/celeste-summit.jpg。主题源码在 themes/winterwind，发布仍只推 main。
