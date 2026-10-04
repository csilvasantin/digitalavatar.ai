/* Reproductor de Neo (Pixel Streaming) visto a la resolución de la pantalla.
 *
 * El <video> vive en el host (uiless.html, otro origen): no podemos cambiarle
 * el object-fit. Sí podemos:
 *   - pedir MatchViewportRes y un tope de QP/bitrate por la query (el frontend
 *     de Epic los lee si useUrlParams está activo; AutoConnect ya lo está);
 *   - dibujar el iframe a clientWidth * devicePixelRatio y escalarlo con CSS
 *     para que quepa. Así el video element mide píxeles físicos y el stream,
 *     si obedece MatchViewportRes, no se estira por encima de su resolución.
 * ViewportResolutionScale=1 evita que un player nuevo vuelva a multiplicar
 * por el DPR encima de este truco.
 *
 * Lo que solo puede hacer el proceso de Unreal está en docs/neo-nitidez.md.
 */
(function (root) {
  'use strict';

  var BASE = 'https://neo-digitalavatar.csilvasantin.workers.dev/';

  function src(opts) {
    opts = opts || {};
    var muted = opts.muted !== false;
    var q = [
      'AutoConnect=true',
      'AutoPlayVideo=true',
      'StartVideoMuted=' + (muted ? 'true' : 'false'),
      'HoveringMouse=true',
      'MatchViewportRes=true',
      'ViewportResolutionScale=1',
      'MinQP=4',
      'MaxQP=18',
      'WebRTCMinBitrate=8000',
      'WebRTCMaxBitrate=20000',
      'WebRTCFPS=60'
    ];
    return BASE + 'uiless.html?' + q.join('&');
  }

  function fit(frame) {
    if (!frame || !frame.parentElement) return;
    var box = frame.parentElement;
    if (!box.classList.contains('da-neo-fit')) return;
    var dpr = Math.min(root.devicePixelRatio || 1, 2.5);
    var dw = box.clientWidth;
    var dh = box.clientHeight;
    if (dw < 2 || dh < 2) return;
    var lw = Math.round(dw * dpr);
    var lh = Math.round(dh * dpr);
    var longEdge = Math.max(lw, lh);
    var cap = 1920;
    if (longEdge > cap) {
      var scale = cap / longEdge;
      lw = Math.max(2, Math.round(lw * scale));
      lh = Math.max(2, Math.round(lh * scale));
    }
    frame.style.position = 'absolute';
    frame.style.inset = 'auto';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.width = lw + 'px';
    frame.style.height = lh + 'px';
    frame.style.maxWidth = 'none';
    frame.style.border = '0';
    frame.style.transformOrigin = '0 0';
    frame.style.transform = 'scale(' + (dw / lw) + ',' + (dh / lh) + ')';
  }

  function fill(frame) {
    if (!frame) return;
    frame.style.position = 'absolute';
    frame.style.inset = '0';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.width = '100%';
    frame.style.height = '100%';
    frame.style.maxWidth = 'none';
    frame.style.transform = 'none';
    frame.style.border = '0';
  }

  // null = aún no se sabe; true = host vivo; false = dos sondeos seguidos fallaron.
  function whenHost(maxMs) {
    maxMs = maxMs || 12000;
    return new Promise(function (res) {
      var t0 = Date.now();
      (function poll() {
        if (root.__daHostUp === true || root.__daHostUp === false) return res(root.__daHostUp);
        if (Date.now() - t0 >= maxMs) return res(null);
        setTimeout(poll, 200);
      })();
    });
  }

  // MP3 de ElevenLabs ~128 kbps. Sirve para el estado «hablando» cuando la voz
  // la pone el stream y este documento no reproduce el fichero.
  function clipMs(b64) {
    var bytes = Math.floor(String(b64 || '').length * 0.75);
    var ms = Math.round(bytes / 16);
    if (ms < 900) ms = 900;
    if (ms > 40000) ms = 40000;
    return ms;
  }

  function bindFit(frame) {
    if (!frame) return;
    function go() {
      if (frame.dataset.mode === 'web') return;
      fit(frame);
    }
    root.addEventListener('resize', go);
    if (root.ResizeObserver && frame.parentElement) {
      try { new root.ResizeObserver(go).observe(frame.parentElement); } catch (e) {}
    }
    go();
    root.requestAnimationFrame(go);
  }

  root.DANeoPlayer = {
    BASE: BASE,
    src: src,
    fit: fit,
    fill: fill,
    whenHost: whenHost,
    clipMs: clipMs,
    bindFit: bindFit,
    probe: BASE + 'images/favicon-32x32.png',
    // Avatar web mudo: se ve, no habla (la voz la pone esta página si el host cayó).
    webFallback: '/best.html?kiosk=1&embed=1&audio=off&listen=0'
  };
})(window);
