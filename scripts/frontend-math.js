/* global hexo */
'use strict';

/**
 * 数学公式（前台渲染）
 *
 * 由浏览器在页面加载后用 KaTeX 把 $...$ / $$...$$ 渲染成公式。
 * 所有资源（js/css/字体）都是本仓库自带的 /katex/ 下的本地文件，不依赖任何 CDN。
 *
 * 只注入到含文章正文的页面（首页、文章页），后台 /admin 不受影响。
 */

const SNIPPET = [
  '<link rel="stylesheet" href="/katex/katex.min.css">',
  '<script defer src="/katex/katex.min.js"></script>',
  '<script defer src="/katex/auto-render.min.js"></script>',
  '<script>',
  'document.addEventListener("DOMContentLoaded",function(){',
  '  if (typeof renderMathInElement !== "function") return;',
  '  var nodes = document.querySelectorAll(".article-entry");',
  '  var list = nodes.length ? nodes : [document.body];',
  '  var D = "$";',
  '  for (var i = 0; i < list.length; i++){',
  '    try {',
  '      renderMathInElement(list[i], {',
  '        delimiters: [',
  '          {left: D + D, right: D + D, display: true},',
  '          {left: "\\\\[", right: "\\\\]", display: true},',
  '          {left: D,     right: D,     display: false},',
  '          {left: "\\\\(", right: "\\\\)", display: false}',
  '        ],',
  '        ignoredTags: ["script","noscript","style","textarea","pre","code","option"],',
  '        ignoredClasses: ["highlight","katex","mjx-container"],',
  '        throwOnError: false,',
  '        errorColor: "#c0392b"',
  '      });',
  '    } catch (e) {}',
  '  }',
  '});',
  '</script>'
].join('\n');

hexo.extend.filter.register('after_render:html', function (html) {
  if (html.indexOf('article-entry') === -1) return html;   // 只处理文章类页面
  if (html.indexOf('/katex/katex.min.js') !== -1) return html; // 别重复注入
  return html.replace('</body>', SNIPPET + '\n</body>');
});
