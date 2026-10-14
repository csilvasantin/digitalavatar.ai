// El Arquitecto = Admirito con otra piel (?personaje=arquitecto · Carlos, 14-oct-2026: «/arquitecto … admirito se
// disfrace de arquitecto y le podamos pedir crear, reformar o inventariar»). Se ejecuta el assets/nube.js REAL contra
// un DOM de mentira: misma nube, mismo motor; cambian la piel (casco, gafas, lápiz y rollo de planos), las frases y el
// papel (el estudio de admira.biz). Nunca pregunta al cerebro: lo que se le dice va al anfitrión.
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
function carga({ search = '?personaje=arquitecto&embed=1&audio=off', embebido = true, lang = 'es' } = {}) {
  const nodos = new Map(), posts = [], fetches = [], oyentes = [];
  const document = {
    referrer: embebido ? 'https://www.admira.biz/arquitecto.html' : '', documentElement: nodo('html'), title: '',
    getElementById(id) { if (!nodos.has(id)) nodos.set(id, nodo(id)); return nodos.get(id); },
    createElementNS: () => nodo(''), createElement: () => nodo(''), addEventListener() {}
  };
  const parent = { postMessage: (...v) => posts.push(v) };
  const DAContext = {
    get: () => ({ lang }), set() {}, tier: () => 'good', init() {}, on() {}, chips: (l) => ['Demo · 30 s'].concat(l),
    body: () => ({}), demoCommand: () => null, demoOnLoad() {}, hostOrigin: () => (embebido ? 'https://www.admira.biz' : ''),
    allowed: (o) => /^https:\/\/([a-z0-9-]+\.)*(admira\.biz|admiranext\.com)$|^http:\/\/127\.0\.0\.1(:\d+)?$/.test(String(o || ''))
  };
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
const plano = (x) => JSON.parse(JSON.stringify(x));

test('con ?personaje=arquitecto es la misma nube con la piel del Arquitecto; sin él, Admirito', () => {
  const a = carga();
  assert.equal(a.win.__nube().personaje, 'arquitecto');
  assert.equal(a.win.__nube().piel, 'reposo');
  assert.match(a.document.title, /Arquitecto/);
  assert.deepEqual(plano(a.posts[0]), [{ type: 'da-arquitecto-listo' }, 'https://www.admira.biz'], 'avisa al estudio, a su origen exacto');
  const admirito = carga({ search: '?embed=1&audio=off' });
  assert.equal(admirito.win.__nube().personaje, 'admirito');
  assert.equal(admirito.win.__arquitecto.estado('midiendo'), false, 'Admirito no tiene estados de Arquitecto');
  const bugito = carga({ search: '?personaje=bugito&embed=1' });
  assert.equal(bugito.win.__nube().personaje, 'bugito', 'las dos pieles conviven');
});

test('nube.html: casco, gafas, lápiz, rollo y cejas sólo existen con personaje=arquitecto, sobre papel de plano', () => {
  assert.match(html, /html\[data-personaje="arquitecto"\] \.piel-parte\[data-piel="arquitecto"\]\{display:inline\}/);
  for (const id of ['arqCasco', 'arqGafas', 'arqLapiz', 'arqRollo', 'arqCejas']) assert.match(html, new RegExp(`id="${id}" class="piel-parte" data-piel="arquitecto"`), id);
  assert.match(html, /id="arqCasco"[\s\S]{0,200}fill="#ffc21a"/, 'casco amarillo de obra');
  assert.match(html, /html\[data-personaje="arquitecto"\] body\{background:linear-gradient/, 'papel de plano azul');
  assert.doesNotMatch(html, /html\[data-personaje="arquitecto"\] \.cuerpo-(relleno|borde)/, 'sigue siendo Admirito: blanco y verde');
  assert.equal((html.match(/src="\/assets\/nube\.js/g) || []).length, 1, 'el mismo motor');
  assert.match(html, /src="\/assets\/nube\.js\?v=20261014-arquitecto-1"/);
  assert.match(html, /html\.dock\[data-personaje="arquitecto"\] #langPills\{display:none !important\}/, 'en el estudio, el idioma lo pone la página');
  assert.doesNotMatch(html, /html\[data-personaje="arquitecto"\] #btnMic/, 'el Arquitecto sí escucha: conserva el micro');
  assert.equal(fs.existsSync(new URL('../arquitecto.html', import.meta.url)), false, 'no hay copia de la página');
});

test('lo que se le dice se traduce a una orden (o a una descripción para la orden abierta)', () => {
  const { win } = carga();
  const o = (t) => win.__arquitecto.orden(t).orden;
  for (const [t, id] of [['Crear un Xpacio', 'crear'], ['crea una cafetería de 8 por 12', 'crear'], ['/arquitecto crear estanco', 'crear'], ['Create a Xpace', 'crear'],
    ['Reformar este local', 'reformar'], ['quiero una reforma con un videowall', 'reformar'], ['Renovate this space', 'reformar'], ['/arquitecto reformar', 'reformar'],
    ['Inventariar desde una foto', 'inventariar'], ['inventaría la tienda', 'inventariar'], ['Survey from a photo', 'inventariar'], ['/architect inventory', 'inventariar']]) {
    assert.equal(o(t), id, t);
  }
  for (const t of ['tres pantallas en la pared del fondo', 'un local de 6 por 10 metros', '']) assert.equal(o(t), '', t);
  assert.equal(win.__arquitecto.orden('x'.repeat(5000)).texto.length, 2000, 'texto acotado');
});

test('frases propias por estado y orden', () => {
  const { win } = carga();
  const f = win.__arquitecto.frase;
  assert.equal(f('entregando', 'inventariar'), 'Inventario listo, firmo el acta.');
  assert.equal(f('dibujando', 'reformar'), 'Esto pide una reforma. Dibujo la propuesta.');
  assert.equal(f('entregando', 'crear'), 'Plano listo. ¿Lo usamos?');
  assert.equal(f('dibujando', 'inventada'), 'Dibujando el plano…');
  assert.match(nube, /'Vamos a medir\.'/);
  for (const e of ['reposo', 'escuchando', 'midiendo', 'dudando']) assert.ok(f(e).length > 10, e);
  const en = carga({ search: '?personaje=arquitecto&embed=1&lang=en', lang: 'en' });
  assert.equal(en.win.__arquitecto.frase('entregando', 'inventariar'), 'Inventory ready, signing it off.');
});

test('el estudio le cuenta en qué está; sólo el padre y desde un origen de la red', () => {
  const a = carga();
  a.msg({ type: 'da-arquitecto', estado: 'midiendo' }, { origin: 'https://evil.example' });
  assert.equal(a.win.__nube().piel, 'reposo', 'otro origen: nada');
  a.msg({ type: 'da-arquitecto', estado: 'midiendo' }, { source: {} });
  assert.equal(a.win.__nube().piel, 'reposo', 'otra ventana: nada');
  a.msg({ type: 'da-arquitecto', estado: 'demoler' });
  assert.equal(a.win.__nube().piel, 'reposo', 'estado desconocido: nada');
  a.msg({ type: 'da-bugito', estado: 'celebrando' });
  assert.equal(a.win.__nube().piel, 'reposo', 'los mensajes de otra piel no le afectan');
  for (const e of ['escuchando', 'midiendo', 'dibujando', 'entregando', 'dudando']) {
    a.msg({ type: 'da-arquitecto', estado: e, orden: 'inventariar' });
    assert.equal(a.win.__nube().piel, e);
  }
  assert.equal(a.win.__nube().speaking, true, 'lo dice con el lip-sync de la nube');
});

test('nunca pregunta al cerebro: lo que se le dice (texto o micro) va al estudio', () => {
  const a = carga();
  a.win.__arquitecto.ask('Inventariar desde una foto');
  a.win.__arquitecto.ask('tres pantallas verticales en la pared del fondo');
  a.win.__arquitecto.ask('¿Quién eres?');
  assert.equal(a.fetches.length, 0, 'ni /metahuman/ask ni nada');
  const ordenes = a.posts.filter(([m]) => m.type === 'da-arquitecto-orden').map(plano);
  assert.deepEqual(ordenes, [
    [{ type: 'da-arquitecto-orden', orden: 'inventariar', texto: 'Inventariar desde una foto', lang: 'es' }, 'https://www.admira.biz'],
    [{ type: 'da-arquitecto-orden', orden: '', texto: 'tres pantallas verticales en la pared del fondo', lang: 'es' }, 'https://www.admira.biz']
  ], '«¿Quién eres?» lo contesta él');
  assert.equal(a.win.__nube().piel, 'escuchando');
  const suelto = carga({ embebido: false });
  suelto.win.__arquitecto.ask('Crear un Xpacio');
  assert.equal(suelto.posts.filter(([m]) => m.type === 'da-arquitecto-orden').length, 0, 'sin estudio no hay a quién mandarla');
  assert.equal(suelto.fetches.length, 0);
});

test('la piel se engancha a la tabla PIELES con los ganchos genéricos del motor', () => {
  assert.match(nube, /arquitecto: \{ textos: \{/);
  assert.match(nube, /if \(ARQ\) Object\.assign\(PIELES\.arquitecto, \{/);
  const motor = nube.slice(0, nube.indexOf('// ───────────────────────── Piel BUGITO'));
  assert.doesNotMatch(motor.replace(/\/\*[\s\S]*?\*\//, ''), /\bARQ\b|arqEstado|arqFrame/, 'el motor no sabe nada del Arquitecto');
});
