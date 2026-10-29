  // ───────────────────────── Cuerpo (SVG) ─────────────────────────
  var el = {
    svg: $('nube'), flota: $('flota'), cuerpo: $('cuerpo'), ojoI: $('ojoI'), ojoD: $('ojoD'), ojos: $('ojos'),
    felices: $('ojosFelices'), mejI: $('mejI'), mejD: $('mejD'), boca: $('bocaForma'), clip: $('bocaClipPath'),
    lengua: $('lengua'), piensa: $('piensa'), fx: $('fx'), sombra: $('sombra')
  };
  var CX = 138.5, BASE_Y = 190;           // pie de la nube (origen del squish)
  var EYES = [{ g: el.ojoI, x: 111, y: 110 }, { g: el.ojoD, x: 166, y: 110 }];

  // Boca: a = apertura 0..1, r = redondez 0..1 (o/u). Cerrada = la sonrisa original.
  function mouthPath(a, r) {
    var y = 135, hw = 16.5 * (1 - 0.38 * r) * (1 + 0.08 * a), up = 14 * (1 - 0.75 * a) + 2 * r * a, down = up + 6 + 30 * a * (1 + 0.25 * r);
    if (a < 0.02) return 'M' + (CX - 16.5) + ',' + y + ' Q' + CX + ',' + (y + 18) + ' ' + (CX + 16.5) + ',' + y;
    return 'M' + (CX - hw).toFixed(2) + ',' + y + ' Q' + CX + ',' + (y + up).toFixed(2) + ' ' + (CX + hw).toFixed(2) + ',' + y +
      ' Q' + CX + ',' + (y + down).toFixed(2) + ' ' + (CX - hw).toFixed(2) + ',' + y + 'Z';
  }
  var mouth = { a: 0, r: 0, ta: 0, tr: 0 };
  function drawMouth() {
    var d = mouthPath(mouth.a, mouth.r);
    el.boca.setAttribute('d', d);
    el.boca.setAttribute('fill', mouth.a < 0.02 ? 'none' : '#1d2b12');
    el.clip.setAttribute('d', mouth.a < 0.02 ? 'M0,0Z' : d);
    el.lengua.setAttribute('cy', (135 + 8 + 26 * mouth.a).toFixed(2));
  }

