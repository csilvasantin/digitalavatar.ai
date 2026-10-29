  // ───────────────────────── Bailes (para que la gente la mire) ─────────────────────────
  // Carlos, 7-oct-2026: «más movimientos cuando nadie le consulta, giros o bailes graciosos».
  // Cinco números grandes (cada ~9–15 s de reposo, al azar sin repetir el último), además de los
  // gestos pequeños. Nunca mientras habla, piensa o duerme; se cortan al tocarla o al preguntar;
  // con prefers-reduced-motion no se hacen. Demo: ?dance=1 (los cinco en bucle) · ?dance=giro|baile|
  // voltereta|gelatina|lluvia (alias spin|dance|flip|jelly|rain) para uno solo.
  var DANCES = ['giro', 'baile', 'voltereta', 'gelatina', 'lluvia'];
  var DANCE_ALIAS = { giro: 'giro', spin: 'giro', pirueta: 'giro', baile: 'baile', dance: 'baile', voltereta: 'voltereta', flip: 'voltereta', backflip: 'voltereta',
    gelatina: 'gelatina', jelly: 'gelatina', disco: 'gelatina', lluvia: 'lluvia', rain: 'lluvia', arcoiris: 'lluvia', rainbow: 'lluvia' };
  var DEMO = (function () { var v = String(params.get('dance') || '').toLowerCase(); if (!v || v === '0') return null; return /^(1|true|all|todos)$/.test(v) ? 'all' : (DANCE_ALIAS[v] || null); })();
  var D = null, lastDance = '', demoIdx = 0;
  S.nextDance = DEMO ? 0.6 : 9 + Math.random() * 6;
  if (DEMO && !(sleepParam > 0)) S.sleepAfter = Infinity;
  var PY = 112;                                  // centro del cuerpo (pivote de giros)
  var brazos = document.createElementNS(SVGNS, 'g'); brazos.id = 'brazos'; el.cuerpo.insertBefore(brazos, el.cuerpo.firstChild);
  var fondo = document.createElementNS(SVGNS, 'g'); fondo.id = 'fondo'; el.svg.insertBefore(fondo, el.sombra);
  function clamp01(u) { return Math.max(0, Math.min(1, u)); }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function ease(u) { u = clamp01(u); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function land(t) { return Math.exp(-t * 7) * Math.cos(t * 22); }   // rebote al aterrizar
  function once(d, k, fn) { if (!d.ev[k]) { d.ev[k] = 1; fn(); } }
  function mk(tag, attrs, parent, d) {
    var n = document.createElementNS(SVGNS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || el.fx).appendChild(n); if (d) d.nodes.push(n); return n;
  }
  function temp(node, ms) { el.fx.appendChild(node); setTimeout(function () { node.remove(); }, ms); return node; }
  function note(d, side) {
    var t = document.createElementNS(SVGNS, 'text'), x = side < 0 ? 4 + Math.random() * 26 : 238 + Math.random() * 26;
    t.setAttribute('class', 'nota'); t.setAttribute('x', x); t.setAttribute('y', 70 + Math.random() * 30);
    t.setAttribute('fill', ['#bfe9ff', '#ffe48a', '#ff8fb1', '#b9f18c'][Math.floor(Math.random() * 4)]);
    t.style.setProperty('--nx', (side * (14 + Math.random() * 18)) + 'px'); t.style.setProperty('--nr', (side * (10 + Math.random() * 20)) + 'deg');
    t.textContent = Math.random() < 0.5 ? '♪' : '♫'; temp(t, 1900);
  }
  function rainDrop() {
    var x = 112 + Math.random() * 53, y = -6 + Math.random() * 4;
    var l = document.createElementNS(SVGNS, 'path'); l.setAttribute('class', 'lluvia'); l.setAttribute('d', 'M' + x.toFixed(1) + ',' + y.toFixed(1) + ' l-1.5,8');
    temp(l, 650);
  }
  function splash() {
    for (var i = 0; i < 6; i++) {
      var side = i % 2 ? 1 : -1, c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('class', 'salpica'); c.setAttribute('cx', side < 0 ? 18 + Math.random() * 30 : 230 + Math.random() * 30); c.setAttribute('cy', 40 + Math.random() * 90); c.setAttribute('r', 3 + Math.random() * 2.5);
      c.style.setProperty('--sx', (side * (22 + Math.random() * 26)) + 'px'); c.style.setProperty('--sy', (-14 + Math.random() * 30) + 'px');
      temp(c, 800);
    }
  }
  function armPose(n, cx, cy, dx, dy, s) {
    n.setAttribute('transform', 'translate(' + (cx + dx).toFixed(1) + ',' + (cy + dy).toFixed(1) + ') scale(' + s.toFixed(3) + ') translate(' + (-cx) + ',' + (-cy) + ')');
  }
  var DANCE = {
    // 1) Pirueta: se agacha, salta girando dos vueltas y aterriza con «squish».
    giro: { dur: 2.1, step: function (d, t, o) {
      if (t < 0.3) { var c = Math.sin(seg(t, 0, 0.3) * Math.PI / 2); o.sx = 1 + 0.12 * c; o.sy = 1 - 0.14 * c; }
      else if (t < 1.6) {
        var u = seg(t, 0.3, 1.6), cs = Math.cos(ease(u) * Math.PI * 4);
        o.dy = -30 * Math.sin(Math.PI * u); o.sx = Math.abs(cs) < 0.08 ? (cs < 0 ? -0.08 : 0.08) : cs; o.sy = 1 + 0.06 * Math.sin(Math.PI * u);
        o.happy = u > 0.12 && u < 0.92; o.mouth = [0.35 * Math.sin(Math.PI * u), 0.6];
      } else { var l = t - 1.6; o.sx = 1 + 0.2 * land(l); o.sy = 1 - 0.2 * land(l); o.happy = true; once(d, 'chispa', function () { sparkle(3); }); }
    } },
    // 2) Bailecito: de lado a lado con botecito al ritmo, cantando «la la» y soltando notas.
    baile: { dur: 3.0, step: function (d, t, o) {
      var env = Math.min(1, t / 0.3, (d.dur - t) / 0.35), beat = t / 0.42, b = Math.abs(Math.sin(Math.PI * beat));
      o.dx = 16 * Math.sin(Math.PI * beat) * env; o.dy = -11 * b * env; o.rot = 8 * Math.sin(Math.PI * beat) * env;
      o.sx = 1 + 0.08 * (1 - b) * env; o.sy = 1 - 0.08 * (1 - b) * env;
      o.mouth = [0.38 * b * env, 0.2]; o.happy = Math.floor(beat / 2) % 2 === 1;
      if (t >= d.nextNote && t < d.dur - 0.4) { note(d, d.side); d.side = -d.side; d.nextNote = t + 0.45; }
    } },
    // 3) Voltereta hacia atrás con cara feliz (se encoge un poco para no salirse del marco).
    voltereta: { dur: 2.2, step: function (d, t, o) {
      if (t < 0.3) { var c = Math.sin(seg(t, 0, 0.3) * Math.PI / 2); o.sx = 1 + 0.1 * c; o.sy = 1 - 0.16 * c; }
      else if (t < 1.6) {
        var u = seg(t, 0.3, 1.6), k = 0.26 * Math.sin(Math.PI * u);
        o.dy = -26 * Math.sin(Math.PI * u); o.rot = -360 * ease(u); o.sx = o.sy = 1 - k; o.happy = true; o.mouth = [0.55 * Math.sin(Math.PI * u), 0];
      } else { var l = t - 1.6; o.sx = 1 + 0.22 * land(l); o.sy = 1 - 0.22 * land(l); o.happy = true; once(d, 'chispa', function () { sparkle(2); }); }
    } },
    // 4) Gelatina disco: tiembla como un flan y saca dos «bracitos» de nube que señalan arriba y abajo.
    gelatina: { dur: 3.0,
      start: function (d) {
        d.armI = mk('ellipse', { cx: 18, cy: 128, rx: 21, ry: 14, fill: '#f3f9e8', stroke: '#689840', 'stroke-width': 9 }, brazos, d);
        d.armD = mk('ellipse', { cx: 259, cy: 128, rx: 21, ry: 14, fill: '#f3f9e8', stroke: '#689840', 'stroke-width': 9 }, brazos, d);
      },
      step: function (d, t, o) {
        var env = Math.min(1, t / 0.35, (d.dur - t) / 0.35), ph = Math.sin(2 * Math.PI * t / 1.1);
        var w = Math.sin(2 * Math.PI * 4.5 * t) * 0.1 * env * (t < 1.1 ? 1 : 0.45);
        o.sx = 1 + w; o.sy = 1 - w; o.rot = 10 * ph * env; o.dy = -6 * Math.abs(Math.sin(2 * Math.PI * t / 0.55)) * env;
        o.happy = t > 0.5; o.mouth = [0.3 * env, 0.85];
        var up = Math.max(0, ph), dn = Math.max(0, -ph);
        armPose(d.armI, 18, 128, -12 * env, (-58 * up + 26 * dn) * env, env);
        armPose(d.armD, 259, 128, 12 * env, (-58 * dn + 26 * up) * env, env);
        if (t >= d.nextNote && t < d.dur - 0.5) { sparkle(1); d.nextNote = t + 0.9; }
      } },
    // 5) Nubarrón: le llueve encima, se sorprende, se sacude como un perrito y sale un arcoíris.
    lluvia: { dur: 5.2,
      start: function (d) {
        d.gris = mk('g', { 'class': 'nubegris', opacity: 0 }, el.fx, d);
        mk('rect', { x: 106, y: -16, width: 66, height: 15, rx: 7.5, fill: '#8d9aa8' }, d.gris);
        mk('circle', { cx: 121, cy: -16, r: 12, fill: '#8d9aa8' }, d.gris);
        mk('circle', { cx: 140, cy: -23, r: 16, fill: '#9aa7b4' }, d.gris);
        mk('circle', { cx: 158, cy: -15, r: 11, fill: '#8d9aa8' }, d.gris);
      },
      step: function (d, t, o) {
        var gop = t < 0.4 ? t / 0.4 : t < 2.3 ? 1 : 1 - seg(t, 2.3, 2.8);
        d.gris.setAttribute('opacity', gop.toFixed(2));
        d.gris.setAttribute('transform', 'translate(' + (t > 2.3 ? 60 * seg(t, 2.3, 2.8) : 0).toFixed(1) + ',' + (t > 2.3 ? -12 * seg(t, 2.3, 2.8) : 0).toFixed(1) + ')');
        if (t > 0.45 && t < 2.25 && t >= d.nextDrop) { rainDrop(); d.nextDrop = t + 0.07; }
        if (t > 0.85 && t < 2.2) { o.eyes = 1.28; o.mouth = [0.42, 1]; o.gaze = [0, -1]; o.dx = 1.4 * Math.sin(t * 60); }
        else if (t >= 2.2 && t < 3.0) {
          var k = Math.sin(Math.PI * seg(t, 2.2, 3.0)), f = 2 * Math.PI * 11 * t;
          o.dx = 9 * Math.sin(f) * k; o.rot = 6 * Math.sin(f + 1) * k; o.sx = 1 + 0.06 * k; o.sy = 1 - 0.04 * k; o.happy = true;
          once(d, 'salpica1', splash); if (t > 2.55) once(d, 'salpica2', splash);
        } else if (t >= 3.0) {
          o.happy = true; o.mouth = [0.3 * Math.min(1, (d.dur - t) / 0.4), 0];
          once(d, 'arco', function () {
            var g = mk('g', { 'class': 'arco' }, fondo, d), cols = ['#ff6b6b', '#ffb84d', '#ffe66d', '#6bd68a', '#6bb8ff'];
            for (var i = 0; i < 5; i++) { var r = 165 - i * 7; mk('path', { d: 'M' + (CX - r) + ',160 A' + r + ',' + r + ' 0 0 1 ' + (CX + r) + ',160', stroke: cols[i], pathLength: 1 }, g); }
            kick(0.7); S.hopV = 2.4;
          });
          if (t > 3.25) once(d, 'chispa', function () { sparkle(3); });
        }
      } }
  };
  function startDance(name, wakeOrOpts, dur) {
    if (REDUCED || !DANCE[name]) return null;
    var opts = wakeOrOpts && typeof wakeOrOpts === 'object' ? wakeOrOpts : { wake: !!wakeOrOpts, dur: dur };
    stopDance();
    D = { name: name, t: 0, dur: opts.dur || DANCE[name].dur, nodes: [], ev: {}, wake: !!opts.wake, forced: !!opts.forced, nextNote: 0.2, side: Math.random() < 0.5 ? -1 : 1, nextDrop: 0 };
    if (DANCE[name].start) DANCE[name].start(D);
    lastDance = name;
    if (D.forced) S.lastTouch = performance.now();   // no dormir a mitad de un /animacion
    return name;
  }
  function stopDance() {
    if (!D) return;
    var wasForced = D.forced;
    D.nodes.forEach(function (n) { n.remove(); }); D = null;
    S.nextDance = DEMO ? 0.35 : 9 + Math.random() * 6; S.nextGesture = Math.max(S.nextGesture, 2.5);
    if (wasForced) S.lastTouch = performance.now();
  }
  function pickDance() {
    if (DEMO === 'all') return DANCES[demoIdx++ % DANCES.length];
    if (DEMO) return DEMO;
    var pool = DANCES.filter(function (n) { return n !== lastDance; });
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // Devuelve los desplazamientos del baile en curso (o neutros) para este fotograma.
  function danceFrame(dt, idleMs) {
    var o = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, eyes: 1, mouth: null, happy: false, gaze: null };
    if (D) {
      D.t += dt;
      if (S.mode !== 'idle' || S.speak) stopDance();
      else if (D.t >= D.dur) stopDance();
      else DANCE[D.name].step(D, D.t, o);
    } else if (!REDUCED && S.mode === 'idle' && !S.speak && idleMs > (DEMO ? 1200 : 2500)) {
      S.nextDance -= dt; if (S.nextDance <= 0) startDance(pickDance());
    }
    return o;
  }
  window.__nubeDance = function (name) { return startDance(DANCE_ALIAS[String(name || '').toLowerCase()] || pickDance(), { forced: true }); };

