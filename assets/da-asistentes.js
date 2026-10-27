/* DigitalAvatar.ai · los asistentes con IA de AdmiraNeXT (Neo · MacStudio, 27-oct-2026).
 *
 * Una sola lista para todos: la leen el CLI del ⌘ Experto (da-shell.js: /help, /asistente y /<nombre>),
 * el chat del avatar (da-remote.js: /help y /asistente <nombre>) y la guía (help/index.html).
 * Añadir un asistente = una línea aquí (y, si es una piel de la nube, su entrada en PIELES de nube.js).
 * `url` es dónde se abre en digitalavatar.ai; `casa` es el sitio de la suite donde trabaja.
 */
(function (root) {
  'use strict';
  var LISTA = [
    { id: 'admirito', nombre: 'Admirito', tipo: 'nube', url: '/nube.html',
      es: 'la nube verde que habla: atiende al cliente y conoce la tienda',
      en: 'the talking green cloud: greets the customer and knows the store',
      casa: 'admira.store · xpaceos.com' },
    { id: 'angelito', nombre: 'Angelito', tipo: 'nube', url: '/nube.html?personaje=angelito',
      es: 'la nube dorada con aureola y alas: ayuda y acompaña',
      en: 'the golden cloud with halo and wings: helps and guides' },
    { id: 'creativo', nombre: 'Creativo', tipo: 'nube', url: '/nube.html?personaje=creativo',
      es: 'ideas, imagen y sonido para tus campañas',
      en: 'ideas, image and sound for your campaigns' },
    { id: 'bugito', nombre: 'Bugito', tipo: 'nube', url: '/nube.html?personaje=bugito',
      es: 'el diablillo rojo de las incidencias: rompe players en el banco de pruebas',
      en: 'the little red incident imp: breaks lab players on the test bench',
      casa: 'admira.biz/bugito.html' },
    { id: 'arquitecto', nombre: 'Arquitecto', tipo: 'nube', url: '/nube.html?personaje=arquitecto',
      es: 'Admirito con casco de obra: crea, reforma e inventaría Xpacios',
      en: 'Admirito in a hard hat: creates, renovates and surveys Xpaces',
      casa: 'admira.biz/arquitecto.html' },
    { id: 'supervisor', nombre: 'Supervisor', tipo: 'nube', url: '/nube.html?personaje=supervisor',
      es: 'el ojo que vigila las pantallas y abre incidencias',
      en: 'the eye that watches the screens and opens incidents',
      casa: 'admira.live' },
    { id: 'comercial', nombre: 'Comercial', tipo: 'nube', url: '/nube.html?personaje=comercial',
      es: 'Admirito con corbata y maletín: vende campañas y capta comercios',
      en: 'Admirito with a tie and briefcase: sells campaigns and recruits merchants',
      casa: 'admira.biz' },
    { id: 'luna', nombre: 'Luna', tipo: 'human', url: '/best.html?tier=human',
      es: 'la anfitriona web (Ready Player Me), cálida y profesional',
      en: 'the web host (Ready Player Me), warm and professional' },
    { id: 'neo', nombre: 'Neo', tipo: 'metahuman', url: '/metahuman.html',
      es: 'el MetaHuman fotorrealista (Unreal Engine 5); si el host está apagado, entra Luna',
      en: 'the photoreal MetaHuman (Unreal Engine 5); Luna takes over if the host is off' }
  ];
  function porId(id) {
    id = String(id || '').toLowerCase().trim();
    for (var i = 0; i < LISTA.length; i++) if (LISTA[i].id === id) return LISTA[i];
    return null;
  }
  function lineas(lang) {
    var en = lang === 'en';
    return LISTA.map(function (a) {
      return '/' + a.id + ' — ' + a.nombre + ', ' + (en ? a.en : a.es) + (a.casa ? ' · ' + a.casa : '');
    });
  }
  function texto(lang) {
    var en = lang === 'en';
    return (en ? 'AdmiraNeXT AI assistants (type /<name> or /asistente <name> to open one):'
      : 'Asistentes con IA de AdmiraNeXT (escribe /<nombre> o /asistente <nombre> para abrirlo):') +
      '\n' + lineas(lang).join('\n');
  }
  root.DA_ASISTENTES = { lista: LISTA, porId: porId, lineas: lineas, texto: texto };
})(window);
