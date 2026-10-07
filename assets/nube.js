/* DigitalAvatar.ai · nivel GOOD = Admirito, la nube (GrokBot · MacMini, 6-oct-2026).
 *
 * Lo opuesto a Neo (best): 2D, SVG + JS, sin 3D ni WebGL; carga al instante.
 *  - Labios: con voz, la boca sigue la amplitud del audio (WebAudio AnalyserNode) y la forma de
 *    las vocales (alineación de ElevenLabs); en modo solo texto se anima un tiempo proporcional
 *    a la longitud de la respuesta.
 *  - Vida propia si nadie la toca: flota, parpadea, mira alrededor, gestos (botecito, guiño,
 *    gota de lluvia, chispa, balanceo) y «zzz» tras un rato; se despierta al interactuar.
 *  - Ratón/toque: sigue el puntero con la mirada, se ruboriza y hace un «squish» feliz.
 *  - Pensando: puntitos mientras contesta el cerebro. prefers-reduced-motion: solo parpadeo y boca.
 * Contexto del cliente, chips, idioma y reglas: assets/da-context.js (tier good) + el cerebro.
 * Parámetros: ?dock=1 (panel de la suite) · ?kiosk=1 (tótem) · ?embed=1 (pantalla del gemelo)
 * · ?audio=off (solo texto: no gasta voz) · loc/lang/sector/brand/site/city/tier (da-context).
 * postMessage (como best.html): da-ask {question,lang} · da-lang · da-audio {on} → da-answer.
 * Bailes (7-oct-2026): giro, baile, voltereta, gelatina y lluvia (con arcoíris) cada ~9–15 s de reposo;
 * ?dance=1 los enseña todos en bucle, ?dance=<nombre> uno solo (alias spin, dance, flip, jelly, rain).
 * Slash: /animacion 1|giro … /animacion help; /quien soy; /perfil; /aprender|/train (admin); /help.
 * Identidad: avatar=admirito (tier good). Nunca se mezcla con Luna ni Neo.
 */
(function () {
  'use strict';
  var API = 'https://brain.digitalavatar.ai';
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var KIOSK = /^(1|true)$/.test(params.get('kiosk') || '');
  var EMBED = params.get('embed') === '1';
  var DOCK = params.get('dock') === '1';
  var REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var MUTED = params.get('audio') === 'off' || params.get('voice') === '0';
  var DACTX = window.DAContext;
  var DADemo = window.DADemo;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var T = {
    es: { lang: 'es', tag: 'Admirito, la nube que habla', placeholder: 'Escribe o pulsa 🎙️ para hablar con Admirito…',
      thinking: 'Pensando…', listening: 'Escuchando…', speaking: 'Hablando', cut: 'Voz cortada', net: 'Error de red: ',
      noVoice: '', audioBlocked: 'El navegador bloqueó el audio. Pulsa de nuevo para oír la respuesta.',
      micNo: 'Este navegador no tiene dictado. Escribe la pregunta.', micDenied: 'Micro bloqueado. Permite el micrófono o escribe.',
      micFail: 'No se pudo usar el micrófono. Escribe la pregunta.', micEmpty: 'No se oyó nada. Prueba otra vez o escribe.',
      loc: 'Xpacio (Admira.app)', aria: 'Admirito, la nube de AdmiraNeXT',
      chips: ['¿Quién eres?', '¿Qué ofrece esta tienda?', '¿Cómo puedo pagar?', '¿A quién pregunto?'] },
    en: { lang: 'en', tag: 'Admirito, the talking cloud', placeholder: 'Type or press 🎙️ to talk to Admirito…',
      thinking: 'Thinking…', listening: 'Listening…', speaking: 'Speaking', cut: 'Voice cut', net: 'Network error: ',
      noVoice: '', audioBlocked: 'The browser blocked audio. Tap again to hear the reply.',
      micNo: 'This browser has no dictation. Type the question.', micDenied: 'Microphone blocked. Allow it, or type.',
      micFail: 'The microphone failed. Type the question.', micEmpty: 'Nothing was heard. Try again or type.',
      loc: 'Xpacio (Admira.app location)', aria: 'Admirito, the AdmiraNeXT cloud',
      chips: ['Who are you?', 'What does this shop offer?', 'How can I pay?', 'Who can I ask?'] }
  };
  var LANG = (params.get('lang') === 'en' ? 'en' : params.get('lang') === 'es' ? 'es' : '') || DACTX.get().lang || (localStorage.getItem('da_lang') === 'en' ? 'en' : 'es');

  // ───────────────────────── Cuerpo (SVG) ─────────────────────────
  var el = {
    svg: $('nube'), flota: $('flota'), cuerpo: $('cuerpo'), ojoI: $('ojoI'), ojoD: $('ojoD'), ojos: $('ojos'),
    felices: $('ojosFelices'), mejI: $('mejI'), mejD: $('mejD'), boca: $('bocaForma'), clip: $('bocaClipPath'),
    lengua: $('lengua'), piensa: $('piensa'), fx: $('fx'), sombra: $('sombra')
  };
  var CX = 138.5, BASE_Y = 190;           // pie de la nube (origen del squish)
  var EYES = [{ g: el.ojoI, x: 111, y: 110 }, { g: el.ojoD, x: 166, y: 110 }];

  // Boca: a = apertura 0..1, r = redondez 0..1 (o/u). Cerrada = la sonrisa original.
  function mouthPath(a, r) {
    var y = 135, hw = 16.5 * (1 - 0.38 * r) * (1 + 0.08 * a), up = 14 * (1 - 0.75 * a) + 2 * r * a, down = up + 6 + 30 * a * (1 + 0.25 * r);
    if (a < 0.02) return 'M' + (CX - 16.5) + ',' + y + ' Q' + CX + ',' + (y + 18) + ' ' + (CX + 16.5) + ',' + y;
    return 'M' + (CX - hw).toFixed(2) + ',' + y + ' Q' + CX + ',' + (y + up).toFixed(2) + ' ' + (CX + hw).toFixed(2) + ',' + y +
      ' Q' + CX + ',' + (y + down).toFixed(2) + ' ' + (CX - hw).toFixed(2) + ',' + y + 'Z';
  }
  var mouth = { a: 0, r: 0, ta: 0, tr: 0 };
  function drawMouth() {
    var d = mouthPath(mouth.a, mouth.r);
    el.boca.setAttribute('d', d);
    el.boca.setAttribute('fill', mouth.a < 0.02 ? 'none' : '#1d2b12');
    el.clip.setAttribute('d', mouth.a < 0.02 ? 'M0,0Z' : d);
    el.lengua.setAttribute('cy', (135 + 8 + 26 * mouth.a).toFixed(2));
  }

  // ───────────────────────── Estado ─────────────────────────
  var S = {
    mode: 'idle',               // idle | thinking | speaking | sleeping
    lastTouch: performance.now(), sleepAfter: 45000,
    blink: 0, nextBlink: 1.8, wink: -1, winkEye: 0,
    gaze: { x: 0, y: 0, tx: 0, ty: 0, next: 1.2 }, pointer: null,
    squish: 0, squishV: 0, tilt: 0, tiltT: 0, hop: 0, hopV: 0,
    blush: 0, blushT: 0, happy: 0, sleepEyes: 0,
    nextGesture: 4 + Math.random() * 3, nextZ: 0,
    speak: null                  // {kind:'audio'|'text', ...}
  };
  var sleepParam = +params.get('sleep'); if (sleepParam > 0) S.sleepAfter = sleepParam * 1000;   // demos: segundos hasta dormirse
  window.__nube = function () {
    return { mode: S.mode, mouthOpen: +mouth.a.toFixed(3), speaking: !!S.speak, speakKind: S.speak ? S.speak.kind : '', sleeping: S.mode === 'sleeping',
      dance: D ? D.name : '', danceT: D ? +D.t.toFixed(2) : 0, demo: DEMO || '',
      blink: +S.blink.toFixed(2), gaze: [+S.gaze.x.toFixed(2), +S.gaze.y.toFixed(2)], reduced: REDUCED, lang: LANG, tier: DACTX.tier(), muted: MUTED };
  };

  function touch() {
    var was = S.mode === 'sleeping';
    S.lastTouch = performance.now();
    if (D && !D.wake) stopDance();                    // tocarla corta el baile al momento
    if (was) wake();
  }
  function wake() {
    S.mode = S.speak ? 'speaking' : 'idle';
    S.sleepEyes = 0; kick(0.9); S.hopV = 2.6; sparkle(1);
    // Al despertar, un bailecito corto de alegría (no lo corta mover el ratón; sí tocarla o preguntar).
    if (!REDUCED) setTimeout(function () { if (S.mode === 'idle' && !S.speak && !D) startDance('baile', true, 1.9); }, 350);
  }
  function kick(amount) { S.squishV += amount * 3.2; }         // botecito / squish elástico
  function goSleep() { if (REDUCED) return; S.mode = 'sleeping'; S.nextZ = 0.4; }

  // ───────────────────────── Partículas ─────────────────────────
  function fx(node, ms) { if (REDUCED) return; el.fx.appendChild(node); setTimeout(function () { node.remove(); }, ms); }
  function zzz() {
    var t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('class', 'zzz'); t.setAttribute('x', 222 + Math.random() * 10); t.setAttribute('y', 40);
    t.textContent = Math.random() < 0.5 ? 'z' : 'Z'; fx(t, 2700);
  }
  function drop() {
    var p = document.createElementNS(SVGNS, 'path'), x = 90 + Math.random() * 100;
    p.setAttribute('class', 'gota'); p.setAttribute('d', 'M' + x + ',196 q-6,10 0,14 q6,-4 0,-14z'); fx(p, 1600);
  }
  function sparkle(n) {
    for (var i = 0; i < (n || 1); i++) {
      var s = document.createElementNS(SVGNS, 'path'), x = 20 + Math.random() * 240, y = -10 + Math.random() * 40;
      s.setAttribute('class', 'chispa');
      s.setAttribute('d', 'M' + x + ',' + (y - 9) + ' L' + (x + 2.5) + ',' + (y - 2.5) + ' L' + (x + 9) + ',' + y + ' L' + (x + 2.5) + ',' + (y + 2.5) + ' L' + x + ',' + (y + 9) + ' L' + (x - 2.5) + ',' + (y + 2.5) + ' L' + (x - 9) + ',' + y + ' L' + (x - 2.5) + ',' + (y - 2.5) + 'Z');
      s.style.animationDelay = (i * 0.15) + 's'; fx(s, 1700);
    }
  }
  function heart() {
    var h = document.createElementNS(SVGNS, 'path'), x = 205 + Math.random() * 20, y = 60;
    h.setAttribute('class', 'corazon');
    h.setAttribute('d', 'M' + x + ',' + y + ' c-4,-6 -13,-3 -10,4 c2,4 10,9 10,9 c0,0 8,-5 10,-9 c3,-7 -6,-10 -10,-4z'); fx(h, 1500);
  }

  // Gestos al azar cuando nadie la toca.
  function gesture() {
    var g = ['hop', 'wink', 'drop', 'sparkle', 'sway', 'look', 'hop', 'drop'][Math.floor(Math.random() * 8)];
    if (g === 'hop') { kick(0.8); S.hopV = 3; }
    else if (g === 'wink') { S.wink = 0; S.winkEye = Math.random() < 0.5 ? 0 : 1; }
    else if (g === 'drop') { drop(); setTimeout(drop, 380); }
    else if (g === 'sparkle') sparkle(2);
    else if (g === 'sway') S.tiltT = 1.4;
    else { S.gaze.tx = (Math.random() < 0.5 ? -1 : 1) * 0.9; S.gaze.ty = -0.3; S.gaze.next = 1.4; }
    return g;
  }
  window.__nubeGesture = gesture;

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

  // ───────────────────────── Bucle ─────────────────────────
  var last = performance.now(), clock = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
    var idleMs = now - S.lastTouch;
    if (S.mode === 'idle' && idleMs > S.sleepAfter && !S.speak && !D) goSleep();
    var o = danceFrame(dt, idleMs);

    // Boca
    updateMouthTarget(dt);
    if (o.mouth && !S.speak) { mouth.ta = o.mouth[0]; mouth.tr = o.mouth[1]; }
    var k = 1 - Math.exp(-dt * 26);
    mouth.a += (mouth.ta - mouth.a) * k; mouth.r += (mouth.tr - mouth.r) * k;
    drawMouth();

    // Parpadeo y guiño
    S.nextBlink -= dt;
    if (S.blink > 0) { S.blink -= dt; }
    else if (S.nextBlink <= 0 && S.mode !== 'sleeping') { S.blink = 0.16; S.nextBlink = 2.2 + Math.random() * 3.8; if (Math.random() < 0.15) S.nextBlink = 0.25; }
    var bl = S.blink > 0 ? Math.sin((1 - S.blink / 0.16) * Math.PI) : 0;
    var wk = 0; if (S.wink >= 0) { S.wink += dt; wk = S.wink < 0.5 ? Math.sin(Math.min(1, S.wink / 0.5) * Math.PI) : 0; if (S.wink > 0.5) S.wink = -1; }
    var sleepy = S.mode === 'sleeping' ? 1 : 0;
    S.sleepEyes += (sleepy - S.sleepEyes) * Math.min(1, dt * 2.5);

    // Mirada: puntero > deriva al azar; pensando mira arriba; dormida, abajo
    S.gaze.next -= dt;
    if (S.pointer && now - S.pointer.t < 2500) { S.gaze.tx = S.pointer.x; S.gaze.ty = S.pointer.y; }
    else if (S.mode === 'thinking') { S.gaze.tx = 0.6; S.gaze.ty = -0.8; }
    else if (S.mode === 'speaking') { if (S.gaze.next <= 0) { S.gaze.tx = (Math.random() - 0.5) * 0.4; S.gaze.ty = (Math.random() - 0.5) * 0.2; S.gaze.next = 1 + Math.random() * 1.5; } }
    else if (S.gaze.next <= 0) { var c = Math.random(); S.gaze.tx = c < 0.4 ? 0 : (Math.random() - 0.5) * 1.8; S.gaze.ty = c < 0.4 ? 0 : (Math.random() - 0.5) * 1.0; S.gaze.next = 0.9 + Math.random() * 2.6; }
    if (S.mode === 'sleeping') { S.gaze.tx = 0; S.gaze.ty = 0.4; }
    if (o.gaze) { S.gaze.tx = o.gaze[0]; S.gaze.ty = o.gaze[1]; }
    var gk = Math.min(1, dt * 10); S.gaze.x += (S.gaze.tx - S.gaze.x) * gk; S.gaze.y += (S.gaze.ty - S.gaze.y) * gk;

    // Felicidad (^^) y rubor
    if (S.happy > 0) S.happy = Math.max(0, S.happy - dt);
    if (S.blushT > 0) S.blushT = Math.max(0, S.blushT - dt);
    S.blush += ((S.blushT > 0 ? 1 : 0) - S.blush) * Math.min(1, dt * 6);
    var happyOn = (S.happy > 0 || o.happy) ? 1 : 0;
    el.felices.setAttribute('opacity', happyOn);
    el.ojos.setAttribute('opacity', 1 - happyOn);
    for (var i = 0; i < 2; i++) {
      var e = EYES[i], sy = Math.max(0.08, 1 - bl) * (1 - 0.85 * S.sleepEyes);
      if (wk && S.winkEye === i) sy = Math.max(0.08, 1 - wk);
      var gx = S.gaze.x * 6, gy = S.gaze.y * 4;
      e.g.setAttribute('transform', 'translate(' + (e.x + gx).toFixed(2) + ',' + (e.y + gy + (1 - sy) * 5).toFixed(2) + ') scale(' + o.eyes.toFixed(3) + ',' + (sy * o.eyes).toFixed(3) + ') translate(' + (-e.x) + ',' + (-e.y) + ')');
    }
    var bs = 1 + 0.35 * S.blush;
    el.mejI.setAttribute('opacity', (0.75 + 0.25 * S.blush).toFixed(2)); el.mejD.setAttribute('opacity', (0.75 + 0.25 * S.blush).toFixed(2));
    el.mejI.setAttribute('rx', (15 * bs).toFixed(2)); el.mejD.setAttribute('rx', (15 * bs).toFixed(2));

    // Cuerpo: flotar, squish elástico, salto, balanceo
    if (!REDUCED) {
      var a2 = -S.squish * 60 - S.squishV * 9; S.squishV += a2 * dt; S.squish += S.squishV * dt;
      S.hopV -= 14 * dt; S.hop = Math.max(0, S.hop + S.hopV * dt * 10); if (S.hop === 0 && S.hopV < 0) S.hopV = 0;
      if (S.tiltT > 0) S.tiltT = Math.max(0, S.tiltT - dt);
      var tiltTarget = S.tiltT > 0 ? Math.sin(S.tiltT * 9) * 7 * (S.tiltT / 1.4) : (S.mode === 'sleeping' ? 4 : S.mode === 'thinking' ? -3 : 0);
      S.tilt += (tiltTarget - S.tilt) * Math.min(1, dt * 6);
      var speedF = S.mode === 'sleeping' ? 0.45 : S.mode === 'speaking' ? 1.6 : 1;
      var bob = Math.sin(clock * 1.7 * speedF) * (S.mode === 'sleeping' ? 3 : 6) + (S.mode === 'speaking' ? Math.sin(clock * 9) * 1.2 * mouth.a : 0);
      var sq = Math.max(-0.25, Math.min(0.25, S.squish + (S.mode === 'sleeping' ? 0.02 * Math.sin(clock * 0.8) : 0)));
      var sx = 1 + sq, syb = 1 - sq;
      var danceT = (o.rot ? 'translate(' + CX + ',' + PY + ') rotate(' + o.rot.toFixed(2) + ') translate(' + (-CX) + ',' + (-PY) + ') ' : '') +
        (o.sx !== 1 || o.sy !== 1 ? 'translate(' + CX + ',' + BASE_Y + ') scale(' + o.sx.toFixed(3) + ',' + o.sy.toFixed(3) + ') translate(' + (-CX) + ',' + (-BASE_Y) + ') ' : '');
      el.cuerpo.setAttribute('transform', danceT + 'translate(' + CX + ',' + BASE_Y + ') rotate(' + S.tilt.toFixed(2) + ') scale(' + sx.toFixed(3) + ',' + syb.toFixed(3) + ') translate(' + (-CX) + ',' + (-BASE_Y) + ')');
      el.flota.setAttribute('transform', 'translate(' + o.dx.toFixed(2) + ',' + (bob - S.hop + o.dy).toFixed(2) + ')');
      var sh = 1 - (bob - S.hop + o.dy + 8) / 80; el.sombra.setAttribute('rx', (92 * sh).toFixed(1)); el.sombra.setAttribute('opacity', (0.35 * sh).toFixed(2));
      // Gestos y zzz
      if (S.mode === 'idle' && !D && !DEMO) { S.nextGesture -= dt; if (S.nextGesture <= 0) { gesture(); S.nextGesture = 3.5 + Math.random() * 4.5; } }
      if (S.mode === 'sleeping') { S.nextZ -= dt; if (S.nextZ <= 0) { zzz(); S.nextZ = 1.1 + Math.random() * 0.8; } }
    }
    el.piensa.classList.toggle('on', S.mode === 'thinking');
    el.piensa.setAttribute('opacity', S.mode === 'thinking' ? 1 : 0);
    requestAnimationFrame(frame);
  }

  // ───────────────────────── Labios ─────────────────────────
  var VOWEL = { a: [0.95, 0], 'á': [0.95, 0], e: [0.6, 0], 'é': [0.6, 0], i: [0.42, 0], 'í': [0.42, 0], y: [0.4, 0],
    o: [0.78, 0.9], 'ó': [0.78, 0.9], u: [0.5, 1], 'ú': [0.5, 1], 'ü': [0.5, 1], w: [0.45, 1] };
  function shapeFor(ch) {
    ch = (ch || '').toLowerCase();
    if (VOWEL[ch]) return VOWEL[ch];
    if (/[\s.,;:!?¡¿"'()\-–—…]/.test(ch)) return [0, 0];
    if (/[pbm]/.test(ch)) return [0.03, 0.1];
    return [0.22, 0.15];
  }
  function charAt(text, starts, ends, t) {
    for (var i = 0; i < starts.length; i++) { if (t >= starts[i] - 0.02 && t <= ends[i] + 0.03) return text[i]; if (starts[i] > t) return ''; }
    return '';
  }
  var audioCtx, analyser, buf, mediaSrc;
  function warmGraph() {
    try {
      if (!audioCtx) { audioCtx = window.__daAudioCtx || new (window.AudioContext || window.webkitAudioContext)(); window.__daAudioCtx = audioCtx; analyser = audioCtx.createAnalyser(); analyser.fftSize = 512; buf = new Uint8Array(analyser.fftSize); }
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) {}
  }
  function connect(audio) {
    warmGraph();
    if (!audioCtx || (mediaSrc && mediaSrc._el === audio)) return;
    try { mediaSrc = audioCtx.createMediaElementSource(audio); mediaSrc._el = audio; mediaSrc.connect(analyser); analyser.connect(audioCtx.destination); } catch (_) {}
  }
  function updateMouthTarget() {
    var sp = S.speak;
    if (!sp) { mouth.ta = 0; mouth.tr = 0; return; }
    if (sp.kind === 'audio') {
      var au = sp.audio, t = au.currentTime, energy = 0;
      if (analyser && buf) { analyser.getByteTimeDomainData(buf); var s = 0; for (var i = 0; i < buf.length; i++) { var d = (buf[i] - 128) / 128; s += d * d; } energy = Math.min(1, Math.sqrt(s / buf.length) * 4.2); }
      var shp = [0.5, 0.2];
      if (sp.al && sp.al.chars) shp = shapeFor(charAt(sp.al.chars, sp.al.starts, sp.al.ends, t));
      else if (!analyser) shp = shapeFor(sp.text[Math.floor((t / Math.max(0.5, au.duration || 3)) * sp.text.length)] || '');
      var open = analyser ? Math.min(1, Math.max(0, (energy - 0.03) * 2.4)) * (0.55 + 0.6 * shp[0]) : shp[0];
      mouth.ta = Math.min(1, open); mouth.tr = shp[1];
      caption(sp, sp.al && sp.al.ends ? countUntil(sp.al.ends, t) : Math.floor(sp.text.length * t / Math.max(0.5, au.duration || 3)));
      if (au.ended || au.paused && t > 0.05) endSpeak();
    } else {
      var el2 = (performance.now() - sp.t0) / 1000, p = el2 / sp.dur;
      if (p >= 1) { endSpeak(); return; }
      var idx = Math.floor(p * sp.text.length), sh = shapeFor(sp.text[idx]);
      var wob = 0.85 + 0.15 * Math.sin(el2 * 23);
      mouth.ta = sh[0] * wob; mouth.tr = sh[1];
      caption(sp, idx);
    }
  }
  function countUntil(ends, t) { var n = 0; while (n < ends.length && ends[n] <= t) n++; return n; }
  // Solo texto: ~15 caracteres por segundo, entre 1,2 y 16 s.
  function textDuration(text) { return Math.max(1.2, Math.min(16, String(text || '').length / 15)); }
  window.__nubeTextDuration = textDuration;
  function speakText(text) { S.speak = { kind: 'text', text: String(text || ''), t0: performance.now(), dur: textDuration(text) }; S.mode = 'speaking'; setLive(true); }
  function speakAudio(audio, text, al) { S.speak = { kind: 'audio', audio: audio, text: String(text || ''), al: al || null }; S.mode = 'speaking'; setLive(true); }
  function endSpeak() {
    var sp = S.speak; S.speak = null; setLive(false);
    if (sp) setCaption(sp.text);
    S.mode = 'idle'; S.lastTouch = performance.now();
    if (DADemo) DADemo.setState('listo');
    if ($('status').textContent === T[LANG].speaking) setStatus('');
    if (!REDUCED && Math.random() < 0.5) { kick(0.5); }
  }
  var lastCap = -1;
  function caption(sp, n) {
    if (n === lastCap) return; lastCap = n;
    $('caption').innerHTML = '<span class="sp1">' + esc(sp.text.slice(0, n)) + '</span><span class="sp0">' + esc(sp.text.slice(n)) + '</span>';
  }

  // ───────────────────────── Cerebro ─────────────────────────
  function esc(s) { return String(s || '').replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function setStatus(m, c) { var s = $('status'); s.textContent = m || ''; s.className = 'status' + (c ? ' ' + c : ''); }
  function setLive(on) { $('livedot').classList.toggle('on', on); }
  function setCaption(t) { lastCap = -1; $('caption').innerHTML = '<span class="sp1">' + esc(t) + '</span>'; }
  function notifyParent(payload) { try { if (window.self !== window.top) window.parent.postMessage(Object.assign({ type: 'da-answer' }, payload || {}), '*'); } catch (_) {} }
  function stopAll() {
    if (DADemo) DADemo.stop();
    if (S.speak && S.speak.audio) { try { S.speak.audio.pause(); } catch (_) {} }
    S.speak = null; setLive(false); if (S.mode === 'speaking' || S.mode === 'thinking') S.mode = 'idle';
  }

  var asking = 0;

  // ───────────────────────── /animacion (slash) ─────────────────────────
  // Carlos, 7-oct-2026: /animacion 1|giro … /animacion help. No van al cerebro.
  var DANCE_NUM = { '1': 'giro', '2': 'baile', '3': 'voltereta', '4': 'gelatina', '5': 'lluvia' };
  var DANCE_HELP = {
    es: {
      title: 'Animaciones de Admirito',
      lines: [
        '1 · giro — pirueta de dos vueltas y aterrizaje con squish',
        '2 · baile — de lado a lado al ritmo, con notas ♪',
        '3 · voltereta — mortal hacia atrás con cara feliz',
        '4 · gelatina — tiembla como un flan y saca bracitos disco',
        '5 · lluvia — le llueve encima, se sacude y sale un arcoíris'
      ],
      usage: 'Escribe /animacion <número|nombre>. También /animacion help.',
      playing: '¡Ahí va!',
      unknown: 'No conozco esa animación. Prueba /animacion help.',
      reduced: 'Con «reducir movimiento» las animaciones están apagadas.'
    },
    en: {
      title: "Admirito's animations",
      lines: [
        '1 · giro (spin) — a two-turn pirouette with a squash landing',
        '2 · baile (dance) — side-to-side bounce with ♪ notes',
        '3 · voltereta (flip) — a happy backflip',
        '4 · gelatina (jelly) — disco wobble with little cloud arms',
        '5 · lluvia (rain) — rains on itself, shakes off, then a rainbow'
      ],
      usage: 'Type /animacion <number|name>. Also /animacion help.',
      playing: 'Here goes!',
      unknown: "I don't know that animation. Try /animacion help.",
      reduced: 'With reduce-motion on, the animations stay off.'
    }
  };
  function danceHelpText() {
    var h = DANCE_HELP[LANG] || DANCE_HELP.es;
    return h.title + '\n' + h.lines.join('\n') + '\n' + h.usage;
  }

  // ───────────────────────── Identidad Admirito ─────────────────────────
  function parseIdentityCommand(raw) {
    var t = String(raw || '').trim();
    var m = t.match(/^\/\s*(quien\s+soy|whoami|perfil|profile|aprender|train|olvidar|forget|help|ayuda|avatar\s+help)\s*(.*)$/i);
    if (!m) return null;
    var verb = m[1].toLowerCase().replace(/\s+/g, ' ');
    var arg = String(m[2] || '').trim();
    if (verb === 'quien soy' || verb === 'whoami') return { kind: 'who' };
    if (verb === 'perfil' || verb === 'profile') return { kind: 'profile' };
    if (verb === 'aprender' || verb === 'train') return { kind: 'train', fact: arg };
    if (verb === 'olvidar' || verb === 'forget') return { kind: 'forget', fact: arg };
    if (verb === 'help' || verb === 'ayuda' || verb === 'avatar help') return { kind: 'help' };
    return null;
  }
  function identityHelpText() {
    if (LANG === 'en') {
      return 'Admirito · commands\n'
        + '/quien soy — who I am\n'
        + '/perfil — my profile and trained facts\n'
        + '/animacion help — the 5 dances\n'
        + '/animacion 1|giro … 5|lluvia — play a dance\n'
        + '/aprender <fact> — teach me (needs admin token; see help)\n'
        + '/olvidar <text> — forget a fact (admin)\n'
        + 'Training API: POST /metahuman/train with Bearer ADMIN_TOKEN.';
    }
    return 'Admirito · comandos\n'
      + '/quien soy — quién soy\n'
      + '/perfil — mi perfil y hechos aprendidos\n'
      + '/animacion help — los 5 bailes\n'
      + '/animacion 1|giro … 5|lluvia — lanza un baile\n'
      + '/aprender <hecho> — enseñarme algo (hace falta token de admin)\n'
      + '/olvidar <texto> — olvidar un hecho (admin)\n'
      + 'API: POST https://brain.digitalavatar.ai/metahuman/train con Authorization: Bearer <ADMIN_TOKEN>.';
  }
  function handleIdentityCommand(cmd) {
    if (cmd.kind === 'help') { showHelpReply(identityHelpText()); return; }
    if (cmd.kind === 'who') {
      var who = DACTX.who && DACTX.who();
      showHelpReply(who || (LANG === 'en'
        ? "Hi! I'm Admirito, the green AdmiraNeXT cloud."
        : '¡Hola! Soy Admirito, la nube verde de AdmiraNeXT.'));
      return;
    }
    if (cmd.kind === 'profile') {
      var sum = DACTX.summary && DACTX.summary();
      if (sum) { showHelpReply(sum); return; }
      DACTX.refresh().then(function () { showHelpReply((DACTX.summary && DACTX.summary()) || identityHelpText()); });
      return;
    }
    if (cmd.kind === 'train' || cmd.kind === 'forget') {
      var token = '';
      try { token = String(window.DA_ADMIN_TOKEN || localStorage.getItem('da_admin_token') || '').trim(); } catch (_) {}
      if (!cmd.fact) {
        showHelpReply(LANG === 'en'
          ? 'Usage: /' + (cmd.kind === 'train' ? 'aprender' : 'olvidar') + ' <text>. Needs ADMIN_TOKEN (not available in this page by default).'
          : 'Uso: /' + (cmd.kind === 'train' ? 'aprender' : 'olvidar') + ' <texto>. Hace falta ADMIN_TOKEN (esta página no lo trae por defecto).');
        return;
      }
      if (!token) {
        showHelpReply(LANG === 'en'
          ? 'I can only learn through the admin API:\nPOST /metahuman/train {\"avatar\":\"admirito\",\"fact\":\"…\"}\nAuthorization: Bearer <ADMIN_TOKEN>\n(The token is not embedded in this page on purpose.)'
          : 'Solo puedo aprender por la API de admin:\nPOST /metahuman/train {\"avatar\":\"admirito\",\"fact\":\"…\"}\nAuthorization: Bearer <ADMIN_TOKEN>\n(El token no va en esta página a propósito.)');
        return;
      }
      var path = cmd.kind === 'train' ? '/metahuman/train' : '/metahuman/forget';
      fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ avatar: 'admirito', fact: cmd.fact }) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (d) {
          if (!d || !d.ok) { showHelpReply((LANG === 'en' ? 'Could not save: ' : 'No se pudo guardar: ') + (d && d.error || 'error')); return; }
          DACTX.refresh();
          showHelpReply(LANG === 'en'
            ? (cmd.kind === 'train' ? 'Learned. ' : 'Forgot. ') + (d.facts || []).slice(-3).join(' · ')
            : (cmd.kind === 'train' ? 'Aprendido. ' : 'Olvidado. ') + (d.facts || []).slice(-3).join(' · '));
        })
        .catch(function (e) { showHelpReply(String(e.message || e)); });
    }
  }

  function parseAnimCommand(raw) {
    var t = String(raw || '').trim();
    // /animación, /animaciones, /animation, /animacion; also "/ayuda animacion"
    var m = t.match(/^\/\s*(?:animaci[oó]n(?:es)?|animation)\s*(.*)$/i);
    if (!m) {
      m = t.match(/^\/\s*ayuda\s+animaci[oó]n(?:es)?\s*$/i);
      if (m) return { help: true };
      return null;
    }
    var arg = String(m[1] || '').trim().toLowerCase().replace(/^\/+/, '');
    if (!arg || arg === 'help' || arg === '?' || arg === 'ayuda' || arg === 'list' || arg === 'lista') return { help: true };
    if (DANCE_NUM[arg]) return { name: DANCE_NUM[arg] };
    if (DANCE_ALIAS[arg]) return { name: DANCE_ALIAS[arg] };
    return { unknown: arg };
  }
  function showHelpReply(text) {
    var cap = $('caption');
    cap.classList.add('help');
    setCaption(text);
    setStatus('');
    if (DADemo) DADemo.setState('listo');
  }
  function clearHelpClass() { var cap = $('caption'); if (cap) cap.classList.remove('help'); }

  async function ask(question) {
    touch();
    if (DADemo) DADemo.unlock();
    warmGraph();
    question = String(question || $('q').value || '').trim();
    if (!question) return;
    var idCmd = parseIdentityCommand(question);
    if (idCmd) {
      $('q').value = '';
      clearHelpClass();
      handleIdentityCommand(idCmd);
      return;
    }
    var cmd = parseAnimCommand(question);
    if (cmd) {
      $('q').value = '';
      clearHelpClass();
      var h = DANCE_HELP[LANG] || DANCE_HELP.es;
      if (cmd.help) { showHelpReply(danceHelpText()); return; }
      if (cmd.unknown) { showHelpReply(h.unknown + '\n' + h.usage); return; }
      if (REDUCED) { showHelpReply(h.reduced); return; }
      stopAll(); // corta voz/pensando, pero el baile forzado se lanza despues
      startDance(cmd.name, { forced: true });
      setStatus(h.playing + ' ' + cmd.name);
      setTimeout(function () { if ($('status').textContent.indexOf(cmd.name) >= 0) setStatus(''); }, 1800);
      return;
    }
    stopDance();
    stopAll();
    var mine = ++asking;
    $('q').value = ''; clearHelpClass(); setStatus(T[LANG].thinking); if (DADemo) DADemo.setState('pensando'); $('btnSend').disabled = true; setCaption('…');
    S.mode = 'thinking';
    try {
      var body = Object.assign({ question: question, lang: LANG, voice: !MUTED, timestamps: !MUTED }, MUTED ? {} : { voiceId: DADemo ? DADemo.voiceId(LANG) : '' }, DACTX.body(), $('loc').value ? { loc: $('loc').value } : {});
      var res = await fetch(API + '/metahuman/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var j = await res.json().catch(function () { return {}; });
      if (mine !== asking) return;
      if (!j.ok) { S.mode = 'idle'; setStatus('❌ ' + (j.error || ('HTTP ' + res.status)), 'err'); setCaption(''); if (DADemo) DADemo.setState('listo'); notifyParent({ error: j.error || ('HTTP ' + res.status) }); return; }
      var answer = j.answer || '';
      DACTX.remember(question, answer);
      // /demo de Admirito: termina con un bailecito al acabar de hablar.
      var danceAfter = !!j.dance && !REDUCED;
      if (j.audioBase64 && !MUTED && DADemo) {
        var audio = DADemo.load(j.audioBase64, j.mime);
        connect(audio);
        if (danceAfter) audio.addEventListener('ended', function () { setTimeout(function () { startDance('baile', { forced: true }); }, 250); });
        try {
          await DADemo.start(audio);
          speakAudio(audio, answer, j.alignment); setStatus(T[LANG].speaking);
          notifyParent({ answer: answer, muted: false, spoke: true });
        } catch (err) {
          speakText(answer); setStatus(T[LANG].audioBlocked, 'err');
          notifyParent({ answer: answer, muted: false, spoke: false });
          DADemo.armRetry(function () { DADemo.start(audio).then(function () { speakAudio(audio, answer, j.alignment); setStatus(T[LANG].speaking); }).catch(function () {}); });
        }
      } else {
        // Solo texto (audio=off o sin voz): la boca se mueve el tiempo que dura leerla.
        speakText(answer); setStatus('');
        if (danceAfter) setTimeout(function () { startDance('baile', { forced: true }); }, textDuration(answer) * 1000 + 300);
        notifyParent({ answer: answer, muted: MUTED, spoke: false });
      }
    } catch (e) {
      S.mode = 'idle'; setStatus(T[LANG].net + (e.message || e), 'err'); setCaption(''); if (DADemo) DADemo.setState('listo'); notifyParent({ error: String(e.message || e) });
    } finally { if (mine === asking) $('btnSend').disabled = false; }
  }
  window.__nubeAsk = ask;
  DACTX.demoOnLoad(ask);
  window.__nubeSpeakText = speakText;
  window.__nubeParseAnim = parseAnimCommand;
  window.__nubeDanceHelp = danceHelpText;

  // ───────────────────────── Micro ─────────────────────────
  function micError(code) {
    $('btnMic').classList.remove('live'); var t = T[LANG];
    if (code === 'unsupported') setStatus(t.micNo, 'err');
    else if (code === 'not-allowed' || code === 'service-not-allowed') setStatus(t.micDenied, 'err');
    else if (code === 'no-speech') setStatus(t.micEmpty, 'warn');
    else setStatus(t.micFail, 'err');
  }
  function toggleListen() {
    touch(); stopDance();
    if (!DADemo) return;
    if (DADemo.state() === 'escuchando') { DADemo.cancelListen(); $('btnMic').classList.remove('live'); setStatus(''); return; }
    stopAll();
    var ok = DADemo.listen({ lang: LANG,
      onPartial: function (text) { $('q').value = text; setStatus(T[LANG].listening); },
      onFinal: function (text) { $('btnMic').classList.remove('live'); ask(text); },
      onError: micError });
    if (ok) { $('btnMic').classList.add('live'); setStatus(T[LANG].listening); }
  }

  // ───────────────────────── Idioma y chips ─────────────────────────
  function applyLang(l) {
    LANG = l === 'en' ? 'en' : 'es'; var t = T[LANG];
    try { localStorage.setItem('da_lang', LANG); } catch (_) {}
    document.documentElement.lang = t.lang;
    $('tag').textContent = t.tag; $('q').placeholder = t.placeholder; el.svg.setAttribute('aria-label', t.aria);
    var lt = $('langToggle'); if (lt) lt.textContent = LANG === 'es' ? 'EN' : 'ES';
    if (DACTX.get().lang !== LANG) DACTX.set({ lang: LANG });
    renderChips();
  }
  function renderChips() {
    var list = DACTX.chips(T[LANG].chips);
    $('chips').innerHTML = list.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('');
    Array.prototype.forEach.call($('chips').children, function (node, i) { node.onclick = function () { $('q').value = list[i]; ask(); }; });
  }
  DACTX.on(function (kind) { if (kind === 'lang') applyLang(DACTX.get().lang); else renderChips(); });
  function loadLocations() {
    fetch(API + '/locations', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var list = (d && d.locations) || [], sel = $('loc'); sel.innerHTML = '<option value="">' + T[LANG].loc + '</option>';
      list.forEach(function (l) { var o = document.createElement('option'); o.value = l.id; o.textContent = (l.name || l.id) + (l.addr ? ' · ' + l.addr : ''); sel.appendChild(o); });
      if (DACTX.get().loc) sel.value = DACTX.get().loc;
    }).catch(function () {});
  }

  // ───────────────────────── Interacción ─────────────────────────
  function pointerAt(ev) {
    var r = el.svg.getBoundingClientRect(); if (!r.width) return;
    var cx = r.left + r.width * 0.5, cy = r.top + r.height * 0.45;
    S.pointer = { x: Math.max(-1, Math.min(1, (ev.clientX - cx) / (r.width * 0.6))), y: Math.max(-1, Math.min(1, (ev.clientY - cy) / (r.height * 0.6))), t: performance.now() };
  }
  document.addEventListener('pointermove', function (ev) { pointerAt(ev); touch(); }, { passive: true });
  document.addEventListener('keydown', touch, { passive: true });
  el.svg.addEventListener('pointerenter', function () { touch(); S.blushT = 1.2; });
  function pet() {
    touch(); stopDance(); S.happy = 0.9; S.blushT = 1.6; kick(1.1); S.hopV = 2.2; if (!REDUCED) { heart(); sparkle(1); }
  }
  el.svg.addEventListener('click', function () {
    pet();
    // En la pantalla del gemelo el toque se reenvía (abre su panel), como en best.html.
    if (EMBED) { try { window.parent.postMessage({ type: 'da-tap' }, '*'); } catch (_) {} return; }
    if (KIOSK) toggleListen();
  });
  el.svg.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pet(); } });

  window.addEventListener('message', function (ev) {
    var d = ev && ev.data; if (!d || typeof d !== 'object') return;
    if (d.type === 'da-ask') { touch(); if (d.lang && d.lang !== LANG) applyLang(d.lang); var q = String(d.question || '').trim(); if (q) ask(q); }
    else if (d.type === 'da-lang' && d.lang) applyLang(d.lang);
    else if (d.type === 'da-audio') { MUTED = d.on === false || d.on === 'off'; if (MUTED && S.speak && S.speak.audio) { var tx = S.speak.text; stopAll(); speakText(tx); } }
    else if (d.type === 'da-context') touch();
  });

  $('btnSend').onclick = function () { ask(); };
  $('btnMic').onclick = toggleListen;
  $('btnStop').onclick = function () { stopAll(); setStatus(T[LANG].cut); setCaption(''); };
  $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(); });
  $('q').addEventListener('focus', touch);
  $('langToggle').onclick = function () { applyLang(LANG === 'es' ? 'en' : 'es'); stopAll(); };

  drawMouth();
  applyLang(LANG);
  DACTX.init({ tier: 'good', avatar: 'admirito', lang: LANG });
  if (!DOCK && !KIOSK && !EMBED) loadLocations();
  requestAnimationFrame(frame);
})();
