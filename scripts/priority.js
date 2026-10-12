/* global hexo */
'use strict';

/**
 * 文章优先级（置顶）排序
 *
 * hexo-generator-index 原生支持 front-matter 的 `sticky` 字段，它的做法是：
 *   1. 先按 index_generator.order_by（本站为 -date）排序
 *   2. 再按 sticky 降序做一次稳定排序（V8 的 Array#sort 自 ES2019 起稳定）
 * 于是「优先级高的排在前面，优先级相同的保持时间倒序」是它自带的语义，
 * 不需要替换生成器、也不需要拼一个复合排序键。
 *
 * 本站约定：
 *   - sticky: 整数，越大越靠前；0 或缺省 = 不置顶
 *   - priority: 同义，作为更直白的别名存在；两个都写时以 sticky 为准
 *
 * 为什么不能直接在 before_generate 里改 post：
 *   hexo.locals 里 `posts` 的取值函数是 `db.model('Post').find(query)`，
 *   _runGenerators() 会先 invalidate() 再 toObject()，拿到的是一批新副本，
 *   在 before_generate 里改到的对象根本传不到生成器手上。
 *   所以这里改成包住那个取值函数，在返回值交出去之前做归一化。
 */

var patched = false;

function normalizePost(post) {
  if (!post) return;

  var raw = post.sticky;
  if (raw === undefined || raw === null || raw === '') raw = post.priority;

  var n = Number(raw);
  post.sticky = (isFinite(n) && n !== 0) ? n : 0;
}

function patchPostsLocal() {
  if (patched) return;

  var locals = hexo.locals;
  if (!locals || !locals.getters || typeof locals.getters.posts !== 'function') return;

  var original = locals.getters.posts;

  locals.set('posts', function () {
    var query = original();

    try {
      if (query && typeof query.forEach === 'function') query.forEach(normalizePost);
    } catch (e) {
      // 归一化失败就让首页退化成纯时间排序，绝不能把整站构建搞挂
      hexo.log.warn('[priority] 优先级归一化失败，已回退到时间排序：' + e.message);
    }

    return query;
  });

  patched = true;
}

hexo.extend.filter.register('before_generate', patchPostsLocal);
