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
    if (PIEL && PIEL.identidad) { var propia = PIEL.identidad(cmd.kind); if (propia) { showHelpReply(propia); return; } }
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
    question = String(question || $('q').value || '').trim();
    if (!question) return;
    var demoControl = DACTX.demoCommand && DACTX.demoCommand(question);
    if (demoControl) {
      var controlMine = ++asking;
      stopDance(); stopAll(); $('q').value = ''; clearHelpClass();
      setStatus(LANG === 'en' ? 'Waiting for host confirmation…' : 'Esperando confirmación del anfitrión…');
      setCaption(''); $('btnSend').disabled = false;
      var controlResult = await demoControl;
      if (controlMine !== asking) return;
      setStatus(controlResult.ok ? '' : (LANG === 'en' ? 'Demo not confirmed' : 'Demo no confirmada'), controlResult.ok ? '' : 'err');
      setCaption(controlResult.message); if (DADemo) DADemo.setState('listo');
      return;
    }
    if (DADemo) DADemo.unlock();
    warmGraph();
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
    if (PIEL && PIEL.ask) { PIEL.ask(question); return; }   // una piel con papel propio no pregunta al cerebro
    stopDance();
    stopAll();
    // /demo <solución>: presenta la solución y luego la página abre su demo (da-context.js).
    if (DACTX.demoAsk) question = DACTX.demoAsk(question);
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
      if (DACTX.action) DACTX.action(j.action);
      DACTX.remember(question, answer);
      if (DACTX.demoDone) DACTX.demoDone(answer);
      // /demo de Admirito: termina con un bailecito al acabar de hablar.
      var danceAfter = !!j.dance && !REDUCED;
      if (j.audioBase64 && !MUTED && DADemo) {
        var audio = DADemo.load(j.audioBase64, j.mime);
        connect(audio);
        if (danceAfter) audio.addEventListener('ended', function () { setTimeout(function () { startDance('baile', { forced: true }); }, 250); });
        try {
          await DADemo.start(audio);
          speakAudio(audio, answer, j.alignment); setStatus(T[LANG].speaking);
          notifyParent({ answer: answer, action: j.action, muted: false, spoke: true });
        } catch (err) {
          speakText(answer); setStatus(T[LANG].audioBlocked, 'err');
          notifyParent({ answer: answer, action: j.action, muted: false, spoke: false });
          DADemo.armRetry(function () { DADemo.start(audio).then(function () { speakAudio(audio, answer, j.alignment); setStatus(T[LANG].speaking); }).catch(function () {}); });
        }
      } else {
        // Solo texto (audio=off o sin voz): la boca se mueve el tiempo que dura leerla.
        speakText(answer); setStatus('');
        if (danceAfter) setTimeout(function () { startDance('baile', { forced: true }); }, textDuration(answer) * 1000 + 300);
        notifyParent({ answer: answer, action: j.action, muted: MUTED, spoke: false });
      }
    } catch (e) {
      if (mine !== asking) return;
      S.mode = 'idle'; setStatus(T[LANG].net + (e.message || e), 'err'); setCaption(''); if (DADemo) DADemo.setState('listo'); notifyParent({ error: String(e.message || e) });
    } finally { if (mine === asking) $('btnSend').disabled = false; }
  }
  window.__nubeAsk = ask;
  DACTX.demoOnLoad(ask);
  window.__nubeSpeakText = speakText;
  // Pase de presentación (Carlos, 27-oct-2026): la voz con audio real del Comercial (brain /tts + lip-sync) vale para
  // cualquier piel; da-remote.js la usa para que cada asistente diga a qué se dedica, y pregunta si sigue hablando.
  window.__nubeDecir = comDecir;
  window.__nubeHablando = function () { return S.mode === 'speaking'; };
  window.__nubeParseAnim = parseAnimCommand;
  window.__nubeDanceHelp = danceHelpText;

