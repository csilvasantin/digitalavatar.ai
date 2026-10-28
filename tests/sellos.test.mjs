// Sellos de caché (28-oct-2026): cada ?v= de /assets/* es el hash del archivo; si no, npm run sellos.
import test from 'node:test';import assert from 'node:assert/strict';
import { sellar } from '../scripts/sellos.mjs';

test('todos los sellos de /assets coinciden con el contenido', () => {
  const viejos = sellar({ escribir: false });
  assert.equal(viejos.size, 0, 'sellos viejos (ejecuta npm run sellos): ' + [...viejos.keys()].join(', '));
});
