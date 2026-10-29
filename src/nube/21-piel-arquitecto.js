  // ───────────────────────── Piel ARQUITECTO ─────────────────────────
  // Carlos, 14-oct-2026: «/arquitecto … admirito se disfrace de arquitecto y le podamos pedir crear, reformar o
  // inventariar». Mismo cuerpo, misma vida y mismo lip-sync (speakText); aquí sólo lo suyo: estados, frases, cejas,
  // lápiz, rollo y efectos (ondas al escuchar, cinta métrica al medir, trazos al dibujar y el plano al entregar).
  var ARQ_ESTADOS = ['reposo', 'escuchando', 'midiendo', 'dibujando', 'entregando', 'dudando'];
  var ARQ_ORDENES = ['crear', 'reformar', 'inventariar'];
  var ARQ_FRASES = {
    es: {
      reposo: ['¿Qué hacemos hoy: crear, reformar o inventariar?', 'Casco puesto y lápiz afilado. Tú dirás.', 'Dime qué local es y te lo dibujo.'],
      escuchando: ['Te escucho: cuéntame cómo es el local.', 'Soy todo oídos… y planos.', 'Adelante, lo apunto todo.'],
      midiendo: ['Vamos a medir.', 'Cinta en mano: ancho, fondo y alto.', 'Una puerta son dos metros y pico… vamos a medir.'],
      dibujando: { crear: 'Trazo paredes, puerta y escaparate…', reformar: 'Esto pide una reforma. Dibujo la propuesta.', inventariar: 'Apunto cada pantalla y cada player…', otro: 'Dibujando el plano…' },
      entregando: { crear: 'Plano listo. ¿Lo usamos?', reformar: 'Propuesta de obra lista: aquí tienes la orden.', inventariar: 'Inventario listo, firmo el acta.', otro: 'Listo: te lo entrego.' },
      dudando: ['Mmm… esto no me cuadra.', 'Me falta un dato para seguir.', 'Así no lo veo claro: cuéntamelo de otra forma.'],
      pedido: 'Apuntado.', sinEstudio: 'Para dibujar necesito mi estudio: ábreme en admira.biz/arquitecto.html.',
      quien: '¡Hola! Soy el Arquitecto: Admirito con casco de obra. Creo Xpacios nuevos, reformo los que hay y hago su inventario ITIL.',
      ayuda: 'Arquitecto · órdenes\n/arquitecto crear [tipo] — un Xpacio nuevo, inventado\n/arquitecto reformar — una reforma desde foto, vídeo o lo que me cuentes\n/arquitecto inventariar — plano e inventario ITIL desde foto, vídeo o descripción\nAl final, el inventario se da de alta en Yokup (Portal del comercio).\nMi estudio: admira.biz/arquitecto.html'
    },
    en: {
      reposo: ['What shall we do today: create, renovate or survey?', 'Hard hat on, pencil sharp. Over to you.', 'Tell me about the space and I will draw it.'],
      escuchando: ['I\'m listening: tell me what the space is like.', 'All ears… and blueprints.', 'Go ahead, I\'m taking notes.'],
      midiendo: ['Let\'s measure.', 'Tape in hand: width, depth and height.', 'A door is two metres and a bit… let\'s measure.'],
      dibujando: { crear: 'Drawing walls, door and shop window…', reformar: 'This calls for a renovation. Drawing the proposal.', inventariar: 'Logging every screen and every player…', otro: 'Drawing the floor plan…' },
      entregando: { crear: 'Floor plan ready. Shall we use it?', reformar: 'Works proposal ready: here is the order.', inventariar: 'Inventory ready, signing it off.', otro: 'Done: here you are.' },
      dudando: ['Hmm… that does not add up.', 'I need one more detail to go on.', 'I can\'t see it that way: tell me differently.'],
      pedido: 'Noted.', sinEstudio: 'I need my studio to draw: open me at admira.biz/arquitecto.html.',
      quien: 'Hi! I\'m the Architect: Admirito in a hard hat. I create new Xpaces, renovate existing ones and build their ITIL inventory.',
      ayuda: 'Architect · commands\n/arquitecto crear [type] — a new, invented Xpace\n/arquitecto reformar — a renovation from a photo, a video or what you tell me\n/arquitecto inventariar — floor plan and ITIL inventory from a photo, a video or a description\nAt the end the inventory is registered in Yokup (retailer portal).\nMy studio: admira.biz/arquitecto.html'
    }
  };
  var ARQ = PERSONAJE === 'arquitecto' ? { estado: 'reposo', orden: '', t: 0, clock: 0, ceja: 0, alto: 0, lapiz: 0, rollo: 0, efectoT: 0 } : null;
  function arqF() { return ARQ_FRASES[LANG] || ARQ_FRASES.es; }
  function arqPick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function arqNorm(t) { return String(t || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  // Frase del estado (dibujar y entregar dependen de la orden).
  function arqFrase(estado, orden) {
    var f = arqF(), o = ARQ_ORDENES.indexOf(orden) >= 0 ? orden : 'otro';
    if (estado === 'dibujando' || estado === 'entregando') return f[estado][o] || f[estado].otro;
    var list = f[estado];
    return Array.isArray(list) ? arqPick(list) : '';
  }
  // Texto del visitante → {orden, texto}: la orden si la nombra («crea…», «reforma…», «inventaría…»,
  // «/arquitecto crear»…), o '' si es una descripción para la orden que ya está abierta.
  function arquitectoOrden(text) {
    var raw = String(text || '').trim().slice(0, 2000), t = arqNorm(raw).replace(/^\/\s*(arquitecto|architect)\b\s*/, '');
    var orden = '';
    if (/^(crea|crear|create|nuevo|nueva|inventa|invent)\b|xpacio nuevo|nuevo xpacio|new (xpace|space)/.test(t)) orden = 'crear';
    else if (/^(reforma|reformar|reform|renova|renovate|redistribu)|\breforma\b|\brenovat/.test(t)) orden = 'reformar';
    else if (/^(inventari|inventory|survey|levanta)|\binventari|\binventory\b/.test(t)) orden = 'inventariar';
    return { orden: orden, texto: raw };
  }
  function arqDecir(texto) { if (!texto) return; stopAll(); clearHelpClass(); speakText(texto); setStatus(''); }
  function arqAsk(question) {
    $('q').value = ''; clearHelpClass();
    var q = String(question || '').trim(); if (!q) return;
    if (/^(¿\s*)?(quien eres|quien sois|who are you)\b/.test(arqNorm(q))) { arqDecir(arqF().quien); return; }
    var host = DACTX.hostOrigin ? DACTX.hostOrigin() : '';
    if (window.self === window.top || !host) { arqDecir(arqF().sinEstudio); return; }
    var o = arquitectoOrden(q);
    try { window.parent.postMessage({ type: 'da-arquitecto-orden', orden: o.orden, texto: o.texto, lang: LANG }, host); } catch (_) { arqDecir(arqF().sinEstudio); return; }
    arqEstado('escuchando', { orden: o.orden || ARQ.orden, texto: arqF().pedido });
  }
  // Estado que manda el anfitrión (o el propio Arquitecto): entra con su gesto y dice su frase con lip-sync.
  function arqEstado(estado, opt) {
    if (!ARQ) return false;
    opt = opt || {};
    if (ARQ_ESTADOS.indexOf(estado) < 0) return false;
    if (ARQ_ORDENES.indexOf(opt.orden) >= 0) ARQ.orden = opt.orden;
    ARQ.estado = estado; ARQ.t = 0; ARQ.efectoT = 0; touch();
    var texto = typeof opt.texto === 'string' && opt.texto.trim() ? opt.texto.trim().slice(0, 240) : arqFrase(estado, ARQ.orden);
    if (!opt.silencio) arqDecir(texto);
    if (REDUCED) return true;
    if (estado === 'entregando') { S.happy = 2.2; kick(0.9); S.hopV = 2.4; sparkle(2); }
    else if (estado === 'escuchando') S.tiltT = 1.4;
    else if (estado === 'dudando') { S.tiltT = 1.4; drop(); }
    else if (estado === 'midiendo' || estado === 'dibujando') kick(0.4);
    return true;
  }
  window.__arquitecto = { estado: arqEstado, frase: arqFrase, orden: arquitectoOrden, ask: function (q) { if (ARQ) arqAsk(q); } };
  if (ARQ) { el.arqCejaI = $('arqCejaI'); el.arqCejaD = $('arqCejaD'); el.arqLapiz = $('arqLapiz'); el.arqRollo = $('arqRollo'); S.sleepAfter = Math.min(S.sleepAfter, 60000); }
  function arqNodo(tag, attrs) { var n = document.createElementNS(SVGNS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  // Efectos: ondas (escuchar), cinta métrica (medir), trazos de plano (dibujar) y el plano que se desenrolla (entregar).
  function arqOndas() {
    for (var i = 0; i < 2; i++) { var o = arqNodo('path', { class: 'onda', d: 'M' + (268 + i * 11) + ',' + (98 - i * 4) + ' q' + (9 + i * 3) + ',' + (12 + i * 4) + ' 0,' + (24 + i * 8) }); o.style.animationDelay = (i * 0.18) + 's'; fx(o, 1500); }
  }
  function arqCinta() {
    var g = arqNodo('g', { class: 'cinta' });
    g.appendChild(arqNodo('rect', { x: -4, y: 204, width: 268, height: 9, rx: 2, fill: '#ffd23d', stroke: '#5a3b00', 'stroke-width': 1.6 }));
    for (var x = 6; x < 262; x += 13) g.appendChild(arqNodo('path', { d: 'M' + x + ',204 l0,' + (((x - 6) / 13) % 5 === 0 ? 6 : 3.5), stroke: '#5a3b00', 'stroke-width': 1.3 }));
    g.appendChild(arqNodo('rect', { x: -22, y: 198, width: 20, height: 20, rx: 4, fill: '#ffb300', stroke: '#5a3b00', 'stroke-width': 2 }));
    fx(g, 2200);
  }
  function arqTrazo() {
    var x = 196 + Math.random() * 56, y = 170 + Math.random() * 30, w = 14 + Math.random() * 22, h = 10 + Math.random() * 16;
    var d = Math.random() < 0.5 ? 'M' + x + ',' + y + ' h' + w.toFixed(1) + ' v' + h.toFixed(1) + ' h' + (-w).toFixed(1) + ' z' : 'M' + x + ',' + y + ' h' + w.toFixed(1) + ' m' + (-w / 2).toFixed(1) + ',0 v' + h.toFixed(1);
    fx(arqNodo('path', { class: 'trazo', d: d, pathLength: 1 }), 1700);
  }
  function arqPlano() {
    var g = arqNodo('g', { class: 'plano' });
    g.appendChild(arqNodo('rect', { x: -26, y: 120, width: 74, height: 54, rx: 2, fill: '#2f6db5', stroke: '#133a66', 'stroke-width': 2.5 }));
    g.appendChild(arqNodo('path', { d: 'M-18,128 h58 v38 h-58 z M-18,147 h26 M8,128 v38 M24,147 h16', fill: 'none', stroke: '#cfe6ff', 'stroke-width': 1.8 }));
    fx(g, 2700);
  }
  // Cejas (ángulo: + = extremo interior abajo, concentrado), altura, lápiz y rollo por estado.
  var ARQ_CEJA = { reposo: 0, escuchando: -6, midiendo: 12, dibujando: 15, entregando: -8, dudando: -16 };
  var ARQ_CEJA_Y = { reposo: 0, escuchando: -5, midiendo: 2, dibujando: 3, entregando: -6, dudando: -3 };
  function arqFrame(dt) {
    var e = ARQ.estado, k = Math.min(1, dt * 6);
    ARQ.t += dt; ARQ.clock += dt;
    if (e !== 'reposo' && S.mode === 'idle') S.lastTouch = performance.now();   // trabajando no se duerme
    var cj = S.mode === 'sleeping' ? 0 : (ARQ_CEJA[e] || 0), cy = S.mode === 'sleeping' ? 4 : (ARQ_CEJA_Y[e] || 0);
    ARQ.ceja += (cj - ARQ.ceja) * k; ARQ.alto += (cy - ARQ.alto) * k;
    var gx = (S.gaze.x * 3).toFixed(2);
    el.arqCejaI.setAttribute('transform', 'translate(' + gx + ',' + ARQ.alto.toFixed(2) + ') rotate(' + ARQ.ceja.toFixed(2) + ' 111 77)');
    el.arqCejaD.setAttribute('transform', 'translate(' + gx + ',' + ARQ.alto.toFixed(2) + ') rotate(' + (-ARQ.ceja).toFixed(2) + ' 166 77)');
    // El lápiz tiembla al dibujar; el rollo bota al entregar.
    var lap = e === 'dibujando' ? 6 * Math.sin(ARQ.clock * 16) : e === 'midiendo' ? 2 * Math.sin(ARQ.clock * 5) : 0;
    ARQ.lapiz += (lap - ARQ.lapiz) * Math.min(1, dt * 12);
    el.arqLapiz.setAttribute('transform', 'translate(196,50) rotate(' + (-30 + ARQ.lapiz).toFixed(2) + ')');
    var rol = e === 'entregando' && ARQ.t < 2.4 ? -8 * Math.abs(Math.sin(ARQ.clock * 7)) : 0;
    ARQ.rollo += (rol - ARQ.rollo) * Math.min(1, dt * 10);
    el.arqRollo.setAttribute('transform', 'translate(-14,' + (166 + ARQ.rollo).toFixed(2) + ') rotate(' + (-22 + ARQ.rollo).toFixed(2) + ')');
    if (REDUCED || S.mode === 'sleeping') return;
    ARQ.efectoT -= dt;
    if (ARQ.efectoT > 0) return;
    if (e === 'escuchando' && ARQ.t < 8) { arqOndas(); ARQ.efectoT = 0.9; }
    else if (e === 'midiendo') { arqCinta(); ARQ.efectoT = 2.3; }
    else if (e === 'dibujando') { arqTrazo(); ARQ.efectoT = 0.45; }
    else if (e === 'entregando' && ARQ.t < 3) { arqPlano(); ARQ.efectoT = 3.2; }
    else ARQ.efectoT = 0.5;
  }
  // Boca: concentrado al medir y dibujar (morritos), y una «o» de duda.
  function arqMouth() {
    var e = ARQ.estado;
    if (e === 'midiendo') { mouth.ta = 0.14; mouth.tr = 0.95; }
    else if (e === 'dibujando') { mouth.ta = 0.08; mouth.tr = 0.55; }
    else if (e === 'dudando') { mouth.ta = 0.22; mouth.tr = 1; }
  }
  if (ARQ) Object.assign(PIELES.arquitecto, {
    frame: arqFrame, mouth: arqMouth, ask: arqAsk,
    droop: function () { return ARQ.estado === 'dibujando' ? 0.32 : ARQ.estado === 'midiendo' ? 0.18 : 0; },
    gaze: function () { var e = ARQ.estado; return e === 'midiendo' ? [-0.75, 0.75] : e === 'dibujando' ? [0.8, 0.7] : e === 'escuchando' ? [0.35, -0.15] : e === 'dudando' ? [-0.2, -0.6] : null; },
    estado: function () { return ARQ.estado; },
    identidad: function (kind) { return kind === 'help' ? arqF().ayuda : (kind === 'who' || kind === 'profile') ? arqF().quien : ''; },
    titulo: function (l) { return l === 'en' ? 'DigitalAvatar.ai — the Architect (Admirito in a hard hat)' : 'DigitalAvatar.ai — el Arquitecto (Admirito con casco de obra)'; },
    mensaje: function (d) { arqEstado(String(d.estado || ''), { orden: d.orden, texto: d.texto, silencio: d.silencio === true }); }
  });
  // Embebido en el estudio: avisa al anfitrión de que ya escucha.
  if (ARQ && window.self !== window.top) { try { var hostA = DACTX.hostOrigin ? DACTX.hostOrigin() : ''; if (hostA) window.parent.postMessage({ type: 'da-arquitecto-listo' }, hostA); } catch (_) {} }

