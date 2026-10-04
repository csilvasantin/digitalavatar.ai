/* Voz de demo, la misma en good (2D), better (3D) y Neo (MetaHuman).
 *
 * Un solo par ElevenLabs (el de better.html). El primer gesto reanuda el
 * AudioContext y arranca un elemento <audio> reutilizable: así Chrome, Safari
 * e iOS no se quedan mudos cuando el MP3 llega después del fetch. Una sola
 * reproducción a la vez. Cortar es pausar ese elemento.
 */
(function (root) {
  'use strict';

  var VOICE = { es: 'dNjJKg63Fr5AXwIdkATa', en: 'qSeXEcewz7tA0Q0qk9fH' };
  var SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  var el = null;
  var primed = false;
  var state = 'listo';
  var hooks = [];
  var retry = null;
  var gen = 0;
  var recog = null;
  var listening = false;

  function element() {
    if (!el) {
      el = new Audio();
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      el.preload = 'auto';
    }
    return el;
  }

  function setState(next) {
    state = next;
    try { root.document.documentElement.setAttribute('data-da-voice', next); } catch (e) {}
    for (var i = 0; i < hooks.length; i++) {
      try { hooks[i](next); } catch (err) {}
    }
  }

  function resumeCtx() {
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    if (!root.__daAudioCtx) {
      try { root.__daAudioCtx = new AC(); } catch (e) { return; }
    }
    if (root.__daAudioCtx.state === 'suspended') root.__daAudioCtx.resume();
  }

  function unlock() {
    resumeCtx();
    if (primed) return;
    primed = true;
    var audio = element();
    if (!audio.src) audio.src = SILENT;
    var pending = audio.play();
    if (pending && pending.catch) pending.catch(function () {});
  }

  function stop() {
    gen += 1;
    cancelListen();
    if (el) {
      el.onended = null;
      try { el.pause(); } catch (e) {}
    }
    if (state === 'hablando' || state === 'pensando' || state === 'escuchando') setState('listo');
  }

  function load(b64, mime) {
    var audio = element();
    gen += 1;
    audio.onended = null;
    try { audio.pause(); } catch (e) {}
    audio.src = 'data:' + (mime || 'audio/mpeg') + ';base64,' + b64;
    primed = true;
    return audio;
  }

  function start(audio) {
    var mine = gen;
    resumeCtx();
    setState('hablando');
    return audio.play().then(function () {
      if (mine !== gen) {
        try { audio.pause(); } catch (e) {}
      }
      return audio;
    }, function (err) {
      if (mine === gen) setState('listo');
      var blocked = err || new Error('play');
      blocked.daAudio = true;
      throw blocked;
    });
  }

  function armRetry(fn) { retry = fn; }

  function onGesture() {
    unlock();
    if (!retry) return;
    var fn = retry;
    retry = null;
    try { fn(); } catch (e) {}
  }

  root.document.addEventListener('pointerdown', onGesture, true);
  root.document.addEventListener('keydown', onGesture, true);

  function listen(opts) {
    opts = opts || {};
    var SR = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!SR) {
      if (opts.onError) opts.onError('unsupported');
      return false;
    }
    if (listening && recog) {
      cancelListen();
      return false;
    }
    unlock();
    stop();
    recog = new SR();
    recog.lang = opts.lang === 'en' ? 'en-US' : 'es-ES';
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    listening = true;
    setState('escuchando');
    recog.onresult = function (ev) {
      var text = '';
      for (var i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript;
      if (opts.onPartial) opts.onPartial(text);
      if (ev.results[ev.results.length - 1].isFinal) {
        listening = false;
        setState('listo');
        if (opts.onFinal) opts.onFinal(text);
      }
    };
    recog.onerror = function (ev) {
      listening = false;
      setState('listo');
      if (opts.onError) opts.onError((ev && ev.error) || 'error');
    };
    recog.onend = function () {
      if (!listening) return;
      listening = false;
      if (state === 'escuchando') setState('listo');
      if (opts.onEnd) opts.onEnd();
    };
    try { recog.start(); }
    catch (e) {
      listening = false;
      setState('listo');
      if (opts.onError) opts.onError('start');
      return false;
    }
    return true;
  }

  function cancelListen() {
    listening = false;
    if (recog) {
      try { recog.onend = null; recog.stop(); } catch (e) {}
      recog = null;
    }
  }

  root.DADemo = {
    VOICE: VOICE,
    voiceId: function (lang) { return VOICE[lang === 'en' ? 'en' : 'es']; },
    unlock: unlock,
    stop: stop,
    load: load,
    start: start,
    element: element,
    armRetry: armRetry,
    listen: listen,
    cancelListen: cancelListen,
    state: function () { return state; },
    onState: function (fn) { hooks.push(fn); },
    setState: setState
  };
})(window);
