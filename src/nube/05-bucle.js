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
    if (PIEL && PIEL.mouth && !S.speak) PIEL.mouth(dt);
    var k = 1 - Math.exp(-dt * 26);
    mouth.a += (mouth.ta - mouth.a) * k; mouth.r += (mouth.tr - mouth.r) * k;
    drawMouth();

    // Parpadeo y guiño
    S.nextBlink -= dt;
    if (S.blink > 0) { S.blink -= dt; }
    else if (S.nextBlink <= 0 && S.mode !== 'sleeping') { S.blink = 0.16; S.nextBlink = 2.2 + Math.random() * 3.8; if (Math.random() < 0.15) S.nextBlink = 0.25; }
    var bl = S.blink > 0 ? Math.sin((1 - S.blink / 0.16) * Math.PI) : 0;
    var wk = 0; if (S.wink >= 0) { S.wink += dt; wk = S.wink < 0.5 ? Math.sin(Math.min(1, S.wink / 0.5) * Math.PI) : 0; if (S.wink > 0.5) S.wink = -1; }
    var sleepy = S.mode === 'sleeping' ? 1 : (PIEL && PIEL.droop ? PIEL.droop() : 0);
    S.sleepEyes += (sleepy - S.sleepEyes) * Math.min(1, dt * 2.5);

    // Mirada: puntero > deriva al azar; pensando mira arriba; dormida, abajo
    S.gaze.next -= dt;
    if (S.pointer && now - S.pointer.t < 2500) { S.gaze.tx = S.pointer.x; S.gaze.ty = S.pointer.y; }
    else if (S.mode === 'thinking') { S.gaze.tx = 0.6; S.gaze.ty = -0.8; }
    else if (S.mode === 'speaking') { if (S.gaze.next <= 0) { S.gaze.tx = (Math.random() - 0.5) * 0.4; S.gaze.ty = (Math.random() - 0.5) * 0.2; S.gaze.next = 1 + Math.random() * 1.5; } }
    else if (S.gaze.next <= 0) { var c = Math.random(); S.gaze.tx = c < 0.4 ? 0 : (Math.random() - 0.5) * 1.8; S.gaze.ty = c < 0.4 ? 0 : (Math.random() - 0.5) * 1.0; S.gaze.next = 0.9 + Math.random() * 2.6; }
    if (S.mode === 'sleeping') { S.gaze.tx = 0; S.gaze.ty = 0.4; }
    if (o.gaze) { S.gaze.tx = o.gaze[0]; S.gaze.ty = o.gaze[1]; }
    else if (PIEL && PIEL.gaze && S.mode !== 'sleeping' && !(S.pointer && now - S.pointer.t < 2500)) { var pg = PIEL.gaze(); if (pg) { S.gaze.tx = pg[0]; S.gaze.ty = pg[1]; } }
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
    if (PIEL && PIEL.frame) PIEL.frame(dt);
    requestAnimationFrame(frame);
  }

