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
 *   admira-next-web/assets/admira-frame.js (⌘ EXPERTO · CLI: yk-cli)
 *   admira-next-web/assets/presentation-generator-quadratic.css
 *     (ficha verde generator-console a la izquierda del CLI)
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

  /* Las 11 herramientas viven en /help del CLI, no como baldosas. */
  var NIVELES = {
    vectorial: '/vectorial.html',
    '2d': '/good.html',
    '3d': '/better.html',
    realista: '/best.html',
    metahuman: '/metahuman.html'
  };
  var NIVEL_POR_RUTA = {
    '/vectorial.html': 'vectorial', '/vectorial': 'vectorial',
    '/good.html': '2d', '/good': '2d',
    '/better.html': '3d', '/better': '3d',
    '/': '3d', '/index.html': '3d',
    '/best.html': 'realista', '/best': 'realista',
    '/metahuman.html': 'metahuman', '/metahuman': 'metahuman'
  };
  var GO = {
    vectorial: '/vectorial.html',
    '2d': '/good.html',
    '3d': '/better.html',
    realista: '/best.html',
    metahuman: '/metahuman.html',
    neo: '/metahuman.html',
    mcp: '/mcp/',
    embed: '/embed-demo.html',
    embedmh: '/embed-mh.html',
    roadmap: '/roadmap/',
    ayuda: '/help/'
  };
  var VERBS = ['help', 'nivel', 'neo', 'say', 'estado', 'mcp', 'embed', 'roadmap', 'ayuda', 'limpiar', 'version', 'idioma', 'vectorial', '2d', '3d', 'realista', 'metahuman', 'embedmh'];
  var BRAIN = 'https://brain.digitalavatar.ai';
  var HOST_PROBE = 'https://macbook-pro-16.tail48b61c.ts.net:8443/images/favicon-32x32.png';
  var hostState = 'comprobando…';
  var engineState = '';
  var hostGen = 0;

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
    var expert = '<section class="da-expert is-collapsed" id="daExpert" aria-label="EXPERTO · CLI" aria-hidden="true">' +
      '<div class="yk-rail-navhd">⌘ EXPERTO · CLI</div>' +
      '<div class="yk-expert">' +
      '<section class="generator-slot" aria-label="' + T('Motor del avatar', 'Avatar engine') + '">' +
      '<pre class="generator-console" id="daEngine"></pre></section>' +
      '<div class="yk-cli">' +
      '<div class="yk-cli-out" id="daLog" role="log" aria-live="polite" tabindex="0"></div>' +
      '<form class="yk-cli-form" id="daCli" autocomplete="off">' +
      '<label class="yk-cli-prompt" for="daCliInput">›</label>' +
      '<input class="yk-cli-input" id="daCliInput" type="text" spellcheck="false" autocapitalize="off" placeholder="/help" aria-label="' + T('Orden para el CLI', 'CLI command') + '">' +
      '</form></div></div></section>';
    return bar + '<div class="da-layer">' + options + advanced + expert + '</div>';
  }

  function helpText() {
    if (lang() === 'en') {
      return '/help — this list\n' +
        '/nivel <vectorial|2d|3d|realista|metahuman> — avatar level\n' +
        '/neo — open Neo (MetaHuman)\n' +
        '/say <text> — ask Neo and print the answer\n' +
        '/estado — engine card and MetaHuman host probe\n' +
        '/mcp — MCP hub\n' +
        '/embed — embed demo\n' +
        '/roadmap — plan\n' +
        '/ayuda — open the guide (/help/)\n' +
        '/limpiar — clear the log (alias: /clear /cls)\n' +
        '/version — release stamp\n' +
        '/idioma en|es — language\n' +
        'Tools: /vectorial /2d /3d /realista /metahuman /neo /mcp /embed /embedmh /roadmap /ayuda';
    }
    return '/help — esta lista\n' +
      '/nivel <vectorial|2d|3d|realista|metahuman> — nivel del avatar\n' +
      '/neo — abre Neo (MetaHuman)\n' +
      '/say <texto> — pregunta a Neo y muestra la respuesta\n' +
      '/estado — ficha del motor y sondeo del host MetaHuman\n' +
      '/mcp — hub MCP\n' +
      '/embed — demo del embed\n' +
      '/roadmap — plan\n' +
      '/ayuda — abre la guía (/help/)\n' +
      '/limpiar — vacía el registro (alias: /clear /cls)\n' +
      '/version — sello del release\n' +
      '/idioma en|es — idioma\n' +
      'Herramientas: /vectorial /2d /3d /realista /metahuman /neo /mcp /embed /embedmh /roadmap /ayuda';
  }

  function nivelActual() {
    var fromPath = NIVEL_POR_RUTA[herePath()];
    if (fromPath) return fromPath;
    try {
      var saved = sessionStorage.getItem('da_nivel');
      if (saved && NIVELES[saved]) return saved;
    } catch (e) {}
    return '3d';
  }

  function vozActual() {
    return 'ElevenLabs ' + lang();
  }

  function engineLines() {
    return [
      'DIGITALAVATAR ENGINE',
      'version: ' + (versionText() || 'sin sello'),
      'avatar: neo',
      'nivel: ' + nivelActual(),
      'voz: ' + vozActual(),
      'cerebro: brain.digitalavatar.ai',
      'metahuman host: ' + hostState,
      'estado: ' + (engineState || (lang() === 'en' ? 'ready' : 'listo'))
    ];
  }

  function paintEngine() {
    var pre = document.getElementById('daEngine');
    if (pre) pre.textContent = engineLines().join('\n');
  }

  function probeHost() {
    var gen = ++hostGen;
    hostState = lang() === 'en' ? 'checking…' : 'comprobando…';
    paintEngine();
    return new Promise(function (resolve) {
      var done = false;
      var img = new Image();
      var timer = setTimeout(function () {
        if (!done) { done = true; resolve(false); }
      }, 9000);
      img.onload = function () {
        if (!done) { done = true; clearTimeout(timer); resolve(true); }
      };
      img.onerror = function () {
        if (!done) { done = true; clearTimeout(timer); resolve(false); }
      };
      img.src = HOST_PROBE + '?_=' + Date.now();
    }).then(function (ok) {
      if (gen !== hostGen) return ok;
      hostState = ok ? 'online' : 'offline';
      paintEngine();
      return ok;
    });
  }

  function roomName() {
    var el = document.getElementById('room');
    var value = el && String(el.value || '').trim();
    return value || 'xtanco';
  }

  function askNeo(text) {
    var en = lang() === 'en';
    var question = text + (en
      ? '\n\n(You are Neo, the digital human of digitalavatar.ai. Always answer as Neo. Please answer in English.)'
      : '\n\n(Eres Neo, el humano digital de digitalavatar.ai. Responde siempre como Neo.)');
    return fetch(BRAIN + '/metahuman/ask', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        question: question,
        room: roomName(),
        loc: '',
        persona: 'neo',
        lang: en ? 'en' : 'es',
        history: []
      })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return {ok: response.ok, status: response.status, data: data || {}};
      });
    });
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
    paintEngine();
  }

  function log(text, cls) {
    var out = document.getElementById('daLog');
    if (!out) return;
    var extra = cls === 'da-in' || cls === 'cmd' ? ' yk-cli-cmd' : cls === 'err' ? ' yk-cli-err' : '';
    String(text == null ? '' : text).split('\n').forEach(function (line) {
      var row = document.createElement('div');
      row.className = 'yk-cli-line' + extra;
      row.textContent = line;
      out.appendChild(row);
    });
    while (out.children.length > 80) out.removeChild(out.firstElementChild);
    out.scrollTop = out.scrollHeight;
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
    if (verb === 'help' || verb === '?') {
      log(helpText());
      return;
    }
    if (verb === 'limpiar' || verb === 'clear' || verb === 'cls') {
      var out = document.getElementById('daLog');
      if (out) out.replaceChildren();
      return;
    }
    if (verb === 'estado' || verb === 'status') {
      log(lang() === 'en' ? 'Checking the MetaHuman host…' : 'Comprobando el host MetaHuman…');
      probeHost().then(function () {
        engineLines().forEach(function (line) { log(line); });
      });
      return;
    }
    if (verb === 'nivel' || verb === 'level') {
      var nivel = (p.args || '').toLowerCase();
      if (!NIVELES[nivel]) {
        log('Uso: /nivel <vectorial|2d|3d|realista|metahuman>', 'err');
        return;
      }
      try { sessionStorage.setItem('da_nivel', nivel); } catch (e) {}
      paintEngine();
      log((lang() === 'en' ? 'Level ' : 'Nivel ') + nivel + ' · ' + NIVELES[nivel]);
      if (herePath() !== norm(NIVELES[nivel])) {
        setTimeout(function () { location.assign(NIVELES[nivel]); }, 180);
      }
      return;
    }
    if (verb === 'say' || verb === 'decir') {
      if (!p.args) { log('Uso: /say <texto>', 'err'); return; }
      engineState = lang() === 'en' ? 'thinking…' : 'pensando…';
      paintEngine();
      log(lang() === 'en' ? '· thinking…' : '· respondiendo…');
      askNeo(p.args).then(function (result) {
        var answer = String(result.data.answer || '').trim();
        if (!result.ok && !answer) {
          engineState = lang() === 'en' ? 'connection error' : 'error de conexión';
          log((lang() === 'en' ? 'Brain error (' : 'Error del cerebro (') + result.status + ')', 'err');
        } else if (!answer) {
          engineState = lang() === 'en' ? 'no answer' : 'sin respuesta';
          log(lang() === 'en' ? '(no answer)' : '(sin respuesta)', 'err');
        } else {
          engineState = '';
          log(answer);
        }
        paintEngine();
      }).catch(function () {
        engineState = lang() === 'en' ? 'connection error' : 'error de conexión';
        paintEngine();
        log(lang() === 'en' ? '⚠️ connection error' : '⚠️ error de conexión', 'err');
      });
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
    if (GO[verb]) {
      var nivelGo = verb === 'neo' ? 'metahuman' : (NIVELES[verb] ? verb : '');
      if (nivelGo) {
        try { sessionStorage.setItem('da_nivel', nivelGo); } catch (e2) {}
        paintEngine();
      }
      log(lang() === 'en' ? 'Opening ' + GO[verb] : 'Abro ' + GO[verb]);
      setTimeout(function () { location.assign(GO[verb]); }, 180);
      return;
    }
    log(lang() === 'en'
      ? 'Unknown verb: /' + verb + ' · type /help'
      : 'Verbo desconocido: /' + verb + ' · escribe /help', 'err');
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
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        if (cursor === history.length) draft = input.value;
        cursor = Math.max(0, Math.min(history.length, cursor + (ev.key === 'ArrowUp' ? -1 : 1)));
        input.value = cursor === history.length ? draft : history[cursor];
        return;
      }
      if (ev.key === 'Tab' && input.value.trim() && input.value.indexOf(' ') < 0) {
        var prefix = input.value.trim().toLowerCase().replace(/^\//, '');
        var hits = VERBS.filter(function (verb) { return verb.indexOf(prefix) === 0; });
        if (!hits.length) return;
        ev.preventDefault();
        if (hits.length === 1) input.value = '/' + hits[0] + ' ';
        else log(hits.map(function (verb) { return '/' + verb; }).join('  '));
      }
    });

    paintEngine();
    log('CLI de DigitalAvatar · ADmiraNeXT · escribe /help');
    probeHost();
    fetch('/version.json', {cache: 'no-store'}).then(function (response) {
      return response.ok ? response.json() : null;
    }).then(function (data) {
      var stamp = data && data.version;
      if (!stamp || !/^v\.\d{2}\.\d{2}\.\d{4}\.r\d+\.\d{2}:\d{2}/.test(stamp)) return;
      var meta = document.querySelector('meta[name="admiranext-version"]');
      if (meta) meta.content = stamp;
      var slot = document.getElementById('daVersion');
      if (slot) slot.textContent = stamp;
      paintEngine();
    }).catch(function () {});

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
