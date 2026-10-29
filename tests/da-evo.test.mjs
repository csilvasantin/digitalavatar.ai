// Conmutador de evolución en un solo sitio (29-oct-2026): assets/da-evo.js; ninguna página repite nav, estilo ni script.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const leer = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('las páginas del avatar usan assets/da-evo.js y no copian el conmutador', () => {
  for (const p of ['good.html', 'better.html', 'best.html', 'metahuman.html', 'nube.html', 'vectorial.html', 'index.html']) {
    const h = leer(p);
    assert.match(h, /<nav id="evo"[^>]*><\/nav>\s*<script src="\/assets\/da-evo\.js\?v=[\w-]+"><\/script>/, p);
    assert.doesNotMatch(h, /data-evo=|#evo\{position/, p + ' sin copia');
  }
});
