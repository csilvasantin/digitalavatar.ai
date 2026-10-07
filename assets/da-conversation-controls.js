/* Shared conversation controls: native handlers remain on their original buttons.
 * Compact mode (body[data-da-composer=compact], used by nube/Admirito): language pills and
 * icon buttons live inside the composer; the big "Idioma del avatar" bar and the three large
 * labelled buttons are not created. better/best keep the previous layout. */
(function (root) {
  'use strict';
  var doc = root.document, context = root.DAContext;
  var mic = doc.getElementById('mic') || doc.getElementById('btnMic');
  var stop = doc.getElementById('cut') || doc.getElementById('btnStop');
  var ask = doc.getElementById('send') || doc.getElementById('btnSend');
  if (!mic || !stop || !ask || !context) return;
  var compact = doc.body && doc.body.getAttribute('data-da-composer') === 'compact';
  var row = mic.parentElement;
  if (!compact) row.classList.add('da-control-row');
  var labels = {
    es: { language: 'Idioma del avatar', mic: 'Micrófono', stop: 'Detener', ask: 'Preguntar', micTitle: 'Hablar por micrófono', stopTitle: 'Detener voz y escucha', askTitle: 'Enviar pregunta', es: 'ESP', en: 'ENG' },
    en: { language: 'Avatar language', mic: 'Microphone', stop: 'Stop', ask: 'Ask', micTitle: 'Speak using the microphone', stopTitle: 'Stop speech and listening', askTitle: 'Send question', es: 'ESP', en: 'ENG' }
  };
  var icons = {
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
    ask: '<path d="m5 12 7-7 7 7M12 5v15"/>'
  };
  var languageButtons = {};
  var selector = null;
  var nameLabel = null;
  if (compact) {
    // Pills already in the composer (#langPills); just wire them.
    selector = doc.getElementById('langPills');
    if (selector) {
      selector.setAttribute('role', 'group');
      var pills = selector.querySelectorAll ? selector.querySelectorAll('[data-lang]') : [];
      Array.prototype.forEach.call(pills, function (button) {
        var lang = button.getAttribute('data-lang');
        languageButtons[lang] = button;
        button.addEventListener('click', function () { choose(lang); });
      });
    }
  } else {
    selector = doc.createElement('div');
    selector.className = 'da-conversation-language';
    selector.setAttribute('role', 'group');
    nameLabel = doc.createElement('span');
    nameLabel.className = 'da-language-label';
    selector.append(nameLabel);
    ['es', 'en'].forEach(function (lang) {
      var button = doc.createElement('button');
      button.type = 'button';
      button.className = 'da-language-choice';
      button.textContent = lang === 'es' ? 'ESP' : 'ENG';
      button.setAttribute('aria-label', lang === 'es' ? 'Español' : 'English');
      button.addEventListener('click', function () { choose(lang); });
      languageButtons[lang] = button;
      selector.append(button);
    });
    row.parentElement.insertBefore(selector, row);
  }
  function language() { return context.get().lang === 'en' ? 'en' : 'es'; }
  function paint() {
    var lang = language(), t = labels[lang];
    if (selector) selector.setAttribute('aria-label', t.language);
    if (nameLabel) nameLabel.textContent = t.language;
    ['es', 'en'].forEach(function (l) {
      if (languageButtons[l]) languageButtons[l].setAttribute('aria-pressed', String(l === lang));
    });
    [[mic, 'mic'], [stop, 'stop'], [ask, 'ask']].forEach(function (pair) {
      var button = pair[0], kind = pair[1];
      button.type = 'button';
      button.classList.add('da-conversation-action', 'da-action-' + kind);
      button.setAttribute('aria-label', t[kind]);
      button.title = t[kind + 'Title'];
      var html = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + icons[kind] + '</svg><span>' + t[kind] + '</span>';
      if (button.innerHTML !== html) button.innerHTML = html;
    });
  }
  function choose(lang) {
    if (lang !== 'es' && lang !== 'en' || lang === language()) return;
    context.set({ lang: lang });
    paint();
    try {
      if (root.parent !== root) {
        var origin = new URL(doc.referrer).origin;
        if (/^https:\/\/([a-z0-9-]+\.)*(admira\.store|xpaceos\.com|admiranext\.com)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          root.parent.postMessage({ type: 'da-language-selected', lang: lang }, origin);
        }
      }
    } catch (_) {}
  }
  context.on(function (kind) {
    if (kind === 'lang') stop.click();
    if (kind === 'lang' || kind === 'profile') paint();
  });
  root.DAConversationControls = { choose: choose, paint: paint };
  paint();
})(window);
