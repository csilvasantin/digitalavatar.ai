// innerHTML seguro (29-oct-2026): el texto que viene del cerebro, del error o de la config no se pinta como HTML.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const leer = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('setStatus pinta texto (recibe j.error y e.message del cerebro/red)', () => {
  for (const p of ['good.html', 'legacy.html', '3d/index.html']) {
    const m = leer(p).match(/function setStatus\([^)]*\)\s*\{[^}]*\}/);
    assert.ok(m, p); assert.doesNotMatch(m[0], /innerHTML/, p); assert.match(m[0], /textContent/, p);
  }
});

test('embed.js escapa título, saludo y placeholder de la config', () => {
  const js = leer('embed.js');
  assert.doesNotMatch(js, /\$\{C\.(title|greeting|placeholder)\}/);
  assert.equal((js.match(/\$\{H\(C\.(title|greeting|placeholder)\)\}/g) || []).length, 4);
});

test('los innerHTML con texto dinámico de la nube y del chat pasan por esc()', () => {
  for (const p of ['src/nube/06-labios.js', 'src/nube/07-cerebro.js', 'src/nube/11-idioma-chips.js', 'assets/da-remote.js']) {
    for (const l of leer(p).split('\n').filter((x) => /innerHTML\s*=/.test(x) && /\+\s*\w/.test(x)))
      assert.match(l, /esc\(|T\[LANG\]/, p + ': ' + l.trim().slice(0, 80));
  }
});
