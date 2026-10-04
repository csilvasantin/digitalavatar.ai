/* Shell cuadrático de digitalavatar.ai.
 *
 * No hay un único script de barra publicado para las cuatro patas: cada una
 * trae el suyo con el mismo contrato (☰ Opciones, ▤ Avanzado, ⌘ Experto,
 * paneles superpuestos, cerrados al cargar, Esc cierra el panel con el foco).
 * Este fichero es ese contrato para DigitalAvatar. La paleta no se copia:
 * la página carga el token compartido
 * https://www.carlossilva.info/admira-design/tokens.css
 * (la fuente de verdad del grupo: Pixeria, XpaceOS, admira.app, admira.live…).
 *
 * Referencias releídas el 4-oct-2026:
 *   xpaceos/assets/xpace-shell.js          (xpaceos.com)
 *   clearchannel-tv/galaxy-shell.js        (clearchannel.tv y admira.biz)
 *   pixeria/assets/cuadratura.js           (pixeria.com / admira.studio)
 *   tool/yokup-site yk-frame               (yokup.com)
 *   32.-ConsejoAdmiraNextGame/admira-bar.js (admira.live)
 *
 *   <link rel="stylesheet" href="https://www.carlossilva.info/admira-design/tokens.css">
 *   <link rel="stylesheet" href="/assets/da-shell.css?v=…">
 *   <script defer src="/assets/da-shell.js?v=…" data-section="/ inicio" data-section-en="/ home"></script>
 *
 * En un iframe no pinta nada (embed-mh y cualquier página enmarcada).
 */
(function (root) {
  'use strict';

  var BAR = 46;
  var HISTORY_KEY = 'digitalavatar_expert_history_v1';

  var OPTIONS = [
    {href: '/', es: 'Inicio', en: 'Home'},
    {group: true, es: 'Niveles', en: 'Levels'},
    {href: '/vectorial.html', es: 'Vectorial', en: 'Vector'},
    {href: '/good.html', es: '2D', en: '2D'},
    {href: '/better.html', es: '3D', en: '3D'},
    {href: '/best.html', es: 'Realista', en: 'Realistic'},
    {href: '/metahuman.html', es: 'Metahuman', en: 'Metahuman'},
    {href: '/metahuman.html', es: 'Neo', en: 'Neo', key: 'neo'},
    {group: true, es: 'Desarrollo', en: 'Development'},
    {href: '/help/', es: 'Ayuda', en: 'Help'},
    {href: '/roadmap/', es: 'Roadmap', en: 'Roadmap'},
    {href: '/mcp/', es: 'MCP', en: 'MCP'},
    {group: true, es: 'Familia AdmiraNeXT', en: 'AdmiraNeXT family'},
    {href: 'https://www.xpaceos.com', es: 'XpaceOS', en: 'XpaceOS', ext: true},
    {href: 'https://www.yokup.com', es: 'Yokup', en: 'Yokup', ext: true},
    {href: 'https://www.pixeria.com', es: 'Pixeria', en: 'Pixeria', ext: true},
    {href: 'https://www.admira.live', es: 'admira.live', en: 'admira.live', ext: true},
    {href: 'https://www.admira.biz', es: 'admira.biz', en: 'admira.biz', ext: true}
  ];

  var ADVANCED = [
    {href: '/embed-demo.html', es: 'Demo del embed', en: 'Embed demo'},
    {href: '/embed-mh.html', es: 'Embed MetaHuman', en: 'MetaHuman embed'},
    {href: '/say.html', es: 'Hazle hablar', en: 'Make it speak'},
    {href: '/asistencia.html', es: 'Asistencia en vivo', en: 'Live assist'},
    {href: '/3d/', es: 'Laboratorio 3D', en: '3D lab'},
    {href: '/legacy.html', es: 'Legacy', en: 'Legacy'},
    {href: '/docs/integration-UE.md', es: 'Integración Unreal', en: 'Unreal integration'},
    {href: '/mcp/llms.txt', es: 'llms.txt', en: 'llms.txt'},
    {href: '/mcp/manifest.json', es: 'manifest.json', en: 'manifest.json'}
  ];

  /* Baldosas del modo experto: el foco de desarrollo. */
  var TILES = [
    {href: '/vectorial.html', es: 'Vectorial', en: 'Vector', mark: 'VEC', hint: {es: 'nivel', en: 'level'}},
    {href: '/good.html', es: '2D', en: '2D', mark: '2D', hint: {es: 'nivel', en: 'level'}},
    {href: '/better.html', es: '3D', en: '3D', mark: '3D', hint: {es: 'nivel', en: 'level'}},
    {href: '/best.html', es: 'Realista', en: 'Realistic', mark: 'REL', hint: {es: 'nivel', en: 'level'}},
    {href: '/metahuman.html', es: 'Metahuman', en: 'Metahuman', mark: 'MH', hint: {es: 'nivel', en: 'level'}},
    {href: '/metahuman.html', es: 'Neo', en: 'Neo', mark: 'NEO', hint: {es: 'en vivo', en: 'live'}, key: 'neo'},
    {href: '/mcp/', es: 'MCP', en: 'MCP', mark: 'MCP', hint: {es: 'agentes', en: 'agents'}},
    {href: '/embed-demo.html', es: 'Embed', en: 'Embed', mark: 'EMB', hint: {es: 'demo', en: 'demo'}},
    {href: '/embed-mh.html', es: 'Embed MH', en: 'Embed MH', mark: 'MH+', hint: {es: 'iframe', en: 'iframe'}},
    {href: '/roadmap/', es: 'Roadmap', en: 'Roadmap', mark: 'MAP', hint: {es: 'plan', en: 'plan'}},
    {href: '/help/', es: 'Ayuda', en: 'Help', mark: '?', hint: {es: 'guía', en: 'guide'}}
  ];

  var GO = {
    vectorial: '/vectorial.html', vec: '/vectorial.html',
    '2d': '/good.html', good: '/good.html',
    '3d': '/better.html', better: '/better.html',
    realista: '/best.html', realistic: '/best.html', best: '/best.html', foto: '/best.html',
    metahuman: '/metahuman.html', mh: '/metahuman.html',
    neo: '/metahuman.html',
    mcp: '/mcp/',
    embed: '/embed-demo.html',
    embedmh: '/embed-mh.html',
    roadmap: '/roadmap/', mapa: '/roadmap/',
    ayuda: '/help/', manual: '/help/',
    say: '/say.html', decir: '/say.html',
    asistencia: '/asistencia.html', assist: '/asistencia.html',
    lab: '/3d/', laboratorio: '/3d/',
    legacy: '/legacy.html',
    inicio: '/', home: '/',
    unreal: '/docs/integration-UE.md', ue: '/docs/integration-UE.md'
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }
  function lang() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
  }
  function pick(item) {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return lang() === 'en' ? (item.en || item.es || '') : (item.es || item.en || '');
  }
  function herePath() {
    var p = (location.pathname || '/').replace(/index\.html$/, '');
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    return p || '/';
  }
  function norm(href) {
    try {
      var u = new URL(href, location.origin);
      if (u.origin !== location.origin) return '';
      var p = u.pathname.replace(/index\.html$/, '');
      if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
      return p || '/';
    } catch (e) { return ''; }
  }
  function isCurrent(href, key) {
    var n = norm(href);
    if (!n || n !== herePath()) return false;
    if (key === 'neo') return herePath() === '/metahuman.html' || herePath() === '/metahuman';
    return true;
  }

  function linkHtml(item) {
    if (item.group) return '<div class="da-group" data-es="' + esc(item.es) + '" data-en="' + esc(item.en) + '">' + esc(pick(item)) + '</div>';
    var cur = isCurrent(item.href, item.key) ? ' aria-current="page"' : '';
    var ext = item.ext ? ' target="_blank" rel="noopener"' : '';
    return '<a href="' + esc(item.href) + '"' + ext + cur + ' data-es="' + esc(item.es) + '" data-en="' + esc(item.en) + '">' + esc(pick(item)) + '</a>';
  }

  function tileHtml(item) {
    var cur = isCurrent(item.href, item.key) ? ' aria-current="page"' : '';
    return '<a class="da-tile" href="' + esc(item.href) + '"' + cur +
      ' data-es="' + esc(item.es) + '" data-en="' + esc(item.en) + '">' +
      '<span class="da-mark">' + esc(item.mark) + '</span>' +
      '<span class="da-name">' + esc(pick(item)) + '</span>' +
      '<span class="da-hint" data-es="' + esc(item.hint.es) + '" data-en="' + esc(item.hint.en) + '">' + esc(pick(item.hint)) + '</span></a>';
  }

  function versionText() {
    var meta = document.querySelector('meta[name="admiranext-version"]');
    return (meta && meta.content) || '';
  }

  function markup(section) {
    var T = function (es, en) { return lang() === 'en' ? en : es; };
    var sec = section ? '<span class="da-section" data-es="' + esc(section.es) + '" data-en="' + esc(section.en) + '">' + esc(pick(section)) + '</span>' : '';
    var bar = '<div id="daTop" class="da-bar" data-da-shell>' +
      '<button type="button" class="da-icon" id="daOptionsBtn" data-da-toggle="options" aria-controls="daOptions" aria-expanded="false" title="' + T('Opciones', 'Options') + '" aria-label="' + T('Opciones', 'Options') + '">☰</button>' +
      '<span class="da-brand-wrap"><a class="da-brand" href="/" title="' + T('DigitalAvatar · inicio', 'DigitalAvatar · home') + '">Digital<b>Avatar</b></a>' + sec + '</span>' +
      '<div class="da-spacer"></div>' +
      '<div class="da-toggles" role="group" aria-label="' + T('Modos: avanzado y experto', 'Modes: advanced and expert') + '">' +
      '<button type="button" class="da-icon" id="daAdvancedBtn" data-da-toggle="advanced" aria-controls="daAdvanced" aria-expanded="false" title="' + T('Avanzado', 'Advanced') + '" aria-label="' + T('Avanzado', 'Advanced') + '">▤</button>' +
      '<button type="button" class="da-icon" id="daExpertBtn" data-da-toggle="expert" aria-controls="daExpert" aria-pressed="false" title="' + T('Modo experto', 'Expert mode') + '" aria-label="' + T('Modo experto', 'Expert mode') + '">⌘</button>' +
      '</div></div>';
    var options = '<nav class="da-panel da-left is-collapsed" id="daOptions" aria-label="' + T('Opciones', 'Options') + '" aria-hidden="true">' +
      '<div class="da-title" data-es="Opciones" data-en="Options">' + T('Opciones', 'Options') + '</div>' +
      '<div class="da-links">' + OPTIONS.map(linkHtml).join('') +
      '<button type="button" class="da-link" id="daLangBtn" data-es="Idioma · English" data-en="Language · Español">' + (lang() === 'en' ? 'Language · Español' : 'Idioma · English') + '</button>' +
      '</div><div class="da-version" id="daVersion">' + esc(versionText()) + '</div></nav>';
    var advanced = '<nav class="da-panel da-right is-collapsed" id="daAdvanced" aria-label="' + T('Avanzado', 'Advanced') + '" aria-hidden="true">' +
      '<div class="da-title" data-es="Avanzado" data-en="Advanced">' + T('Avanzado', 'Advanced') + '</div>' +
      '<div class="da-links" id="daAdvancedLinks">' + ADVANCED.map(linkHtml).join('') + '</div></nav>';
    var expert = '<section class="da-expert is-collapsed" id="daExpert" aria-label="' + T('Modo experto', 'Expert mode') + '" aria-hidden="true">' +
      '<div class="da-expert-head"><strong class="da-head" data-es="Modo experto" data-en="Expert mode">' + T('Modo experto', 'Expert mode') + '</strong>' +
      '<button type="button" class="da-close" data-da-close="expert" aria-label="' + T('Cerrar modo experto', 'Close expert mode') + '">×</button></div>' +
      '<div class="da-tiles" id="daTiles">' + TILES.map(tileHtml).join('') + '</div>' +
      '<form class="da-cli" id="daCli" autocomplete="off"><span class="da-prompt">›</span>' +
      '<input id="daCliInput" spellcheck="false" autocapitalize="off" placeholder="/help" aria-label="' + T('Orden del modo experto', 'Expert mode command') + '">' +
      '<button type="submit" data-es="Ir" data-en="Go">' + T('Ir', 'Go') + '</button></form>' +
      '<ol class="da-log" id="daLog" role="log" aria-live="polite"></ol></section>';
    return bar + '<div class="da-layer">' + options + advanced + expert + '</div>';
  }

  function helpText() {
    if (lang() === 'en') {
      return 'DigitalAvatar · expert mode.\n' +
        '  /help — this list\n  /limpiar — clear the console\n  /version — release stamp\n  /idioma en|es — language\n' +
        'Open a tool: /vectorial /2d /3d /realista /metahuman /neo /mcp /embed /embedmh /roadmap /manual /say /asistencia /lab /inicio';
    }
    return 'DigitalAvatar · modo experto.\n' +
      '  /help — esta lista\n  /limpiar — vacía la consola\n  /version — sello del release\n  /idioma en|es — idioma\n' +
      'Abrir una herramienta: /vectorial /2d /3d /realista /metahuman /neo /mcp /embed /embedmh /roadmap /manual /say /asistencia /lab /inicio';
  }

  function parseCommand(text) {
    var raw = String(text == null ? '' : text).trim();
    if (!raw) return null;
    var m = raw.match(/^\/?([^\s]+)(?:\s+([\s\S]*))?$/);
    if (!m) return null;
    return {raw: raw, verb: m[1].toLowerCase(), args: (m[2] || '').trim()};
  }

  var state = {options: false, advanced: false, expert: false};
  var IDS = {options: 'daOptions', advanced: 'daAdvanced', expert: 'daExpert'};

  function paint(name) {
    var open = state[name];
    var panel = document.getElementById(IDS[name]);
    if (!panel) return;
    panel.classList.toggle('is-collapsed', !open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    var btn = document.querySelector('#daTop [data-da-toggle="' + name + '"]');
    if (btn) {
      btn.classList.toggle('is-active', open);
      btn.setAttribute(name === 'expert' ? 'aria-pressed' : 'aria-expanded', open ? 'true' : 'false');
    }
    var h = 0;
    if (state.expert) {
      var ex = document.getElementById('daExpert');
      h = ex ? Math.round(ex.getBoundingClientRect().height) : 0;
    }
    document.documentElement.style.setProperty('--da-bottom', h + 'px');
  }

  function setPanel(name, open, opts) {
    if (!(name in state)) return;
    state[name] = !!open;
    paint(name);
    opts = opts || {};
    if (open && name === 'expert' && opts.focus !== false) {
      var input = document.getElementById('daCliInput');
      if (input) setTimeout(function () { input.focus({preventScroll: true}); }, 30);
    }
  }

  function translate() {
    var en = lang() === 'en';
    var nodes = document.querySelectorAll('#daTop [data-es], #daOptions [data-es], #daAdvanced [data-es], #daExpert [data-es]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var text = en ? el.getAttribute('data-en') : el.getAttribute('data-es');
      if (text != null && el.childElementCount === 0) el.textContent = text;
      else if (text != null && el.classList.contains('da-tile')) {
        var name = el.querySelector('.da-name');
        if (name) name.textContent = text;
      }
    }
    var hints = document.querySelectorAll('#daTiles .da-hint');
    for (var j = 0; j < hints.length; j++) {
      hints[j].textContent = en ? hints[j].getAttribute('data-en') : hints[j].getAttribute('data-es');
    }
    var labels = {
      daOptionsBtn: en ? 'Options' : 'Opciones',
      daAdvancedBtn: en ? 'Advanced' : 'Avanzado',
      daExpertBtn: en ? 'Expert mode' : 'Modo experto'
    };
    Object.keys(labels).forEach(function (id) {
      var b = document.getElementById(id);
      if (!b) return;
      b.title = labels[id];
      b.setAttribute('aria-label', labels[id]);
    });
    var langBtn = document.getElementById('daLangBtn');
    if (langBtn) langBtn.textContent = en ? 'Language · Español' : 'Idioma · English';
  }

  function log(text, cls) {
    var ol = document.getElementById('daLog');
    if (!ol) return;
    String(text == null ? '' : text).split('\n').forEach(function (line) {
      var li = document.createElement('li');
      if (cls) li.className = cls;
      li.textContent = line;
      ol.appendChild(li);
    });
    while (ol.children.length > 40) ol.removeChild(ol.firstElementChild);
    ol.scrollTop = ol.scrollHeight;
  }

  function setLanguage(next) {
    next = next === 'en' ? 'en' : 'es';
    var pair = document.getElementById(next === 'en' ? 'langEn' : 'langEs');
    if (pair) { pair.click(); return; }
    var toggle = document.getElementById('langToggle') || document.getElementById('langBtn');
    if (toggle && toggle.offsetParent !== null) {
      var label = (toggle.textContent || '').trim().toLowerCase();
      if (label === next) { toggle.click(); return; }
    } else if (toggle) {
      var labelHidden = (toggle.textContent || '').trim().toLowerCase();
      if (labelHidden === 'en' || labelHidden === 'es') {
        if (labelHidden === next) { toggle.click(); translate(); return; }
      }
    }
    try { localStorage.setItem('da_lang', next); } catch (e) {}
    document.documentElement.lang = next;
    document.dispatchEvent(new CustomEvent('da:lang', {detail: {lang: next}}));
    translate();
  }

  function run(text) {
    var p = parseCommand(text);
    if (!p) return;
    log('› ' + p.raw, 'da-in');
    var verb = p.verb;
    if (verb === 'help' || verb === '?' || (verb === 'ayuda' && !p.args)) {
      log(helpText());
      return;
    }
    if (verb === 'limpiar' || verb === 'clear' || verb === 'cls') {
      var ol = document.getElementById('daLog');
      if (ol) ol.replaceChildren();
      return;
    }
    if (verb === 'version' || verb === 'sello') { log(versionText() || 'sin sello'); return; }
    if (verb === 'idioma' || verb === 'lang' || verb === 'language') {
      var arg = (p.args || '').toLowerCase();
      if (arg === 'en' || arg === 'es') { setLanguage(arg); log(arg); return; }
      setLanguage(lang() === 'en' ? 'es' : 'en');
      log(lang());
      return;
    }
    if (verb === 'opciones' || verb === 'options') { setPanel('options', true, {focus: false}); return; }
    if (verb === 'avanzado' || verb === 'advanced') { setPanel('advanced', true, {focus: false}); return; }
    if (GO[verb]) {
      log(lang() === 'en' ? 'Opening ' + GO[verb] : 'Abro ' + GO[verb]);
      setTimeout(function () { location.assign(GO[verb]); }, 180);
      return;
    }
    log(lang() === 'en'
      ? 'Unknown verb. /help lists them.'
      : 'Verbo desconocido. /help los lista.');
  }

  function boot() {
    if (root.__daShell) return;
    if (root.self !== root.top) return;
    var script = document.currentScript || document.querySelector('script[src*="da-shell.js"]');
    if (script && script.getAttribute('data-da-framed') === 'on') return;
    if (document.getElementById('daTop')) return;
    root.__daShell = true;

    var saved = null;
    try { saved = localStorage.getItem('da_lang'); } catch (e) {}
    if ((saved === 'en' || saved === 'es') && !document.getElementById('langToggle') && !document.getElementById('langBtn')) {
      document.documentElement.lang = saved;
    }

    var data = (script && script.dataset) || {};
    var section = null;
    if (data.section) section = data.sectionEn ? {es: data.section, en: data.sectionEn} : {es: data.section, en: data.section};

    var tpl = document.createElement('template');
    tpl.innerHTML = markup(section);
    document.body.prepend(tpl.content);
    document.documentElement.setAttribute('data-da-shell', 'on');
    document.documentElement.style.setProperty('--da-bar-h', BAR + 'px');

    var stage = document.body.hasAttribute('data-da-stage') || document.getElementById('stage');
    if (!stage) document.body.classList.add('da-pad');

    var dot = document.getElementById('livedot');
    var brand = document.querySelector('#daTop .da-brand');
    if (dot && brand) brand.appendChild(dot);

    document.documentElement.classList.add('da-no-anim');
    ['options', 'advanced', 'expert'].forEach(function (name) { paint(name); });
    translate();
    new MutationObserver(translate).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
    requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.remove('da-no-anim'); }); });

    document.querySelectorAll('#daTop [data-da-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-da-toggle');
        setPanel(name, !state[name]);
      });
    });
    document.querySelectorAll('[data-da-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-da-close');
        setPanel(name, false);
        var t = document.querySelector('#daTop [data-da-toggle="' + name + '"]');
        if (t) t.focus();
      });
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      var inside = ev.target && ev.target.closest && ev.target.closest('#daOptions, #daAdvanced, #daExpert');
      if (!inside) return;
      var name = inside.id === 'daOptions' ? 'options' : inside.id === 'daAdvanced' ? 'advanced' : 'expert';
      setPanel(name, false);
      var t = document.querySelector('#daTop [data-da-toggle="' + name + '"]');
      if (t) t.focus();
    });

    var langBtn = document.getElementById('daLangBtn');
    if (langBtn) langBtn.addEventListener('click', function () { setLanguage(lang() === 'en' ? 'es' : 'en'); });

    var form = document.getElementById('daCli');
    var input = document.getElementById('daCliInput');
    var history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').filter(function (x) { return typeof x === 'string'; }).slice(-40); } catch (e) {}
    var cursor = history.length;
    var draft = '';
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var value = input.value.trim();
      if (!value) return;
      input.value = '';
      if (history[history.length - 1] !== value) history.push(value);
      history = history.slice(-40);
      cursor = history.length;
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) {}
      run(value);
    });
    input.addEventListener('keydown', function (ev) {
      if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
      ev.preventDefault();
      if (cursor === history.length) draft = input.value;
      cursor = Math.max(0, Math.min(history.length, cursor + (ev.key === 'ArrowUp' ? -1 : 1)));
      input.value = cursor === history.length ? draft : history[cursor];
    });

    var params = new URLSearchParams(location.search);
    var open = (params.get('da-panel') || '').toLowerCase();
    if (open === 'options' || open === 'opciones' || open === 'left') setPanel('options', true, {focus: false});
    if (open === 'advanced' || open === 'avanzado' || open === 'right') setPanel('advanced', true, {focus: false});
    if (open === 'expert' || open === 'experto') setPanel('expert', true, {focus: false});

    root.DigitalAvatarShell = {setPanel: setPanel, setLanguage: setLanguage, run: run, version: versionText};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window === 'undefined' ? globalThis : window);
