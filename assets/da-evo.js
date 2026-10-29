/* Conmutador de EVOLUCIÓN (nube → vectorial → 2D → 3D → realista → metahuman) · una sola fuente (29-oct-2026).
 * Uso: <nav id="evo" aria-label="Evolución del avatar"></nav><script src="/assets/da-evo.js?v=…"></script>
 * Pinta los enlaces, marca el nivel de la página y trae su CSS. Antes cada página repetía nav + estilo + script.
 */
(function () {
  var NIVELES = [
    ['nube', 'nube.html', 'Nube'],
    ['vectorial', 'vectorial.html', 'Vectorial'],
    ['2d', 'good.html', '2D'],
    ['3d', 'better.html', '3D'],
    ['foto', 'best.html', 'Realista'],
    ['metahuman', 'metahuman.html', 'Metahuman']
  ];
  var CSS = '#evo{position:fixed;top:9px;left:50%;transform:translateX(-50%);z-index:60;display:flex;flex-wrap:wrap;gap:3px;align-items:center;justify-content:center;max-width:96vw;' +
    'background:rgba(6,14,24,.82);border:1px solid #1b3346;border-radius:999px;padding:4px 6px;backdrop-filter:blur(10px);' +
    'font-family:ui-sans-serif,-apple-system,system-ui,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.5)}' +
    '#evo a{display:inline-block;padding:5px 12px;border-radius:999px;font-size:.72rem;font-weight:700;text-decoration:none;color:#86a6bd;white-space:nowrap}' +
    '#evo a.on{background:linear-gradient(180deg,#12466a,#0c2c44);color:#bfe9ff;box-shadow:0 0 12px rgba(95,208,255,.25)}' +
    '@media(max-width:520px){#evo a{padding:5px 10px;font-size:.68rem}}';
  var nav = document.getElementById('evo');
  if (!nav) return;
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var f = (location.pathname.split('/').pop() || '').toLowerCase();
  var cur = '3d'; // portada (index) = 3D, como antes
  NIVELES.forEach(function (n) { if (n[1] === f) cur = n[0]; });
  if (!nav.querySelector('a')) NIVELES.forEach(function (n) {
    var a = document.createElement('a'); a.setAttribute('data-evo', n[0]); a.href = n[1]; a.textContent = n[2]; nav.appendChild(a);
  });
  nav.querySelectorAll('a').forEach(function (a) { if (a.getAttribute('data-evo') === cur) a.classList.add('on'); });
})();
