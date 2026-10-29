// nube.js partido (29-oct-2026): la fuente vive en src/nube/*.js y assets/nube.js es su suma exacta.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import { construir } from '../scripts/nube.mjs';

test('assets/nube.js coincide con src/nube/*.js (si no: npm run nube)', () => {
  assert.equal(fs.readFileSync(new URL('../assets/nube.js', import.meta.url), 'utf8'), construir());
});
