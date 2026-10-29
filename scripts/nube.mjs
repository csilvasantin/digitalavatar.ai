// assets/nube.js se genera juntando src/nube/*.js en orden (un archivo por bloque: motor, labios, pieles…).
// Uso: npm run nube (genera) · node scripts/nube.mjs --check (falla si assets/nube.js no coincide con la fuente).
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(RAIZ, 'src/nube');
const DESTINO = path.join(RAIZ, 'assets/nube.js');

export function construir() {
  return fs.readdirSync(SRC).filter((f) => f.endsWith('.js')).sort()
    .map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('');
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const js = construir();
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(DESTINO, 'utf8') !== js) { console.error('assets/nube.js no coincide con src/nube: ejecuta npm run nube'); process.exit(1); }
  } else {
    fs.writeFileSync(DESTINO, js);
    console.log('assets/nube.js ← ' + fs.readdirSync(SRC).length + ' bloques de src/nube');
  }
}
