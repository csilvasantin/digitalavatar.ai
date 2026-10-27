/* DigitalAvatar.ai · los asistentes con IA de AdmiraNeXT (Neo · MacStudio, 27-oct-2026).
 *
 * Una sola lista para todos: la leen el CLI del ⌘ Experto (da-shell.js: /help, /asistente y /<nombre>),
 * el chat del avatar (da-remote.js: /help y /asistente <nombre>) y la guía (help/index.html).
 * Añadir un asistente = una entrada aquí (y, si es una piel de la nube, su entrada en PIELES de nube.js).
 * `url` es dónde se abre en digitalavatar.ai; `casa` es el sitio de la suite donde trabaja; `alias` son los otros
 * nombres con que se le llama (Carlos, 27-oct-2026: «Comercial y AlfredIA o Alfredito son lo mismo; tenemos
 * diferentes formas de llamar a cada asistente»). porId() entiende el id y cualquier alias, sin mayúsculas.
 * `que` y `fuertes` (ES/EN) son su ficha: «/<nombre> descripcion» la enseña (Carlos, 27-oct-2026: «que cuando
 * digamos /alfredito descripcion o cualquier otro nos diga cuáles son sus puntos fuertes»). Solo lo que hacen de
 * verdad hoy; lo que está por definir se dice tal cual.
 */
(function (root) {
  'use strict';
  var LISTA = [
    { id: 'admirito', nombre: 'Admirito', tipo: 'nube', url: '/nube.html', alias: ['Nube', 'Avatar'],
      es: 'la nube verde que habla: atiende al cliente y conoce la tienda',
      en: 'the talking green cloud: greets the customer and knows the store',
      casa: 'admira.store · xpaceos.com',
      que: { es: 'La nube verde de AdmiraNeXT, la mascota de la casa y el avatar que atiende al cliente en la tienda.',
             en: 'The AdmiraNeXT green cloud, the house mascot and the avatar that greets the customer in the store.' },
      fuertes: {
        es: ['Conversa con el cliente y conoce la tienda: qué ofrece, cómo pagar, a quién preguntar (contexto del Xpacio por el cerebro).',
             'Habla con la voz de Admira y mueve los labios; 2D ligero, carga al instante.',
             'Tiene vida propia: parpadea, baila (/animacion help) y se duerme; /demo da un pitch de 30 s.',
             'Se incrusta en cualquier pantalla de la suite y en marcas blancas (/marca starbucks, /marca 365).'],
        en: ['Talks with the customer and knows the store: offer, payment, who to ask (Xpace context via the brain).',
             'Speaks with the Admira voice and moves its lips; light 2D, loads instantly.',
             'Lives on its own: blinks, dances (/animacion help) and naps; /demo gives a 30 s pitch.',
             'Embeds in any suite screen and in white labels (/marca starbucks, /marca 365).'] } },
    { id: 'angelito', nombre: 'Angelito', tipo: 'nube', url: '/nube.html?personaje=angelito',
      es: 'la nube dorada con aureola y alas: ayuda y acompaña',
      en: 'the golden cloud with halo and wings: helps and guides',
      que: { es: 'La nube dorada con aureola y alas: la versión amable de Admirito, para ayudar y acompañar.',
             en: 'The golden cloud with halo and wings: the kind version of Admirito, there to help and guide.' },
      fuertes: {
        es: ['Mismo motor, misma voz y mismos bailes que Admirito, con su piel dorada y su luz.',
             'Ayuda y acompaña: responde «¿en qué puedes ayudarme?» y guía al cliente.',
             'Recién llegado (21-oct-2026): sus tareas propias están por definir.'],
        en: ['Same engine, voice and dances as Admirito, in its golden skin and light.',
             'Helps and guides: answers “how can you help me?” and walks the customer through.',
             'Newcomer (21-Oct-2026): its own tasks are still to be defined.'] } },
    { id: 'creativo', nombre: 'Creativo', tipo: 'nube', url: '/nube.html?personaje=creativo', alias: ['Creative'],
      es: 'ideas, imagen y sonido para tus campañas',
      en: 'ideas, image and sound for your campaigns',
      que: { es: 'El asistente de ideas y contenidos: imagen y sonido para las campañas.',
             en: 'The ideas and content assistant: image and sound for campaigns.' },
      fuertes: {
        es: ['Propone una idea para tu campaña a partir de una frase.',
             'Piensa en imagen y sonido, no solo en texto.',
             'Recién llegado (21-oct-2026): sus herramientas propias están por definir.'],
        en: ['Suggests an idea for your campaign from one sentence.',
             'Thinks in image and sound, not just text.',
             'Newcomer (21-Oct-2026): its own tools are still to be defined.'] } },
    { id: 'bugito', nombre: 'Bugito', tipo: 'nube', url: '/nube.html?personaje=bugito', alias: ['Bug'],
      es: 'el diablillo rojo de las incidencias: rompe players en el banco de pruebas',
      en: 'the little red incident imp: breaks lab players on the test bench',
      casa: 'admira.biz/bugito.html',
      que: { es: 'El diablillo rojo de las incidencias: rompe players de laboratorio en el banco de pruebas de admira.biz para que el equipo practique.',
             en: 'The little red incident imp: breaks lab players on the admira.biz test bench so the team can practise.' },
      fuertes: {
        es: ['Lanza fallos a la orden: gira la pantalla, cambia la resolución, lanza un popup, ábrela a medias, y vuelve a la normalidad.',
             'Cada fallo abre su incidencia con ticket (Yokup) y cuenta qué ha pasado.',
             'Solo toca players de laboratorio, nunca producción.',
             'Mismo cuerpo y bailes que Admirito; no gasta cerebro ni voz.'],
        en: ['Fires faults on demand: rotate the screen, change the resolution, pop up a popup, half-open it, back to normal.',
             'Each fault opens its incident with a ticket (Yokup) and reports what happened.',
             'Only touches lab players, never production.',
             'Same body and dances as Admirito; spends no brain or voice.'] } },
    { id: 'arquitecto', nombre: 'Arquitecto', tipo: 'nube', url: '/nube.html?personaje=arquitecto', alias: ['Architect'],
      es: 'Admirito con casco de obra: crea, reforma e inventaría Xpacios',
      en: 'Admirito in a hard hat: creates, renovates and surveys Xpaces',
      casa: 'admira.biz/arquitecto.html',
      que: { es: 'Admirito con casco de obra: el estudio de Xpacios de admira.biz.',
             en: 'Admirito in a hard hat: the admira.biz Xpace studio.' },
      fuertes: {
        es: ['Crea un Xpacio nuevo desde cero (/arquitecto crear [tipo]).',
             'Reforma un local desde una foto, un vídeo o lo que le cuentes (/arquitecto reformar).',
             'Inventaría: plano e inventario ITIL desde foto, vídeo o descripción, y lo da de alta en Yokup (/arquitecto inventariar).',
             'Modela: del plano al gemelo 3D en xpaceos.com, con la planta en DXF (/arquitecto modelar).',
             'Escucha por el micro y contesta desde su estudio.'],
        en: ['Creates a new Xpace from scratch (/arquitecto crear [type]).',
             'Renovates a space from a photo, a video or what you tell it (/arquitecto reformar).',
             'Surveys: floor plan and ITIL inventory from photo, video or description, registered in Yokup (/arquitecto inventariar).',
             'Models: from the plan to the 3D twin on xpaceos.com, with the floor plan as DXF (/arquitecto modelar).',
             'Listens through the mic and answers from its studio.'] } },
    { id: 'supervisor', nombre: 'Supervisor', tipo: 'nube', url: '/nube.html?personaje=supervisor',
      es: 'el ojo que vigila las pantallas y abre incidencias',
      en: 'the eye that watches the screens and opens incidents',
      casa: 'admira.live',
      que: { es: 'El ojo que vigila: la cámara Insta360 del laboratorio que mira las pantallas y abre incidencias.',
             en: 'The watching eye: the lab Insta360 camera that looks at the screens and opens incidents.' },
      fuertes: {
        es: ['Da su parte al momento: «¿qué ves?» o «¿hay incidencias?» (pantalla encendida, apagada, sin señal).',
             'Abre la cámara con sus controles («abre la cámara»).',
             'Abre incidencias en admira.app/supervisor, con su ticket.',
             'No inventa: solo cuenta lo que la cámara ve.'],
        en: ['Reports on the spot: “what do you see?” or “any incidents?” (screen on, off, no signal).',
             'Opens the camera with its controls (“open the camera”).',
             'Opens incidents at admira.app/supervisor, with a ticket.',
             'Never makes things up: it only tells what the camera sees.'] } },
    { id: 'comercial', nombre: 'Comercial', tipo: 'nube', url: '/nube.html?personaje=comercial', alias: ['AlfredIA', 'Alfredito', 'Alfred', 'Commercial'],
      es: 'Admirito con corbata y maletín: vende campañas y capta comercios',
      en: 'Admirito with a tie and briefcase: sells campaigns and recruits merchants',
      casa: 'admira.biz',
      que: { es: 'Admirito con corbata y maletín: el comercial de admira.biz, que vende campañas y capta comercios.',
             en: 'Admirito with a tie and briefcase: the admira.biz sales rep, who sells campaigns and recruits merchants.' },
      fuertes: {
        es: ['Vende una campaña: cuéntale anunciante, objetivo, público, fechas y presupuesto, y prepara la propuesta.',
             'Elige ubicaciones en el mapa (o las que le digas) y las incorpora con foto y dirección.',
             'Entrega la propuesta en PDF con mapa o por correo, y te ofrece su tarjeta.',
             'Capta un comercio: nombre, ciudad, dirección y pantallas, y hace la ficha.',
             'Habla con la voz de Admirito y escucha por el micro.'],
        en: ['Sells a campaign: tell it advertiser, objective, audience, dates and budget, and it prepares the proposal.',
             'Picks locations on the map (or the ones you name) and adds them with photo and address.',
             'Delivers the proposal as a PDF with a map or by email, and offers its business card.',
             'Recruits a merchant: name, city, address and screens, and prepares the brief.',
             'Speaks with the Admirito voice and listens through the mic.'] } },
    { id: 'luna', nombre: 'Luna', tipo: 'human', url: '/best.html?tier=human', alias: ['Human'],
      es: 'la anfitriona web (Ready Player Me), cálida y profesional',
      en: 'the web host (Ready Player Me), warm and professional',
      que: { es: 'La anfitriona web (Ready Player Me): una cara humana en 3D, cálida y profesional, en el navegador.',
             en: 'The web host (Ready Player Me): a warm, professional human face in 3D, in the browser.' },
      fuertes: {
        es: ['Guía por la tienda con datos reales y los labios sincronizados con la voz.',
             'Cara humana en 3D sin instalar nada: va en cualquier navegador.',
             'Entra por Neo cuando el host del MetaHuman está apagado.',
             'Mismo cerebro y mismas marcas blancas que Admirito.'],
        en: ['Guides through the store with real data and lips synced to the voice.',
             'A human 3D face with nothing to install: runs in any browser.',
             'Takes over from Neo when the MetaHuman host is off.',
             'Same brain and white labels as Admirito.'] } },
    { id: 'neo', nombre: 'Neo', tipo: 'metahuman', url: '/metahuman.html', alias: ['MetaHuman'],
      es: 'el MetaHuman fotorrealista (Unreal Engine 5); si el host está apagado, entra Luna',
      en: 'the photoreal MetaHuman (Unreal Engine 5); Luna takes over if the host is off',
      que: { es: 'El MetaHuman de Unreal Engine 5: la cara fotorrealista de AdmiraNeXT.',
             en: 'The Unreal Engine 5 MetaHuman: the photoreal face of AdmiraNeXT.' },
      fuertes: {
        es: ['Fotorrealismo por Pixel Streaming desde la workstation al navegador.',
             'Labios sincronizados con Audio2Face y la voz de Admira.',
             'Mismo cerebro y mismos datos del Xpacio que el resto de asistentes.',
             'Pensado para el stand y el tótem; si el host de render está apagado, entra Luna.'],
        en: ['Photorealism via Pixel Streaming from the workstation to the browser.',
             'Lips synced with Audio2Face and the Admira voice.',
             'Same brain and Xpace data as the other assistants.',
             'Built for the stand and the kiosk; if the render host is off, Luna takes over.'] } }
  ];
  // Presentación en primera persona (Carlos, 27-oct-2026: «/asistentes presentandose: que aparezcan todos durante 15
  // segundos cada uno diciendo a qué se dedican»). Unas 40 palabras: con la voz de la nube son unos 15 segundos.
  var ME = {
    admirito: { es: '¡Hola! Soy Admirito, la nube verde de AdmiraNeXT y la mascota de la casa. Atiendo al cliente en la tienda: le cuento qué ofrece, cómo pagar y a quién preguntar, con la voz de Admira. Y cuando nadie me habla, bailo un poco.',
                en: 'Hi! I am Admirito, the AdmiraNeXT green cloud and the house mascot. I look after the customer in the store: what we offer, how to pay and who to ask, with the Admira voice. And when nobody talks to me, I dance a little.' },
    angelito: { es: 'Soy Angelito, la nube dorada con aureola y alas. Soy la versión amable de Admirito: estoy para ayudar y acompañar a quien llega, con la misma voz y el mismo motor. Acabo de llegar y mis tareas propias se están definiendo.',
                en: 'I am Angelito, the golden cloud with halo and wings. I am the kind version of Admirito: here to help and guide whoever arrives, with the same voice and engine. I have just arrived and my own tasks are being defined.' },
    creativo: { es: 'Soy Creativo, el asistente de ideas y contenidos. Me cuentas tu campaña en una frase y te propongo ideas, pensando en imagen y sonido, no solo en texto. Acabo de llegar y mis herramientas propias se están definiendo.',
                en: 'I am Creativo, the ideas and content assistant. Tell me your campaign in one sentence and I suggest ideas, thinking in image and sound, not just text. I have just arrived and my own tools are being defined.' },
    bugito: { es: '¡Je, je! Soy Bugito, el diablillo rojo de las incidencias. Rompo players de laboratorio en el banco de pruebas de admira.biz para que el equipo practique: giro la pantalla, cambio la resolución, lanzo un popup. Cada fallo abre su ticket. Producción no la toco nunca.',
              en: 'Heh, heh! I am Bugito, the little red incident imp. I break lab players on the admira.biz test bench so the team can practise: I rotate the screen, change the resolution, pop up a popup. Each fault opens its ticket. I never touch production.' },
    arquitecto: { es: 'Soy el Arquitecto: Admirito con casco de obra, en el estudio de Xpacios de admira.biz. Creo Xpacios nuevos, reformo locales desde una foto o un vídeo, hago el plano y el inventario ITIL y lo doy de alta en Yokup. Y del plano paso al gemelo 3D.',
                  en: 'I am the Architect: Admirito in a hard hat, at the admira.biz Xpace studio. I create new Xpaces, renovate spaces from a photo or a video, draw the floor plan and the ITIL inventory and register it in Yokup. And from the plan I build the 3D twin.' },
    supervisor: { es: 'Soy el Supervisor, el ojo que vigila. Soy la cámara del laboratorio que mira las pantallas: me preguntas qué veo y te doy mi parte, encendida, apagada o sin señal. Si algo falla, abro la incidencia con su ticket. No invento nada: solo cuento lo que veo.',
                  en: 'I am the Supervisor, the watching eye. I am the lab camera that looks at the screens: ask me what I see and I give my report, on, off or no signal. If something fails, I open the incident with its ticket. I make nothing up: I only tell what I see.' },
    comercial: { es: '¡Hola! Soy Comercial; también me llaman AlfredIA o Alfredito. Soy el comercial de admira.biz: me cuentas anunciante, objetivo, público, fechas y presupuesto, elijo ubicaciones en el mapa y te preparo la propuesta en PDF o por correo. Y capto comercios y pantallas para la red.',
                 en: 'Hi! I am Comercial; they also call me AlfredIA or Alfredito. I am the admira.biz sales rep: tell me advertiser, objective, audience, dates and budget, I pick locations on the map and prepare the proposal as a PDF or by email. And I recruit merchants and screens for the network.' },
    luna: { es: 'Soy Luna, la anfitriona web. Una cara humana en 3D, cálida y profesional, en cualquier navegador y sin instalar nada. Guío por la tienda con datos reales y los labios a tiempo con la voz. Cuando Neo está apagado, entro yo.',
            en: 'I am Luna, the web host. A warm, professional human face in 3D, in any browser with nothing to install. I guide through the store with real data and lips in time with the voice. When Neo is off, I step in.' },
    neo: { es: 'Soy Neo, el MetaHuman de Unreal Engine 5: la cara fotorrealista de AdmiraNeXT. Llego al navegador por Pixel Streaming desde la workstation, con los labios sincronizados y la voz de Admira. Estoy pensado para el stand y el tótem; si mi host está apagado, entra Luna.',
           en: 'I am Neo, the Unreal Engine 5 MetaHuman: the photoreal face of AdmiraNeXT. I reach the browser by Pixel Streaming from the workstation, with synced lips and the Admira voice. I am built for the stand and the kiosk; if my host is off, Luna steps in.' }
  };
  LISTA.forEach(function (a) { a.me = ME[a.id] || null; });
  function norm(s) { return String(s || '').toLowerCase().trim(); }
  function porId(id) {
    id = norm(id);
    if (!id) return null;
    for (var i = 0; i < LISTA.length; i++) if (LISTA[i].id === id) return LISTA[i];
    for (var j = 0; j < LISTA.length; j++) {
      var al = LISTA[j].alias || [];
      for (var k = 0; k < al.length; k++) if (norm(al[k]) === id) return LISTA[j];
    }
    return null;
  }
  function nombres(a) { return [a.nombre].concat(a.alias || []); }
  function lineas(lang) {
    var en = lang === 'en';
    return LISTA.map(function (a) {
      var otros = (a.alias || []).length ? ' (' + (en ? 'also ' : 'también ') + (a.alias || []).join(', ') + ')' : '';
      return '/' + a.id + ' — ' + a.nombre + otros + ', ' + (en ? a.en : a.es) + (a.casa ? ' · ' + a.casa : '');
    });
  }
  function texto(lang) {
    var en = lang === 'en';
    return (en ? 'AdmiraNeXT AI assistants (type /<name> or /asistente <name> to open one; /<name> descripcion for its strengths; /asistentes presentandose for the parade):'
      : 'Asistentes con IA de AdmiraNeXT (escribe /<nombre> o /asistente <nombre> para abrirlo; /<nombre> descripcion para sus puntos fuertes; /asistentes presentandose para el pase):') +
      '\n' + lineas(lang).join('\n');
  }
  // La ficha: quién es y sus puntos fuertes. Acepta id o alias; sin asistente devuelve ''.
  function ficha(id, lang) {
    var a = porId(id); if (!a) return '';
    var en = lang === 'en';
    var cab = a.nombre + ((a.alias || []).length ? ' · ' + (en ? 'also ' : 'también ') + a.alias.join(', ') : '');
    var fuertes = (a.fuertes && (en ? a.fuertes.en : a.fuertes.es)) || [];
    return [cab, (a.que && (en ? a.que.en : a.que.es)) || (en ? a.en : a.es), (en ? 'Strengths:' : 'Puntos fuertes:')]
      .concat(fuertes.map(function (f) { return '· ' + f; }))
      .concat([(a.casa ? (en ? 'Works at: ' : 'Dónde trabaja: ') + a.casa + ' · ' : '') + (en ? 'Open: /' : 'Abrir: /') + a.id])
      .join('\n');
  }
  // Pase de presentación: lo que dice cada uno, en primera persona, y la URL de su turno (presenta=<n>).
  function presentacion(id, lang) { var a = porId(id); return a && a.me ? (lang === 'en' ? a.me.en : a.me.es) : ''; }
  function urlPase(i) { var a = LISTA[i]; if (!a) return ''; return a.url + (a.url.indexOf('?') >= 0 ? '&' : '?') + 'presenta=' + i; }
  var PIDE_PASE = /^(present[aá]ndose|presentaci[oó]n|presentarse|presentando|pase|desfile|parade|introductions?)$/i;
  function pidePase(s) { return PIDE_PASE.test(String(s || '').trim()); }
  // ¿La palabra pide la ficha? («descripcion», «descripción», «description», «info», «ficha», «puntos fuertes», «strengths»)
  var PIDE_FICHA = /^(descripci[oó]n|description|info|ficha|puntos\s*fuertes|strengths|qui[eé]n\s*(eres|es)|who)$/i;
  function pideFicha(s) { return PIDE_FICHA.test(String(s || '').trim()); }
  root.DA_ASISTENTES = { lista: LISTA, porId: porId, nombres: nombres, lineas: lineas, texto: texto, ficha: ficha, pideFicha: pideFicha, presentacion: presentacion, urlPase: urlPase, pidePase: pidePase };
})(window);
