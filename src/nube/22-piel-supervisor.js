  // ───────────────────────── Piel SUPERVISOR ─────────────────────────
  // Carlos, 18-oct-2026: Admirito, Bugito y Supervisor son las tres mascotas del ⌘ Experto, y el Supervisor (la Insta360
  // del MacMini que mira el MBP16 del laboratorio) era la única sin cara. Mismo cuerpo, misma vida y mismo lip-sync;
  // aquí sólo lo suyo: estados, frases, la ceja, el objetivo (diafragma, anillo de enfoque, piloto REC) y efectos
  // (fogonazo al capturar, pulsos de alerta, estática sin señal). No sabe lo que ve la cámara: se lo cuenta el anfitrión.
  var SUP_ESTADOS = ['vigilando', 'enfocando', 'alerta', 'conforme', 'dudando', 'ciego', 'sin-senal'];
  // El anfitrión puede mandar tal cual el estado del tablero (leerTablero) o del veredicto (veredicto) de supervisor-core.
  var SUP_ALIAS = { encendida: 'vigilando', apagada: 'alerta', 'sin-dato': 'ciego', esperando: 'enfocando', 'esperando-senal': 'sin-senal',
    'sin-nueva': 'dudando', 'no-visto': 'dudando' };
  var SUP_ORDENES = ['estado', 'camara'];
  var SUP_FRASES = {
    es: {
      vigilando: ['Ojo avizor.', 'Aquí estoy, mirando el MBP16.', 'Si esa pantalla falla, lo apunto.'],
      enfocando: ['A ver… enfoco.', 'Enfocando la pantalla del MBP16…', 'Un momento: la cámara mira cada 5 segundos.'],
      alerta: { conTicket: ['¡Lo he visto! Incidencia {t} abierta.', '¡Te pillé! Queda apuntado en la incidencia {t}.'], sinTicket: ['¡Lo he visto!', '¡Alto ahí! Esa pantalla no está bien.'] },
      conforme: ['Veo la pantalla encendida otra vez.', 'La pantalla vuelve a lucir.'],
      sigueAbierta: ' {t} sigue abierta hasta que alguien la revise.',
      dudando: ['Mmm… yo eso no lo he visto.', 'En dos minutos no he visto el cambio.', 'No me consta: no lo he visto.'],
      ciego: ['No veo bien: hay alguien delante o poca luz.', 'Apartaos un poco, que no veo la pantalla.'],
      'sin-senal': ['Sin señal: ahora mismo no estoy mirando.', 'Mi tablero no publica… no puedo decir qué pasa.'],
      pedidoEstado: 'A ver qué veo…', pedidoCamara: 'Abro la cámara con sus controles.',
      sinAnfitrion: 'Desde aquí no veo nada: ábreme en el ⌘ Experto (/supervisor estado) o en el banco de admira.biz/bugito.html.',
      charla: ['Yo sólo miro: pregúntame «¿qué ves?» o pídeme «abre la cámara».', 'Para charlar está Admirito; yo vigilo la pantalla.', 'Shhh… estoy de guardia. ¿Te digo qué veo?'],
      quien: '¡Hola! Soy el Supervisor: Admirito con gorra de vigilante y un ojo de cámara. Desde la Insta360 del MacMini miro la pantalla del MBP16 del laboratorio y, si falla, abro la incidencia en admira.app/supervisor.',
      ayuda: 'Supervisor · órdenes\n¿Qué ves? · ¿Hay incidencias? — mi parte (como /supervisor estado)\nAbre la cámara — la Insta360 con sus controles (como /supervisor)\n/quien soy — quién soy\n/animacion help — mis bailes (los de Admirito)\nMi tablero: admira.app/supervisor'
    },
    en: {
      vigilando: ['Eyes peeled.', 'Here I am, watching the MBP16.', 'If that screen fails, I write it down.'],
      enfocando: ['Let me see… focusing.', 'Focusing on the MBP16 screen…', 'One moment: the camera looks every 5 seconds.'],
      alerta: { conTicket: ['I saw it! Incident {t} opened.', 'Gotcha! It is logged in incident {t}.'], sinTicket: ['I saw it!', 'Hold it! That screen is not right.'] },
      conforme: ['I see the screen on again.', 'The screen is lit again.'],
      sigueAbierta: ' {t} stays open until someone reviews it.',
      dudando: ['Hmm… I did not see that.', 'I have not seen the change in two minutes.', 'Not on my record: I did not see it.'],
      ciego: ['I can\'t see well: someone in front or low light.', 'Step aside a little, I can\'t see the screen.'],
      'sin-senal': ['No signal: I am not watching right now.', 'My board is not publishing… I can\'t tell what is going on.'],
      pedidoEstado: 'Let me see…', pedidoCamara: 'Opening the camera with its controls.',
      sinAnfitrion: 'I can\'t see anything from here: open me in the ⌘ Expert (/supervisor status) or on the admira.biz/bugito.html bench.',
      charla: ['I only watch: ask me “what do you see?” or “open the camera”.', 'Admirito is the chatty one; I keep an eye on the screen.', 'Shhh… I\'m on duty. Shall I tell you what I see?'],
      quien: 'Hi! I\'m the Supervisor: Admirito with a security cap and a camera eye. From the Mac mini Insta360 I watch the lab MBP16 screen and, if it fails, I open the incident at admira.app/supervisor.',
      ayuda: 'Supervisor · commands\nWhat do you see? · Any incidents? — my report (like /supervisor status)\nOpen the camera — the Insta360 with its controls (like /supervisor)\n/quien soy — who I am\n/animacion help — my dances (Admirito\'s)\nMy board: admira.app/supervisor'
    }
  };
  var SUP = PERSONAJE === 'supervisor' ? { estado: 'vigilando', t: 0, clock: 0, ceja: 0, alto: 0, iris: 5.8, giro: 0, efectoT: 0, pintado: '' } : null;
  var SUP_TICKET = /^INC-[A-Z0-9]{3,16}$/;
  function supF() { return SUP_FRASES[LANG] || SUP_FRASES.es; }
  function supPick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function supNorm(t) { return String(t || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  // Estado del anfitrión → estado de la piel: el suyo, o el del tablero/veredicto («visto» depende de lo esperado).
  function supEstadoDe(estado, espera) {
    var e = String(estado || '');
    if (SUP_ESTADOS.indexOf(e) >= 0) return e;
    if (e === 'visto') return espera === 'encendida' ? 'conforme' : 'alerta';
    return Object.prototype.hasOwnProperty.call(SUP_ALIAS, e) ? SUP_ALIAS[e] : '';
  }
  // Frase del estado ({t} = incidencia de Yokup, si la hay; sin ella, la alerta no presume de haber abierto nada).
  function supFrase(estado, ticket) {
    var f = supF(), tk = SUP_TICKET.test(String(ticket || '')) ? String(ticket) : '';
    if (estado === 'alerta') return tk ? supPick(f.alerta.conTicket).replace('{t}', tk) : supPick(f.alerta.sinTicket);
    var list = f[estado];
    if (!Array.isArray(list)) return '';
    return supPick(list) + (estado === 'conforme' && tk ? f.sigueAbierta.replace('{t}', tk) : '');
  }
  // Texto del visitante → orden para el anfitrión (las mismas que el verbo /supervisor), o null si es charla.
  function supervisorOrden(text) {
    var n = supNorm(text), slash = /^\/\s*supervis/.test(n), t = n.replace(/^\/\s*(supervisor|supervisa)\b\s*/, '');
    if (!t) return slash ? 'camara' : null;
    if (/^(estado|status|parte|report)\b|que ves|what do you see|what can you see|que pasa|como esta|incidenc|incident|tablero|board|pantalla|screen/.test(t)) return 'estado';
    if (/camara|camera|insta ?360|controles|controls|en vivo|\blive\b|^abre|^open/.test(t)) return 'camara';
    return null;
  }
  function supDecir(texto) { if (!texto) return; stopAll(); clearHelpClass(); speakText(texto); setStatus(''); }
  function supAsk(question) {
    $('q').value = ''; clearHelpClass();
    var q = String(question || '').trim(); if (!q) return;
    if (/^(¿\s*)?(quien eres|quien sois|who are you)\b/.test(supNorm(q))) { supDecir(supF().quien); return; }
    var orden = supervisorOrden(q);
    if (!orden) { supDecir(supPick(supF().charla)); return; }
    var host = DACTX.hostOrigin ? DACTX.hostOrigin() : '';
    if (window.self === window.top || !host) { supDecir(supF().sinAnfitrion); return; }
    try { window.parent.postMessage({ type: 'da-supervisor-orden', orden: orden, texto: q.slice(0, 500), lang: LANG }, host); } catch (_) { supDecir(supF().sinAnfitrion); return; }
    if (orden === 'estado') supEstado('enfocando', { texto: supF().pedidoEstado });
    else supDecir(supF().pedidoCamara);
  }
  // Estado que manda el anfitrión (o el propio Supervisor): entra con su gesto y dice su frase con lip-sync.
  function supEstado(estado, opt) {
    if (!SUP) return false;
    opt = opt || {};
    estado = supEstadoDe(estado, opt.espera);
    if (!estado) return false;
    SUP.estado = estado; SUP.t = 0; SUP.efectoT = 0; touch();
    var texto = typeof opt.texto === 'string' && opt.texto.trim() ? opt.texto.trim().slice(0, 240) : supFrase(estado, opt.ticket);
    if (!opt.silencio) supDecir(texto);
    if (REDUCED) return true;
    if (estado === 'alerta') { kick(1.1); S.hopV = 3; supFlash(); supMarca('!', '#ff5b5b'); }
    else if (estado === 'conforme') { S.happy = 2.2; kick(0.7); S.hopV = 2.2; sparkle(2); supMarca('✓', '#7fe3a1'); }
    else if (estado === 'dudando') { S.tiltT = 1.4; drop(); supMarca('?', '#cfeee4'); }
    else if (estado === 'ciego') { S.tiltT = 1.4; supMarca('?', '#cfeee4'); }
    else if (estado === 'enfocando') kick(0.4);
    else if (estado === 'sin-senal') drop();
    return true;
  }
  window.__supervisor = { estado: supEstado, frase: supFrase, orden: supervisorOrden, de: supEstadoDe, ask: function (q) { if (SUP) supAsk(q); } };
  if (SUP) { el.supLente = $('supLente'); el.supAnillo = $('supAnillo'); el.supIris = $('supIris'); el.supCeja = $('supCeja'); S.sleepAfter = Math.min(S.sleepAfter, 20000); }
  function supNodo(tag, attrs) { var n = document.createElementNS(SVGNS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  // Efectos del objetivo: van dentro de #supLente para seguir la mirada y el bote de la nube.
  function supFxLente(node, ms) { if (REDUCED) return; el.supLente.appendChild(node); setTimeout(function () { node.remove(); }, ms); }
  function supFlash() { supFxLente(supNodo('circle', { class: 'sup-flash', cx: 166, cy: 110, r: 13 }), 600); }
  function supPulso(color) { supFxLente(supNodo('circle', { class: 'sup-pulso', cx: 166, cy: 110, r: 21, stroke: color }), 1300); }
  function supRuido() {
    var y = 100 + Math.random() * 20, hw = Math.sqrt(Math.max(0, 150 - (y - 110) * (y - 110)));
    supFxLente(supNodo('path', { class: 'sup-ruido', d: 'M' + (166 - hw).toFixed(1) + ',' + y.toFixed(1) + ' h' + (2 * hw * (0.4 + Math.random() * 0.6)).toFixed(1) }), 300);
  }
  function supMarca(texto, color) {
    var m = supNodo('text', { class: 'sup-marca', x: 192 + Math.random() * 8, y: 82, fill: color }); m.textContent = texto; fx(m, 1700);
  }
  // Ceja (ángulo: + = extremo interior abajo, escrutadora), altura, diafragma y anillo de enfoque por estado.
  var SUP_CEJA = { vigilando: 4, enfocando: 14, alerta: -16, conforme: -6, dudando: -20, ciego: 12, 'sin-senal': 2 };
  var SUP_CEJA_Y = { vigilando: 0, enfocando: 2, alerta: -8, conforme: -5, dudando: -6, ciego: 3, 'sin-senal': 4 };
  var SUP_IRIS = { vigilando: 5.8, alerta: 7.8, conforme: 6.4, dudando: 5, ciego: 7, 'sin-senal': 2.6 };
  function supFrame(dt) {
    var e = SUP.estado, k = Math.min(1, dt * 6);
    SUP.t += dt; SUP.clock += dt;
    if (e !== 'sin-senal' && S.mode === 'idle') S.lastTouch = performance.now();   // el vigilante sólo se duerme sin señal
    if (SUP.pintado !== e) { el.supLente.setAttribute('data-estado', e); SUP.pintado = e; }
    // El objetivo es el ojo derecho: copia su transform (mirada y parpadeo, que hace de obturador).
    var tr = el.ojoD.getAttribute('transform'); if (tr) el.supLente.setAttribute('transform', tr);
    var cj = S.mode === 'sleeping' ? 0 : (SUP_CEJA[e] || 0), cy = S.mode === 'sleeping' ? 4 : (SUP_CEJA_Y[e] || 0);
    SUP.ceja += (cj - SUP.ceja) * k; SUP.alto += (cy - SUP.alto) * k;
    el.supCeja.setAttribute('transform', 'translate(' + (S.gaze.x * 3).toFixed(2) + ',' + SUP.alto.toFixed(2) + ') rotate(' + SUP.ceja.toFixed(2) + ' 111 80)');
    // Diafragma: se cierra y respira al enfocar; se abre de golpe en alerta.
    var ir = e === 'enfocando' ? 3.6 + 0.8 * Math.sin(SUP.clock * 3) : (SUP_IRIS[e] || 5.8);
    SUP.iris += (ir - SUP.iris) * Math.min(1, dt * 8);
    el.supIris.setAttribute('r', SUP.iris.toFixed(2));
    if (!REDUCED) { if (e === 'enfocando') SUP.giro += dt * 70; else if (e === 'alerta' && SUP.t < 1) SUP.giro += dt * 240; }
    el.supAnillo.setAttribute('transform', 'rotate(' + (SUP.giro % 360).toFixed(1) + ' 166 110)');
    if (REDUCED || S.mode === 'sleeping') return;
    SUP.efectoT -= dt;
    if (SUP.efectoT > 0) return;
    if (e === 'enfocando') { supFlash(); SUP.efectoT = 2.5; }
    else if (e === 'alerta' && SUP.t < 4) { supPulso('#ff5b5b'); SUP.efectoT = 0.7; }
    else if (e === 'sin-senal') { supRuido(); SUP.efectoT = 0.16; }
    else if (e === 'vigilando') { supPulso('#7fe3a1'); SUP.efectoT = 4 + Math.random() * 3; }
    else SUP.efectoT = 0.5;
  }
  // Boca: morritos al enfocar, una «o» al ver el fallo y una línea recta cuando no ve o no tiene señal.
  function supMouth() {
    var e = SUP.estado;
    if (e === 'enfocando') { mouth.ta = 0.1; mouth.tr = 0.9; }
    else if (e === 'alerta' && SUP.t < 1.2) { mouth.ta = 0.5; mouth.tr = 1; }
    else if (e === 'ciego' || e === 'dudando') { mouth.ta = 0.16; mouth.tr = 0.6; }
  }
  if (SUP) Object.assign(PIELES.supervisor, {
    frame: supFrame, mouth: supMouth, ask: supAsk,
    droop: function () { var e = SUP.estado; return e === 'sin-senal' ? 0.55 : e === 'ciego' ? 0.4 : e === 'enfocando' ? 0.15 : 0; },
    // Vigilando barre de lado a lado, como una cámara de patrulla; al enfocar mira fijo hacia la pantalla (a su derecha).
    gaze: function () { var e = SUP.estado; return e === 'vigilando' ? [0.85 * Math.sin(SUP.clock * 0.55), 0.08] : e === 'enfocando' || (e === 'alerta' && SUP.t < 1.5) ? [-0.9, 0.1] : e === 'dudando' ? [0.3, -0.6] : e === 'sin-senal' ? [0, 0.5] : null; },
    estado: function () { return SUP.estado; },
    identidad: function (kind) { return kind === 'help' ? supF().ayuda : (kind === 'who' || kind === 'profile') ? supF().quien : ''; },
    titulo: function (l) { return l === 'en' ? 'DigitalAvatar.ai — the Supervisor (Admirito with a camera eye)' : 'DigitalAvatar.ai — el Supervisor (Admirito con ojo de cámara)'; },
    mensaje: function (d) {
      var inc = d.incidencia, ticket = typeof d.ticket === 'string' ? d.ticket : inc && typeof inc === 'object' ? inc.id : inc;
      supEstado(String(d.estado || ''), { espera: d.espera, ticket: ticket, texto: d.texto, silencio: d.silencio === true });
    }
  });
  // Embebido (⌘ Experto, banco de Bugito): avisa al anfitrión de que ya escucha, para que le cuente lo que ve.
  if (SUP && window.self !== window.top) { try { var hostS = DACTX.hostOrigin ? DACTX.hostOrigin() : ''; if (hostS) window.parent.postMessage({ type: 'da-supervisor-listo' }, hostS); } catch (_) {} }

