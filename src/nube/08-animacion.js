  // ───────────────────────── /animacion (slash) ─────────────────────────
  // Carlos, 7-oct-2026: /animacion 1|giro … /animacion help. No van al cerebro.
  var DANCE_NUM = { '1': 'giro', '2': 'baile', '3': 'voltereta', '4': 'gelatina', '5': 'lluvia' };
  var DANCE_HELP = {
    es: {
      title: 'Animaciones de Admirito',
      lines: [
        '1 · giro — pirueta de dos vueltas y aterrizaje con squish',
        '2 · baile — de lado a lado al ritmo, con notas ♪',
        '3 · voltereta — mortal hacia atrás con cara feliz',
        '4 · gelatina — tiembla como un flan y saca bracitos disco',
        '5 · lluvia — le llueve encima, se sacude y sale un arcoíris'
      ],
      usage: 'Escribe /animacion <número|nombre>. También /animacion help.',
      playing: '¡Ahí va!',
      unknown: 'No conozco esa animación. Prueba /animacion help.',
      reduced: 'Con «reducir movimiento» las animaciones están apagadas.'
    },
    en: {
      title: "Admirito's animations",
      lines: [
        '1 · giro (spin) — a two-turn pirouette with a squash landing',
        '2 · baile (dance) — side-to-side bounce with ♪ notes',
        '3 · voltereta (flip) — a happy backflip',
        '4 · gelatina (jelly) — disco wobble with little cloud arms',
        '5 · lluvia (rain) — rains on itself, shakes off, then a rainbow'
      ],
      usage: 'Type /animacion <number|name>. Also /animacion help.',
      playing: 'Here goes!',
      unknown: "I don't know that animation. Try /animacion help.",
      reduced: 'With reduce-motion on, the animations stay off.'
    }
  };
  function danceHelpText() {
    var h = DANCE_HELP[LANG] || DANCE_HELP.es;
    return h.title + '\n' + h.lines.join('\n') + '\n' + h.usage;
  }

