(function($){
  // Search
  // 开关只负责「显示/隐藏面板」；检索与结果渲染在 js/search.js 里。
  // 注意：这里刻意不用 input 的 blur 关闭——否则鼠标点结果时会先失焦，
  // 面板还没来得及跳转就被隐藏了。改成「点面板外 / Esc / 点关闭按钮」关闭。
  var $searchWrap = $('#search-form-wrap'),
    isSearchAnim = false,
    searchAnimDuration = 200;

  var startSearchAnim = function(){
    isSearchAnim = true;
  };

  var stopSearchAnim = function(callback){
    setTimeout(function(){
      isSearchAnim = false;
      callback && callback();
    }, searchAnimDuration);
  };

  var closeSearch = function(){
    $searchWrap.removeClass('on');
    $('#header-inner').removeClass('ww-searching');
    $('#ww-search-results').attr('hidden', 'hidden');
    $('#ww-search-input').attr('aria-expanded', 'false');
  };

  var openSearch = function(){
    if (isSearchAnim) return;

    startSearchAnim();
    $searchWrap.addClass('on');
    $('#header-inner').addClass('ww-searching');
    stopSearchAnim(function(){
      $('#ww-search-input').focus();
    });
  };

  $('.nav-search-btn').on('click', function(e){
    e.stopPropagation();
    if ($searchWrap.hasClass('on')) {
      closeSearch();
    } else {
      openSearch();
    }
  });

  $('.ww-search-close').on('click', function(e){
    e.stopPropagation();
    closeSearch();
  });

  // 点击面板外部任意位置关闭
  $(document).on('click', function(e){
    if (!$searchWrap.hasClass('on')) return;
    if ($(e.target).closest('#search-form-wrap').length) return;
    closeSearch();
  });

  // Esc 关闭（输入框内由 search.js 处理，这里兜住面板外聚焦的情况）
  $(document).on('keydown', function(e){
    if ((e.key === 'Escape' || e.keyCode === 27) && $searchWrap.hasClass('on')) {
      closeSearch();
    }
  });

  // Caption
  $('.article-entry').each(function(i){
    $(this).find('img').each(function(){
      if ($(this).parent().hasClass('fancybox') || $(this).parent().is('a')) return;

      var alt = this.alt;

      if (alt) $(this).after('<span class="caption">' + alt + '</span>');

      $(this).wrap('<a href="' + this.src + '" data-fancybox=\"gallery\" data-caption="' + alt + '"></a>')
    });

    $(this).find('.fancybox').each(function(){
      $(this).attr('rel', 'article' + i);
    });
  });

  if ($.fancybox){
    $('.fancybox').fancybox();
  }

  // Mobile nav
  var $container = $('#container'),
    isMobileNavAnim = false,
    mobileNavAnimDuration = 200;

  var startMobileNavAnim = function(){
    isMobileNavAnim = true;
  };

  var stopMobileNavAnim = function(){
    setTimeout(function(){
      isMobileNavAnim = false;
    }, mobileNavAnimDuration);
  }

  $('#main-nav-toggle').on('click', function(){
    if (isMobileNavAnim) return;

    startMobileNavAnim();
    $container.toggleClass('mobile-nav-on');
    stopMobileNavAnim();
  });

  $('#wrap').on('click', function(){
    if (isMobileNavAnim || !$container.hasClass('mobile-nav-on')) return;

    $container.removeClass('mobile-nav-on');
  });
})(jQuery);