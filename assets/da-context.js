/* DigitalAvatar.ai · contexto del cliente para las tres caras (good, better, best).
 * GrokBot · MacMini, 6-oct-2026.
 *
 * Quien incrusta la cara (admiranext.com/assets/avatar.js, el gemelo de admira.store /
 * xpaceos.com, un tótem) la abre con parámetros en la URL:
 *   ?loc=<id del punto>&lang=es|en&sector=<estanco|cafeteria|…>&brand=<marca blanca>
 *   &site=<nombre>&city=<ciudad>&tier=avatar|human|metahuman (o good|better|best)&avatar=admirito|luna|neo
 * Tier → avatar por defecto: avatar/good→admirito, human/better→luna, metahuman/best→neo. El historial de sesión
 * se guarda por avatar para que al cambiar de cara no se mezclen recuerdos.
 * y puede cambiarlos después con postMessage {type:'da-context', …mismos campos, live}
 * desde un origen de la red (lista ALLOWED). `live` = datos en vivo (p. ej. «Suena
 * ahora: …»); solo viaja en el nivel best.
 *
 * Modo pedido (SubMorfeoMacMini, 7-oct-2026): el quiosco de ainimation.studio abre la cara con
 * ?mode=order&store=<id>&brand=starbucks (o lo manda en da-context, con `order` = su carrito
 * actual). La cara pasa mode/store/order al cerebro y, cuando este devuelve
 * action {type:'order-draft'}, NO pinta botón: la reenvía al anfitrión dentro de da-answer,
 * solo a un origen de ORDER_HOSTS y nunca con '*'.
 *
 * La página pide a brain.digitalavatar.ai/metahuman/profile los chips, las frases de
 * espera y el saludo del sector, y añade DAContext.body() a cada pregunta. Las reglas
 * (Ley 28/2005 para tabaco y vapeo, no inventar productos ni precios) las pone el cerebro.
 */
(function (root) {
  'use strict';
  var BRAIN = 'https://brain.digitalavatar.ai';
  var KEYS = ['loc', 'lang', 'sector', 'brand', 'site', 'city', 'tier', 'avatar', 'live', 'mode', 'store'];
  var TIER_AVATAR = { good: 'admirito', better: 'luna', best: 'neo' };
  // Categorías públicas (7-oct-2026): avatar/human/metahuman = good/better/best.
  var CATEGORY_TIER = { avatar: 'good', human: 'better', metahuman: 'best' };
  var AVATAR_ALIAS = { alex: 'luna' };
  var AVATARS = ['admirito', 'luna', 'neo'];
  var TIERS = ['good', 'better', 'best'];
  var ALLOWED = /^https:\/\/([a-z0-9-]+\.)*(admiranext\.com|admira\.store|xpaceos\.com|admira\.studio|pixeria\.com|admira\.tv|clearchannel\.tv|admira\.biz|admira\.app|yokup\.com|digitalavatar\.ai|carlossilva\.info|csilvasantin\.github\.io|ainimation\.studio)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  // Anfitriones que pueden recibir la acción de pedido (origen exacto en postMessage).
  var ORDER_HOSTS = /^https:\/\/([a-z0-9-]+\.)*(ainimation\.studio|admira\.store|xpaceos\.com|admiranext\.com)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  function clean(k, v) {
    if (v == null) return '';
    v = String(v).replace(/\s+/g, ' ').trim().slice(0, k === 'live' ? 600 : 120);
    if (k === 'lang') return /^en/i.test(v) ? 'en' : /^es/i.test(v) ? 'es' : '';
    if (k === 'tier') { v = v.toLowerCase(); v = CATEGORY_TIER[v] || v; return TIERS.indexOf(v) >= 0 ? v : ''; }
    if (k === 'avatar') {
      v = v.toLowerCase();
      if (AVATAR_ALIAS[v]) return AVATAR_ALIAS[v];
      if (CATEGORY_TIER[v]) return TIER_AVATAR[CATEGORY_TIER[v]];
      if (AVATARS.indexOf(v) >= 0) return v;
      if (TIER_AVATAR[v]) return TIER_AVATAR[v];
      return '';
    }
    if (k === 'brand' && /^(admira|off|none)$/i.test(v)) return '';
    if (k === 'mode') return /^order$/i.test(v) ? 'order' : '';
    if (k === 'store') { v = v.toLowerCase(); return /^[a-z0-9][a-z0-9-]{0,79}$/.test(v) ? v : ''; }
    return v;
  }

  var ctx = {};
  var fromUrl = {};
  try {
    var q = new URLSearchParams(root.location.search);
    KEYS.forEach(function (k) { if (k === 'live') return; var v = clean(k, q.get(k)); if (v) { ctx[k] = v; fromUrl[k] = true; } });
  } catch (_) {}

  var profile = null, listeners = [], histories = {}, pending = null, seq = 0, lastAvatar = '';
  function emit(kind) { for (var i = 0; i < listeners.length; i++) { try { listeners[i](kind, api); } catch (_) {} } }

  function tier() { return ctx.tier || 'good'; }
  function lang(fallback) { return ctx.lang || fallback || 'es'; }
  function avatar() { return ctx.avatar || TIER_AVATAR[tier()] || 'admirito'; }
  function historyFor(id) { if (!histories[id]) histories[id] = []; return histories[id]; }

  // Métricas (7-oct-2026): id aleatorio de conversación por pestaña (sin datos personales),
  // plataforma de origen (?from= o el dominio que nos incrusta) y sala. Ver brain /metrics.
  var CONV = '', FROM = '', SALA = '', CANAL = '', ORIGEN = '', DEMO_RUN = '';
  try {
    CONV = sessionStorage.getItem('da-conv') || '';
    if (!CONV) { CONV = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6); sessionStorage.setItem('da-conv', CONV); }
  } catch (_) { CONV = Math.random().toString(36).slice(2, 14); }
  try {
    var qp = new URLSearchParams(root.location.search);
    FROM = String(qp.get('from') || '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 40);
    if (!FROM && document.referrer) { var rh = new URL(document.referrer).hostname.replace(/^www\./, ''); if (rh && rh !== root.location.hostname.replace(/^www\./, '')) FROM = rh; }
    SALA = String(qp.get('sala') || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 60);
    // Registro (7-oct-2026, contrato «registro v1»): ?conv= del anfitrión (el quiosco enlaza así el pedido con
    // la conversación); en modo pedido, sin ?conv=, una conversación NUEVA por carga (un cliente por iframe) en
    // lugar de la de la pestaña. ?canal=, ?origen=real|demo|qa y ?demo_run= viajan tal cual al cerebro.
    var cv = String(qp.get('conv') || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 40);
    if (cv.length >= 6) CONV = cv;
    else if (ctx.mode === 'order') CONV = 'k' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
    var cn = String(qp.get('canal') || '').toLowerCase();
    if (/^(kiosko|ipad|gemelo|web|movil|tv)$/.test(cn)) CANAL = cn;
    var og = String(qp.get('origen') || '').toLowerCase();
    if (/^(real|demo|qa)$/.test(og)) ORIGEN = og;
    DEMO_RUN = String(qp.get('demo_run') || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 40);
  } catch (_) {}

  // Pedido en curso: el último borrador (del anfitrión en da-context o del cerebro). Viaja
  // de vuelta al cerebro como `order` para que el pedido se acumule turno a turno.
  var order = null;
  function cleanOrder(o) {
    if (!o || typeof o !== 'object' || !Array.isArray(o.lines)) return null;
    var c = {type: 'order-draft', version: 1, lines: o.lines.slice(0, 10).map(function (l) {
      return l && typeof l === 'object' ? {id: String(l.id || '').slice(0, 60), qty: l.qty, options: l.options && typeof l.options === 'object' ? l.options : {}} : null;
    }).filter(Boolean)};
    if (o.store) c.store = String(o.store).slice(0, 80);
    if (o.customerName) c.customerName = String(o.customerName).slice(0, 24);
    try { if (JSON.stringify(c).length > 4000) return null; } catch (_) { return null; }
    return c;
  }

  // Botón de acción que manda el cerebro (p. ej. «Pedir en el quiosco» de Starbucks).
  // Con order-draft no hay botón: la acción se reenvía al anfitrión (notify).
  function action(a) {
    var old = null;
    try { old = document.getElementById('daAction'); } catch (_) {}
    if (old) old.remove();
    if (a && a.type === 'order-draft') { order = cleanOrder(a) || order; return; }
    if (!a || a.type !== 'kiosk' || !/^https:\/\/(www\.)?ainimation\.studio\//.test(String(a.url || ''))) return;
    var el = document.createElement('a');
    el.id = 'daAction'; el.href = a.url; el.target = '_blank'; el.rel = 'noopener';
    el.textContent = '☕ ' + (a.label || 'Pedir en el quiosco') + ' →';
    el.setAttribute('style', 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 170px);z-index:60;padding:11px 20px;border-radius:999px;background:#00704A;color:#fff;font:700 15px/1.1 -apple-system,Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.85)');
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 60000);
  }

  // Campos que se suman al cuerpo de POST /metahuman/ask.
  function body(extra) {
    var b = {tier: tier(), avatar: avatar()};
    if (CONV) b.conv = CONV;
    if (FROM) b.from = FROM;
    if (SALA) b.sala = SALA;
    if (CANAL) b.canal = CANAL;
    if (ORIGEN) b.origen = ORIGEN;
    if (DEMO_RUN) b.demo_run = DEMO_RUN;
    if (ctx.loc) b.loc = ctx.loc;
    if (ctx.sector) b.sector = ctx.sector;
    if (ctx.brand) b.brand = ctx.brand;
    if (ctx.site || ctx.city) b.site = {name: ctx.site || '', city: ctx.city || ''};
    // Historial: en best siempre; con marca (p. ej. Starbucks) también, para el pedido paso a paso.
    if (tier() === 'best' || ctx.brand || ctx.mode === 'order') { var h = historyFor(avatar()); if (h.length) b.history = h.slice(-6); }
    if (ctx.mode === 'order') { b.mode = 'order'; if (ctx.store) b.store = ctx.store; if (order) b.order = order; }
    if (tier() === 'best' && ctx.live) b.context = ctx.live;
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k) && extra[k] !== undefined && extra[k] !== '') b[k] = extra[k];
    return b;
  }

  function remember(question, answer) {
    if (!question || !answer) return;
    var h = historyFor(avatar());
    h.push({role: 'user', content: String(question).slice(0, 500)}, {role: 'assistant', content: String(answer).slice(0, 500)});
    if (h.length > 6) histories[avatar()] = h.slice(-6);
  }

  function refresh(langHint) {
    var mine = ++seq;
    var av = avatar();
    if (av !== lastAvatar) { lastAvatar = av; } // historial ya está scoped por avatar
    var p = ['lang=' + encodeURIComponent(lang(langHint)), 'tier=' + tier(), 'avatar=' + encodeURIComponent(av)];
    ['loc', 'sector', 'brand'].forEach(function (k) { if (ctx[k]) p.push(k + '=' + encodeURIComponent(ctx[k])); });
    if (ctx.site) p.push('site=' + encodeURIComponent(ctx.site));
    if (ctx.city) p.push('city=' + encodeURIComponent(ctx.city));
    pending = fetch(BRAIN + '/metahuman/profile?' + p.join('&'), {cache: 'no-store'})
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (mine !== seq) return profile; if (d && d.ok) { profile = d; emit('profile'); } return profile; })
      .catch(function () { return profile; });
    return pending;
  }

  // Valores por defecto de cada página (p. ej. nube.html = good); la URL manda.
  function init(defaults) {
    if (defaults) for (var k in defaults) if (KEYS.indexOf(k) >= 0 && !fromUrl[k]) { var v = clean(k, defaults[k]); if (v) ctx[k] = v; }
    return refresh();
  }

  function set(partial) {
    if (!partial || typeof partial !== 'object') return api;
    // El carrito del anfitrión manda: {order:null} lo vacía (p. ej. el quiosco vuelve al inicio).
    if (Object.prototype.hasOwnProperty.call(partial, 'order')) order = cleanOrder(partial.order);
    var changed = false, langChanged = false;
    KEYS.forEach(function (k) {
      if (!Object.prototype.hasOwnProperty.call(partial, k)) return;
      var v = clean(k, partial[k]);
      if ((ctx[k] || '') === v) return;
      if (v) ctx[k] = v; else delete ctx[k];
      changed = true; if (k === 'lang') langChanged = true;
    });
    if (!changed) return api;
    emit(langChanged ? 'lang' : 'context');
    if (Object.keys(partial).some(function (k) { return k !== 'live' && k !== 'order' && k !== 'mode' && k !== 'store' && k !== 'type'; })) refresh();
    return api;
  }

  // ─── /demo <solución> (Carlos, 7-oct-2026, demo Alsea · Starbucks) ───
  // «/demo» a secas sigue siendo el pitch de 30 s. «/demo store» (o 1…5, o el alias)
  // hace que la cara presente la solución y, al terminar de hablar, pida a la página
  // que la incrusta abrir su demo: postMessage {type:'da-demo', id} → admiranext.com/assets/avatar.js
  // (mismo catálogo que /demo del ⌘ Experto, suite/experto.js). Sin página madre, abre la URL aquí.
  var DEMOS = [
    { id: 'studio', alias: ['pixeria', 'contenido', 'contenidos', 'creatividad'], n: 'admira.studio',
      es: 'contenidos con IA para la tienda: locución, música, imagen, vídeo y adaptación de formatos',
      en: 'AI content for the store: voiceover, music, image, video and format adaptation',
      url: 'https://www.admira.studio/' },
    { id: 'store', alias: ['tienda', 'xpace', 'xpaceos', 'gemelo', 'twin'], n: 'admira.store',
      es: 'el gemelo digital del Starbucks de Alsea en Matrix; un muffin viaja a la caja y dispara música y pantallas',
      en: 'the digital twin of the Alsea Starbucks in Matrix; a muffin travels to the register and triggers music and screens',
      url: 'https://www.admira.store/admira-xp/?marca=starbucks&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks&lang=es&demo=tpv#tpv' },
    { id: 'tv', alias: ['canal', 'adcelerate', 'calle', 'videoanalytics'], n: 'admira.tv',
      es: 'el Starbucks de Passeig de Gràcia 103 visto desde la calle; el halo de la fachada entra en Matrix',
      en: 'the Starbucks at Passeig de Gràcia 103 seen from the street; the entrance halo opens Matrix',
      url: 'https://admira.tv/adcelerate/demo/?view=human&site=starbucks' },
    { id: 'app', alias: ['yokup', 'operaciones', 'itil', 'incidencias', 'retailer'], n: 'admira.app con Yokup',
      es: 'la operación de la red Starbucks: equipos, incidencias ITIL y estado de cada tienda',
      en: 'Starbucks network operations: equipment, ITIL incidents and the status of each store',
      url: 'https://www.yokup.com/retailer?marca=starbucks' },
    { id: 'biz', alias: ['negocio', 'clearchannel', 'retailmedia', 'comercial'], n: 'admira.biz',
      es: 'la comercialización: retail media y campañas de marca sobre las pantallas de la red',
      en: 'monetisation: retail media and brand campaigns across the network screens',
      url: 'https://www.admira.biz/' }
  ];
  var demoPending = null, demoOpeningTimer = null;
  // Local playback controls are host commands, never questions for the brain.
  // The host acknowledges the request after its dispatcher has run; silence is not success.
  var demoRequests = Object.create(null), demoRequestSeq = 0, demoRequestPrefix = 'da-demo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  var demoParentOrigin = '';
  try {
    var embeddingOrigin = new URL(document.referrer).origin;
    if (ALLOWED.test(embeddingOrigin)) demoParentOrigin = embeddingOrigin;
  } catch (_) {}
  function demoFeedback(en, es) { return lang() === 'en' ? en : es; }
  function demoCommand(question) {
    var m = /^\/?demo\s+(auto|todas|todos|all|pausa|pause|reanudar|resume|continuar|siguiente|next|stop|off|parar|estado|status|help|ayuda|lista|\?)$/i.exec(norm(question));
    if (!m || root.self === root.top) return null;
    var isHelp = /^(help|ayuda|lista|\?)$/.test(m[1]);
    demoPending = null;
    clearTimeout(demoOpeningTimer); demoOpeningTimer = null;
    if (!demoParentOrigin) return Promise.resolve({ok: false, confirmed: false, message: demoFeedback('No trusted host is available; the demo command is not confirmed.', 'No hay un anfitrión de confianza disponible; la orden de demo no está confirmada.')});
    var requestId = demoRequestPrefix + '-' + (++demoRequestSeq);
    return new Promise(function (resolve) {
      var timeout = setTimeout(function () {
        if (!demoRequests[requestId]) return;
        delete demoRequests[requestId];
        resolve({ok: false, confirmed: false, message: demoFeedback('The host did not confirm the demo command. Check its state before retrying.', 'El anfitrión no confirmó la orden de demo. Comprueba su estado antes de reintentar.')});
      }, 20000);
      demoRequests[requestId] = {resolve: resolve, timeout: timeout};
      try {
        root.parent.postMessage({type: 'da-demo', id: '', texto: '/demo ' + (isHelp ? 'help' : m[1].toLowerCase()), requestId: requestId}, demoParentOrigin);
      } catch (_) {
        clearTimeout(timeout); delete demoRequests[requestId];
        resolve({ok: false, confirmed: false, message: demoFeedback('The demo command could not reach the host.', 'La orden de demo no pudo llegar al anfitrión.')});
      }
    });
  }

  // Subdemos locales de la plataforma que incrusta la cara (admira.studio / pixeria.com), recibidas de
  // admiranext.com/assets/avatar.js como {type:'da-subdemos', plataforma, subdemos:[{n, id, nombre, desc, aliases}]}.
  // Con ellas, /demo 1…5 y sus alias son de esa plataforma y /demo help lista solo esas (contrato de Trinity).
  var LOCAL = null;
  function norm(t) { return String(t == null ? '' : t).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function demoFind(question) {
    var m = /^\/?demo\s+(.+)$/i.exec(String(question || '').trim());
    if (!m) return null;
    var a = norm(m[1]).replace(/^admira\./, '');
    if (LOCAL) {
      if (/^(help|ayuda|\?|lista)$/.test(a)) return { ayuda: true, texto: '/demo help' };
      for (var j = 0; j < LOCAL.subdemos.length; j++) {
        var s = LOCAL.subdemos[j];
        if (a === String(s.n) || (s.aliases || []).map(norm).indexOf(a) >= 0)
          return { id: LOCAL.plataforma + '/' + s.id, n: s.nombre, es: s.desc, en: s.desc, texto: '/demo ' + s.n, local: true };
      }
      if (/^[0-9]+$/.test(a)) return null;
    }
    if (/^[1-5]$/.test(a)) return DEMOS[+a - 1];
    for (var i = 0; i < DEMOS.length; i++) if (DEMOS[i].id === a || DEMOS[i].alias.indexOf(a) >= 0) return DEMOS[i];
    return null;
  }
  // Pregunta → pregunta para el cerebro. Si es /demo <solución>, deja la demo pendiente.
  function demoAsk(question) {
    var d = demoFind(question);
    demoPending = d;
    if (!d) return question;
    if (d.ayuda) {
      var l = LOCAL.subdemos.map(function (x) { return x.n + ' ' + x.nombre; }).join(', ');
      return lang() === 'en'
        ? 'In one short sentence, say these are the demos of ' + (LOCAL.nombre || LOCAL.plataforma) + ' and name them: ' + l + '. Tell them to ask "/demo" and the number.'
        : 'En una frase corta, di que estas son las demos de ' + (LOCAL.nombre || LOCAL.plataforma) + ' y nómbralas: ' + l + '. Diles que pidan «/demo» y el número.';
    }
    if (d.local) return lang() === 'en'
      ? 'In two short sentences, as Admira\'s host for Alsea (Starbucks in Spain and Mexico), introduce the ' + d.n + ' demo: ' + d.en + '. End by saying you are showing the prepared sample now.'
      : 'En dos frases cortas, como anfitrión de Admira para Alsea (Starbucks en España y México), presenta la demo ' + d.n + ': ' + d.es + '. Termina diciendo que enseñas ahora la muestra preparada.';
    return lang() === 'en'
      ? 'In two short sentences, as Admira\'s host for Alsea (Starbucks in Spain and Mexico), introduce ' + d.n + ': ' + d.en + '. End by saying you are showing it now.'
      : 'En dos frases cortas, como anfitrión de Admira para Alsea (Starbucks en España y México), presenta ' + d.n + ': ' + d.es + '. Termina diciendo que la enseñas ahora.';
  }
  // Tras la respuesta: abre la demo cuando la cara acaba de hablar (estimado por el texto).
  function demoDone(answer) {
    var d = demoPending; demoPending = null;
    if (!d) return;
    var words = String(answer || '').split(/\s+/).filter(Boolean).length;
    var ms = Math.min(30000, Math.max(1500, words / 2.6 * 1000 + 800));
    demoOpeningTimer = setTimeout(function () {
      demoOpeningTimer = null;
      try {
        if (root.self !== root.top) root.parent.postMessage(d.texto ? { type: 'da-demo', id: d.id || '', texto: d.texto } : { type: 'da-demo', id: d.id }, '*');
        else if (d.url) root.location.assign(d.url);
      } catch (_) {}
    }, ms);
  }

  // da-answer al anfitrión. Sin acción, como siempre. Con acción (p. ej. order-draft), solo si
  // el anfitrión es de ORDER_HOSTS y con su origen exacto; si no, se manda sin la acción.
  function notify(payload) {
    try {
      if (root.self === root.top) return false;
      var msg = {type: 'da-answer'}, k;
      for (k in payload || {}) if (Object.prototype.hasOwnProperty.call(payload, k) && k !== 'action' && payload[k] !== undefined) msg[k] = payload[k];
      var a = payload && payload.action;
      if (a && typeof a === 'object' && demoParentOrigin && ORDER_HOSTS.test(demoParentOrigin)) {
        msg.action = a;
        root.parent.postMessage(msg, demoParentOrigin);
        return true;
      }
      root.parent.postMessage(msg, '*');
      return true;
    } catch (_) { return false; }
  }

  root.addEventListener('message', function (ev) {
    var d = ev && ev.data;
    if (d && typeof d === 'object' && d.type === 'da-demo-result') {
      if (ev.source !== root.parent || !demoParentOrigin || ev.origin !== demoParentOrigin) return;
      if (typeof d.requestId !== 'string') return;
      var request = demoRequests[d.requestId];
      if (!request) return;
      clearTimeout(request.timeout); delete demoRequests[d.requestId];
      request.resolve({ok: d.ok === true, confirmed: true, message: String(d.message || demoFeedback('The host returned a response.', 'El anfitrión devolvió una respuesta.')).slice(0, 4000), estado: d.estado});
      return;
    }
    if (!demoParentOrigin && ev && ev.source === root.parent && ALLOWED.test(String(ev.origin || '')) && d && (d.type === 'da-subdemos' || d.type === 'da-context')) demoParentOrigin = ev.origin;
    if (d && typeof d === 'object' && d.type === 'da-subdemos' && ALLOWED.test(String(ev.origin || '')) && Array.isArray(d.subdemos)) {
      LOCAL = d.subdemos.length ? { plataforma: String(d.plataforma || ''), nombre: String(d.nombre || ''), subdemos: d.subdemos.slice(0, 20) } : null;
      return;
    }
    if (!d || typeof d !== 'object' || d.type !== 'da-context') return;
    if (!ALLOWED.test(String(ev.origin || ''))) return;
    set(d);
  });

  var api = {
    get: function () { var c = {}; for (var k in ctx) c[k] = ctx[k]; return c; },
    set: set, init: init, refresh: refresh, body: body, remember: remember, action: action, notify: notify,
    order: function () { return order; }, hostOrigin: function () { return demoParentOrigin; },
    demoCommand: demoCommand, demoAsk: demoAsk, demoDone: demoDone, subdemos: function () { return LOCAL; }, demos: function () { return DEMOS.map(function (d) { return { id: d.id, nombre: d.n, url: d.url }; }); },
    tier: tier, lang: lang, avatar: avatar,
    // id de la conversación actual (el registro de digitalavatar.ai/metricas agrupa por él)
    conv: function () { return CONV; },
    profile: function () { return profile; },
    ready: function () { return pending || Promise.resolve(profile); },
    // Chip de demo (7-oct-2026): «Demo · 30 s» → el cerebro lo trata como /demo (pitch de 30 s).
    chips: function (fallback) { var l = profile && profile.chips && profile.chips.length ? profile.chips : (fallback || []); return l.some(function (c) { return /^\/?demo\b/i.test(String(c)); }) ? l : ['Demo · 30 s'].concat(l); },
    // ?demo=1: lanza el pitch al cargar (una vez), con el ask de cada página.
    demoOnLoad: function (askFn) { try { if (new URLSearchParams(root.location.search).get('demo') !== '1') return; } catch (_) { return; } (pending || Promise.resolve()).then(function () { setTimeout(function () { askFn('/demo'); }, 700); }); },
    idle: function (fallback) { return profile && profile.idle && profile.idle.length ? profile.idle : (fallback || []); },
    greeting: function (fallback) { return (profile && profile.greeting) || fallback || ''; },
    who: function (fallback) { return (profile && profile.who) || fallback || ''; },
    summary: function (fallback) { return (profile && profile.summary) || fallback || ''; },
    name: function () { return (profile && profile.name) || ''; },
    on: function (fn) { if (typeof fn === 'function') listeners.push(fn); return api; },
    allowed: function (origin) { return ALLOWED.test(String(origin || '')); },
    BRAIN: BRAIN
  };
  root.DAContext = api;
  // Mando remoto del MCP (digitalavatar.ai/mcp) + /help, /avatar, /idioma, /marca comunes a las tres caras.
  try { var rs = document.createElement('script'); rs.src = '/assets/da-remote.js?v=20261007-mcp-1'; rs.defer = true; (document.head || document.documentElement).appendChild(rs); } catch (_) {}
})(window);
