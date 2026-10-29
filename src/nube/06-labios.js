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
  // Bocadillo (7-oct-2026): oculto si no hay texto; sigue la palabra que se dice si el texto es largo.
  function bubble() { var c = $('caption'); if (!c) return; c.classList.toggle('vacio', !String(c.textContent || '').trim()); var a = c.querySelector('.sp0'); if (a && c.scrollHeight > c.clientHeight) c.scrollTop = Math.max(0, a.offsetTop - c.clientHeight * 0.5); }
  function caption(sp, n) {
    if (n === lastCap) return; lastCap = n;
    $('caption').innerHTML = '<span class="sp1">' + esc(sp.text.slice(0, n)) + '</span><span class="sp0">' + esc(sp.text.slice(n)) + '</span>';
    bubble();
  }

