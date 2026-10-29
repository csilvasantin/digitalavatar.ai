  // ───────────────────────── Idioma y chips ─────────────────────────
  function applyLang(l) {
    LANG = l === 'en' ? 'en' : 'es'; var t = T[LANG];
    try { localStorage.setItem('da_lang', LANG); } catch (_) {}
    document.documentElement.lang = t.lang;
    $('tag').textContent = t.tag; $('q').placeholder = t.placeholder; el.svg.setAttribute('aria-label', t.aria);
    if (PIEL && PIEL.titulo) document.title = PIEL.titulo(LANG);
    var lt = $('langToggle'); if (lt) lt.textContent = LANG === 'es' ? 'EN' : 'ES';
    if (DACTX.get().lang !== LANG) DACTX.set({ lang: LANG });
    renderChips();
  }
  function renderChips() {
    var list = PIEL ? T[LANG].chips.slice() : DACTX.chips(T[LANG].chips);
    $('chips').innerHTML = list.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('');
    Array.prototype.forEach.call($('chips').children, function (node, i) { node.onclick = function () { $('q').value = list[i]; ask(); }; });
  }
  DACTX.on(function (kind) { if (kind === 'lang') applyLang(DACTX.get().lang); else renderChips(); });
  function loadLocations() {
    fetch(API + '/locations', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var list = (d && d.locations) || [], sel = $('loc'); sel.innerHTML = '<option value="">' + T[LANG].loc + '</option>';
      list.forEach(function (l) { var o = document.createElement('option'); o.value = l.id; o.textContent = (l.name || l.id) + (l.addr ? ' · ' + l.addr : ''); sel.appendChild(o); });
      if (DACTX.get().loc) sel.value = DACTX.get().loc;
    }).catch(function () {});
  }

