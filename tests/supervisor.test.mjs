// El Supervisor = Admirito con otra piel (?personaje=supervisor · Carlos, 18-oct-2026: la tercera mascota del ⌘ Experto,
// la Insta360 del MacMini que vigila el MBP16 y abre incidencias en admira.app/supervisor, y la única sin cara). Se ejecuta
// el assets/nube.js REAL contra un DOM de mentira: misma nube, mismo motor; cambian la piel (gorra de vigilante y ojo-objetivo),
// las frases y el papel. Nunca pregunta al cerebro ni lee APIs: lo que ve se lo cuenta el anfitrión.
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
function carga({ search = '?personaje=supervisor&embed=1&audio=off', embebido = true, lang = 'es', host = 'https://www.admiranext.com' } = {}) {
  const nodos = new Map(), posts = [], fetches = [], oyentes = [], frames = [];
  const document = {
    referrer: embebido ? host + '/suite/' : '', documentElement: nodo('html'), title: '',
    getElementById(id) { if (!nodos.has(id)) nodos.set(id, nodo(id)); return nodos.get(id); },
    createElementNS: () => nodo(''), createElement: () => nodo(''), addEventListener() {}
  };
  const parent = { postMessage: (...v) => posts.push(v) };
  const DAContext = {
    get: () => ({ lang }), set() {}, tier: () => 'good', init() {}, on() {}, chips: (l) => ['Demo · 30 s'].concat(l),
    body: () => ({}), demoCommand: () => null, demoOnLoad() {}, hostOrigin: () => (embebido ? host : ''),
    allowed: (o) => /^https:\/\/([a-z0-9-]+\.)*(admira\.biz|admiranext\.com)$|^http:\/\/127\.0\.0\.1(:\d+)?$/.test(String(o || ''))
  };
  let ahora = 0;
  const win = {
    document, DAContext, location: { search }, parent, URLSearchParams, Math, JSON, Object, Array, String, Number, Date, Promise, Error,
    addEventListener: (t, f) => { if (t === 'message') oyentes.push(f); },
    matchMedia: () => ({ matches: false }), performance: { now: () => ahora }, requestAnimationFrame: (f) => frames.push(f), setTimeout: () => 0, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {} }, fetch: async (...a) => { fetches.push(a); return { ok: false, json: async () => ({}) }; }
  };
  win.window = win; win.self = win; win.top = embebido ? {} : win;
  vm.createContext(win);
  vm.runInContext(nube, win);
  const msg = (data, { origin = host, source = parent } = {}) => oyentes.forEach((f) => f({ data, origin, source }));
  // Avanza el bucle de animación n fotogramas de 1/60 s (el motor se vuelve a pedir en cada uno).
  const avanza = (n = 1) => { for (let i = 0; i < n; i++) { ahora += 1000 / 60; const f = frames.shift(); if (f) f(ahora); } };
  return { win, posts, fetches, msg, nodos, document, avanza };
}
const plano = (x) => JSON.parse(JSON.stringify(x));

test('con ?personaje=supervisor es la misma nube con la piel del Supervisor; sin él, Admirito', () => {
  const s = carga();
  assert.equal(s.win.__nube().personaje, 'supervisor');
  assert.equal(s.win.__nube().piel, 'vigilando');
  assert.match(s.document.title, /Supervisor/);
  assert.deepEqual(plano(s.posts[0]), [{ type: 'da-supervisor-listo' }, 'https://www.admiranext.com'], 'avisa al anfitrión, a su origen exacto');
  const admirito = carga({ search: '?embed=1&audio=off' });
  assert.equal(admirito.win.__nube().personaje, 'admirito');
  assert.equal(admirito.win.__supervisor.estado('alerta'), false, 'Admirito no tiene estados de Supervisor');
  for (const otra of ['bugito', 'arquitecto']) assert.equal(carga({ search: `?personaje=${otra}&embed=1` }).win.__nube().personaje, otra, 'las tres pieles conviven');
});

test('nube.html: gorra, objetivo y ceja sólo existen con personaje=supervisor, en la paleta de su tarjeta de admira.biz', () => {
  assert.match(html, /html\[data-personaje="supervisor"\] \.piel-parte\[data-piel="supervisor"\]\{display:inline\}/);
  for (const id of ['supGorra', 'supLente', 'supCejas']) assert.match(html, new RegExp(`id="${id}" class="piel-parte" data-piel="supervisor"`), id);
  for (const id of ['supAnillo', 'supIris', 'supRec']) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.match(html, /html\[data-personaje="supervisor"\] #ojoD, html\[data-personaje="supervisor"\] #ojosFelices path:nth-child\(2\)\{display:none\}/, 'el ojo derecho es el objetivo');
  assert.match(html, /rgba\(255,226,140,\.42\)/, 'el halo es dorado: el Supervisor es un ángel');
  for (const id of ['supAlas', 'supAureola']) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.match(html, /html\[data-personaje="supervisor"\] body\{background:radial-gradient\(60% 45%/, 'fondo de luz divina');
  assert.match(html, /html\[data-personaje="supervisor"\] #btnMic, html\[data-personaje="supervisor"\] #btnStop/, 'mira, no escucha: sin micro');
  assert.equal((html.match(/src="\/assets\/nube\.js/g) || []).length, 1, 'el mismo motor');
  assert.match(html, /src="\/assets\/nube\.js\?v=20261018-supervisor-1"/);
  assert.equal(fs.existsSync(new URL('../supervisor.html', import.meta.url)), false, 'no hay copia de la página');
});

test('el anfitrión puede mandar el estado del tablero o del veredicto de supervisor-core tal cual', () => {
  const { win } = carga();
  const de = win.__supervisor.de;
  for (const [e, piel] of [['encendida', 'vigilando'], ['apagada', 'alerta'], ['sin-dato', 'ciego'], ['sin-senal', 'sin-senal'],
    ['esperando', 'enfocando'], ['esperando-senal', 'sin-senal'], ['sin-nueva', 'dudando'], ['no-visto', 'dudando']]) assert.equal(de(e), piel, e);
  assert.equal(de('visto', 'encendida'), 'conforme', 'ver la pantalla encendida otra vez');
  assert.equal(de('visto', 'apagada'), 'alerta');
  assert.equal(de('visto', 'incidencia'), 'alerta');
  for (const e of ['vigilando', 'enfocando', 'alerta', 'conforme', 'dudando', 'ciego', 'sin-senal']) assert.equal(de(e), e, e);
  for (const e of ['desconocido', 'constructor', '__proto__', '', 'hasOwnProperty']) assert.equal(de(e), '', `«${e}» no es un estado`);
});

test('frases honestas: la alerta sólo cita incidencia si el anfitrión trae un INC- válido', () => {
  const { win } = carga();
  const f = win.__supervisor.frase;
  for (let i = 0; i < 20; i++) {
    assert.match(f('alerta', 'INC-7K2Q9'), /INC-7K2Q9/);
    assert.doesNotMatch(f('alerta', ''), /incidencia|\{t\}/i, 'sin ticket no presume de haber abierto nada');
    assert.doesNotMatch(f('alerta', 'DROP TABLE'), /DROP|\{t\}/);
    assert.match(f('conforme', 'INC-7K2Q9'), /INC-7K2Q9 sigue abierta hasta que alguien la revise\.$/, 'recuperar la emisión no cierra la incidencia');
    assert.doesNotMatch(f('conforme', ''), /sigue abierta/);
  }
  for (const e of ['vigilando', 'enfocando', 'dudando', 'ciego', 'sin-senal']) assert.ok(f(e).length > 8, e);
  assert.equal(f('inventado'), '');
  const en = carga({ search: '?personaje=supervisor&embed=1&lang=en', lang: 'en' });
  assert.match(en.win.__supervisor.frase('conforme', 'INC-ABC12'), /INC-ABC12 stays open until someone reviews it\.$/);
});

test('lo que se le dice se traduce a las órdenes del verbo /supervisor (estado o cámara) o es charla', () => {
  const { win } = carga();
  const o = win.__supervisor.orden;
  for (const t of ['¿Qué ves?', 'que ves', '¿Hay incidencias?', 'What do you see?', 'Any incidents?', '/supervisor estado', '/supervisor status', '¿cómo está la pantalla?'])
    assert.equal(o(t), 'estado', t);
  for (const t of ['Abre la cámara', 'Open the camera', '/supervisor', 'quiero ver la Insta360', 'la cámara en vivo']) assert.equal(o(t), 'camara', t);
  for (const t of ['hola', 'cuéntame un chiste', '']) assert.equal(o(t), null, t);
});

test('nunca pregunta al cerebro: las órdenes van al anfitrión y la charla la contesta él', () => {
  const s = carga();
  s.win.__supervisor.ask('¿Qué ves?');
  assert.equal(s.win.__nube().piel, 'enfocando', 'mientras el anfitrión lee el tablero, enfoca');
  s.win.__supervisor.ask('Abre la cámara');
  s.win.__supervisor.ask('cuéntame un chiste');
  s.win.__supervisor.ask('¿Quién eres?');
  assert.equal(s.fetches.length, 0, 'ni /metahuman/ask ni el tablero');
  assert.deepEqual(s.posts.filter(([m]) => m.type === 'da-supervisor-orden').map(plano), [
    [{ type: 'da-supervisor-orden', orden: 'estado', texto: '¿Qué ves?', lang: 'es' }, 'https://www.admiranext.com'],
    [{ type: 'da-supervisor-orden', orden: 'camara', texto: 'Abre la cámara', lang: 'es' }, 'https://www.admiranext.com']
  ]);
  assert.equal(s.win.__nube().speaking, true, 'lo dice con el lip-sync de la nube');
  const suelto = carga({ embebido: false });
  suelto.win.__supervisor.ask('¿Qué ves?');
  assert.equal(suelto.posts.filter(([m]) => m.type === 'da-supervisor-orden').length, 0, 'sin anfitrión no hay a quién preguntar');
  assert.equal(suelto.win.__nube().piel, 'vigilando', 'y no finge que enfoca');
  assert.equal(suelto.fetches.length, 0);
});

test('el anfitrión le cuenta lo que ve; sólo el padre y desde un origen de la red', () => {
  const s = carga();
  s.msg({ type: 'da-supervisor', estado: 'apagada' }, { origin: 'https://evil.example' });
  assert.equal(s.win.__nube().piel, 'vigilando', 'otro origen: nada');
  s.msg({ type: 'da-supervisor', estado: 'apagada' }, { source: {} });
  assert.equal(s.win.__nube().piel, 'vigilando', 'otra ventana: nada');
  s.msg({ type: 'da-supervisor', estado: 'explotar' });
  assert.equal(s.win.__nube().piel, 'vigilando', 'estado desconocido: nada');
  s.msg({ type: 'da-bugito', estado: 'celebrando' });
  s.msg({ type: 'da-arquitecto', estado: 'midiendo' });
  assert.equal(s.win.__nube().piel, 'vigilando', 'los mensajes de otra piel no le afectan');
  s.msg({ type: 'da-supervisor', estado: 'visto', espera: 'incidencia', incidencia: { id: 'INC-7K2Q9', url: 'https://www.admira.app/ticket?id=INC-7K2Q9' } });
  assert.equal(s.win.__nube().piel, 'alerta');
  s.msg({ type: 'da-supervisor', estado: 'visto', espera: 'encendida', ticket: 'INC-7K2Q9' });
  assert.equal(s.win.__nube().piel, 'conforme');
  for (const [e, piel] of [['sin-dato', 'ciego'], ['sin-senal', 'sin-senal'], ['no-visto', 'dudando'], ['enfocando', 'enfocando']]) {
    s.msg({ type: 'da-supervisor', estado: e });
    assert.equal(s.win.__nube().piel, piel, e);
  }
  const biz = carga({ host: 'https://www.admira.biz' });
  biz.msg({ type: 'da-supervisor', estado: 'apagada' });
  assert.equal(biz.win.__nube().piel, 'alerta', 'también en el banco de admira.biz');
});

test('el objetivo sigue al ojo derecho, cambia de estado y sólo se duerme sin señal', () => {
  const s = carga();
  s.avanza(3);
  const lente = s.nodos.get('supLente'), ojo = s.nodos.get('ojoD');
  assert.ok(ojo.attrs.transform, 'el motor mueve el ojo');
  assert.equal(lente.attrs.transform, ojo.attrs.transform, 'el objetivo copia su mirada y su parpadeo');
  assert.equal(lente.attrs['data-estado'], 'vigilando');
  s.win.__supervisor.estado('enfocando', { silencio: true });
  s.avanza(30);
  assert.equal(lente.attrs['data-estado'], 'enfocando');
  assert.ok(+s.nodos.get('supIris').attrs.r < 5, 'el diafragma se cierra al enfocar');
  s.win.__supervisor.estado('vigilando', { silencio: true });
  s.avanza(60 * 25);
  assert.equal(s.win.__nube().sleeping, false, 'vigilando no se duerme');
  s.win.__supervisor.estado('sin-senal', { silencio: true });
  s.avanza(60 * 25);
  assert.equal(s.win.__nube().sleeping, true, 'sin señal, sí: ahora mismo no está mirando');
});

test('la piel se engancha a la tabla PIELES con los ganchos genéricos del motor', () => {
  assert.match(nube, /supervisor: \{ textos: \{/);
  assert.match(nube, /if \(SUP\) Object\.assign\(PIELES\.supervisor, \{/);
  const motor = nube.slice(0, nube.indexOf('// ───────────────────────── Piel BUGITO'));
  assert.doesNotMatch(motor.replace(/\/\*[\s\S]*?\*\//, ''), /\bSUP\b|supEstado|supFrame/, 'el motor no sabe nada del Supervisor');
  assert.doesNotMatch(nube.slice(nube.indexOf('// ───────────────────────── Piel SUPERVISOR')), /fetch\(|api\.yokup\.com/, 'la piel no lee el tablero por su cuenta');
});

test('admira.live es anfitrión de confianza: allí está la cámara del Supervisor y su cara sale junto a ella', () => {
  const ctx = fs.readFileSync(new URL('../assets/da-context.js', import.meta.url), 'utf8');
  const carga = (referrer) => {
    const win = { location: { search: '', hostname: 'digitalavatar.ai' }, addEventListener() {}, parent: { postMessage() {} } };
    win.self = win; win.top = {};
    const document = { referrer, getElementById: () => null, createElement: () => ({}), head: { appendChild() {} } };
    vm.runInNewContext(ctx, { window: win, document, URL, URLSearchParams, setTimeout() {}, clearTimeout() {}, fetch: async () => ({ ok: false, json: async () => ({}) }) });
    return win.DAContext;
  };
  const live = carga('https://www.admira.live/analizar?supervisor=1');
  assert.equal(live.allowed('https://www.admira.live'), true);
  assert.equal(live.hostOrigin(), 'https://www.admira.live', 'la cara sabe a quién mandar sus órdenes');
  assert.equal(live.allowed('https://admira.live.evil.example'), false);
  assert.equal(live.allowed('http://www.admira.live'), false, 'sólo https');
  assert.equal(carga('https://evil.example/').hostOrigin(), '');
});
