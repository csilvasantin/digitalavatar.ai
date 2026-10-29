// Sellos de caché automáticos: cada ?v= de /assets/* pasa a ser el hash del archivo.
// Uso: npm run sellos (reescribe) · node scripts/sellos.mjs --check (falla si alguno está viejo).
// Se repite hasta estabilizar: si da-remote cambia, cambia su sello en da-context y luego el de da-context en las páginas.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FUERA = new Set(['.git', 'node_modules', 'roadmap/assets', 'web-tester', 'workers', 'unreal', 'tests', 'scripts']);
const REF = /(\/?assets\/([\w.-]+\.(?:js|css)))\?v=([\w-]+)/g;

function archivos(dir = RAIZ, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (FUERA.has(e.name) || FUERA.has(path.relative(RAIZ, p))) continue;
    if (e.isDirectory()) archivos(p, out);
    else if (/\.(html|js)$/.test(e.name)) out.push(p);
  }
  return out;
}


export function sellar({ escribir = true } = {}) {
  const lista = archivos();
  const viejos = new Map();
  const contenido = new Map(lista.map((p) => [p, fs.readFileSync(p, 'utf8')]));
  const sello = (p) => crypto.createHash('sha256').update(contenido.has(p) ? contenido.get(p) : fs.readFileSync(p)).digest('hex').slice(0, 10);
  for (let vuelta = 0; vuelta < 20; vuelta++) {
    let cambio = false;
    for (const p of lista) {
      const antes = contenido.get(p);
      const despues = antes.replace(REF, (todo, ref, nombre, v) => {
        const destino = path.join(RAIZ, 'assets', nombre);
        if (destino === p || !fs.existsSync(destino)) return todo; // externo o a sí mismo
        const nuevo = sello(destino);
        if (nuevo === v) return todo;
        viejos.set(path.relative(RAIZ, p) + ' → ' + nombre, v + ' ≠ ' + nuevo);
        return ref + '?v=' + nuevo;
      });
      if (despues !== antes) { contenido.set(p, despues); cambio = true; }
    }
    if (!cambio) break;
  }
  if (escribir) for (const p of lista) if (contenido.get(p) !== fs.readFileSync(p, 'utf8')) fs.writeFileSync(p, contenido.get(p));
  return viejos;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const check = process.argv.includes('--check');
  const viejos = sellar({ escribir: !check });
  for (const [k, v] of viejos) console.log((check ? 'viejo  ' : 'sellado ') + k + '  ' + v);
  if (check && viejos.size) { console.error('Sellos viejos: ejecuta npm run sellos'); process.exit(1); }
}
