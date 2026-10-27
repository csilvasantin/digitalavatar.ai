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
  assert.equal(A.porId('alfredito'), null, 'un nombre que no existe no abre nada');
  assert.match(A.texto('es'), /^Asistentes con IA de AdmiraNeXT/);
  assert.match(A.texto('en'), /^AdmiraNeXT AI assistants/);
  assert.equal(A.lineas('es').length, A.lista.length);
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
