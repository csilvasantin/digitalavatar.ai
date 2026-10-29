  // ───────────────────────── Piel BUGITO ─────────────────────────
  // Mismo cuerpo, misma vida y mismo lip-sync que Admirito (speakText); aquí sólo lo suyo: estados,
  // frases, cejas, rabito, cuernos, colmillo y partículas (bichito lanzado, llamitas, humo).
  var BUG_ESTADOS = ['aburrido', 'tramando', 'lanzando', 'celebrando', 'derrotado'];
  var BUG_TIPOS = ['formato-girado', 'cambio-resolucion', 'popup-encima', 'medio-abrir', 'normal'];
  var BUG_FRASES = {
    es: {
      aburrido: ['Qué aburrimiento… ¿no hay nada que romper?', 'Bostezo… esta pantalla funciona demasiado bien.', 'Elige un fallo y verás qué risa.'],
      tramando: ['Je, je… a ver si el agente se da cuenta.', 'Tic, tac… ¿me pillarán?', 'Shhh, que no se note.'],
      lanzando: { 'formato-girado': '¿Y si giramos esa pantalla…? ¡Vuelta va!', 'cambio-resolucion': 'Cambio de resolución: ¡ahora todo al revés!',
        'popup-encima': '¡Popup va! Que tape bien el anuncio.', 'medio-abrir': 'Ups, se me ha quedado a medio abrir.', normal: 'Vaaale, lo dejo todo como estaba…', otro: '¡Ahí va un fallo!' },
      celebrando: ['¡Pillado! Incidencia {t} abierta.', '¡Me han cazado! Incidencia {t} abierta en Yokup.'],
      derrotado: ['¡Noooo! Ya lo han arreglado.', 'Incidencia resuelta… volveré.', 'Me han devuelto la pantalla a la normalidad. Grrr.'],
      rechazado: 'El mando no me deja tocar esa pantalla. ¡Qué seguridad!',
      pedido: 'Marchando…', sinBanco: 'Desde aquí no llego a ningún player: ábreme en el banco de pruebas, admira.biz/bugito.html.',
      charla: ['Yo no contesto preguntas: yo rompo cosas. Pídeme «gira la pantalla» o «lanza un popup».', 'Je, je… ¿probamos un fallo? Toca uno de mis chips.', 'Para charlar está Admirito; yo estoy aquí para liarla.'],
      quien: '¡Hola! Soy Bugito, el primo diablillo de Admirito: rompo pantallas de laboratorio a propósito para que el agente de incidencias me pille.',
      ayuda: 'Bugito · órdenes\nGira la pantalla · Cambia la resolución · Lanza un popup · Ábrela a medias\nVuelve a la normalidad\n/quien soy — quién soy\n/animacion help — mis bailes (los de Admirito)\nSólo rompo players de laboratorio, en el banco de pruebas: admira.biz/bugito.html'
    },
    en: {
      aburrido: ['So boring… is there nothing to break?', 'Yawn… this screen works far too well.', 'Pick a fault and watch the fun.'],
      tramando: ['Heh, heh… let\'s see if the agent notices.', 'Tick, tock… will they catch me?', 'Shhh, act natural.'],
      lanzando: { 'formato-girado': 'What if we rotate that screen…? Here it spins!', 'cambio-resolucion': 'Resolution change: everything the other way round!',
        'popup-encima': 'Popup coming! Cover that ad nicely.', 'medio-abrir': 'Oops, it got stuck half open.', normal: 'Fiiine, I\'ll put everything back…', otro: 'Here comes a fault!' },
      celebrando: ['Caught! Incident {t} opened.', 'They got me! Incident {t} opened in Yokup.'],
      derrotado: ['Nooo! They fixed it already.', 'Incident resolved… I\'ll be back.', 'They put the screen back to normal. Grrr.'],
      rechazado: 'The remote won\'t let me touch that screen. Tight security!',
      pedido: 'Coming right up…', sinBanco: 'I can\'t reach any player from here: open me on the test bench, admira.biz/bugito.html.',
      charla: ['I don\'t answer questions: I break things. Ask me to “rotate the screen” or “pop up a popup”.', 'Heh, heh… shall we try a fault? Tap one of my chips.', 'Admirito is the chatty one; I\'m here to make trouble.'],
      quien: 'Hi! I\'m Bugito, Admirito\'s little devil cousin: I break lab screens on purpose so the incident agent catches me.',
      ayuda: 'Bugito · commands\nRotate the screen · Change the resolution · Pop up a popup · Half-open it\nBack to normal\n/quien soy — who I am\n/animacion help — my dances (Admirito\'s)\nI only break lab players, on the test bench: admira.biz/bugito.html'
    }
  };
  var BUG = PERSONAJE === 'bugito' ? { estado: 'aburrido', t: 0, clock: 0, ceja: 0, alto: 0, gaze: null, droop: 0.2, bostezo: 6, bostezoT: 0, humoT: 0, llamaT: 0 } : null;
  function bugF() { return BUG_FRASES[LANG] || BUG_FRASES.es; }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  var TICKET = /^[A-Z]{3}-[A-Z0-9]{4,10}$/;
  // Frase del estado (las de lanzar dependen del fallo; {t} = ticket de Yokup, si lo hay).
  function bugFrase(estado, incidencia, ticket) {
    var f = bugF(), tk = TICKET.test(String(ticket || '')) ? String(ticket) : '';
    if (estado === 'lanzando') return f.lanzando[BUG_TIPOS.indexOf(incidencia) >= 0 ? incidencia : 'otro'] || f.lanzando.otro;
    if (estado === 'rechazado') return f.rechazado;
    var list = f[estado];
    if (!list) return '';
    return pick(list).replace(tk ? '{t}' : / ?\{t\}/, tk);
  }
  // Texto del visitante → fallo del catálogo (o «normal»); null si no es una orden.
  function bugitoComando(text) {
    var t = String(text || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^\/\s*(fallo|fault|bugito|incidencia|incident)\b\s*/, '');
    if (!t) return null;
    if (/normal|arregl|\bfix|clear|limpi|restaur|vuelve|\bback\b/.test(t)) return 'normal';
    if (/gir|rota|turn|vuelta/.test(t)) return 'formato-girado';
    if (/resoluc|resolution|lienzo|canvas/.test(t)) return 'cambio-resolucion';
    if (/pop.?up|ventana|aviso|alert|dialog/.test(t)) return 'popup-encima';
    if (/medias|medio|half|persiana|shutter/.test(t)) return 'medio-abrir';
    return BUG_TIPOS.indexOf(t) >= 0 ? t : null;
  }
  function bugDecir(texto) { if (!texto) return; stopAll(); clearHelpClass(); speakText(texto); setStatus(''); }
  function bugAsk(question) {
    $('q').value = ''; clearHelpClass();
    var inc = bugitoComando(question), host = DACTX.hostOrigin ? DACTX.hostOrigin() : '';
    if (!inc) { bugDecir(pick(bugF().charla)); return; }
    if (window.self === window.top || !host) { bugDecir(bugF().sinBanco); return; }
    try { window.parent.postMessage({ type: 'da-bugito-lanzar', incidencia: inc, lang: LANG }, host); } catch (_) { bugDecir(bugF().sinBanco); return; }
    bugEstado('tramando', { texto: bugF().pedido });
  }
  // Estado que manda el anfitrión (o el propio Bugito): entra con su gesto y dice su frase con lip-sync.
  function bugEstado(estado, opt) {
    if (!BUG) return false;
    opt = opt || {};
    var rechazado = estado === 'rechazado';
    if (rechazado) estado = 'derrotado';
    if (BUG_ESTADOS.indexOf(estado) < 0) return false;
    var inc = BUG_TIPOS.indexOf(opt.incidencia) >= 0 ? opt.incidencia : '';
    BUG.estado = estado; BUG.t = 0; touch();
    var texto = typeof opt.texto === 'string' && opt.texto.trim() ? opt.texto.trim().slice(0, 240) : bugFrase(rechazado ? 'rechazado' : estado, inc, opt.ticket);
    if (!opt.silencio) bugDecir(texto);
    if (REDUCED) return true;
    if (estado === 'lanzando') { kick(1.2); S.hopV = 3.2; setTimeout(bichito, 280); }
    else if (estado === 'celebrando') { kick(0.9); S.hopV = 2.6; sparkle(2); setTimeout(function () { if (BUG.estado === 'celebrando') startDance('giro', { forced: true }); }, opt.silencio ? 0 : textDuration(texto) * 1000 + 250); }
    else if (estado === 'derrotado') { stopDance(); humo(2); drop(); }
    else if (estado === 'tramando') S.tiltT = 1.4;
    return true;
  }
  window.__bugito = { estado: bugEstado, frase: bugFrase, comando: bugitoComando, ask: function (q) { if (BUG) bugAsk(q); } };
  function bichito() {
    var g = document.createElementNS(SVGNS, 'g'); g.setAttribute('class', 'bichito');
    [['line', { x1: 24, y1: 112, x2: 20, y2: 104 }], ['line', { x1: 36, y1: 112, x2: 40, y2: 104 }], ['line', { x1: 24, y1: 126, x2: 20, y2: 134 }], ['line', { x1: 36, y1: 126, x2: 40, y2: 134 }]]
      .forEach(function (l) { var n = document.createElementNS(SVGNS, l[0]); for (var k in l[1]) n.setAttribute(k, l[1][k]); n.setAttribute('stroke', '#170607'); n.setAttribute('stroke-width', '2.5'); g.appendChild(n); });
    var cuerpo = document.createElementNS(SVGNS, 'ellipse'); cuerpo.setAttribute('cx', 31); cuerpo.setAttribute('cy', 119); cuerpo.setAttribute('rx', 11); cuerpo.setAttribute('ry', 8.5);
    cuerpo.setAttribute('fill', '#e2302e'); cuerpo.setAttribute('stroke', '#170607'); cuerpo.setAttribute('stroke-width', 2.5); g.appendChild(cuerpo);
    var cabeza = document.createElementNS(SVGNS, 'circle'); cabeza.setAttribute('cx', 19); cabeza.setAttribute('cy', 119); cabeza.setAttribute('r', 5.5); cabeza.setAttribute('fill', '#170607'); g.appendChild(cabeza);
    [[30, 115], [35, 122], [27, 123]].forEach(function (p) { var c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', 1.8); c.setAttribute('fill', '#170607'); g.appendChild(c); });
    fx(g, 1250);
  }
  function humo(n) {
    for (var i = 0; i < (n || 1); i++) {
      var c = document.createElementNS(SVGNS, 'circle'), izq = Math.random() < 0.5;
      c.setAttribute('class', 'humo'); c.setAttribute('cx', izq ? 64 + Math.random() * 10 : 204 + Math.random() * 10); c.setAttribute('cy', -12 + Math.random() * 8); c.setAttribute('r', 6 + Math.random() * 4);
      c.style.setProperty('--hx', ((izq ? -1 : 1) * (4 + Math.random() * 10)) + 'px'); c.style.animationDelay = (i * 0.2) + 's'; fx(c, 2100);
    }
  }
  function llamas(n) {
    for (var i = 0; i < (n || 1); i++) {
      var f = document.createElementNS(SVGNS, 'path'), x = 30 + Math.random() * 218, y = 20 + Math.random() * 40;
      f.setAttribute('class', 'llama'); f.setAttribute('fill', Math.random() < 0.5 ? '#ff9b3d' : '#ffd23d');
      f.setAttribute('d', 'M' + x.toFixed(1) + ',' + y.toFixed(1) + ' q-7,-9 -1,-21 q2,7 6,8 q2,-6 1,-11 q8,9 3,24 q-4,3 -9,0z');
      f.style.setProperty('--lx', ((Math.random() - 0.5) * 20).toFixed(1) + 'px'); f.style.animationDelay = (i * 0.12) + 's'; fx(f, 1500);
    }
  }
  if (BUG) { el.bugCejaI = $('bugCejaI'); el.bugCejaD = $('bugCejaD'); el.bugCola = $('bugCola'); el.bugCuernoI = $('bugCuernoI'); el.bugCuernoD = $('bugCuernoD'); el.bugColmillo = $('bugColmillo'); el.bocaG = $('boca'); S.sleepAfter = Math.min(S.sleepAfter, 30000); }
  // Boca propia: bostezos cuando se aburre (el lip-sync de hablar es el de Admirito).
  function bugMouth(dt) {
    if (BUG.estado === 'aburrido' && S.mode === 'idle' && !D) { BUG.bostezo -= dt; if (BUG.bostezo <= 0) { BUG.bostezoT = 1.5; BUG.bostezo = 7 + Math.random() * 5; } }
    if (BUG.bostezoT > 0) { BUG.bostezoT = Math.max(0, BUG.bostezoT - dt); var u = 1 - BUG.bostezoT / 1.5; mouth.ta = 0.9 * Math.sin(Math.PI * u); mouth.tr = 0.85; }
  }
  // Cejas (ángulo neto por estado; + = extremo interior abajo, pícaro), rabito, cuernos y colmillo.
  var CEJA = { aburrido: 4, tramando: 26, lanzando: 20, celebrando: 2, derrotado: -20 }, CEJA_BASE = 15;
  var CEJA_Y = { aburrido: 3, celebrando: -7, derrotado: 1 };
  var COLA = { aburrido: [4, 1.6], tramando: [10, 5], lanzando: [18, 11], celebrando: [24, 15], derrotado: [3, 1.2] };
  function bugFrame(dt) {
    var e = BUG.estado, k = Math.min(1, dt * 6);
    BUG.t += dt; BUG.clock += dt;
    if (e !== 'aburrido' && S.mode === 'idle') S.lastTouch = performance.now();   // tramando o celebrando no se duerme
    BUG.droop = e === 'derrotado' ? 0.45 : e === 'aburrido' ? 0.22 : 0;
    BUG.gaze = e === 'tramando' || e === 'lanzando' ? [-0.95, 0.12] : e === 'derrotado' ? [0, 0.75] : null;
    var cj = S.mode === 'sleeping' ? 0 : (CEJA[e] || 10), cy = S.mode === 'sleeping' ? 4 : (CEJA_Y[e] || 0);
    BUG.ceja += (cj - BUG.ceja) * k; BUG.alto += (cy - BUG.alto) * k;
    var gx = (S.gaze.x * 3).toFixed(2), r = (BUG.ceja - CEJA_BASE);
    el.bugCejaI.setAttribute('transform', 'translate(' + gx + ',' + BUG.alto.toFixed(2) + ') rotate(' + r.toFixed(2) + ' 111 90)');
    el.bugCejaD.setAttribute('transform', 'translate(' + gx + ',' + BUG.alto.toFixed(2) + ') rotate(' + (-r).toFixed(2) + ' 166 90)');
    var c = COLA[e] || COLA.aburrido, cola = Math.sin(BUG.clock * c[1]) * c[0] + (e === 'derrotado' ? 30 : 0);
    el.bugCola.setAttribute('transform', 'rotate(' + cola.toFixed(2) + ' 246 154)');
    var cuerno = e === 'derrotado' ? -16 : e === 'celebrando' ? 5 * Math.sin(BUG.clock * 14) : 1.5 * Math.sin(BUG.clock * 2);
    el.bugCuernoI.setAttribute('transform', 'rotate(' + cuerno.toFixed(2) + ' 100 36)');
    el.bugCuernoD.setAttribute('transform', 'rotate(' + (-cuerno).toFixed(2) + ' 177 36)');
    // Derrotado y callado: la sonrisa se da la vuelta (morro) y el colmillo se esconde.
    var morro = e === 'derrotado' && mouth.a < 0.04 && !S.speak;
    if (morro !== BUG.morro) { BUG.morro = morro; if (morro) el.bocaG.setAttribute('transform', 'translate(0,282) scale(1,-1)'); else el.bocaG.removeAttribute('transform'); el.bugColmillo.setAttribute('opacity', morro ? 0 : 1); }
    el.bugColmillo.setAttribute('transform', 'translate(0,' + (-5.5 * mouth.a).toFixed(2) + ')');
    if (REDUCED) return;
    if (e === 'celebrando' && BUG.t < 3.5) { BUG.llamaT -= dt; if (BUG.llamaT <= 0) { llamas(2); BUG.llamaT = 0.4; } }
    if (e === 'derrotado' && BUG.t < 5) { BUG.humoT -= dt; if (BUG.humoT <= 0) { humo(1); BUG.humoT = 0.8; } }
  }
  // Embebido en el banco: avisa al anfitrión de que ya escucha (para que le cuente el estado actual).
  // Ganchos de la piel en la tabla (el motor no sabe nada de Bugito; sólo llama a estos).
  Object.assign(PIELES.bugito, {
    frame: bugFrame, mouth: bugMouth, ask: bugAsk,
    droop: function () { return BUG ? BUG.droop : 0; },
    gaze: function () { return BUG ? BUG.gaze : null; },
    estado: function () { return BUG ? BUG.estado : ''; },
    identidad: function (kind) { return kind === 'help' ? bugF().ayuda : (kind === 'who' || kind === 'profile') ? bugF().quien : ''; },
    titulo: function (l) { return l === 'en' ? 'DigitalAvatar.ai — Bugito, the incident imp (Admirito with horns)' : 'DigitalAvatar.ai — Bugito, el diablillo de las incidencias (Admirito con cuernos)'; },
    mensaje: function (d) { bugEstado(String(d.estado || ''), { incidencia: d.incidencia, ticket: d.ticket, texto: d.texto, silencio: d.silencio === true }); }
  });
  if (BUG && window.self !== window.top) { try { var hostO = DACTX.hostOrigin ? DACTX.hostOrigin() : ''; if (hostO) window.parent.postMessage({ type: 'da-bugito-listo' }, hostO); } catch (_) {} }

