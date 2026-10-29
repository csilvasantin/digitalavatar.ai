// Un solo lipsync-avatar.js (29-oct-2026): la copia de web-tester/ había divergido (sin el AudioContext compartido).
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const raiz = new URL('../', import.meta.url).pathname;

test('una sola copia de lipsync-avatar.js y todas las páginas la encuentran', () => {
  assert.equal(fs.existsSync(path.join(raiz, 'web-tester/lipsync-avatar.js')), false, 'sin copia en web-tester/');
  for (const p of ['good.html', 'legacy.html', 'vectorial.html', 'web-tester/index.html', 'web-tester/combined.html']) {
    const m = fs.readFileSync(path.join(raiz, p), 'utf8').match(/src="([^"]*lipsync-avatar\.js)"/);
    assert.ok(m, p + ' carga lipsync-avatar.js');
    assert.equal(path.resolve(path.dirname(path.join(raiz, p)), m[1]), path.join(raiz, 'lipsync-avatar.js'), p);
  }
});
