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
    else if (PIEL && PIEL.mensaje && d.type === 'da-' + PERSONAJE) {
      // Mensajes de la piel ({type:'da-<id>'}): sólo el anfitrión que me incrusta, desde un origen de la red.
      if (ev.source !== window.parent || !(DACTX.allowed && DACTX.allowed(ev.origin))) return;
      if (d.lang && d.lang !== LANG) applyLang(d.lang);
      PIEL.mensaje(d);
    }
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
