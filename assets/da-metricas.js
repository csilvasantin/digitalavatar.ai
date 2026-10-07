/* digitalavatar.ai/metricas · extensión del shell cuadrático (da-shell.js) para el panel de métricas.
 * Se carga ANTES de da-shell.js (los dos con defer). Declara window.DA_SHELL con el panel ▤ Avanzado
 * (marca blanca y filtros) y los verbos del CLI ⌘ Experto: /marca, /persona, /plataforma, /periodo,
 * /pruebas. Todo navega con parámetros de URL: el servidor (cerebro, ruta del worker) filtra y viste
 * la marca; aquí no hay datos ni tokens. GrokBot · MacMini, 7-oct-2026.
 */
(function (root) {
  'use strict';
  var MARCAS = {starbucks: 'Starbucks', '365': '365', admira: 'AdmiraNeXT'};
  var AVATARES = {admirito: 'Admirito', luna: 'Luna', neo: 'Neo'};
  var OFF = ['off', 'todas', 'todos', 'all', 'ninguna', 'quitar', 'reset', ''];
  var cfgEl = document.getElementById('daMetricasCfg');
  var cfg = {};
  try { cfg = JSON.parse((cfgEl && cfgEl.textContent) || '{}'); } catch (e) {}
  (cfg.marcas || []).forEach(function (k) { if (!MARCAS[k]) MARCAS[k] = k; });

  function go(key, value) {
    var q = new URLSearchParams(location.search);
    if (value == null || OFF.indexOf(String(value).toLowerCase()) >= 0) q.delete(key); else q.set(key, value);
    var s = q.toString();
    location.assign('/metricas/' + (s ? '?' + s : ''));
  }
  function fold(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
  function verb(key, list, es, en, param) {
    return {es: es, en: en, run: function (args, api) {
      var a = fold(args);
      if (!a || a === 'help' || a === '?') { api.log((api.lang() === 'en' ? 'Options: ' : 'Opciones: ') + Object.keys(list).join(' | ') + ' | off'); return; }
      if (OFF.indexOf(a) >= 0) { api.log(api.lang() === 'en' ? 'Filter removed' : 'Filtro quitado'); setTimeout(function () { go(param, null); }, 150); return; }
      var hit = Object.keys(list).filter(function (k) { return k === a || fold(list[k]) === a || fold(list[k]).indexOf(a) === 0; })[0];
      if (!hit) { api.log((api.lang() === 'en' ? 'Unknown: ' : 'No existe: ') + args + ' · ' + Object.keys(list).join(' | '), 'err'); return; }
      api.log((api.lang() === 'en' ? 'Applying ' : 'Aplico ') + param + ' = ' + list[hit]);
      setTimeout(function () { go(param, hit); }, 150);
    }};
  }
  var PLATS = {}; (cfg.plataformas || []).forEach(function (k) { PLATS[k] = k; });
  var DIAS = {'1': 'hoy', '7': '7', '30': '30', '90': '90'};

  var advanced = [{group: true, es: 'Marca blanca', en: 'White label'}];
  var ORDEN = ['starbucks', '365', 'admira'].concat((cfg.marcas || []).filter(function (k) { return ['starbucks', '365', 'admira'].indexOf(k) < 0; }));
  ORDEN.forEach(function (k) {
    advanced.push({href: '/metricas/?' + new URLSearchParams(Object.assign({}, cfg.q || {}, {brand: k})).toString(), es: 'Marca · ' + MARCAS[k], en: 'Brand · ' + MARCAS[k], current: (cfg.q || {}).brand === k});
  });
  var qAll = Object.assign({}, cfg.q || {}); delete qAll.brand;
  advanced.push({href: '/metricas/?' + new URLSearchParams(qAll).toString(), es: 'Todas las marcas', en: 'All brands', current: !(cfg.q || {}).brand});
  advanced.push({group: true, es: 'Avatar', en: 'Avatar'});
  Object.keys(AVATARES).forEach(function (k) {
    advanced.push({href: '/metricas/?' + new URLSearchParams(Object.assign({}, cfg.q || {}, {avatar: k})).toString(), es: AVATARES[k], en: AVATARES[k], current: (cfg.q || {}).avatar === k});
  });
  advanced.push({group: true, es: 'Panel', en: 'Panel'});
  advanced.push({href: '/metricas/salir', es: 'Salir de métricas', en: 'Sign out of metrics', current: false});

  root.DA_SHELL = {
    advanced: advanced,
    verbs: {
      marca: verb('marca', MARCAS, 'marca blanca: /marca starbucks|365|admira|off (tema y filtro)', 'white label: /marca starbucks|365|admira|off', 'brand'),
      persona: verb('persona', AVATARES, 'filtra por avatar: /persona admirito|luna|neo|off', 'filter by avatar: /persona admirito|luna|neo|off', 'avatar'),
      plataforma: verb('plataforma', PLATS, 'filtra por plataforma de origen: /plataforma <nombre>|off', 'filter by platform: /plataforma <name>|off', 'plataforma'),
      periodo: verb('periodo', DIAS, 'periodo: /periodo 1|7|30|90', 'period: /periodo 1|7|30|90', 'days'),
      pruebas: {es: 'pruebas internas: /pruebas on|off', en: 'internal tests: /pruebas on|off', run: function (args, api) {
        var on = /^(on|si|sí|1|yes)$/i.test(String(args).trim());
        api.log(on ? 'Incluyo pruebas internas' : 'Solo uso real'); setTimeout(function () { go('qa', on ? '1' : null); }, 150);
      }}
    }
  };

  // Selector de marca en la cabecera del panel (sin JS sigue habiendo enlaces en las pestañas).
  function wire() {
    var sel = document.getElementById('mxMarca');
    if (sel) sel.addEventListener('change', function () { go('brand', sel.value || null); });
    paintLang();
    new MutationObserver(paintLang).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  }
  function paintLang() {
    var en = (document.documentElement.lang || '').indexOf('en') === 0;
    var nodes = document.querySelectorAll('[data-mes][data-men]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = nodes[i].getAttribute(en ? 'data-men' : 'data-mes');
  }
  document.addEventListener('da:lang', paintLang);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})(typeof window === 'undefined' ? globalThis : window);
