// Comercial = Admirito con otra piel (?personaje=comercial · Carlos, 20-oct-2026: «que Comercial escuche el brief por el
// micro y responda con la voz de Admirito, como el Arquitecto»). Se ejecuta el assets/nube.js REAL contra un DOM de mentira:
// misma nube, mismo motor; cambian la piel (corbata y maletín), las frases y el papel (Comercial en la portada de
// admira.biz). Nunca pregunta al cerebro: lo que se le dice va al anfitrión, que sabe de briefs.
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
function carga({ search = '?personaje=comercial&embed=1&audio=off', embebido = true, lang = 'es', host = 'https://www.admira.biz' } = {}) {
  const nodos = new Map(), posts = [], fetches = [], oyentes = [], frames = [];
  const document = {
    referrer: embebido ? host + '/' : '', documentElement: nodo('html'), title: '',
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
    localStorage: { getItem: () => null, setItem() {} }, fetch: async (...a) => { fetches.push(a); return { ok: false, json: async () => ({}) }; },
    DADemo: { load: () => ({}), start: async () => {}, armRetry() {}, setState() {}, stop() {}, unlock() {}, voiceId: (l) => 'voz-' + l }
  };
  win.window = win; win.self = win; win.top = embebido ? {} : win;
  vm.createContext(win);
  vm.runInContext(nube, win);
  const msg = (data, { origin = host, source = parent } = {}) => oyentes.forEach((f) => f({ data, origin, source }));
  return { win, posts, fetches, msg, nodos, document };
}

test('con ?personaje=comercial es la misma nube con la piel de Comercial; sin él, Admirito', () => {
  const { win } = carga();
  assert.equal(win.__nube().personaje, 'comercial');
  assert.equal(win.__comercial.estado('reposo', { silencio: true }), true);
  assert.equal(win.__nube().piel, 'reposo');
  assert.equal(carga({ search: '?embed=1' }).win.__nube().personaje, 'admirito');
  assert.equal(carga({ search: '?personaje=arquitecto&embed=1' }).win.__nube().personaje, 'arquitecto', 'las pieles conviven');
});

test('nube.html: corbata y maletín sólo existen con personaje=comercial, en azul de oficina y oro; micro conservado', () => {
  assert.match(html, /html\[data-personaje="comercial"\] \.piel-parte\[data-piel="comercial"\]\{display:inline\}/);
  for (const id of ['comCorbata', 'comMaletin', 'comTarjeta']) assert.match(html, new RegExp(`id="${id}" class="piel-parte" data-piel="comercial"`), id);
  // Los tres rasgos (Carlos, 20-oct-2026): maletín con tapa y hoja de propuesta dentro, tarjeta de visita blanca con banda azul y sello dorado.
  assert.match(html, /id="comMaletinTapa"/); assert.match(html, /id="comMaletinPapel"/);
  assert.match(html, /id="comTarjeta"[\s\S]{0,300}fill="#f4f8ff"[\s\S]{0,200}fill="#254c76"[\s\S]{0,200}fill="#e8cd7b"/, 'tarjeta blanca, banda azul, sello dorado');
  assert.match(nube, /COM\.abierto \+= \(\(e === 'entregando' \? 1 : 0\) - COM\.abierto\) \* k/, 'el maletín se abre al entregar');
  assert.match(nube, /COM\.ofrece \+= \(\(e === 'escuchando' \? 1 : 0\) - COM\.ofrece\) \* k/, 'la tarjeta se ofrece al escuchar');
  assert.match(html, /id="comCorbata"[\s\S]{0,400}fill="#254c76"/, 'corbata azul');
  assert.match(html, /id="comMaletin"[\s\S]{0,1200}fill="#e8cd7b"/, 'cierre dorado del maletín');
  assert.doesNotMatch(html, /html\[data-personaje="comercial"\] \.cuerpo-(relleno|borde)/, 'sigue siendo Admirito: blanco y verde');
  assert.doesNotMatch(html, /html\[data-personaje="comercial"\] #btnMic/, 'Comercial sí escucha: conserva el micro');
  assert.match(html, /html\.dock\[data-personaje="comercial"\] #langPills\{display:none !important\}/, 'en la portada, el idioma lo pone la página');
  assert.match(html, /src="\/assets\/nube\.js\?v=20261027-asistentes-7"/, 'versión de caché nueva');
});

test('frases propias por estado, en los dos idiomas; estados desconocidos no cambian nada', () => {
  const { win } = carga();
  for (const e of ['reposo', 'escuchando', 'apuntando', 'proponiendo', 'entregando', 'dudando']) assert.ok(win.__comercial.frase(e).length > 3, e);
  assert.match(nube, /'Propuesta lista: en PDF con marca o por correo\.'/);
  const en = carga({ search: '?personaje=comercial&embed=1&lang=en', lang: 'en' });
  assert.match(en.win.__comercial.frase('entregando'), /PDF|Here it is|Ready/);
  assert.equal(win.__comercial.estado('vendiendo'), false);
});

test('nunca pregunta al cerebro: lo que se le dice va al anfitrión como texto del brief; «¿quién eres?» lo contesta él', () => {
  const { win, posts, fetches } = carga();
  win.__comercial.ask('Para Café Rico, lanzar el frappé de otoño, jóvenes urbanos, 2.000 euros');
  const enviado = posts.find(([d]) => d && d.type === 'da-comercial-texto');
  assert.ok(enviado, 'el texto va al anfitrión'); assert.equal(enviado[0].texto, 'Para Café Rico, lanzar el frappé de otoño, jóvenes urbanos, 2.000 euros'); assert.equal(enviado[1], 'https://www.admira.biz');
  assert.equal(win.__nube().piel, 'apuntando');
  win.__comercial.ask('¿Quién eres?');
  assert.equal(posts.filter(([d]) => d && d.type === 'da-comercial-texto').length, 1, '«quién eres» no sale de la nube');
  assert.equal(fetches.length, 0, 'sin cerebro ni APIs');
  const suelto = carga({ embebido: false });
  suelto.win.__comercial.ask('una campaña');
  assert.equal(suelto.posts.length, 0, 'sin anfitrión no manda nada');
});

test('el anfitrión le cuenta en qué está; sólo el padre y desde un origen de la red; al cargar avisa de que escucha', () => {
  const a = carga();
  assert.ok(a.posts.some(([d, o]) => d && d.type === 'da-comercial-listo' && o === 'https://www.admira.biz'), 'aviso de listo al anfitrión');
  a.msg({ type: 'da-comercial', estado: 'proponiendo' }, { origin: 'https://evil.example' });
  assert.equal(a.win.__nube().piel, 'reposo', 'otro origen: nada');
  a.msg({ type: 'da-comercial', estado: 'proponiendo' }, { source: {} });
  assert.equal(a.win.__nube().piel, 'reposo', 'otra ventana: nada');
  a.msg({ type: 'da-comercial', estado: 'proponiendo', texto: 'Hago números con tres ubicaciones.' });
  assert.equal(a.win.__nube().piel, 'proponiendo');
  a.msg({ type: 'da-comercial', estado: 'entregando', silencio: true });
  assert.equal(a.win.__nube().piel, 'entregando');
  a.msg({ type: 'da-arquitecto', estado: 'midiendo' });
  assert.equal(a.win.__nube().piel, 'entregando', 'los mensajes de otra piel no le afectan');
});

test('la piel se engancha a la tabla PIELES con los ganchos genéricos del motor', () => {
  assert.match(nube, /comercial: \{ textos: \{/);
  assert.match(nube, /if \(COM\) Object\.assign\(PIELES\.comercial, \{/);
  const motor = nube.slice(0, nube.indexOf('// ───────────────────────── Piel BUGITO'));
  assert.doesNotMatch(motor.replace(/\/\*[\s\S]*?\*\//, ''), /\bCOM\b|comEstado|comFrame/, 'el motor no sabe nada de Comercial');
  // Sólo una llamada de red en la piel: la voz, al cerebro (brain.digitalavatar.ai/tts), con la voz de las demos de Admirito.
  const piel = nube.slice(nube.indexOf('// ───────────────────────── Piel COMERCIAL'));
  assert.equal((piel.match(/fetch\(/g) || []).length, 1, 'una sola llamada de red: la voz');
  assert.match(piel, /fetch\(API \+ '\/tts'/); assert.match(piel, /voiceId: DADemo\.voiceId\(LANG\), timestamps: true/);
});

test('la voz con audio: pide el audio al cerebro (/tts) con la voz de Admirito y lo guarda; con audio=off o sin red, texto', async () => {
  const { win, fetches } = carga({ search: '?personaje=comercial&embed=1' });
  win.__comercial.estado('entregando', { texto: 'Propuesta lista.' });
  await new Promise((r) => setImmediate(r));
  assert.equal(fetches.length, 1, 'una petición de voz'); assert.equal(fetches[0][0], 'https://brain.digitalavatar.ai/tts');
  const body = JSON.parse(fetches[0][1].body); assert.equal(body.text, 'Propuesta lista.'); assert.equal(body.lang, 'es'); assert.equal(body.voiceId, 'voz-es'); assert.equal(body.timestamps, true);
  assert.equal(win.__nube().piel, 'entregando');
  const callada = carga({ search: '?personaje=comercial&embed=1&audio=off' });
  callada.win.__comercial.estado('entregando', { texto: 'Propuesta lista.' });
  await new Promise((r) => setImmediate(r));
  assert.equal(callada.fetches.length, 0, 'con audio=off no pide voz');
});
