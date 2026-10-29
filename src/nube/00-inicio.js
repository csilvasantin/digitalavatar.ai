/* DigitalAvatar.ai · nivel GOOD = Admirito, la nube (GrokBot · MacMini, 6-oct-2026).
 * ⚠ GENERADO: la fuente está en src/nube/*.js (un archivo por bloque); edita allí y ejecuta npm run nube.
 *
 * Lo opuesto a Neo (best): 2D, SVG + JS, sin 3D ni WebGL; carga al instante.
 *  - Labios: con voz, la boca sigue la amplitud del audio (WebAudio AnalyserNode) y la forma de
 *    las vocales (alineación de ElevenLabs); en modo solo texto se anima un tiempo proporcional
 *    a la longitud de la respuesta.
 *  - Vida propia si nadie la toca: flota, parpadea, mira alrededor, gestos (botecito, guiño,
 *    gota de lluvia, chispa, balanceo) y «zzz» tras un rato; se despierta al interactuar.
 *  - Ratón/toque: sigue el puntero con la mirada, se ruboriza y hace un «squish» feliz.
 *  - Pensando: puntitos mientras contesta el cerebro. prefers-reduced-motion: solo parpadeo y boca.
 * Contexto del cliente, chips, idioma y reglas: assets/da-context.js (tier good) + el cerebro.
 * Parámetros: ?dock=1 (panel de la suite) · ?kiosk=1 (tótem) · ?embed=1 (pantalla del gemelo)
 * · ?audio=off (solo texto: no gasta voz) · loc/lang/sector/brand/site/city/tier (da-context).
 * postMessage (como best.html): da-ask {question,lang} · da-lang · da-audio {on} → da-answer.
 * Bailes (7-oct-2026): giro, baile, voltereta, gelatina y lluvia (con arcoíris) cada ~9–15 s de reposo;
 * ?dance=1 los enseña todos en bucle, ?dance=<nombre> uno solo (alias spin, dance, flip, jelly, rain).
 * Slash: /animacion 1|giro … /animacion help; /quien soy; /perfil; /aprender|/train (admin); /help.
 * Identidad: avatar=admirito (tier good). Nunca se mezcla con Luna ni Neo.
 * PIELES (?personaje=<id> · Carlos, 14-oct-2026): disfraces de Admirito con el MISMO motor, la misma vida y el
 * mismo lip-sync. Tabla PIELES: admirito (por defecto, sin piel) y bugito; la siguiente (arquitecto) se añade
 * igual: su entrada en PIELES (textos y chips), sus piezas en nube.html (class="piel-parte" data-piel="<id>" + su
 * bloque de CSS bajo html[data-personaje="<id>"]) y sus ganchos (frame, mouth, droop, gaze, ask, identidad,
 * mensaje, titulo, estado). Mensajes del anfitrión: {type:'da-<id>', …}, sólo del padre y de un origen de la red.
 * Bugito (personaje=bugito, «Bugito es una adaptación de Admirito»): rojo y negro, cuernos, rabito, cejas
 * pícaras y colmillo; el creador de incidencias del banco de pruebas (admira.biz/bugito.html). No pregunta al
 * cerebro: sus órdenes van al anfitrión (da-bugito-lanzar) y el anfitrión le cuenta qué pasa
 * (da-bugito {estado: aburrido|tramando|lanzando|celebrando|derrotado|rechazado, incidencia, ticket}).
 * Comercial (personaje=comercial, Carlos 20-oct-2026): Admirito con corbata y maletín, el asistente de campañas y
 * captación de la portada de admira.biz; lo que se le dice va al anfitrión (da-comercial-texto) y él le cuenta en qué
 * está (da-comercial {estado, texto}).
 * Arquitecto (personaje=arquitecto, «/arquitecto … admirito se disfrace de arquitecto»): Admirito con casco amarillo
 * de obra, gafas redondas, lápiz en la oreja y rollo de planos, sobre papel de plano azul; el estudio del Arquitecto
 * de admira.biz (arquitecto.html: crear, reformar e inventariar Xpacios). Tampoco pregunta al cerebro: lo que se le
 * dice (texto o micro) va al anfitrión (da-arquitecto-orden {orden: crear|reformar|inventariar|'', texto}) y el
 * anfitrión le cuenta en qué está (da-arquitecto {estado: reposo|escuchando|midiendo|dibujando|entregando|dudando,
 * orden, texto}).
 * Supervisor (personaje=supervisor, Carlos 18-oct-2026: la tercera mascota del ⌘ Experto, la Insta360 del MacMini que
 * vigila el MBP16 y abre incidencias en admira.app/supervisor): Admirito en menta y teal con gorra de vigilante y el
 * ojo derecho hecho objetivo de cámara. Tampoco pregunta al cerebro ni lee APIs: «¿qué ves?» o «abre la cámara» van al
 * anfitrión (da-supervisor-orden {orden: estado|camara, texto}) y el anfitrión le cuenta lo que ve el Supervisor
 * (da-supervisor {estado: vigilando|enfocando|alerta|conforme|dudando|ciego|sin-senal, o el estado del tablero o del
 * veredicto de supervisor-core, espera, ticket, texto}).
 */
(function () {
  'use strict';
  var API = 'https://brain.digitalavatar.ai';
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var KIOSK = /^(1|true)$/.test(params.get('kiosk') || '');
  var EMBED = params.get('embed') === '1';
  var DOCK = params.get('dock') === '1';
  var REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var MUTED = params.get('audio') === 'off' || params.get('voice') === '0';
  var DACTX = window.DAContext;
  var DADemo = window.DADemo;
  var SVGNS = 'http://www.w3.org/2000/svg';
  // ───── Pieles: la tabla. Los ganchos de cada piel se le añaden más abajo (bloque «Piel <ID>»). ─────
  var PIELES = {
    admirito: null,   // la nube de siempre
    angelito: {textos:{es:{tag:'Angelito · la nube dorada',placeholder:'Cuéntame en qué puedo ayudarte…',aria:'Angelito dorado con aureola y alas',chips:['¿Quién eres?','¿En qué puedes ayudarme?']},en:{tag:'Angelito · the golden cloud',placeholder:'Tell me how I can help…',aria:'Golden Angelito with halo and wings',chips:['Who are you?','How can you help me?']}}},
    creativo: {textos:{es:{tag:'Creativo · ideas, imagen y sonido',placeholder:'Cuéntame tu idea…',aria:'Creativo, el asistente de ideas y contenidos',chips:['Una idea para mi campaña','¿Quién eres?']},en:{tag:'Creative · ideas, image and sound',placeholder:'Tell me your idea…',aria:'Creative, your ideas and content assistant',chips:['An idea for my campaign','Who are you?']}}},
    bugito: { textos: {
      es: { tag: 'Bugito, el diablillo de las incidencias', placeholder: 'Pídeme un fallo: «gira la pantalla», «lanza un popup»…',
        aria: 'Bugito, el diablillo rojo de AdmiraNeXT', chips: ['Gira la pantalla', 'Cambia la resolución', 'Lanza un popup', 'Ábrela a medias', 'Vuelve a la normalidad'] },
      en: { tag: 'Bugito, the incident imp', placeholder: 'Ask me for a fault: “rotate the screen”, “pop up a popup”…',
        aria: 'Bugito, the little red AdmiraNeXT devil', chips: ['Rotate the screen', 'Change the resolution', 'Pop up a popup', 'Half-open it', 'Back to normal'] } } },
    arquitecto: { textos: {
      es: { tag: 'El Arquitecto · Admirito con casco de obra', placeholder: 'Cuéntame el local, escrito o con el micro: «crea una cafetería», «reforma la pared del fondo»…',
        aria: 'El Arquitecto: Admirito con casco amarillo, gafas, lápiz y rollo de planos', chips: ['Crear un Xpacio', 'Reformar este local', 'Inventariar desde una foto', '¿Quién eres?'] },
      en: { tag: 'The Architect · Admirito in a hard hat', placeholder: 'Describe the space, typed or with the mic: “create a coffee shop”, “renovate the back wall”…',
        aria: 'The Architect: Admirito with a yellow hard hat, glasses, pencil and blueprint roll', chips: ['Create a Xpace', 'Renovate this space', 'Survey from a photo', 'Who are you?'] } } },
    supervisor: { textos: {
      es: { tag: 'El Supervisor · el ojo que vigila el MBP16', placeholder: 'Pregúntame «¿qué ves?» o pídeme «abre la cámara»…',
        aria: 'El Supervisor: Admirito con gorra de vigilante y un ojo de cámara', chips: ['¿Qué ves?', '¿Hay incidencias?', 'Abre la cámara', '¿Quién eres?'] },
      en: { tag: 'The Supervisor · the eye on the MBP16', placeholder: 'Ask me “what do you see?” or “open the camera”…',
        aria: 'The Supervisor: Admirito with a security cap and a camera eye', chips: ['What do you see?', 'Any incidents?', 'Open the camera', 'Who are you?'] } } },
    comercial: { textos: {
      es: { tag: 'Comercial · Admirito con corbata y maletín', placeholder: 'Cuéntame la campaña, escrita o con el micro: «para Café Rico, lanzar el frappé, jóvenes, 2.000 euros, del 20 al 26 de octubre»…',
        aria: 'Comercial: Admirito con corbata y maletín', chips: ['Vender una campaña', 'Captar un comercio', 'Prepara la propuesta', '¿Quién eres?'] },
      en: { tag: 'Commercial · Admirito with a tie and briefcase', placeholder: 'Tell me the campaign, typed or with the mic: “for Café Rico, launch the frappé, young people, 2,000 euros, 20 to 26 October”…',
        aria: 'Commercial: Admirito with a tie and briefcase', chips: ['Sell a campaign', 'Recruit a merchant', 'Prepare the proposal', 'Who are you?'] } } }
  };
  var PERSONAJE = (function () { var p = String(params.get('personaje') || '').toLowerCase(); return Object.prototype.hasOwnProperty.call(PIELES, p) && PIELES[p] ? p : 'admirito'; })();
  var PIEL = PIELES[PERSONAJE] || null;

  var T = {
    es: { lang: 'es', tag: 'Admirito, la nube que habla', placeholder: 'Escribe o habla con Admirito…',
      thinking: 'Pensando…', listening: 'Escuchando…', speaking: 'Hablando', cut: 'Voz cortada', net: 'Error de red: ',
      noVoice: '', audioBlocked: 'El navegador bloqueó el audio. Pulsa de nuevo para oír la respuesta.',
      micNo: 'Este navegador no tiene dictado. Escribe la pregunta.', micDenied: 'Micro bloqueado. Permite el micrófono o escribe.',
      micFail: 'No se pudo usar el micrófono. Escribe la pregunta.', micEmpty: 'No se oyó nada. Prueba otra vez o escribe.',
      loc: 'Xpacio (Admira.app)', aria: 'Admirito, la nube de AdmiraNeXT',
      chips: ['¿Quién eres?', '¿Qué ofrece esta tienda?', '¿Cómo puedo pagar?', '¿A quién pregunto?'] },
    en: { lang: 'en', tag: 'Admirito, the talking cloud', placeholder: 'Type or talk to Admirito…',
      thinking: 'Thinking…', listening: 'Listening…', speaking: 'Speaking', cut: 'Voice cut', net: 'Network error: ',
      noVoice: '', audioBlocked: 'The browser blocked audio. Tap again to hear the reply.',
      micNo: 'This browser has no dictation. Type the question.', micDenied: 'Microphone blocked. Allow it, or type.',
      micFail: 'The microphone failed. Type the question.', micEmpty: 'Nothing was heard. Try again or type.',
      loc: 'Xpacio (Admira.app location)', aria: 'Admirito, the AdmiraNeXT cloud',
      chips: ['Who are you?', 'What does this shop offer?', 'How can I pay?', 'Who can I ask?'] }
  };
  if (PIEL && PIEL.textos) { T.es = Object.assign({}, T.es, PIEL.textos.es); T.en = Object.assign({}, T.en, PIEL.textos.en); }
  var LANG = (params.get('lang') === 'en' ? 'en' : params.get('lang') === 'es' ? 'es' : '') || DACTX.get().lang || (localStorage.getItem('da_lang') === 'en' ? 'en' : 'es');

