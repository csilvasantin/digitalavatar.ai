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
      blink: +S.blink.toFixed(2), gaze: [+S.gaze.x.toFixed(2), +S.gaze.y.toFixed(2)], reduced: REDUCED, lang: LANG, tier: DACTX.tier(), muted: MUTED,
      personaje: PERSONAJE, piel: PIEL && PIEL.estado ? PIEL.estado() : '' };
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

