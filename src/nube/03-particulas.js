  // ───────────────────────── Partículas ─────────────────────────
  function fx(node, ms) { if (REDUCED) return; el.fx.appendChild(node); setTimeout(function () { node.remove(); }, ms); }
  function zzz() {
    var t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('class', 'zzz'); t.setAttribute('x', 222 + Math.random() * 10); t.setAttribute('y', 40);
    t.textContent = Math.random() < 0.5 ? 'z' : 'Z'; fx(t, 2700);
  }
  function drop() {
    var p = document.createElementNS(SVGNS, 'path'), x = 90 + Math.random() * 100;
    p.setAttribute('class', 'gota'); p.setAttribute('d', 'M' + x + ',196 q-6,10 0,14 q6,-4 0,-14z'); fx(p, 1600);
  }
  function sparkle(n) {
    for (var i = 0; i < (n || 1); i++) {
      var s = document.createElementNS(SVGNS, 'path'), x = 20 + Math.random() * 240, y = -10 + Math.random() * 40;
      s.setAttribute('class', 'chispa');
      s.setAttribute('d', 'M' + x + ',' + (y - 9) + ' L' + (x + 2.5) + ',' + (y - 2.5) + ' L' + (x + 9) + ',' + y + ' L' + (x + 2.5) + ',' + (y + 2.5) + ' L' + x + ',' + (y + 9) + ' L' + (x - 2.5) + ',' + (y + 2.5) + ' L' + (x - 9) + ',' + y + ' L' + (x - 2.5) + ',' + (y - 2.5) + 'Z');
      s.style.animationDelay = (i * 0.15) + 's'; fx(s, 1700);
    }
  }
  function heart() {
    var h = document.createElementNS(SVGNS, 'path'), x = 205 + Math.random() * 20, y = 60;
    h.setAttribute('class', 'corazon');
    h.setAttribute('d', 'M' + x + ',' + y + ' c-4,-6 -13,-3 -10,4 c2,4 10,9 10,9 c0,0 8,-5 10,-9 c3,-7 -6,-10 -10,-4z'); fx(h, 1500);
  }

  // Gestos al azar cuando nadie la toca.
  function gesture() {
    var g = ['hop', 'wink', 'drop', 'sparkle', 'sway', 'look', 'hop', 'drop'][Math.floor(Math.random() * 8)];
    if (g === 'hop') { kick(0.8); S.hopV = 3; }
    else if (g === 'wink') { S.wink = 0; S.winkEye = Math.random() < 0.5 ? 0 : 1; }
    else if (g === 'drop') { drop(); setTimeout(drop, 380); }
    else if (g === 'sparkle') sparkle(2);
    else if (g === 'sway') S.tiltT = 1.4;
    else { S.gaze.tx = (Math.random() < 0.5 ? -1 : 1) * 0.9; S.gaze.ty = -0.3; S.gaze.next = 1.4; }
    return g;
  }
  window.__nubeGesture = gesture;

