  // ───────────────────────── Piel COMERCIAL ─────────────────────────
  // Carlos, 20-oct-2026: «que Comercial escuche el brief por el micro y responda con la voz de Admirito, como el
  // Arquitecto». Comercial es Admirito con corbata y maletín: el asistente de campañas y captación de comercios de la
  // portada de admira.biz. Mismo cuerpo, misma vida y mismo lip-sync. No pregunta al cerebro: lo que se le dice (texto o
  // micro) va al anfitrión (da-comercial-texto), que lo interpreta como brief; y el anfitrión le cuenta en qué está
  // (da-comercial {estado: reposo|escuchando|apuntando|proponiendo|entregando|dudando, texto, silencio}).
  var COM_ESTADOS = ['reposo', 'escuchando', 'apuntando', 'proponiendo', 'entregando', 'dudando'];
  var COM_FRASES = {
    es: {
      reposo: ['¿Vendemos una campaña o captamos un comercio?', 'Corbata puesta y maletín listo. Tú dirás.', 'Cuéntame la campaña y te preparo la propuesta.'],
      escuchando: ['Te escucho: anunciante, objetivo, a quién llegar y presupuesto.', 'Adelante, lo apunto todo.', 'Dime la campaña como se la contarías a un cliente.'],
      apuntando: ['Apuntado.', 'Lo tengo.', 'Anotado en el brief.'],
      proponiendo: ['Preparo la propuesta…', 'Cifras, ubicaciones y avisos: un momento.', 'Hago números.'],
      entregando: ['Propuesta lista: en PDF con marca o por correo.', 'Aquí la tienes: revísala y la enviamos.', 'Lista para el anunciante.'],
      dudando: ['Me falta un dato para seguir.', 'Así no me sale: cuéntamelo de otra forma.', 'Mmm… ¿me lo repites?'],
      pedido: 'Apuntado.', sinAnfitrion: 'Para preparar campañas necesito la portada de admira.biz: ábreme allí (Comercial).',
      quien: '¡Hola! Soy Comercial: Admirito con corbata y maletín. Vendo campañas a anunciantes y capto comercios y pantallas para la red.',
      ayuda: 'Comercial\nVender campañas: cuéntame anunciante, objetivo, audiencia, fechas y presupuesto; elige ubicaciones y te preparo la propuesta en PDF o por correo.\nCaptar comercios: nombre, ciudad, dirección y pantallas; te hago la ficha.'
    },
    en: {
      reposo: ['Shall we sell a campaign or recruit a merchant?', 'Tie on, briefcase ready. Over to you.', 'Tell me the campaign and I will prepare the proposal.'],
      escuchando: ['I\'m listening: advertiser, objective, who to reach and budget.', 'Go ahead, I\'m taking notes.', 'Tell me the campaign as you would tell a client.'],
      apuntando: ['Noted.', 'Got it.', 'Written in the brief.'],
      proponiendo: ['Preparing the proposal…', 'Figures, locations and caveats: one moment.', 'Crunching numbers.'],
      entregando: ['Proposal ready: as a branded PDF or by email.', 'Here it is: review it and we send it.', 'Ready for the advertiser.'],
      dudando: ['I am missing something to go on.', 'That did not come through: tell me another way.', 'Hmm… could you repeat that?'],
      pedido: 'Noted.', sinAnfitrion: 'To prepare campaigns I need the admira.biz home page: open me there (Commercial).',
      quien: 'Hi! I am Commercial: Admirito with a tie and briefcase. I sell campaigns to advertisers and recruit merchants and screens for the network.',
      ayuda: 'Commercial\nSell campaigns: tell me advertiser, objective, audience, dates and budget; choose locations and I prepare the proposal as PDF or email.\nRecruit merchants: name, city, address and screens; I prepare the brief.'
    }
  };
  var COM = PERSONAJE === 'comercial' ? { estado: 'reposo', t: 0, clock: 0, efectoT: 0 } : null;
  function comF() { return COM_FRASES[LANG] || COM_FRASES.es; }
  function comPick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function comNorm(t) { return String(t || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function comFrase(estado) { var v = comF()[estado]; return Array.isArray(v) ? comPick(v) : (typeof v === 'string' ? v : ''); }
  // La voz de Admirito con audio de verdad (Carlos, 20-oct-2026): el texto que manda el anfitrión se sintetiza con la
  // misma voz de las demos (ElevenLabs, es/en) por el cerebro, POST brain.digitalavatar.ai/tts, que ya atiende a esta
  // nube sin credencial y devuelve el audio con las marcas de tiempo para el lip-sync. Sin audio (sin red, audio=off,
  // bloqueado por el navegador), bocadillo y lip-sync de texto como hasta ahora. Las frases se repiten mucho: se
  // guardan en memoria para no pedirlas dos veces. Nunca se manda el brief: sólo lo que dice Comercial.
  var comCache = {}, comPidiendo = 0;
  function comAudio(texto) {
    var clave = LANG + '|' + texto;
    if (comCache[clave]) return Promise.resolve(comCache[clave]);
    return fetch(API + '/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: texto, lang: LANG, voiceId: DADemo.voiceId(LANG), timestamps: true }) })
      .then(function (r) { if (!r.ok) throw new Error('tts ' + r.status); return r.json(); })
      .then(function (j) { if (!j || !j.audioBase64) throw new Error('tts sin audio'); comCache[clave] = j; return j; });
  }
  function comDecir(texto) {
    if (!texto) return;
    stopAll(); clearHelpClass(); setStatus('');
    if (MUTED || !DADemo || typeof fetch !== 'function') { speakText(texto); return; }
    var mio = ++comPidiendo;
    // El texto se ve ya en el bocadillo, pero la boca espera al audio (Carlos, 27-oct-2026: «en ocasiones aún no está
    // hablando y la boca ya se mueve»). Solo si el audio no llega, lip-sync de texto.
    setCaption(texto);
    comAudio(texto).then(function (j) {
      if (mio !== comPidiendo) return;
      var audio = DADemo.load(j.audioBase64, j.mime || 'audio/mpeg'); connect(audio);
      return DADemo.start(audio).then(function () { if (mio === comPidiendo) speakAudio(audio, texto, j.alignment || null); })
        .catch(function () { DADemo.armRetry(function () { DADemo.start(audio).then(function () { speakAudio(audio, texto, j.alignment || null); }).catch(function () {}); }); });
    }).catch(function () { if (mio === comPidiendo) speakText(texto); /* sin audio: lip-sync de texto */ });
  }
  // Lo que se le dice va al anfitrión tal cual: él sabe de briefs; aquí sólo se contesta «¿quién eres?».
  function comAsk(question) {
    $('q').value = ''; clearHelpClass();
    var q = String(question || '').trim(); if (!q) return;
    if (/^(¿\s*)?(quien eres|quien sois|who are you)\b/.test(comNorm(q))) { comDecir(comF().quien); return; }
    var host = DACTX.hostOrigin ? DACTX.hostOrigin() : '';
    if (window.self === window.top || !host) { comDecir(comF().sinAnfitrion); return; }
    try { window.parent.postMessage({ type: 'da-comercial-texto', texto: q.slice(0, 2000), lang: LANG }, host); } catch (_) { comDecir(comF().sinAnfitrion); return; }
    comEstado('apuntando', { texto: comF().pedido });
  }
  function comEstado(estado, opt) {
    if (!COM) return false;
    opt = opt || {};
    if (COM_ESTADOS.indexOf(estado) < 0) return false;
    COM.estado = estado; COM.t = 0; COM.efectoT = 0; touch();
    var texto = typeof opt.texto === 'string' && opt.texto.trim() ? opt.texto.trim().slice(0, 240) : comFrase(estado);
    if (!opt.silencio) comDecir(texto);
    if (REDUCED) return true;
    if (estado === 'entregando') { S.happy = 2.2; kick(0.9); S.hopV = 2.4; sparkle(2); }
    else if (estado === 'escuchando') S.tiltT = 1.4;
    else if (estado === 'dudando') { S.tiltT = 1.4; drop(); }
    else if (estado === 'apuntando' || estado === 'proponiendo') kick(0.4);
    return true;
  }
  // El maletín se balancea (más al entregar) y la corbata se mueve al hacer números.
  // Los tres rasgos (Carlos, 20-oct-2026): la corbata se levanta al proponer y da un respingo al entregar; el maletín se
  // abre al entregar y asoma la propuesta; la tarjeta de visita se ofrece al escuchar. Todo con suavizado (lerp) para
  // que abrir, cerrar y ofrecer no sean un salto.
  function comFrame(dt) {
    if (!COM) return;
    COM.t += dt; COM.clock += dt;
    var k = Math.min(1, dt * 5), e = COM.estado;
    COM.abierto += ((e === 'entregando' ? 1 : 0) - COM.abierto) * k;
    COM.ofrece += ((e === 'escuchando' ? 1 : 0) - COM.ofrece) * k;
    if (el.comMaletin) {
      var b = e === 'entregando' ? Math.sin(COM.clock * 6) * 2.5 : Math.sin(COM.clock * 1.3) * 2;
      el.comMaletin.setAttribute('transform', 'rotate(' + b.toFixed(2) + ' 256 191)');
      if (el.comMaletinTapa) el.comMaletinTapa.setAttribute('transform', 'rotate(' + (-105 * COM.abierto).toFixed(2) + ' 225 193)');
      if (el.comMaletinPapel) { el.comMaletinPapel.setAttribute('transform', 'translate(0 ' + (-26 * COM.abierto).toFixed(2) + ')'); el.comMaletinPapel.setAttribute('opacity', COM.abierto.toFixed(2)); }
    }
    if (el.comCorbata) {
      var c = e === 'proponiendo' ? Math.sin(COM.clock * 4) * 3 : 0;
      if (e === 'entregando' && COM.t < 0.6) c -= Math.sin(COM.t / 0.6 * Math.PI) * 28;   // respingo
      el.comCorbata.setAttribute('transform', 'rotate(' + c.toFixed(2) + ' 138 178)');
    }
    if (el.comTarjeta) {
      var o = COM.ofrece, bob = Math.sin(COM.clock * 1.6) * 1.5;
      el.comTarjeta.setAttribute('transform', 'translate(' + (18 * o).toFixed(2) + ' ' + (-16 * o + bob).toFixed(2) + ') rotate(' + (-10 * o).toFixed(2) + ' 20 198) scale(' + (1 + 0.12 * o).toFixed(3) + ')');
      el.comTarjeta.setAttribute('transform-origin', '20 198');
    }
  }
  function comMouth() {
    var e = COM.estado;
    if (e === 'proponiendo') { mouth.ta = 0.14; mouth.tr = 0.95; }
    else if (e === 'dudando') { mouth.ta = 0.22; mouth.tr = 1; }
  }
  window.__comercial = { estado: comEstado, frase: comFrase, ask: function (q) { if (COM) comAsk(q); } };
  if (COM) { el.comMaletin = $('comMaletin'); el.comMaletinTapa = $('comMaletinTapa'); el.comMaletinPapel = $('comMaletinPapel'); el.comCorbata = $('comCorbata'); el.comTarjeta = $('comTarjeta'); COM.abierto = 0; COM.ofrece = 0; S.sleepAfter = Math.min(S.sleepAfter, 60000); }
  if (COM) Object.assign(PIELES.comercial, {
    frame: comFrame, mouth: comMouth, ask: comAsk,
    droop: function () { return COM.estado === 'proponiendo' ? 0.18 : 0; },
    gaze: function () { var e = COM.estado; return e === 'escuchando' ? [0.35, -0.15] : e === 'proponiendo' ? [0.8, 0.7] : e === 'dudando' ? [-0.2, -0.6] : null; },
    estado: function () { return COM.estado; },
    identidad: function (kind) { return kind === 'help' ? comF().ayuda : (kind === 'who' || kind === 'profile') ? comF().quien : ''; },
    titulo: function (l) { return l === 'en' ? 'DigitalAvatar.ai — Commercial (Admirito with a tie and briefcase)' : 'DigitalAvatar.ai — Comercial (Admirito con corbata y maletín)'; },
    mensaje: function (d) { comEstado(String(d.estado || ''), { texto: d.texto, silencio: d.silencio === true }); }
  });
  // Embebido en la portada de admira.biz: avisa al anfitrión de que ya escucha.
  if (COM && window.self !== window.top) { try { var hostC = DACTX.hostOrigin ? DACTX.hostOrigin() : ''; if (hostC) window.parent.postMessage({ type: 'da-comercial-listo' }, hostC); } catch (_) {} }

