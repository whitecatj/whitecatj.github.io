/* global hexo */
'use strict';

/**
 * 站内搜索索引生成器 —— 产出 /search.json
 *
 * 为什么不用 hexo-generator-search / hexo-generator-searchdb：
 *   那两个是 npm 包，装完要同步 package-lock.json，会影响 CI 的 `npm ci`；
 *   而 Hexo 本身支持站点根目录的 `scripts/` 作为本地插件脚本，
 *   在这里注册一个 generator 就能产出索引，零依赖、零锁文件改动。
 *
 * 索引结构（数组，每篇文章一项）：
 *   {
 *     title: 标题
 *     url:   站内路径（root 拼接，如 /2019/11/29/约数和/）
 *     date:  发布日期 YYYY-MM-DD
 *     cats:  分类名数组
 *     tags:  标签名数组
 *     text:  正文纯文本（截断到 MAX_LEN，控制体积）
 *   }
 * 前端 themes/winterwind/source/js/search.js 拉取本文件做检索。
 */

// 每篇正文最多保留多少字符（够检索用，同时把 search.json 控制在几百 KB 内）
var MAX_LEN = 1500;

function stripHtml(html) {
  return String(html || '')
    // 脚本、样式、注释整块丢掉
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // KaTeX 会把公式原文塞进 annotation，是重复噪音，去掉
    .replace(/<annotation[\s\S]*?<\/annotation>/gi, ' ')
    // 其余标签全部剥掉，只留文本
    .replace(/<[^>]+>/g, ' ')
    // 常见命名实体
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    // 数字实体（如 Hexo 输出的 &#x2F; → /）
    .replace(/&#x([0-9a-f]+);/gi, function (m, hex) {
      var n = parseInt(hex, 16);
      return isFinite(n) ? String.fromCodePoint(n) : m;
    })
    .replace(/&#(\d+);/g, function (m, dec) {
      var n = parseInt(dec, 10);
      return isFinite(n) ? String.fromCodePoint(n) : m;
    })
    // &amp; 放最后，避免把 &amp;lt; 这类二次解码
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function toArray(query) {
  if (!query) return [];
  try {
    return query.toArray();
  } catch (e) {
    return [];
  }
}

hexo.extend.generator.register('search_index', function (locals) {
  var root = hexo.config.root || '/';
  if (root.charAt(root.length - 1) !== '/') root += '/';

  var posts = locals.posts ? locals.posts.sort('-date') : [];
  var list = [];

  posts.each(function (post) {
    if (!post || !post.title) return;

    var text = stripHtml(post.content || post.excerpt || '');
    if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN);

    list.push({
      title: String(post.title),
      // 与站点自身产出的链接保持一致的百分号编码（中文、空格都要编码）
      url: root + encodeURI(String(post.path || '').replace(/^\//, '')),
      date: post.date ? post.date.format('YYYY-MM-DD') : '',
      cats: toArray(post.categories).map(function (c) { return c.name; }),
      tags: toArray(post.tags).map(function (t) { return t.name; }),
      text: text
    });
  });

  hexo.log.info('搜索索引：%d 篇文章', list.length);

  return {
    path: 'search.json',
    data: JSON.stringify(list)
  };
});
