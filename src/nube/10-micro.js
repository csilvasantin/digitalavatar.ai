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

