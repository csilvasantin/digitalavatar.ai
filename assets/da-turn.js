/* da-turn.js — relé TURN para el stream de Neo (Pixel Streaming).
 * Se inyecta (lo hace el worker neo-digitalavatar) al principio del <head> del reproductor
 * de Wilbur. Sin TURN, quien ve a Neo fuera de la red de casa/tailnet o sin UDP (redes de
 * empresa, hoteles, 4G con CGNAT estricto) se quedaba en negro y sin voz.
 * La credencial NO vive aquí: la acuña el grifo /turn de api.yokup.com (Cloudflare Realtime
 * TURN, 10 minutos, 10 por hora y por IP, sólo para orígenes autorizados). Si el par elegido
 * usa el relé, se renueva antes de caducar con setConfiguration(); si no, no se gasta cupo.
 * Version 20261007-turn-1. */
(function (root) {
  'use strict';
  var EP = 'https://api.yokup.com/turn';
  var KEY = 'da-turn:v1';
  var TTL_MS = 600000, MARGIN_MS = 150000;
  var O = root.RTCPeerConnection;
  if (!O || O.__daTurn) return;
  var cur = null; // {servers:[...], exp:ms}
  var waiters = [];
  var pcs = [];
  function norm(d) {
    var list = d && d.iceServers; if (!list) return null;
    if (!Array.isArray(list)) list = [list];
    var out = [];
    list.forEach(function (s) {
      var urls = [].concat(s.urls || s.url || []).filter(function (u) { return !/:53(\?|$)/.test(u); });
      // Puertos 443 (TLS) y 80 (TCP) de Cloudflare: los únicos que dejan pasar muchas redes cerradas.
      if (s.username && urls.some(function (u) { return /turn\.cloudflare\.com/.test(u); })) {
        ['turns:turn.cloudflare.com:443?transport=tcp', 'turn:turn.cloudflare.com:80?transport=tcp'].forEach(function (u) { if (urls.indexOf(u) < 0) urls.push(u); });
      }
      if (urls.length) out.push(s.username ? { urls: urls, username: s.username, credential: s.credential } : { urls: urls });
    });
    return out.length ? out : null;
  }
  function load() {
    try { var c = JSON.parse(root.localStorage.getItem(KEY) || 'null'); if (c && c.exp - Date.now() > MARGIN_MS && c.servers) return c; } catch (_) {}
    return null;
  }
  function save(c) { try { root.localStorage.setItem(KEY, JSON.stringify(c)); } catch (_) {} }
  var inflight = null;
  function mint(force) {
    if (!force) { var c = cur && cur.exp - Date.now() > MARGIN_MS ? cur : load(); if (c) { cur = c; flush(); return Promise.resolve(c); } }
    if (inflight) return inflight;
    var t0 = Date.now();
    inflight = fetch(EP, { method: 'GET', credentials: 'omit', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { var s = norm(d); if (s) { cur = { servers: s, exp: t0 + TTL_MS }; save(cur); } return cur; })
      .catch(function () { return cur; })
      .then(function (c) { inflight = null; flush(); return c; });
    return inflight;
  }
  function flush() { var w = waiters; waiters = []; w.forEach(function (f) { f(); }); }
  function ready(ms) { return new Promise(function (res) { if (cur || !inflight) return res(); waiters.push(res); setTimeout(res, ms); }); }
  function merge(cfg) {
    cfg = Object.assign({}, cfg || {});
    var base = (cfg.iceServers || []).filter(function (s) { return !s.username; });
    cfg.iceServers = base.concat(cur ? cur.servers : []);
    return cfg;
  }
  function apply(pc) { try { if (cur) pc.setConfiguration(merge(pc.getConfiguration())); } catch (_) {} }
  function W(cfg) {
    var pc = arguments.length > 1 ? new O(merge(cfg), arguments[1]) : new O(merge(cfg));
    pcs.push(pc);
    var sld = pc.setLocalDescription.bind(pc);
    pc.setLocalDescription = function () {
      var a = arguments;
      return ready(3000).then(function () { apply(pc); return sld.apply(pc, a); });
    };
    pc.addEventListener('connectionstatechange', function () {
      if (pc.connectionState === 'closed') pcs = pcs.filter(function (p) { return p !== pc; });
    });
    return pc;
  }
  W.prototype = O.prototype;
  Object.keys(O).forEach(function (k) { try { W[k] = O[k]; } catch (_) {} });
  W.__daTurn = true;
  try { W.generateCertificate = O.generateCertificate.bind(O); } catch (_) {}
  root.RTCPeerConnection = W;
  if (root.webkitRTCPeerConnection) root.webkitRTCPeerConnection = W;
  // Renovar sólo si el relé está en uso de verdad (no gastar cupo en balde).
  function usingRelay(pc) {
    return pc.getStats().then(function (st) {
      var relay = false;
      st.forEach(function (x) {
        if (x.type === 'transport' && x.selectedCandidatePairId) {
          var p = st.get(x.selectedCandidatePairId), l = p && st.get(p.localCandidateId);
          if (l && l.candidateType === 'relay') relay = true;
        }
      });
      return relay;
    }).catch(function () { return false; });
  }
  setInterval(function () {
    if (!cur || cur.exp - Date.now() > MARGIN_MS) return;
    var live = pcs.filter(function (p) { return p.connectionState === 'connected'; });
    if (!live.length) return;
    Promise.all(live.map(usingRelay)).then(function (r) {
      if (r.indexOf(true) === -1) return;
      mint(true).then(function () { live.forEach(apply); });
    });
  }, 30000);
  root.__daTurn = { state: function () { return { ready: !!cur, exp: cur && cur.exp, servers: cur ? cur.servers.map(function (s) { return [].concat(s.urls).length + ' urls' + (s.username ? ' (cred)' : ''); }) : [] }; } };
  mint(false);
})(window);
