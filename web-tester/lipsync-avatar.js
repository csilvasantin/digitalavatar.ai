/* ============================================================================
 * DigitalAvatar.ai — Motor de lip-sync 2D en el navegador (offline, sin coste)
 * ----------------------------------------------------------------------------
 * Analiza CUALQUIER audio (el MP3 de ElevenLabs, un sample o el micro) con
 * WebAudio y mueve la boca de una cara 2D en tiempo real. No necesita internet,
 * ni datos de fonemas, ni servicios de pago.
 *
 *   AudioEngine    → extrae {open, spread, voiced} del sonido (lo que se oye)
 *   ProceduralSkin → cara vectorial de marca, variantes ♀/♂ que evocan a cada
 *                    actor de los vídeos (♀ castaño recogido + collar plata,
 *                    ♂ pelo plateado abundante + jersey negro), con expresividad
 *   LipSyncAvatar  → orquesta: bucle de render + vida idle
 *
 *   const av = new LipSyncAvatar(canvas, { accent:'#5fd0ff', gender:'female' });
 *   av.start(); av.connectAudioElement(audioEl); audioEl.play();
 *   av.setGender('male');
 * ========================================================================== */

(function (global) {
  'use strict';

  // ──────────────────────────────────────────────────────────────────────────
  class AudioEngine {
    constructor() {
      this.ctx = null; this.analyser = null;
      this.timeBuf = null; this.freqBuf = null;
      this.connected = false; this._elSource = null;
      this._gainRoll = 0.02;
      this.open = 0; this.spread = 0.5; this.voiced = 0;
    }
    _ensureCtx() {
      if (this.ctx) return;
      const AC = global.AudioContext || global.webkitAudioContext;
      this.ctx = new AC();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.55;
      this.timeBuf = new Uint8Array(this.analyser.fftSize);
      this.freqBuf = new Uint8Array(this.analyser.frequencyBinCount);
    }
    ensureContext() { this._ensureCtx(); if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    connectSource(node, toSpeakers = true) {
      this._ensureCtx(); node.connect(this.analyser);
      if (toSpeakers) this.analyser.connect(this.ctx.destination);
      this.connected = true;
    }
    connectElement(audioEl) {
      this._ensureCtx();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (this._elSource && this._elSource._el === audioEl) { this.connected = true; return; }
      try {
        const src = this.ctx.createMediaElementSource(audioEl);
        src._el = audioEl; src.connect(this.analyser); this.analyser.connect(this.ctx.destination);
        this._elSource = src; this.connected = true;
      } catch (e) { this.connected = true; }
    }
    async connectMic() {
      this._ensureCtx();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const src = this.ctx.createMediaStreamSource(stream);
      src.connect(this.analyser); this.connected = true; this._mic = stream;
      return stream;
    }
    stopMic() { if (this._mic) { this._mic.getTracks().forEach(t => t.stop()); this._mic = null; } }
    sample() {
      if (!this.connected || !this.analyser) {
        this.open *= 0.8; this.voiced *= 0.8;
        return { open: this.open, spread: this.spread, voiced: this.voiced };
      }
      const a = this.analyser;
      a.getByteTimeDomainData(this.timeBuf);
      a.getByteFrequencyData(this.freqBuf);
      let sum = 0;
      for (let i = 0; i < this.timeBuf.length; i++) { const v = (this.timeBuf[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / this.timeBuf.length);
      this._gainRoll = Math.max(rms, this._gainRoll * 0.995);
      const norm = this._gainRoll > 0.001 ? Math.min(1, rms / (this._gainRoll * 0.9)) : 0;
      const voicedTarget = rms > 0.012 ? 1 : 0;
      const sr = this.ctx.sampleRate || 44100;
      const hz = sr / this.analyser.fftSize;
      const band = (lo, hi) => {
        let s = 0, n = 0;
        const a0 = Math.max(1, (lo / hz) | 0), a1 = Math.min(this.freqBuf.length - 1, (hi / hz) | 0);
        for (let i = a0; i <= a1; i++) { s += this.freqBuf[i]; n++; }
        return n ? s / n / 255 : 0;
      };
      const mid = band(300, 1100), high = band(1800, 4000);
      const spreadTarget = high + mid > 0.01 ? Math.min(1, Math.max(0, (high / (high + mid)) * 1.4)) : 0.5;
      const atk = 0.55, rel = 0.28;
      const openT = norm * (0.35 + 0.65 * voicedTarget);
      this.open += (openT - this.open) * (openT > this.open ? atk : rel);
      this.voiced += (voicedTarget - this.voiced) * (voicedTarget > this.voiced ? 0.6 : 0.12);
      this.spread += (spreadTarget - this.spread) * 0.18;
      return { open: this.open, spread: this.spread, voiced: this.voiced };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Paletas que evocan a los actores de los vídeos
  // ──────────────────────────────────────────────────────────────────────────
  const PALETTES = {
    female: {
      skin: '#f0d3ba', shadow: '#d6ac8b', hair: '#2c1c14', browCol: '#2c1c14',
      lip: '#c0676a', lipFull: 1.0, brow: 4.0, jaw: 0.9, chin: 0.92,
      lashes: true, blush: true, hairStyle: 'female', collar: 'silver', eye: null,
    },
    male: {
      skin: '#ecceb2', shadow: '#caa583', hair: '#dadada', browCol: '#b4b4b4',
      lip: '#b58077', lipFull: 0.65, brow: 5.5, jaw: 1.09, chin: 1.06,
      lashes: false, blush: false, hairStyle: 'male', collar: 'dark', eye: '#3b7fb0',
    },
  };

  class ProceduralSkin {
    constructor(opts = {}) { this.accent = opts.accent || '#5fd0ff'; this.setGender(opts.gender || 'female'); }
    setGender(g) { this.gender = (g === 'male') ? 'male' : 'female'; this.pal = PALETTES[this.gender]; }

    draw(ctx, W, H, p, life) {
      const pal = this.pal;
      const cx = W / 2, cy = H / 2 + 6;
      const s = Math.min(W, H) / 320;
      const sway = Math.sin(life.t * 0.7) * 2 * s;
      const bob = -p.open * 5 * s + Math.sin(life.t * 1.6) * 1.5 * s;
      const breath = 1 + Math.sin(life.t * 1.6) * 0.012;
      const gx = life.gaze.x, gy = life.gaze.y;
      const irisCol = pal.eye || this.accent;
      const hw = 92 * s * pal.jaw, hh = 112 * s;

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(cx + sway, cy + bob);
      ctx.scale(breath, breath);

      // Halo de marca
      const halo = ctx.createRadialGradient(0, 0, 40 * s, 0, 0, 175 * s);
      halo.addColorStop(0, this._a(this.accent, 0.16)); halo.addColorStop(1, this._a(this.accent, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, 175 * s, 0, 6.3); ctx.fill();

      // Pelo TRASERO (volumen lateral)
      ctx.fillStyle = pal.hair;
      if (pal.hairStyle === 'female') {
        // recogido: volumen contenido a los lados, sin melena suelta
        ctx.beginPath(); ctx.ellipse(-70 * s, -6 * s, 26 * s, 64 * s, 0.2, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.ellipse(70 * s, -6 * s, 26 * s, 64 * s, -0.2, 0, 6.3); ctx.fill();
      } else {
        // plateado abundante: melena fuller que baja por los lados
        ctx.beginPath();
        ctx.moveTo(-96 * s, -40 * s);
        ctx.quadraticCurveTo(-128 * s, 50 * s, -88 * s, 96 * s);
        ctx.quadraticCurveTo(-58 * s, 70 * s, -64 * s, -10 * s);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(96 * s, -40 * s);
        ctx.quadraticCurveTo(128 * s, 50 * s, 88 * s, 96 * s);
        ctx.quadraticCurveTo(58 * s, 70 * s, 64 * s, -10 * s);
        ctx.closePath(); ctx.fill();
      }

      // Cuello + prenda (♀ collar plata alto · ♂ jersey negro)
      if (pal.collar === 'dark') {
        ctx.fillStyle = pal.shadow; this._rr(ctx, -30 * s, 66 * s, 60 * s, 50 * s, 16 * s); ctx.fill();
        ctx.fillStyle = '#16181c'; // jersey de cuello alto
        ctx.beginPath();
        ctx.moveTo(-104 * s, 150 * s); ctx.lineTo(-58 * s, 96 * s);
        ctx.quadraticCurveTo(0, 124 * s, 58 * s, 96 * s); ctx.lineTo(104 * s, 150 * s);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#202329'; this._rr(ctx, -40 * s, 86 * s, 80 * s, 26 * s, 13 * s); ctx.fill();
      } else {
        ctx.fillStyle = pal.shadow; this._rr(ctx, -30 * s, 66 * s, 60 * s, 50 * s, 16 * s); ctx.fill();
        const sil = ctx.createLinearGradient(0, 92 * s, 0, 150 * s);
        sil.addColorStop(0, '#cdd6dd'); sil.addColorStop(1, '#9fb0bd');
        ctx.fillStyle = sil;
        ctx.beginPath();
        ctx.moveTo(-104 * s, 150 * s); ctx.lineTo(-50 * s, 92 * s);
        ctx.quadraticCurveTo(0, 116 * s, 50 * s, 92 * s); ctx.lineTo(104 * s, 150 * s);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = this._a(this.accent, 0.5); ctx.lineWidth = 2 * s;
        ctx.beginPath(); ctx.moveTo(-50 * s, 92 * s); ctx.quadraticCurveTo(0, 116 * s, 50 * s, 92 * s); ctx.stroke();
      }

      // Cabeza
      const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
      grad.addColorStop(0, pal.skin); grad.addColorStop(1, pal.shadow);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -hh);
      ctx.bezierCurveTo(hw, -hh, hw, 30 * s, hw * pal.chin * 0.7, 78 * s);
      ctx.quadraticCurveTo(0, 118 * s, -hw * pal.chin * 0.7, 78 * s);
      ctx.bezierCurveTo(-hw, 30 * s, -hw, -hh, 0, -hh);
      ctx.closePath(); ctx.fill();

      // Rim light
      ctx.strokeStyle = this._a(this.accent, 0.5); ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, Math.PI * 0.12, Math.PI * 0.92); ctx.stroke();

      // Colorete (♀)
      if (pal.blush) {
        ctx.fillStyle = this._a('#e0807c', 0.16);
        ctx.beginPath(); ctx.ellipse(-46 * s, 30 * s, 16 * s, 10 * s, 0, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.ellipse(46 * s, 30 * s, 16 * s, 10 * s, 0, 0, 6.3); ctx.fill();
      }

      // Cejas
      const browLift = -life.brow * 6 * s;
      ctx.strokeStyle = pal.browCol; ctx.lineWidth = pal.brow * s; ctx.lineCap = 'round';
      this._brow(ctx, -34 * s, -26 * s + browLift, 26 * s, s);
      this._brow(ctx, 34 * s, -26 * s + browLift, -26 * s, s);

      // Ojos
      this._eye(ctx, -34 * s, -8 * s, s, life.blink, gx, gy, pal.lashes, irisCol);
      this._eye(ctx, 34 * s, -8 * s, s, life.blink, gx, gy, pal.lashes, irisCol);

      // Nariz
      ctx.strokeStyle = this._a(pal.shadow, 0.9); ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-4 * s, 6 * s); ctx.quadraticCurveTo(-10 * s, 24 * s, 2 * s, 28 * s); ctx.stroke();

      // Boca
      this._mouth(ctx, 0, 52 * s, s, p, life.smile, pal);

      // Pelo DELANTERO (volumen alto barrido hacia atrás)
      ctx.fillStyle = pal.hair;
      ctx.beginPath();
      if (pal.hairStyle === 'female') {
        ctx.moveTo(-hw - 2 * s, -38 * s);
        ctx.quadraticCurveTo(-104 * s, -120 * s, 0, -128 * s);
        ctx.quadraticCurveTo(104 * s, -120 * s, hw + 2 * s, -38 * s);
        ctx.quadraticCurveTo(46 * s, -72 * s, 22 * s, -78 * s);
        ctx.quadraticCurveTo(0, -86 * s, -22 * s, -78 * s);
        ctx.quadraticCurveTo(-46 * s, -72 * s, -hw - 2 * s, -38 * s);
      } else {
        ctx.moveTo(-hw - 8 * s, -8 * s);
        ctx.quadraticCurveTo(-120 * s, -124 * s, 0, -134 * s);
        ctx.quadraticCurveTo(120 * s, -124 * s, hw + 8 * s, -8 * s);
        ctx.quadraticCurveTo(64 * s, -58 * s, 26 * s, -62 * s);
        ctx.quadraticCurveTo(0, -70 * s, -26 * s, -62 * s);
        ctx.quadraticCurveTo(-64 * s, -58 * s, -hw - 8 * s, -8 * s);
      }
      ctx.closePath(); ctx.fill();
      // Brillo del pelo (mechón)
      ctx.strokeStyle = this._a('#ffffff', pal.hairStyle === 'male' ? 0.35 : 0.16);
      ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-40 * s, -104 * s); ctx.quadraticCurveTo(10 * s, -120 * s, 54 * s, -96 * s);
      ctx.stroke();

      ctx.restore();
    }

    _mouth(ctx, x, y, s, p, smile, pal) {
      const open = Math.max(0, Math.min(1, p.open));
      const spread = Math.max(0, Math.min(1, p.spread));
      const w = (28 + spread * 22 - (1 - spread) * 6) * s;
      const h = (2 + open * 30) * s;
      const corner = (1 - open) * smile * 7 * s;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = pal.lip;
      ctx.beginPath();
      ctx.moveTo(-w, -corner);
      ctx.quadraticCurveTo(0, -h - (3 + pal.lipFull * 3) * s, w, -corner);
      ctx.quadraticCurveTo(0, h + (4 + pal.lipFull * 4) * s, -w, -corner);
      ctx.closePath(); ctx.fill();
      if (open > 0.06) {
        ctx.fillStyle = '#3a1414';
        ctx.beginPath(); ctx.ellipse(0, 1 * s, w * 0.78, h * 0.82, 0, 0, 6.3); ctx.fill();
        if (open > 0.18) {
          const tw = w * (0.55 + spread * 0.25);
          ctx.fillStyle = '#f4ede4';
          this._rr(ctx, -tw, -h * 0.78, tw * 2, Math.min(8 * s, h * 0.5), 3 * s); ctx.fill();
        }
        if (open > 0.45 && spread < 0.5) {
          ctx.fillStyle = '#c4584f';
          ctx.beginPath(); ctx.ellipse(0, h * 0.42, w * 0.5, h * 0.32, 0, 0, 6.3); ctx.fill();
        }
      }
      ctx.strokeStyle = this._a('#ffffff', 0.22); ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(-w * 0.6, h * 0.5 + 2 * s);
      ctx.quadraticCurveTo(0, h * 0.7 + 4 * s, w * 0.6, h * 0.5 + 2 * s); ctx.stroke();
      ctx.restore();
    }

    _eye(ctx, x, y, s, blink, gx, gy, lashes, iris) {
      const openY = (1 - blink);
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = '#fbfbfb';
      ctx.beginPath(); ctx.ellipse(0, 0, 16 * s, 11 * s * openY + 0.5, 0, 0, 6.3); ctx.fill();
      if (openY > 0.25) {
        const ox = gx * 5 * s, oy = gy * 4 * s;
        ctx.fillStyle = iris;
        ctx.beginPath(); ctx.arc(ox, oy, 7 * s, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#101820';
        ctx.beginPath(); ctx.arc(ox, oy, 3.4 * s, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(ox - 2.4 * s, oy - 2.4 * s, 1.5 * s, 0, 6.3); ctx.fill();
      }
      ctx.strokeStyle = this.pal.shadow; ctx.lineWidth = 2.5 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(0, 0, 16 * s, 11 * s * openY + 0.5, 0, Math.PI * 1.04, Math.PI * 1.96); ctx.stroke();
      if (lashes && openY > 0.3) {
        ctx.strokeStyle = this.pal.hair; ctx.lineWidth = 2 * s;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(i * 9 * s, -10 * s * openY); ctx.lineTo(i * 11 * s, -15 * s * openY); ctx.stroke();
        }
      }
      ctx.restore();
    }

    _brow(ctx, x, y, dir, s) {
      ctx.beginPath();
      ctx.moveTo(x - dir * 0.5, y + 2 * s);
      ctx.quadraticCurveTo(x + dir * 0.5, y - 4 * s, x + dir, y);
      ctx.stroke();
    }
    _rr(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    _a(hex, a) {
      const c = hex.replace('#', '');
      return `rgba(${parseInt(c.substr(0,2),16)},${parseInt(c.substr(2,2),16)},${parseInt(c.substr(4,2),16)},${a})`;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  class LipSyncAvatar {
    constructor(canvas, opts = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.audio = new AudioEngine();
      this.skin = opts.skin || new ProceduralSkin(opts);
      this.dpr = Math.min(global.devicePixelRatio || 1, 2);
      this._raf = null; this._running = false;
      this.life = {
        t: 0, blink: 0, _opening: false, brow: 0, _nextBlink: 1.5,
        gaze: { x: 0, y: 0 }, gazeTarget: { x: 0, y: 0 }, _gazeTimer: 1.5, smile: 0.4,
      };
      this._fit();
      global.addEventListener('resize', () => this._fit());
    }
    _fit() {
      const r = this.canvas.getBoundingClientRect();
      const w = Math.max(80, r.width), h = Math.max(80, r.height);
      this.canvas.width = w * this.dpr; this.canvas.height = h * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this._W = w; this._H = h;
    }
    start() {
      if (this._running) return;
      this._running = true;
      let last = performance.now();
      const loop = (now) => {
        if (!this._running) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        this._tick(dt); this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    }
    stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); }
    connectAudioElement(el) { this.audio.connectElement(el); }
    async connectMic() { return this.audio.connectMic(); }
    stopMic() { this.audio.stopMic(); }
    ensureAudio() { return this.audio.ensureContext(); }
    connectSource(node, toSpeakers = true) { this.audio.connectSource(node, toSpeakers); }
    setGender(g) { this.skin.setGender && this.skin.setGender(g); }

    _tick(dt) {
      const L = this.life; L.t += dt;
      L._nextBlink -= dt;
      if (L._nextBlink <= 0 && L.blink === 0) { L.blink = 0.0001; L._opening = false; L._nextBlink = 2.5 + Math.random() * 3.5; }
      if (L.blink > 0) {
        L.blink += dt * (!L._opening ? 14 : -10);
        if (L.blink >= 1) { L.blink = 1; L._opening = true; }
        if (L.blink <= 0) { L.blink = 0; L._opening = false; }
      }
      L._gazeTimer -= dt;
      if (L._gazeTimer <= 0) {
        L.gazeTarget.x = (Math.random() * 2 - 1) * 0.55;
        L.gazeTarget.y = (Math.random() * 2 - 1) * 0.32;
        L._gazeTimer = 1.4 + Math.random() * 2.6;
      }
      L.gaze.x += (L.gazeTarget.x - L.gaze.x) * 0.05;
      L.gaze.y += (L.gazeTarget.y - L.gaze.y) * 0.05;

      const p = this.audio.sample();
      const browTarget = Math.min(1, p.open * 1.2) * p.voiced;
      L.brow += (browTarget - L.brow) * (browTarget > L.brow ? 0.4 : 0.06);
      const smileTarget = (1 - p.voiced) * 0.7 + 0.15;
      L.smile += (smileTarget - L.smile) * 0.05;

      const pp = { open: p.open * (0.25 + 0.75 * p.voiced), spread: p.spread, voiced: p.voiced };
      this.skin.draw(this.ctx, this._W, this._H, pp, L);
    }
  }

  global.LipSyncAvatar = LipSyncAvatar;
  global.LipSyncProceduralSkin = ProceduralSkin;
  global.LipSyncAudioEngine = AudioEngine;

})(window);
