/* DigitalAvatar.ai · mando remoto + comandos de chat comunes (GrokBot · MacMini, 7-oct-2026).
 * Lo carga assets/da-context.js en las páginas de avatar (nube, best, better, metahuman).
 * 1) Escucha la cola del MCP (digitalavatar.ai/mcp): GET brain /mcp/commands?sala=…&after=…
 *    cada ~5 s con la pestaña visible. Sala = ?sala=… (por defecto «publica»).
 *    Tipos: say {text} · ask {question} · animate {name} · tier {tier} · demo · lang {lang}
 *    · url {url} · caption {on} · custom {…} (evento window «da-remote» para extensiones).
 * 2) Comandos de chat que valen en las tres caras: /help (/ayuda) → guía digitalavatar.ai/help,
 *    /avatar avatar|human|metahuman, /idioma es|en, /marca starbucks|365|<id>|off.
 *    /animacion y /demo los resuelve cada página (nube.js y el cerebro).
 */
(function () {
  'use strict';
  if (window.__daRemote) return; window.__daRemote = true;
  var BRAIN = 'https://brain.digitalavatar.ai';
  var params = new URLSearchParams(location.search);
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
      ? 'Full guide (commands, avatars and demos): https://digitalavatar.ai/help/\n/animacion help · /avatar avatar|human|metahuman · /demo · /idioma es|en · /marca starbucks|365|off'
      : 'Guía completa (comandos, avatares y demos): https://digitalavatar.ai/help/\n/animacion help · /avatar avatar|human|metahuman · /demo · /idioma es|en · /marca starbucks|365|off';
  }
  // ── Comandos de chat comunes ──
  function chat(raw) {
    var t = String(raw || '').trim(), m;
    if (/^\/\s*(help|ayuda)\s*$/i.test(t)) { show(helpText(), true); return true; }
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
  if (window.self === window.top || params.get('sala')) { setTimeout(poll, 1500); setInterval(poll, 5000); document.addEventListener('visibilitychange', poll); }
})();
