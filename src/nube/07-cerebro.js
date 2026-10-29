  // ───────────────────────── Cerebro ─────────────────────────
  function esc(s) { return String(s || '').replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function setStatus(m, c) { var s = $('status'); s.textContent = m || ''; s.className = 'status' + (c ? ' ' + c : ''); }
  function setLive(on) { $('livedot').classList.toggle('on', on); }
  function setCaption(t) { lastCap = -1; $('caption').innerHTML = '<span class="sp1">' + esc(t) + '</span>'; $('caption').scrollTop = 0; bubble(); }
  // da-answer al anfitrión; con action (order-draft del modo pedido) va solo a su origen exacto (da-context.js).
  function notifyParent(payload) { if (DACTX.notify) { DACTX.notify(payload); return; } try { if (window.self !== window.top) window.parent.postMessage(Object.assign({ type: 'da-answer' }, payload || {}), '*'); } catch (_) {} }
  function stopAll() {
    if (DADemo) DADemo.stop();
    if (S.speak && S.speak.audio) { try { S.speak.audio.pause(); } catch (_) {} }
    S.speak = null; setLive(false); if (S.mode === 'speaking' || S.mode === 'thinking') S.mode = 'idle';
  }

  var asking = 0;

