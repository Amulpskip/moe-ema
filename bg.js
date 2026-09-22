/* ============================================================
   えま 公式サイト ─ 背景まわりのスクリプト
   ・セクションごとの巨大背景タイポを差し込む
   ・斜めバンドと巨大タイポのパララックス
   背景レイヤー本体（.bgx / .bgx-hatch）は index.html に直接置いてある。
   ============================================================ */
(function () {
  'use strict';

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

  function init() {
    buildWords();
    targets = [].slice.call(document.querySelectorAll('[data-bgx-speed]'));

    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
