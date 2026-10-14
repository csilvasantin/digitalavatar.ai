// Bugito = Admirito con otra piel (?personaje=bugito · Carlos, 14-oct-2026: «Bugito es una adaptación de Admirito»).
// Se ejecuta el assets/nube.js REAL contra un DOM de mentira: misma nube, mismo motor; cambian la piel, las
// frases y el papel (lanzar incidencias en el banco de pruebas). Nunca pregunta al cerebro.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const nube = fs.readFileSync(new URL('../assets/nube.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../nube.html', import.meta.url), 'utf8');

function nodo(id) {
  const attrs = {}, kids = [];
  return {
    id, attrs, kids, style: { setProperty() {} }, value: '', textContent: '', innerHTML: '', disabled: false, children: kids, firstChild: null,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute(k, v) { attrs[k] = String(v); }, getAttribute: (k) => attrs[k], removeAttribute(k) { delete attrs[k]; },
    appendChild(n) { kids.push(n); return n; }, insertBefore(n) { kids.unshift(n); return n; }, remove() {},
    addEventListener() {}, querySelector: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 300 }),
    scrollHeight: 0, clientHeight: 0
  };
}
function carga({ search = '?personaje=bugito&embed=1&audio=off', embebido = true, referrer = 'https://www.admira.biz/bugito.html' } = {}) {
  const nodos = new Map(), posts = [], fetches = [], oyentes = [];
  const document = {
    referrer, documentElement: nodo('html'), title: '',
    getElementById(id) { if (!nodos.has(id)) nodos.set(id, nodo(id)); return nodos.get(id); },
    createElementNS: () => nodo(''), createElement: () => nodo(''), addEventListener() {}
  };
  const parent = { postMessage: (...v) => posts.push(v) };
  const DAContext = {
    get: () => ({ lang: 'es' }), set() {}, tier: () => 'good', init() {}, on() {}, chips: (l) => ['Demo · 30 s'].concat(l),
    body: () => ({}), demoCommand: () => null, demoOnLoad() {}, hostOrigin: () => (embebido ? 'https://www.admira.biz' : ''),
    allowed: (o) => /^https:\/\/([a-z0-9-]+\.)*(admira\.biz|admiranext\.com)$|^http:\/\/127\.0\.0\.1(:\d+)?$/.test(String(o || ''))
  };
  // El sandbox ES la ventana: nube.js usa window.X y globales sueltos (location, document, matchMedia…).
  const win = {
    document, DAContext, location: { search }, parent, URLSearchParams, Math, JSON, Object, Array, String, Number, Date, Promise, Error,
    addEventListener: (t, f) => { if (t === 'message') oyentes.push(f); },
    matchMedia: () => ({ matches: false }), performance: { now: () => 0 }, requestAnimationFrame() {}, setTimeout: () => 0, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {} }, fetch: async (...a) => { fetches.push(a); return { ok: false, json: async () => ({}) }; }
  };
  win.window = win; win.self = win; win.top = embebido ? {} : win;
  vm.createContext(win);
  vm.runInContext(nube, win);
  const msg = (data, { origin = 'https://www.admira.biz', source = parent } = {}) => oyentes.forEach((f) => f({ data, origin, source }));
  return { win, posts, fetches, msg, nodos, document };
}

test('sin parámetro sigue siendo Admirito; con ?personaje=bugito, la misma nube con la piel de Bugito', () => {
  const a = carga({ search: '?embed=1&audio=off' });
  assert.equal(a.win.__nube().personaje, 'admirito');
  assert.equal(a.win.__nube().bugito, '');
  assert.equal(a.win.__bugito.estado('celebrando'), false, 'Admirito no tiene estados de Bugito');
  const b = carga();
  assert.equal(b.win.__nube().personaje, 'bugito');
  assert.equal(b.win.__nube().bugito, 'aburrido');
  assert.match(b.document.title, /Bugito/);
  // Embebido: avisa al anfitrión (origen exacto) de que ya escucha.
  assert.deepEqual(JSON.parse(JSON.stringify(b.posts[0])), [{ type: 'da-bugito-listo' }, 'https://www.admira.biz']);
});

test('nube.html: una sola página; las piezas de Bugito sólo existen con la clase bugito', () => {
  assert.match(html, /if\(\/\[\?&\]personaje=bugito\(\?:&\|\$\)\/i\.test\(q\)\)h\.classList\.add\('bugito'\)/);
  assert.match(html, /html:not\(\.bugito\) \.bugito-parte\{display:none\}/);
  for (const id of ['bugCola', 'bugCuernos', 'bugCejas', 'bugColmillo']) assert.match(html, new RegExp(`id="${id}" class="bugito-parte"`), id);
  assert.match(html, /html\.bugito \.cuerpo-relleno\{fill:#e2302e\}/, 'rojo');
  assert.match(html, /html\.bugito \.cuerpo-borde\{fill:#170607\}/, 'y negro');
  assert.equal((html.match(/src="\/assets\/nube\.js/g) || []).length, 1, 'el mismo motor');
  assert.equal(fs.existsSync(new URL('../bugito.html', import.meta.url)), false, 'no hay copia de la página');
});

test('las órdenes del visitante se traducen al catálogo del Creador de incidencias', () => {
  const { win } = carga();
  const c = win.__bugito.comando;
  for (const [t, id] of [['Gira la pantalla', 'formato-girado'], ['Cambia la resolución', 'cambio-resolucion'], ['Lanza un popup', 'popup-encima'],
    ['Ábrela a medias', 'medio-abrir'], ['Vuelve a la normalidad', 'normal'], ['Rotate the screen', 'formato-girado'], ['Change the resolution', 'cambio-resolucion'],
    ['Pop up a popup', 'popup-encima'], ['Half-open it', 'medio-abrir'], ['Back to normal', 'normal'], ['/fallo popup-encima', 'popup-encima'], ['/fallo arregla la pantalla girada', 'normal']]) {
    assert.equal(c(t), id, t);
  }
  for (const no of ['¿Qué hora es?', 'hola', '', '/fallo']) assert.equal(c(no), null, no);
});

test('frases por estado, con el ticket de Yokup sólo si es un id válido', () => {
  const { win } = carga();
  const f = win.__bugito.frase;
  assert.equal(f('lanzando', 'formato-girado'), '¿Y si giramos esa pantalla…? ¡Vuelta va!');
  assert.equal(f('lanzando', 'popup-encima'), '¡Popup va! Que tape bien el anuncio.');
  assert.equal(f('lanzando', 'medio-abrir'), 'Ups, se me ha quedado a medio abrir.');
  assert.equal(f('lanzando', 'inventado'), '¡Ahí va un fallo!');
  assert.match(f('celebrando', '', 'INC-BUG42'), /^¡(Pillado|Me han cazado)! Incidencia INC-BUG42 abierta/);
  const sinTicket = f('celebrando', '', '<img src=x>');
  assert.doesNotMatch(sinTicket, /\{t\}|<img/); assert.match(sinTicket, /Incidencia abierta/);
  for (const e of ['aburrido', 'tramando', 'derrotado']) assert.ok(f(e).length > 10, e);
});

test('el anfitrión le cuenta qué pasa; sólo el padre y desde un origen de la red', () => {
  const b = carga();
  b.msg({ type: 'da-bugito', estado: 'celebrando', ticket: 'INC-BUG42' }, { origin: 'https://evil.example' });
  assert.equal(b.win.__nube().bugito, 'aburrido', 'otro origen: nada');
  b.msg({ type: 'da-bugito', estado: 'celebrando', ticket: 'INC-BUG42' }, { source: {} });
  assert.equal(b.win.__nube().bugito, 'aburrido', 'otra ventana: nada');
  b.msg({ type: 'da-bugito', estado: 'estado-raro' });
  assert.equal(b.win.__nube().bugito, 'aburrido', 'estado desconocido: nada');
  b.msg({ type: 'da-bugito', estado: 'lanzando', incidencia: 'popup-encima' });
  assert.equal(b.win.__nube().bugito, 'lanzando');
  assert.equal(b.win.__nube().speaking, true, 'lo dice con el lip-sync de la nube');
  b.msg({ type: 'da-bugito', estado: 'rechazado' });
  assert.equal(b.win.__nube().bugito, 'derrotado');
});

test('Bugito nunca pregunta al cerebro: las órdenes van al anfitrión y la charla se contesta sola', () => {
  const b = carga();
  b.win.__bugito.ask('¿Cuál es la capital de Francia?');
  b.win.__bugito.ask('Lanza un popup');
  assert.equal(b.fetches.length, 0, 'ni /metahuman/ask ni nada');
  const lanzar = b.posts.filter(([m]) => m.type === 'da-bugito-lanzar');
  assert.equal(lanzar.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(lanzar[0])), [{ type: 'da-bugito-lanzar', incidencia: 'popup-encima', lang: 'es' }, 'https://www.admira.biz']);
  assert.equal(b.win.__nube().bugito, 'tramando');
  // Suelto (sin banco): no hay a quién mandar la orden.
  const suelto = carga({ embebido: false, referrer: '' });
  suelto.win.__bugito.ask('Gira la pantalla');
  assert.equal(suelto.posts.filter(([m]) => m.type === 'da-bugito-lanzar').length, 0);
  assert.equal(suelto.fetches.length, 0);
});
