/* NEXUS INSTITUTE OF TECHNOLOGY — platform behavior. Zero dependencies. */
(function () {
  document.documentElement.classList.add('js');

  /* ---------- language toggle (EN <-> AR, with RTL) ---------- */
  var LANG_KEY = 'nx-lang';
  var btn = document.getElementById('langBtn');
  function applyLang(lang) {
    var ar = lang === 'ar';
    document.documentElement.lang = ar ? 'ar' : 'en';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-ar]').forEach(function (el) {
      if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.textContent);
      el.textContent = ar ? el.getAttribute('data-ar') : el.getAttribute('data-en');
    });
    document.querySelectorAll('[data-ar-placeholder]').forEach(function (el) {
      if (!el.hasAttribute('data-en-placeholder'))
        el.setAttribute('data-en-placeholder', el.getAttribute('placeholder') || '');
      el.setAttribute('placeholder', ar ? el.getAttribute('data-ar-placeholder')
                                        : el.getAttribute('data-en-placeholder'));
    });
    if (btn) btn.textContent = ar ? 'English' : 'العربية';
  }
  var saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
  if (saved === 'ar') applyLang('ar');
  if (btn) btn.addEventListener('click', function () {
    var next = document.documentElement.lang === 'ar' ? 'en' : 'ar';
    applyLang(next);
    try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
  });

  /* ---------- side drop-down section menu ---------- */
  var sm = document.getElementById('sideMenu');
  if (sm) {
    sm.querySelector('button').addEventListener('click', function () {
      sm.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!sm.contains(e.target)) sm.classList.remove('open');
    });
    sm.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        sm.classList.remove('open');
        var tab = a.getAttribute('data-tab');
        if (tab) {
          e.preventDefault();
          var b = document.querySelector('.tabs button[data-tab="' + tab + '"]');
          if (b) { b.click(); b.scrollIntoView({ block: 'center' }); }
        }
      });
    });
  }

  /* ---------- lesson tabs (no JS: all panels stacked) ---------- */
  var bar = document.querySelector('.tabs');
  if (bar) {
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tab]');
      if (!b) return;
      bar.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      document.querySelectorAll('.tabpanel').forEach(function (p) { p.classList.remove('on'); });
      b.classList.add('on');
      var panel = document.getElementById(b.getAttribute('data-tab'));
      if (panel) panel.classList.add('on');
    });
  }

  /* ---------- hidden-answer reveals (tier-1 lecture checks) ---------- */
  document.querySelectorAll('.check').forEach(function (box) {
    var b = box.querySelector('button');
    var panel = box.querySelector('.a');
    if (!b || !panel) return;
    b.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? 'Hide worked answer' : 'Reveal worked answer';
    });
  });

  /* ---------- quiz engine ---------- */
  document.querySelectorAll('.quiz-item').forEach(function (item) {
    var sol = item.querySelector('.quiz-sol');
    var verdict = item.querySelector('.quiz-verdict');
    var rbtn = item.querySelector('.quiz-reveal');
    if (rbtn && sol) {
      rbtn.addEventListener('click', function () {
        var open = sol.classList.toggle('open');
        rbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        var ar = document.documentElement.lang === 'ar';
        rbtn.textContent = open ? (ar ? 'إخفاء الحل الكامل' : 'Hide the full solution')
                                : (ar ? 'إظهار الحل الكامل' : 'Show the full solution');
      });
    }
    var choices = item.querySelectorAll('.quiz-choice');
    if (choices.length) {
      choices.forEach(function (c) {
        c.addEventListener('click', function () {
          if (item.classList.contains('answered')) return;
          item.classList.add('answered');
          var right = c.getAttribute('data-ok') === '1';
          c.classList.add(right ? 'right' : 'wrong');
          if (!right) {
            item.querySelectorAll('.quiz-choice[data-ok="1"]').forEach(function (k) {
              k.classList.add('right');
            });
          }
          if (verdict) {
            var ar = document.documentElement.lang === 'ar';
            verdict.textContent = right
              ? (ar ? '✓ إجابة صحيحة. الشرح الكامل أدناه.' : '✓ Correct. The full explanation is below.')
              : (ar ? '✗ إجابة غير صحيحة — الإجابة الصحيحة مظلَّلة. اقرأ السبب أدناه.'
                    : '✗ Not quite — the correct answer is highlighted. Read why below.');
            verdict.className = 'quiz-verdict ' + (right ? 'ok' : 'no');
            verdict.hidden = false;
          }
          if (sol) sol.classList.add('open');
          choices.forEach(function (k) { k.disabled = true; });
        });
      });
    }
  });

  /* ---------- client-side lesson search ---------- */
  var input = document.getElementById('lessonSearch');
  var out = document.getElementById('searchResults');
  if (input && out) {
    var idx = null;
    function load(cb) {
      if (idx) return cb();
      fetch(input.getAttribute('data-index')).then(function (r) { return r.json(); })
        .then(function (d) { idx = d; cb(); }).catch(function () {});
    }
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { out.hidden = true; out.innerHTML = ''; return; }
      load(function () {
        var hits = [];
        for (var i = 0; i < idx.length && hits.length < 12; i++) {
          var e = idx[i];
          if ((e.t + ' ' + e.c + ' ' + e.k).toLowerCase().indexOf(q) !== -1) hits.push(e);
        }
        out.innerHTML = hits.length
          ? hits.map(function (e) {
              return '<a href="' + e.u + '"><b>' + e.t + '</b><span>' + e.c + '</span></a>';
            }).join('')
          : '<div class="none">No lessons match "' + q.replace(/[<>&"]/g, '') + '"</div>';
        out.hidden = false;
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.searchbox')) { out.hidden = true; }
    });
  }

  /* ---------- PWA service worker ---------- */
  if ('serviceWorker' in navigator) {
    var root = document.documentElement.getAttribute('data-root') || './';
    navigator.serviceWorker.register(root + 'sw.js').catch(function () {});
  }
})();
