'use strict';

// Portero del MetaHuman (#5733). Decide cuándo arrancar y apagar Unreal.
// No lanza procesos: el Mac ejecuta start/stop. Aquí solo está la política,
// para poder probarla sin GPU ni UnrealEditor.

const IDLE_MS = 10 * 60 * 1000;
const WAKING_TEXT = 'despertando el avatar…';

function createSession(opts) {
  const clock = opts && typeof opts.now === 'function' ? opts.now : function () { return Date.now(); };
  let phase = 'asleep';
  let viewers = 0;
  let quietSince = null;

  function message() {
    return phase === 'waking' ? WAKING_TEXT : '';
  }

  function decision(extra) {
    const out = {
      phase: phase,
      viewers: viewers,
      start: false,
      stop: false,
      message: message()
    };
    if (extra) {
      if (extra.start) out.start = true;
      if (extra.stop) out.stop = true;
    }
    return out;
  }

  function armQuiet() {
    if (viewers === 0) {
      if (quietSince == null) quietSince = clock();
    } else {
      quietSince = null;
    }
  }

  function maybeStop() {
    if (phase === 'asleep' || viewers > 0) return decision();
    if (quietSince == null) quietSince = clock();
    if (clock() - quietSince < IDLE_MS) return decision();
    phase = 'asleep';
    quietSince = null;
    return decision({ stop: true });
  }

  function requestStart() {
    if (phase !== 'asleep') return decision();
    phase = 'waking';
    armQuiet();
    return decision({ start: true });
  }

  return {
    viewers: function (n) {
      viewers = n > 0 ? n : 0;
      if (viewers > 0 && phase === 'asleep') return requestStart();
      armQuiet();
      return maybeStop();
    },
    wake: function () {
      return requestStart();
    },
    host: function (up) {
      if (up && phase === 'waking') {
        phase = 'up';
        armQuiet();
      }
      return maybeStop();
    },
    tick: function () {
      return maybeStop();
    },
    snapshot: function () {
      return { phase: phase, viewers: viewers, quietSince: quietSince, message: message() };
    }
  };
}

module.exports = {
  IDLE_MS: IDLE_MS,
  WAKING_TEXT: WAKING_TEXT,
  createSession: createSession
};
