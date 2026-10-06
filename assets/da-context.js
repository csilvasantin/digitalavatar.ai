/* DigitalAvatar.ai · contexto del cliente para las tres caras (good, better, best).
 * GrokBot · MacMini, 6-oct-2026.
 *
 * Quien incrusta la cara (admiranext.com/assets/avatar.js, el gemelo de admira.store /
 * xpaceos.com, un tótem) la abre con parámetros en la URL:
 *   ?loc=<id del punto>&lang=es|en&sector=<estanco|cafeteria|…>&brand=<marca blanca>
 *   &site=<nombre>&city=<ciudad>&tier=good|better|best
 * y puede cambiarlos después con postMessage {type:'da-context', …mismos campos, live}
 * desde un origen de la red (lista ALLOWED). `live` = datos en vivo (p. ej. «Suena
 * ahora: …»); solo viaja en el nivel best.
 *
 * La página pide a brain.digitalavatar.ai/metahuman/profile los chips, las frases de
 * espera y el saludo del sector, y añade DAContext.body() a cada pregunta. Las reglas
 * (Ley 28/2005 para tabaco y vapeo, no inventar productos ni precios) las pone el cerebro.
 */
(function (root) {
  'use strict';
  var BRAIN = 'https://brain.digitalavatar.ai';
  var KEYS = ['loc', 'lang', 'sector', 'brand', 'site', 'city', 'tier', 'live'];
  var TIERS = ['good', 'better', 'best'];
  var ALLOWED = /^https:\/\/([a-z0-9-]+\.)*(admiranext\.com|admira\.store|xpaceos\.com|admira\.studio|pixeria\.com|admira\.tv|clearchannel\.tv|admira\.biz|admira\.app|yokup\.com|digitalavatar\.ai|carlossilva\.info|csilvasantin\.github\.io)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  function clean(k, v) {
    if (v == null) return '';
    v = String(v).replace(/\s+/g, ' ').trim().slice(0, k === 'live' ? 600 : 120);
    if (k === 'lang') return /^en/i.test(v) ? 'en' : /^es/i.test(v) ? 'es' : '';
    if (k === 'tier') return TIERS.indexOf(v.toLowerCase()) >= 0 ? v.toLowerCase() : '';
    if (k === 'brand' && /^(admira|off|none)$/i.test(v)) return '';
    return v;
  }

  var ctx = {};
  var fromUrl = {};
  try {
    var q = new URLSearchParams(root.location.search);
    KEYS.forEach(function (k) { if (k === 'live') return; var v = clean(k, q.get(k)); if (v) { ctx[k] = v; fromUrl[k] = true; } });
  } catch (_) {}

  var profile = null, listeners = [], history = [], pending = null, seq = 0;
  function emit(kind) { for (var i = 0; i < listeners.length; i++) { try { listeners[i](kind, api); } catch (_) {} } }

  function tier() { return ctx.tier || 'good'; }
  function lang(fallback) { return ctx.lang || fallback || 'es'; }

  // Campos que se suman al cuerpo de POST /metahuman/ask.
  function body(extra) {
    var b = {tier: tier()};
    if (ctx.loc) b.loc = ctx.loc;
    if (ctx.sector) b.sector = ctx.sector;
    if (ctx.brand) b.brand = ctx.brand;
    if (ctx.site || ctx.city) b.site = {name: ctx.site || '', city: ctx.city || ''};
    if (tier() === 'best') {
      if (history.length) b.history = history.slice(-6);
      if (ctx.live) b.context = ctx.live;
    }
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k) && extra[k] !== undefined && extra[k] !== '') b[k] = extra[k];
    return b;
  }

  function remember(question, answer) {
    if (!question || !answer) return;
    history.push({role: 'user', content: String(question).slice(0, 500)}, {role: 'assistant', content: String(answer).slice(0, 500)});
    if (history.length > 6) history = history.slice(-6);
  }

  function refresh(langHint) {
    var mine = ++seq;
    var p = ['lang=' + encodeURIComponent(lang(langHint)), 'tier=' + tier()];
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
    if (Object.keys(partial).some(function (k) { return k !== 'live'; })) refresh();
    return api;
  }

  root.addEventListener('message', function (ev) {
    var d = ev && ev.data;
    if (!d || typeof d !== 'object' || d.type !== 'da-context') return;
    if (!ALLOWED.test(String(ev.origin || ''))) return;
    set(d);
  });

  var api = {
    get: function () { var c = {}; for (var k in ctx) c[k] = ctx[k]; return c; },
    set: set, init: init, refresh: refresh, body: body, remember: remember,
    tier: tier, lang: lang,
    profile: function () { return profile; },
    ready: function () { return pending || Promise.resolve(profile); },
    chips: function (fallback) { return profile && profile.chips && profile.chips.length ? profile.chips : (fallback || []); },
    idle: function (fallback) { return profile && profile.idle && profile.idle.length ? profile.idle : (fallback || []); },
    greeting: function (fallback) { return (profile && profile.greeting) || fallback || ''; },
    on: function (fn) { if (typeof fn === 'function') listeners.push(fn); return api; },
    allowed: function (origin) { return ALLOWED.test(String(origin || '')); },
    BRAIN: BRAIN
  };
  root.DAContext = api;
})(window);
