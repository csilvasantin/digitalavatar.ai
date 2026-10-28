/* DigitalAvatar.ai · mando remoto + comandos de chat comunes (GrokBot · MacMini, 7-oct-2026).
 * Lo carga assets/da-context.js en las páginas de avatar (nube, best, better, metahuman).
 * 1) Escucha la cola del MCP (digitalavatar.ai/mcp): GET brain /mcp/commands?sala=…&after=…
 *    cada ~5 s con la pestaña visible. Sala = ?sala=… (por defecto «publica»).
 *    Tipos: say {text} · ask {question} · animate {name} · tier {tier} · demo · lang {lang}
 *    · url {url} · caption {on} · custom {…} (evento window «da-remote» para extensiones).
 * 2) Comandos de chat que valen en las tres caras: /help (/ayuda) → los asistentes con IA de AdmiraNeXT
 *    (assets/da-asistentes.js, la misma lista que el CLI) y la guía digitalavatar.ai/help, /asistente <nombre>,
 *    /asistentes presentandose (pase: cada asistente ~15 s diciendo a qué se dedica; ?presenta=<n> es su turno),
 *    /avatar avatar|human|metahuman, /idioma es|en, /marca starbucks|365|<id>|off.
 *    /animacion y /demo los resuelve cada página (nube.js y el cerebro).
 */
(function () {
  'use strict';
  if (window.__daRemote) return; window.__daRemote = true;
  var BRAIN = 'https://brain.digitalavatar.ai';
  var ASISTENTES_SRC = '/assets/da-asistentes.js?v=20261027-asistentes-6';
  function asistentes(cb) {
    if (window.DA_ASISTENTES) { cb(window.DA_ASISTENTES); return; }
    if (!window.__daAsistentesP) {
      window.__daAsistentesP = new Promise(function (res) {
        var s = document.createElement('script');
        s.src = ASISTENTES_SRC; s.async = true;
        s.onload = function () { res(window.DA_ASISTENTES || null); };
        s.onerror = function () { res(null); };
        (document.head || document.documentElement).appendChild(s);
      });
    }
    window.__daAsistentesP.then(cb);
  }
  function abrirAsistente(a) {
    var u = new URL(a.url, location.origin);
    if (SALA !== 'publica' && !u.searchParams.get('sala')) u.searchParams.set('sala', SALA);
    location.href = u.pathname + u.search;
  }
  // ── Pase de presentación (Carlos, 27-oct-2026) ──
  // /asistentes presentandose abre el turno 0; cada página con ?presenta=<n> dice su presentación (voz real en la nube,
  // texto en Luna y Neo), espera `cada` segundos (15) y, si sigue hablando, a que acabe; luego abre el turno n+1.
  // Al último le sigue Admirito sin pase. Cualquier tecla o clic en la caja lo para.
  function paseCada() { return Math.min(60, Math.max(3, Number(params.get('cada')) || 15)); }
  function urlTurno(A, i, lang) {
    var base = A.urlPase(i); if (!base) return '';
    var u = new URL(base, location.origin);
    if (lang === 'en' || lang === 'es') u.searchParams.set('lang', lang);
    ['sala', 'lang', 'audio', 'cada', 'brand', 'site', 'sector', 'city'].forEach(function (k) { var v = params.get(k); if (v && !u.searchParams.get(k)) u.searchParams.set(k, v); });
    return u.pathname + u.search;
  }
  // /demo digitalavatar = el pase en inglés; /demo avatardigital = en castellano (Carlos, 27-oct-2026). El idioma viaja en ?lang= por todos los turnos.
  function iniciarPase(lang) { asistentes(function (A) { if (A) location.href = urlTurno(A, 0, lang); }); }
  function langPase() { var l = params.get('lang'); return l === 'en' || l === 'es' ? l : L(); }
  var pase = { timer: 0, parado: false };
  function pararPase() { pase.parado = true; clearTimeout(pase.timer); }
  // Flechas ‹ › del pase (Neo, 28-oct-2026: «a la derecha y a la izquierda una flecha con la estética del asistente»):
  // paran la cuenta y abren el turno anterior o siguiente. Toman --accent/--panel/--line de la página (cada asistente su color).
  // También con las teclas ← → fuera de la caja de texto.
  function irTurno(A, n) {
    pararPase();
    if (n >= 0 && n < A.lista.length) { location.href = urlTurno(A, n); return; }
    if (n >= A.lista.length) location.href = '/nube.html' + (params.get('lang') ? '?lang=' + params.get('lang') : '');
  }
  function flechasPase(A, i) {
    if (document.getElementById('paseFlechas')) return;
    var en = langPase() === 'en';
    var st = document.createElement('style');
    st.textContent = '.pase-flecha{position:fixed;top:50%;transform:translateY(-50%);z-index:70;width:54px;height:54px;border-radius:50%;' +
      'display:flex;align-items:center;justify-content:center;cursor:pointer;font:700 1.9rem/1 ui-sans-serif,-apple-system,system-ui,sans-serif;' +
      'color:var(--accent,#5fd0ff);background:var(--panel,rgba(10,19,30,.72));border:1px solid var(--line,#1b3346);' +
      'backdrop-filter:blur(12px);box-shadow:0 12px 34px rgba(0,0,0,.5);transition:border-color .2s,box-shadow .2s,opacity .2s;padding:0 0 4px}' +
      '.pase-flecha:hover,.pase-flecha:focus-visible{border-color:var(--accent,#5fd0ff);box-shadow:0 0 18px color-mix(in srgb,var(--accent,#5fd0ff) 45%,transparent);outline:0}' +
      '.pase-flecha.izq{left:max(14px,env(safe-area-inset-left))}.pase-flecha.der{right:max(14px,env(safe-area-inset-right))}' +
      '.pase-flecha:disabled{opacity:.3;cursor:default;box-shadow:none}' +
      '@media(max-width:520px){.pase-flecha{width:44px;height:44px;font-size:1.5rem}}';
    var box = document.createElement('div'); box.id = 'paseFlechas';
    function boton(cls, txt, label, n, off) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pase-flecha ' + cls; b.textContent = txt;
      b.setAttribute('aria-label', label); b.title = label; b.disabled = !!off;
      b.addEventListener('click', function (e) { e.stopPropagation(); irTurno(A, n); });
      box.appendChild(b);
    }
    var prev = A.lista[i - 1], next = A.lista[i + 1];
    boton('izq', '\u2039', (en ? 'Previous' : 'Anterior') + (prev ? ': ' + prev.nombre : ''), i - 1, !prev);
    boton('der', '\u203A', (en ? 'Next' : 'Siguiente') + (next ? ': ' + next.nombre : ''), i + 1, false);
    (document.head || document.documentElement).appendChild(st); document.body.appendChild(box);
    document.addEventListener('keydown', function (e) {
      var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); irTurno(A, i - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); irTurno(A, i + 1); }
    });
  }
  function turnoPase(A) {
    var i = parseInt(params.get('presenta'), 10); var a = A.lista[i]; if (!a) return;
    flechasPase(A, i);
    document.title = (i + 1) + '/' + A.lista.length + ' · ' + document.title;
    var lp = langPase(); if (lp !== L()) setLang(lp);
    var texto = A.presentacion(a.id, lp) || (a.nombre + ': ' + (lp === 'en' ? a.en : a.es));
    var t0 = Date.now(), intentos = 0;
    (function habla() {
      if (pase.parado) return;
      if (!window.__nubeDecir && /nube\.html$/.test(location.pathname) && intentos++ < 30) { pase.timer = setTimeout(habla, 100); return; }
      if (window.__nubeDecir) { show(texto); window.__nubeDecir(texto); } else { say(texto); }
      pase.timer = setTimeout(siguiente, Math.max(0, paseCada() * 1000 - (Date.now() - t0)));
    })();
    function siguiente() {
      if (pase.parado) return;
      if (window.__nubeHablando && window.__nubeHablando() && Date.now() - t0 < (paseCada() + 20) * 1000) { pase.timer = setTimeout(siguiente, 500); return; }
      var n = i + 1;
      if (n < A.lista.length) { location.href = urlTurno(A, n); return; }
      var fin = new URL('/nube.html', location.origin);
      ['sala', 'lang', 'audio', 'brand', 'site', 'sector', 'city'].forEach(function (k) { var v = params.get(k); if (v) fin.searchParams.set(k, v); });
      location.href = fin.pathname + fin.search;
    }
  }
  var params = new URLSearchParams(location.search);
  asistentes(function () {});
  var SALA = String(params.get('sala') || 'publica').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 60) || 'publica';
  var PAGES = { avatar: '/nube.html', human: '/best.html', metahuman: '/metahuman.html' };
  var CAT = { avatar: 'avatar', good: 'avatar', admirito: 'avatar', nube: 'avatar', human: 'human', better: 'human', luna: 'human', metahuman: 'metahuman', best: 'metahuman', neo: 'metahuman' };
  var DEMOS = { starbucks: { site: 'Starbucks Paseo de Gracia', sector: 'cafeteria', city: 'Barcelona' }, '365': { site: '365 Barcelona', sector: 'panaderia', city: 'Barcelona' } };
  var OFF = params.get('remote') === 'off';
  var after = Date.now() - 20000; // lo encolado justo antes de abrir la página también llega
  var seen = {};
  function L() { var l = (window.DAContext && DAContext.lang && DAContext.lang()) || document.documentElement.lang || 'es'; return /^en/i.test(l) ? 'en' : 'es'; }
  function myAvatar() { return (window.DAContext && DAContext.avatar && DAContext.avatar()) || ''; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show(text, help) {
    var el = document.getElementById('caption') || document.getElementById('ans');
    if (!el) return;
    if (help) el.classList.add('help'); else el.classList.remove('help');
    el.classList.remove('vacio'); // el bocadillo de la nube se esconde sin texto; con texto, se enseña
    el.innerHTML = '<span class="sp1">' + esc(text).replace(/(https:\/\/digitalavatar\.ai\/help\/?)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>') + '</span>';
    el.scrollTop = 0;
  }
  function go(page, set) {
    var p = new URLSearchParams(location.search);
    Object.keys(set || {}).forEach(function (k) { if (set[k] === null) p.delete(k); else p.set(k, set[k]); });
    p.delete('demo');
    var qs = p.toString();
    location.href = (page || location.pathname) + (qs ? '?' + qs : '');
  }
  function ask(q) {
    if (window.__nubeAsk) return window.__nubeAsk(q);
    window.postMessage({ type: 'da-ask', question: q, lang: L() }, location.origin);
    var inp = document.getElementById('q'), b = document.getElementById('btnSend') || document.getElementById('send');
    if (!/best\.html$/.test(location.pathname) && inp && b && !window.__nubeAsk) { inp.value = q; b.click(); }
  }
  function setLang(l) {
    l = /^en/i.test(l) ? 'en' : 'es';
    window.postMessage({ type: 'da-lang', lang: l }, location.origin);
    var mb = document.getElementById('langBtn');
    if (mb && L() !== l) mb.click();
  }
  function say(text) {
    text = String(text || '').slice(0, 400); if (!text) return;
    if (window.__nubeSpeakText) { show(text); window.__nubeSpeakText(text); return; }
    show(text);
  }
  function helpText() {
    return L() === 'en'
      ? 'Full guide (commands, avatars and demos): https://digitalavatar.ai/help/\n/asistente <name> · /asistentes presentandose (= /demo asistentes; /demo digitalavatar in English, /demo avatardigital in Spanish) · /animacion help · /avatar avatar|human|metahuman · /demo · /idioma es|en · /marca starbucks|365|off'
      : 'Guía completa (comandos, avatares y demos): https://digitalavatar.ai/help/\n/asistente <nombre> · /asistentes presentandose (= /demo asistentes; /demo digitalavatar en inglés, /demo avatardigital en castellano) · /animacion help · /avatar avatar|human|metahuman · /demo · /idioma es|en · /marca starbucks|365|off';
  }
  // ── Comandos de chat comunes ──
  function chat(raw) {
    var t = String(raw || '').trim(), m;
    if (/^\/\s*(help|ayuda)\s*$/i.test(t)) {
      show(helpText(), true);
      asistentes(function (A) { show((A ? A.texto(L()) + '\n\n' : '') + helpText(), true); });
      return true;
    }
    // El nombre del asistente, con barra o a secas (Carlos, 27-oct-2026: «bugito» sin barra también cambia): abre ese
    // asistente, salvo que sea la piel que ya está en pantalla (entonces la orden es suya: /arquitecto … o
    // /supervisor … las atiende nube.js). Solo la palabra sola, con signos de cierre como mucho: «¿Bugito?» vale,
    // «bugito rompe algo» es una pregunta normal.
    // «alfredito descripcion», «/neo puntos fuertes», «¿quién es bugito?» no: solo nombre + palabra de ficha (Carlos, 27-oct-2026).
    if ((m = t.match(/^[¿¡]*\/?\s*([a-z]+)\s+(.+?)[\s.!?¡¿]*$/i)) && window.DA_ASISTENTES && window.DA_ASISTENTES.porId(m[1]) && window.DA_ASISTENTES.pideFicha(m[2])) {
      show(window.DA_ASISTENTES.ficha(m[1], L()), true); return true;
    }
    if ((m = t.match(/^[¿¡]*\/?\s*([a-z]+)[\s.!?¡¿]*$/i)) && window.DA_ASISTENTES && window.DA_ASISTENTES.porId(m[1])) {
      var actual = /nube\.html$/.test(location.pathname) ? (document.documentElement.getAttribute('data-personaje') || 'admirito').toLowerCase() : '';
      var yo = m[1].toLowerCase();
      if (yo !== actual) { abrirAsistente(window.DA_ASISTENTES.porId(yo)); return true; }
    }
    // «/asistentes presentandose» (o «asistentes pase» a secas) y «/demo asistentes» (Carlos, 27-oct-2026): el pase de presentación.
    if (/^\/?\s*demo\s+(asistentes|assistants|presentaci[oó]n|pase)\s*[.!?¡¿]*$/i.test(t)) { iniciarPase(); return true; }
    if (/^\/?\s*demo\s+digitalavatar\s*[.!?¡¿]*$/i.test(t)) { iniciarPase('en'); return true; }
    if (/^\/?\s*demo\s+avatardigital\s*[.!?¡¿]*$/i.test(t)) { iniciarPase('es'); return true; }
    if ((m = t.match(/^\/?\s*(asistentes|assistants)\s+(\S+)\s*[.!?¡¿]*$/i)) && window.DA_ASISTENTES && window.DA_ASISTENTES.pidePase(m[2])) { iniciarPase(); return true; }
    if ((m = t.match(/^\/\s*(asistente|asistentes|assistant|assistants)\s*(\S*)\s*(.*?)\s*$/i))) {
      var quien = String(m[2] || '').toLowerCase(), resto = String(m[3] || '');
      asistentes(function (A) {
        if (!A) { show(L() === 'en' ? 'The assistant list did not load.' : 'No se pudo cargar la lista de asistentes.', true); return; }
        if (!quien) { show(A.texto(L()), true); return; }
        var a = A.porId(quien);
        if (!a) { show(L() === 'en' ? 'No assistant called «' + quien + '». /asistente lists them.' : 'No hay ningún asistente «' + quien + '». /asistente los lista.', true); return; }
        if (resto && A.pideFicha(resto)) { show(A.ficha(quien, L()), true); return; }
        abrirAsistente(a);
      });
      return true;
    }
    if ((m = t.match(/^\/\s*avatar\s+(\S+)\s*$/i)) && !/^help$/i.test(m[1])) {
      var c = CAT[m[1].toLowerCase()];
      if (!c) { show(L() === 'en' ? 'Use /avatar avatar, /avatar human or /avatar metahuman.' : 'Usa /avatar avatar, /avatar human o /avatar metahuman.', true); return true; }
      go(PAGES[c], { tier: c, avatar: null }); return true;
    }
    if ((m = t.match(/^\/\s*(idioma|lang|language)\s*(\S*)\s*$/i))) {
      var l = m[2] ? m[2] : (L() === 'es' ? 'en' : 'es');
      if (!/^(es|en|esp|eng|español|english|castellano|ingl[eé]s)$/i.test(l)) { show(L() === 'en' ? 'Use /idioma es or /idioma en.' : 'Usa /idioma es o /idioma en.', true); return true; }
      setLang(/^(en|eng|english|ingl)/i.test(l) ? 'en' : 'es'); return true;
    }
    if ((m = t.match(/^\/\s*(marca|brand)\s*(\S*)\s*$/i))) {
      var b = String(m[2] || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!b) { show((L() === 'en' ? 'Current brand: ' : 'Marca actual: ') + (params.get('brand') || 'AdmiraNeXT') + '\n/marca starbucks · /marca 365 · /marca off', true); return true; }
      if (b === 'off' || b === 'admira') { go(null, { brand: null, site: null, sector: null, city: null }); return true; }
      var d = DEMOS[b] || {};
      go(null, { brand: b, site: d.site || null, sector: d.sector || null, city: d.city || null }); return true;
    }
    return false;
  }
  function inputOf(e) { var q = document.getElementById('q'); return q && (e.target === q || (e.type === 'click' && e.target && e.target.closest && e.target.closest('#btnSend,#send'))) ? q : null; }
  function intercept(e) {
    if (e.type === 'keydown' && e.key !== 'Enter') return;
    var q = inputOf(e); if (!q) return;
    if (chat(q.value)) { q.value = ''; e.preventDefault(); e.stopImmediatePropagation(); }
  }
  document.addEventListener('keydown', intercept, true);
  document.addEventListener('click', intercept, true);
  window.DARemote = { chat: chat, sala: SALA, run: run };

  // ── Cola del MCP ──
  function run(c) {
    var a = c.args || {};
    try { window.dispatchEvent(new CustomEvent('da-remote', { detail: c })); } catch (_) {}
    switch (c.type) {
      case 'say': if (a.lang && a.lang !== L()) setLang(a.lang); say(a.text); break;
      case 'ask': ask(String(a.question || a.text || '')); break;
      case 'demo': ask('/demo'); break;
      case 'animate': if (window.__nubeDance) window.__nubeDance(a.name); break;
      case 'tier': var t = CAT[String(a.tier || '').toLowerCase()]; if (t && PAGES[t] !== location.pathname) go(PAGES[t], { tier: t, avatar: null }); break;
      case 'lang': setLang(a.lang); break;
      case 'caption': var cap = document.getElementById('caption') || document.getElementById('ans'); if (cap) cap.style.display = a.on === false ? 'none' : ''; break;
      case 'url': if (/^https:\/\/(www\.)?digitalavatar\.ai\//.test(String(a.url || ''))) { var u = new URL(a.url); if (!u.searchParams.get('sala') && SALA !== 'publica') u.searchParams.set('sala', SALA); location.href = u.toString(); } break;
      default: break; // custom: lo atienden los oyentes de «da-remote»
    }
  }
  var busy = false;
  function poll() {
    if (OFF || busy || document.hidden) return;
    busy = true;
    var av = myAvatar();
    fetch(BRAIN + '/mcp/commands?sala=' + encodeURIComponent(SALA) + '&after=' + after + (av ? '&avatar=' + encodeURIComponent(av) : ''), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        (d && d.cmds || []).forEach(function (c) {
          if (seen[c.id]) return; seen[c.id] = 1;
          after = Math.max(after, Number(c.id) || 0);
          run(c);
        });
      })
      .catch(function () {})
      .then(function () { busy = false; });
  }
  // El turno del pase se atiende aquí, con `params` y la cola ya definidos (el bloque de arriba solo declara funciones).
  if (params.get('presenta') !== null) {
    asistentes(function (A) { if (A) turnoPase(A); });
    document.addEventListener('keydown', function (e) { var q = document.getElementById('q'); if (e.key === 'Escape' || (q && e.target === q)) pararPase(); }, true);
    document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#q,#btnSend,#send,#btnMic,#btnStop')) pararPase(); }, true);
  }
  if (window.self === window.top || params.get('sala')) { setTimeout(poll, 1500); setInterval(poll, 5000); document.addEventListener('visibilitychange', poll); }
})();
