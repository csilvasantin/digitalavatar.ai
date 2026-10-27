// Los asistentes con IA de AdmiraNeXT (Carlos, 27-oct-2026): una sola lista (assets/da-asistentes.js) que sale con
// /help en el CLI del ⌘ Experto y en el chat del avatar, y en la guía /help. Y sin micro retro (🎙️) en las cajas.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const leer = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const registro = leer('assets/da-asistentes.js');
const nube = leer('assets/nube.js');
const shell = leer('assets/da-shell.js');
const remote = leer('assets/da-remote.js');
const guia = leer('help/index.html');

function cargaRegistro() {
  const window = {};
  vm.runInNewContext(registro, { window });
  return window.DA_ASISTENTES;
}

test('el registro carga y cada asistente tiene id, nombre, textos ES/EN y dónde abrirse', () => {
  const A = cargaRegistro();
  assert.ok(Array.isArray(A.lista) && A.lista.length >= 9, 'hay al menos los nueve de hoy');
  const ids = new Set();
  for (const a of A.lista) {
    assert.match(a.id, /^[a-z0-9-]+$/, a.id);
    assert.ok(!ids.has(a.id), 'id repetido: ' + a.id); ids.add(a.id);
    assert.ok(a.nombre && a.es && a.en, a.id + ' con nombre y textos');
    assert.match(a.url, /^\/[a-z-]+\.html(\?[a-z=&]+)?$/, a.id + ' abre en digitalavatar.ai');
  }
  assert.equal(A.porId('BUGITO').nombre, 'Bugito');
  assert.equal(A.porId('zzz'), null, 'un nombre que no existe no abre nada');
  for (const n of ['alfredito', 'AlfredIA', 'alfred', ' Comercial ']) assert.equal(A.porId(n).id, 'comercial', n + ' es Comercial (Carlos, 27-oct-2026)');
  assert.equal(A.porId('metahuman').id, 'neo'); assert.equal(A.porId('nube').id, 'admirito');
  const todos = A.lista.flatMap((a) => [a.id, ...(a.alias || [])].map((x) => x.toLowerCase()));
  assert.equal(new Set(todos).size, todos.length, 'ningún nombre o alias repetido entre asistentes');
  assert.match(A.texto('es'), /\/comercial — Comercial \(también AlfredIA, Alfredito/, '/help enseña los otros nombres');
  assert.match(A.texto('es'), /^Asistentes con IA de AdmiraNeXT/);
  assert.match(A.texto('en'), /^AdmiraNeXT AI assistants/);
  assert.equal(A.lineas('es').length, A.lista.length);
});

test('cada asistente tiene ficha: quién es y al menos tres puntos fuertes, en ES y EN; /<nombre> descripcion la pide', () => {
  const A = cargaRegistro();
  for (const a of A.lista) {
    assert.ok(a.que && a.que.es && a.que.en, a.id + ' dice quién es');
    for (const l of ['es', 'en']) assert.ok(Array.isArray(a.fuertes[l]) && a.fuertes[l].length >= 3, a.id + ' con 3+ puntos fuertes en ' + l);
    assert.equal(a.fuertes.es.length, a.fuertes.en.length, a.id + ': mismos puntos en los dos idiomas');
  }
  const f = A.ficha('alfredito', 'es');
  assert.match(f, /^Comercial · también AlfredIA/, 'la ficha de alfredito es la de Comercial');
  assert.match(f, /Puntos fuertes:\n· /); assert.match(f, /Abrir: \/comercial$/);
  assert.match(A.ficha('Neo', 'en'), /^Neo · also MetaHuman\n[\s\S]*Strengths:/);
  assert.equal(A.ficha('zzz', 'es'), '');
  for (const w of ['descripcion', 'Descripción', 'description', 'info', 'ficha', 'puntos fuertes', 'strengths']) assert.ok(A.pideFicha(w), w);
  for (const w of ['crear', 'rompe algo', '']) assert.ok(!A.pideFicha(w), 'no pide ficha: ' + w);
  assert.match(shell, /fichaAsistente\(A, verb\)/, 'el CLI atiende /<nombre> descripcion');
  const iFicha = shell.indexOf('root.DA_ASISTENTES.pideFicha(p.args)'), iGo = shell.indexOf('if (GO[verb]) {');
  assert.ok(iFicha > 0 && iGo > 0 && iFicha < iGo, 'la ficha va por delante de los atajos de página (neo, nube, luna…)');
  assert.match(shell, /partes\[2\] && A\.pideFicha/, 'el CLI atiende /asistente <nombre> descripcion');
  assert.match(remote, /pideFicha\(m\[2\]\)/, 'el chat atiende «alfredito descripcion»');
  assert.match(remote, /resto && A\.pideFicha\(resto\)/, 'el chat atiende /asistente <nombre> descripcion');
  assert.match(guia, /a\.fuertes\.es\.map/, 'la guía pinta los puntos fuertes');
});

test('todas las pieles de la nube (PIELES de nube.js) y los tres avatares están en la lista', () => {
  const A = cargaRegistro();
  const bloque = nube.slice(nube.indexOf('var PIELES = {'), nube.indexOf('var PERSONAJE'));
  const pieles = [...bloque.matchAll(/^\s{4}([a-z]+):/gm)].map((m) => m[1]);
  assert.ok(pieles.includes('bugito') && pieles.includes('admirito'), 'leí la tabla PIELES');
  for (const id of [...pieles, 'luna', 'neo']) assert.ok(A.porId(id), 'falta en el registro: ' + id);
  for (const a of A.lista) if (a.tipo === 'nube') assert.ok(pieles.includes(a.id), a.id + ' no es una piel de la nube');
});

test('el CLI del ⌘ Experto y el chat del avatar usan el mismo registro, con el mismo sello', () => {
  const sello = (s) => (s.match(/da-asistentes\.js\?v=([\w-]+)/) || [])[1];
  assert.ok(sello(shell), 'da-shell.js carga el registro');
  assert.equal(sello(remote), sello(shell), 'da-remote.js carga el mismo sello');
  assert.equal(sello(guia), sello(shell), 'la guía carga el mismo sello');
  assert.match(shell, /verb === 'help' \|\| verb === '\?'\) \{\s*asistentes\(/, '/help del CLI espera a la lista');
  assert.match(shell, /verb === 'asistente'/, 'el CLI entiende /asistente');
  assert.match(shell, /A && A\.porId\(verb\)/, 'el CLI abre /<nombre>');
  assert.match(remote, /\(help\|ayuda\)[\s\S]{0,200}asistentes\(function \(A\)/, '/help del chat añade la lista');
  assert.match(remote, /asistente\|asistentes\|assistant\|assistants/, 'el chat entiende /asistente <nombre>');
  assert.ok(guia.includes('id="asistentes"') && guia.includes('asistentesGrid'), 'la guía tiene la sección');
  assert.match(remote, /porId\(m\[1\]\)/, 'el chat abre /<nombre> a secas');
  assert.match(remote, /\^\[¿¡\]\*\\\/\?\\s\*\(\[a-z\]\+\)/, 'el chat abre el nombre sin barra (Carlos, 27-oct-2026)');
  const sr = (remote.match(/da-remote\.js\?v=/) || []).length; assert.ok(sr >= 0);
  const ctx = leer('assets/da-context.js').match(/da-remote\.js\?v=([\w-]+)/)[1];
  const ctxPaginas = new Set(['nube.html', 'metahuman.html', 'best.html', 'better.html'].map((p) => leer(p).match(/da-context\.js\?v=([\w-]+)/)[1]));
  assert.equal(ctxPaginas.size, 1); assert.equal([...ctxPaginas][0], ctx, 'sellos en cadena: cuando cambia da-remote, cambian da-context y las páginas a la vez');
  assert.match(remote, /^\s*asistentes\(function \(\) \{\}\);/m, 'el chat precarga la lista');
});

test('las páginas con chat cargan el mismo sello de da-context.js (cambió su contenido: carga da-remote)', () => {
  const sellos = new Set();
  for (const p of ['nube.html', 'metahuman.html', 'best.html', 'better.html']) { const m = leer(p).match(/da-context\.js\?v=([\w-]+)/); assert.ok(m, p); sellos.add(m[1]); }
  assert.equal(sellos.size, 1, 'un solo sello de da-context.js: ' + [...sellos].join(', '));
  assert.notEqual([...sellos][0], '20261018-admira-live-1', 'sello nuevo: el viejo servía un da-remote sin asistentes');
});

test('las páginas cargan el mismo sello de da-shell.js', () => {
  const paginas = fs.readdirSync(new URL('../', import.meta.url)).filter((f) => f.endsWith('.html')).map(leer).concat([guia]);
  const sellos = new Set();
  for (const html of paginas) { const m = html.match(/da-shell\.js\?v=([\w-]+)/); if (m) sellos.add(m[1]); }
  assert.equal(sellos.size, 1, 'un solo sello de da-shell.js: ' + [...sellos].join(', '));
});

test('sin micro retro: ni en las cajas de texto ni en el botón del micro', () => {
  for (const p of ['nube.html', 'index.html', 'best.html', 'better.html', 'vectorial.html', 'assets/nube.js', 'help/index.html']) {
    assert.ok(!leer(p).includes('🎙'), p + ' sin 🎙️');
  }
  for (const p of ['nube.html', 'index.html', 'best.html', 'better.html', 'vectorial.html']) {
    assert.match(leer(p), /id="btnMic"[^>]*>\s*<svg/, p + ': el botón del micro es un icono SVG');
  }
  assert.match(nube, /placeholder: 'Escribe o habla con Admirito…'/);
});
