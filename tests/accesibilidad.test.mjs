// Accesibilidad y avisos (29-oct-2026): estado anunciado, pregunta etiquetada, aviso sin JS y fallo de micro explicado.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const leer = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const PAGINAS = ['best.html', 'better.html', 'good.html', 'index.html', 'legacy.html', 'metahuman.html', 'nube.html', 'vectorial.html', 'say.html'];

test('el estado se anuncia y la caja de pregunta tiene etiqueta', () => {
  for (const p of PAGINAS) {
    const h = leer(p);
    if (h.includes('id="status"')) assert.match(h, /id="status" role="status" aria-live="polite"/, p);
    for (const m of h.match(/<input id="q"[^>]*>/g) || []) assert.match(m, /aria-label=|data-i18n-ph=/, p);
  }
});

test('sin JavaScript sale un aviso', () => {
  for (const p of PAGINAS) assert.match(leer(p), /<noscript>/, p);
});

test('si el micro falla, el visitante sabe por qué', () => {
  for (const p of ['best.html', 'index.html', 'vectorial.html']) {
    const h = leer(p);
    assert.match(h, /function micAviso\(code\)/, p);
    assert.match(h, /recog\.onerror=e=>\{ stopListen\(\); micAviso\(e&&e\.error\); \};/, p);
  }
});
