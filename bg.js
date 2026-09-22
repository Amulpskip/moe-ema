/* ============================================================
   えま 公式サイト ─ 背景まわり
   ・背景写真の描画（枚数可変・拡大/縮小を交互・クロスフェード）
   ・セクションごとの巨大背景タイポ
   ・斜めバンドと巨大タイポのパララックス

   背景写真の一覧は Supabase の profile.message(JSON) の `backgrounds`
   に入っている。未設定(null/undefined)なら下の既定3枚を使う。
   index.html / gallery.html の両方から読み込まれる。
   ============================================================ */
(function () {
  'use strict';

  /* 1枚あたりの表示時間（ミリ秒）。全体の周期は SLOT × 枚数 */
  var SLOT = 9000;

  /* 既定の背景（同梱画像）。x/y は「顔の位置」＝background-position の % */
  /* スマホ（縦長画面）で顔が中央に来るよう実測で合わせた値。
     縦長写真は左右が、横長写真は上下が切られるため、1枚ずつ違う */
  var DEFAULTS = [
    { url: 'images/bg1.jpg', x: 78, y: 20 },
    { url: 'images/bg2.jpg', x: 78, y: 30 },
    { url: 'images/bg3.jpg', x: 21, y: 30 }
  ];

  function reduced() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function cssNum(name, fallback) {
    var v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(name));
    return isNaN(v) ? fallback : v;
  }

  /* 画像CDN（wsrv.nl）でリサイズ＆webp化。相対パスの同梱画像はそのまま */
  function cdn(url, w) {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return url;
    if (url.indexOf('wsrv.nl') > -1) return url;
    return 'https://wsrv.nl/?url=' +
      encodeURIComponent(url.replace(/^https?:\/\//, '')) +
      '&w=' + w + '&output=webp&q=72';
  }

  /* ---------- 背景写真の描画 ---------- */
  var currentList = null;

  function normalize(list) {
    if (list == null) return DEFAULTS.slice();
    if (!Array.isArray(list)) return DEFAULTS.slice();
    return list.filter(function (b) {
      return b && typeof b.url === 'string' && b.url;
    }).map(function (b) {
      return {
        url: b.url,
        x: typeof b.x === 'number' ? b.x : 50,
        y: typeof b.y === 'number' ? b.y : 30
      };
    });
  }

  function renderPhotos(list) {
    var wrap = document.querySelector('.bgx-photo');
    if (!wrap) return;

    currentList = list;
    var items = normalize(list);
    wrap.innerHTML = '';
    if (!items.length) return;           // 0枚なら夜空だけの表示になる

    var op = cssNum('--bgx-photo-op', 0.85);
    var zMin = cssNum('--bgx-zoom-min', 1.02);
    var zMax = cssNum('--bgx-zoom-max', 1.34);
    var still = reduced();
    var n = items.length;
    var total = n * SLOT;
    var wide = Math.min(Math.round(window.innerWidth * 2), 1600);

    items.forEach(function (bg, i) {
      var el = document.createElement('i');
      el.style.backgroundImage = 'url("' + cdn(bg.url, wide) + '")';
      el.style.backgroundPosition = bg.x + '% ' + bg.y + '%';
      wrap.appendChild(el);

      // 動きを減らす設定の人には1枚だけ静止表示
      if (still) { el.style.opacity = i === 0 ? op : 0; return; }

      // 偶数枚目＝拡大、奇数枚目＝縮小。交互にして動きを途切れさせない
      var a = (i % 2 === 0) ? zMin : zMax;
      var b = (i % 2 === 0) ? zMax : zMin;

      if (n === 1) {
        // 1枚だけのときは切り替えが無いので、拡大↔縮小を往復させる
        el.style.opacity = op;
        el.animate([
          { transform: 'scale(' + zMin + ')' },
          { transform: 'scale(' + zMax + ')' },
          { transform: 'scale(' + zMin + ')' }
        ], { duration: SLOT * 4, iterations: Infinity, easing: 'ease-in-out' });
        return;
      }

      // 表示区間（1.5s〜7.5s）にズームの全行程を収める。
      // 倍率を戻すのは透明な区間なので、戻りは目に映らない。
      el.animate([
        { offset: 0,             opacity: 0,  transform: 'scale(' + a + ')' },
        { offset: 1500 / total,  opacity: op },
        { offset: 7500 / total,  opacity: op },
        { offset: SLOT / total,  opacity: 0,  transform: 'scale(' + b + ')' },
        { offset: 1,             opacity: 0,  transform: 'scale(' + a + ')' }
      ], {
        duration: total,
        delay: i * SLOT,
        iterations: Infinity,
        easing: 'linear'
      });
    });
  }

  /* 管理モードから呼ぶ再描画。app.js が保存後に叩く */
  window.EmaBG = {
    render: renderPhotos,
    DEFAULTS: DEFAULTS
  };

  /* ---------- セクションごとの巨大背景タイポ ---------- */
  var WORDS = {
    profile: 'PROFILE',
    gallery: 'GALLERY',
    diary: 'DIARY',
    comments: 'LETTER',
    omikuji: 'FORTUNE',
    support: 'THANKS',
    sns: 'CONNECT'
  };

  function buildWords() {
    Object.keys(WORDS).forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec || sec.querySelector('.bgx-word')) return;
      var w = document.createElement('span');
      w.className = 'bgx-word';
      w.setAttribute('aria-hidden', 'true');
      w.setAttribute('data-bgx-speed', '0.06');
      w.textContent = WORDS[id];
      sec.insertBefore(w, sec.firstChild);
    });
  }

  /* ---------- パララックス ---------- */
  var targets = [];
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      for (var i = 0; i < targets.length; i++) {
        var el = targets[i];
        var speed = parseFloat(el.getAttribute('data-bgx-speed')) || 0;
        el.style.setProperty('--bgx-y', (y * speed).toFixed(1) + 'px');
      }
      ticking = false;
    });
  }

  /* ---------- 保存済みの背景一覧を読む ---------- */
  function loadSaved() {
    var cfg = window.APP_CONFIG;
    if (!cfg || !window.supabase || !cfg.SUPABASE_URL) return;
    var sb;
    try {
      sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    } catch (e) { return; }

    sb.from('profile').select('message').eq('id', 1).single()
      .then(function (res) {
        if (!res || !res.data || !res.data.message) return;
        var j;
        try { j = JSON.parse(res.data.message); } catch (e) { return; }
        if (!j || typeof j !== 'object') return;
        if (j.backgrounds === undefined) return;     // 未設定なら既定のまま
        renderPhotos(j.backgrounds);
      }, function () { /* 取得できなければ既定のまま */ });
  }

  function init() {
    renderPhotos(null);       // まず既定を即描画（待ち時間ゼロ）
    loadSaved();              // 保存済みがあれば差し替え
    buildWords();

    targets = [].slice.call(document.querySelectorAll('[data-bgx-speed]'));
    if (!reduced()) {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // スマホ⇔PCでズーム量が変わるので、切り替わったら組み直す
    if (window.matchMedia) {
      var mq = window.matchMedia('(max-width: 640px)');
      var onChange = function () { renderPhotos(currentList); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
