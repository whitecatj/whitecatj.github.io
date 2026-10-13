/*
 * 站内搜索（纯原生 JS，不依赖 jQuery）
 * ------------------------------------------------------------------
 * 索引由站点根目录的 scripts/search-index.js 在构建时生成到 /search.json。
 *
 * 行为：
 *   - 首次聚焦输入框时预取索引（只请求一次，之后走内存）
 *   - 输入防抖 130ms，多关键词按空格分隔，需全部命中（AND）
 *   - 排序权重：标题 > 标签 > 分类 > 正文；标题与片段里命中处高亮
 *   - ↑ ↓ 选择，Enter 打开，Esc 关闭
 */
(function () {
  "use strict";

  var wrap = document.getElementById("search-form-wrap");
  if (!wrap) return;

  var input = wrap.querySelector(".ww-search-input");
  var panel = document.getElementById("ww-search-results");
  if (!input || !panel) return;

  var INDEX_URL = wrap.getAttribute("data-index") || "/search.json";
  var MAX_RESULTS = 12;
  var DEBOUNCE = 130;

  var index = null;      // 索引数组；null = 未加载
  var loading = false;
  var waiting = [];      // 加载期间排队的回调
  var results = [];      // 当前结果
  var cursor = -1;       // 键盘选中项

  /* ---------- 索引 ---------- */

  function loadIndex(done) {
    if (index) return done();
    waiting.push(done);
    if (loading) return;
    loading = true;

    var finish = function () {
      loading = false;
      var queued = waiting;
      waiting = [];
      queued.forEach(function (fn) { fn(); });
    };

    if (!window.fetch) {           // 极老的浏览器直接放弃
      index = [];
      return finish();
    }

    window.fetch(INDEX_URL, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        index = Array.isArray(data) ? data : [];
      })
      .catch(function () {
        index = [];
      })
      .then(finish);
  }

  /* ---------- 工具 ---------- */

  function lower(s) { return String(s == null ? "" : s).toLowerCase(); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function highlight(text, terms) {
    var out = escapeHtml(text);
    if (!terms.length) return out;
    var re = new RegExp("(" + terms.map(escapeRe).join("|") + ")", "gi");
    return out.replace(re, "<mark>$1</mark>");
  }

  function termsOf(q) {
    return lower(q).split(/\s+/).filter(Boolean);
  }

  /* ---------- 检索 ---------- */

  function search(query) {
    var terms = termsOf(query);
    if (!terms.length || !index) return [];

    var out = [];
    for (var i = 0; i < index.length; i++) {
      var p = index[i];
      var title = lower(p.title);
      var tags = lower((p.tags || []).join(" "));
      var cats = lower((p.cats || []).join(" "));
      var text = lower(p.text);
      var hay = title + " " + tags + " " + cats + " " + text;

      var score = 0;
      var hit = true;
      for (var t = 0; t < terms.length; t++) {
        var term = terms[t];
        if (hay.indexOf(term) === -1) { hit = false; break; }
        if (title.indexOf(term) !== -1) score += 12;
        else if (tags.indexOf(term) !== -1) score += 7;
        else if (cats.indexOf(term) !== -1) score += 5;
        else score += 1;
      }
      if (!hit) continue;

      // 片段：取第一个命中词的上下文
      var raw = String(p.text || "");
      var at = -1;
      for (var k = 0; k < terms.length; k++) {
        at = lower(raw).indexOf(terms[k]);
        if (at !== -1) break;
      }
      var snippet;
      if (at === -1) {
        snippet = raw.slice(0, 72);
      } else {
        var start = Math.max(0, at - 22);
        snippet = (start > 0 ? "…" : "") +
          raw.slice(start, start + 78) +
          (raw.length > start + 78 ? "…" : "");
      }

      out.push({ post: p, score: score, snippet: snippet });
    }

    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, MAX_RESULTS);
  }

  /* ---------- 渲染 ---------- */

  function hide() {
    panel.setAttribute("hidden", "hidden");
    input.setAttribute("aria-expanded", "false");
    results = [];
    cursor = -1;
  }

  function show(html) {
    panel.innerHTML = html;
    panel.removeAttribute("hidden");
    input.setAttribute("aria-expanded", "true");
  }

  function render(list, terms) {
    results = list;
    cursor = -1;

    if (!list.length) {
      show('<div class="ww-sr-empty">没有找到相关文章</div>');
      return;
    }

    show(list.map(function (r, i) {
      var meta = [];
      if (r.post.date) meta.push(r.post.date);
      var tax = (r.post.cats || []).concat(r.post.tags || []);
      if (tax.length) {
        meta.push(tax.slice(0, 3).map(function (x) { return "#" + x; }).join(" "));
      }

      return '<a class="ww-sr-item" role="option" data-i="' + i + '"' +
        ' aria-selected="false" href="' + escapeHtml(r.post.url) + '">' +
          '<div class="ww-sr-title">' + highlight(r.post.title, terms) + "</div>" +
          (meta.length
            ? '<div class="ww-sr-meta">' + escapeHtml(meta.join(" · ")) + "</div>"
            : "") +
          (r.snippet
            ? '<div class="ww-sr-snippet">' + highlight(r.snippet, terms) + "</div>"
            : "") +
        "</a>";
    }).join(""));
  }

  function move(delta) {
    var els = panel.querySelectorAll(".ww-sr-item");
    if (!els.length) return;
    if (cursor >= 0 && els[cursor]) {
      els[cursor].classList.remove("active");
      els[cursor].setAttribute("aria-selected", "false");
    }
    cursor = (cursor + delta + els.length) % els.length;
    els[cursor].classList.add("active");
    els[cursor].setAttribute("aria-selected", "true");
    if (els[cursor].scrollIntoView) {
      els[cursor].scrollIntoView({ block: "nearest" });
    }
  }

  /* ---------- 事件 ---------- */

  var timer = null;

  input.addEventListener("focus", function () {
    loadIndex(function () {});                       // 提前把索引拉下来
    if (input.value.trim() && results.length) {
      panel.removeAttribute("hidden");
      input.setAttribute("aria-expanded", "true");
    }
  });

  input.addEventListener("input", function () {
    clearTimeout(timer);
    var q = input.value.trim();
    if (!q) { hide(); return; }

    timer = setTimeout(function () {
      loadIndex(function () {
        render(search(q), termsOf(q));
      });
    }, DEBOUNCE);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Escape") {
      hide();
      input.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      var q = input.value.trim();

      var go = function () {
        var target = cursor >= 0 && results[cursor]
          ? results[cursor]
          : results[0];
        if (target) window.location.href = target.post.url;
      };

      if (results.length) {
        go();
      } else if (q) {
        // 边打字边回车：跳过防抖立刻查一次
        loadIndex(function () {
          render(search(q), termsOf(q));
          go();
        });
      }
    }
  });
})();
