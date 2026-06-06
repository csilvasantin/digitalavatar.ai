/**
 * DigitalAvatar.ai — 3D Engine
 * Three.js avatar con blendshapes Nvidia ACE Audio2Face-3D (52 ARKIT shapes)
 * Fallback: WebAudio RMS analysis (sin API key de Nvidia)
 *
 * Clases exportadas:
 *   Scene3D        — escena Three.js completa (renderer, cámara, loop)
 *   Avatar3D       — un avatar (canvas texture + GLB opcional)
 *   LipSyncPlayer  — reproduce frames de blendshapes sincronizados con audio
 *   AudioEngine    — análisis de audio para fallback lip-sync
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─────────────────────────────────────────────────────────────────────────────
// AudioEngine — analiza audio en tiempo real para lip-sync de fallback
// ─────────────────────────────────────────────────────────────────────────────
export class AudioEngine {
  constructor() {
    this.ctx = null; this.analyser = null;
    this.timeBuf = null; this.freqBuf = null;
    this.connected = false; this._elSource = null;
    this._gainRoll = 0.02;
    this.open = 0; this.spread = 0.5; this.voiced = 0;
  }
  _init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.55;
    this.timeBuf = new Uint8Array(this.analyser.fftSize);
    this.freqBuf = new Uint8Array(this.analyser.frequencyBinCount);
  }
  resume() { this._init(); if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
  connectElement(el) {
    this._init(); this.ctx.resume();
    if (this._elSource?._el === el) { this.connected = true; return; }
    try {
      const src = this.ctx.createMediaElementSource(el);
      src._el = el; src.connect(this.analyser); this.analyser.connect(this.ctx.destination);
      this._elSource = src; this.connected = true;
    } catch { this.connected = true; }
  }
  sample() {
    if (!this.connected || !this.analyser) { this.open *= 0.8; this.voiced *= 0.8; return this; }
    const a = this.analyser;
    a.getByteTimeDomainData(this.timeBuf); a.getByteFrequencyData(this.freqBuf);
    let sum = 0;
    for (let i = 0; i < this.timeBuf.length; i++) { const v = (this.timeBuf[i] - 128) / 128; sum += v * v; }
    const rms = Math.sqrt(sum / this.timeBuf.length);
    this._gainRoll = Math.max(rms, this._gainRoll * 0.995);
    const norm = this._gainRoll > 0.001 ? Math.min(1, rms / (this._gainRoll * 0.9)) : 0;
    const voicedT = rms > 0.012 ? 1 : 0;
    const sr = this.ctx.sampleRate || 44100, hz = sr / this.analyser.fftSize;
    const band = (lo, hi) => {
      let s = 0, n = 0;
      const a0 = Math.max(1, (lo / hz) | 0), a1 = Math.min(this.freqBuf.length - 1, (hi / hz) | 0);
      for (let i = a0; i <= a1; i++) { s += this.freqBuf[i]; n++; }
      return n ? s / n / 255 : 0;
    };
    const mid = band(300, 1100), high = band(1800, 4000);
    const spreadT = high + mid > 0.01 ? Math.min(1, Math.max(0, (high / (high + mid)) * 1.4)) : 0.5;
    const openT = norm * (0.35 + 0.65 * voicedT);
    this.open  += (openT  - this.open)  * (openT  > this.open  ? 0.55 : 0.28);
    this.voiced += (voicedT - this.voiced) * (voicedT > this.voiced ? 0.6  : 0.12);
    this.spread += (spreadT - this.spread) * 0.18;
    return this;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LipSyncPlayer — reproduce frames de blendshapes de Nvidia ACE
// sincronizados con la reproducción de un HTMLAudioElement
// ─────────────────────────────────────────────────────────────────────────────
export class LipSyncPlayer {
  constructor() { this._frames = []; this._audio = null; }

  /** @param {Array<{time:number, shapes:Object}>} frames */
  load(frames) { this._frames = frames.slice().sort((a, b) => a.time - b.time); }

  /** @param {HTMLAudioElement} audioEl */
  attach(audioEl) { this._audio = audioEl; }

  /** Devuelve los shapes interpolados para el instante actual del audio */
  sample() {
    if (!this._audio || !this._frames.length) return null;
    const t = this._audio.currentTime;
    const frames = this._frames;
    if (t <= frames[0].time) return frames[0].shapes;
    if (t >= frames[frames.length - 1].time) return frames[frames.length - 1].shapes;
    // búsqueda binaria del frame actual
    let lo = 0, hi = frames.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (frames[mid].time <= t) lo = mid; else hi = mid;
    }
    const a = frames[lo], b = frames[hi];
    const alpha = (t - a.time) / (b.time - a.time + 1e-9);
    const out = {};
    for (const k in a.shapes) out[k] = a.shapes[k] + (b.shapes[k] - a.shapes[k]) * alpha;
    return out;
  }

  /** True si hay blendshapes cargados */
  get hasFrames() { return this._frames.length > 0; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Paletas de color para cada género (evocando a los actores reales)
// ─────────────────────────────────────────────────────────────────────────────
const PALETTES = {
  female: {
    skin:'#f0d3ba', shadow:'#d6ac8b', hair:'#2c1c14', browCol:'#2c1c14',
    lip:'#c0676a', lipFull:1.0, brow:4.0, jaw:0.9, chin:0.92,
    lashes:true, blush:true, hairStyle:'female',
  },
  male: {
    skin:'#ecceb2', shadow:'#caa583', hair:'#dadada', browCol:'#b4b4b4',
    lip:'#b58077', lipFull:0.65, brow:5.5, jaw:1.09, chin:1.06,
    lashes:false, blush:false, hairStyle:'male', eye:'#3b7fb0',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FaceRenderer — dibuja la cara en un OffscreenCanvas / canvas 2D
// Acepta tanto shapes de AudioEngine (fallback) como blendshapes de ACE
// ─────────────────────────────────────────────────────────────────────────────
export class FaceRenderer {
  constructor(width = 256, height = 342, accent = '#5fd0ff') {
    this.W = width; this.H = height; this.accent = accent;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width; this.canvas.height = height;
    this.ctx2d = this.canvas.getContext('2d');
    this._gender = 'female';
    this._t = 0; // tiempo para animaciones idle
    this._gaze = { x: 0, y: 0 };
    this._blink = 0;
    this._blinkTimer = Math.random() * 3;
  }

  setGender(g) { this._gender = (g === 'male') ? 'male' : 'female'; }

  /** shapes: { jawOpen, eyeBlinkLeft, browInnerUp, mouthSmileLeft, … } o null */
  draw(shapes, delta = 0.016) {
    this._t += delta;
    this._updateBlink(delta, shapes);

    const pal = PALETTES[this._gender];
    const { W, H, ctx2d: ctx, accent } = this;
    const cx = W / 2, cy = H / 2 + 6;
    const s = Math.min(W, H) / 320;

    // idle sway & bob
    const sway = Math.sin(this._t * 0.7) * 2 * s;
    const bob  = Math.sin(this._t * 1.6) * 1.5 * s;
    const breathScale = 1 + Math.sin(this._t * 1.6) * 0.012;

    // extraer valores de blendshapes o fallback
    const jawOpen      = shapes?.jawOpen      ?? 0;
    const eyeBlinkL    = shapes?.eyeBlinkLeft  ?? this._blink;
    const eyeBlinkR    = shapes?.eyeBlinkRight ?? this._blink;
    const eyeWideL     = shapes?.eyeWideLeft   ?? 0;
    const browInnUp    = shapes?.browInnerUp   ?? 0;
    const browDownL    = shapes?.browDownLeft  ?? 0;
    const smileL       = shapes?.mouthSmileLeft ?? 0;
    const smileR       = shapes?.mouthSmileRight ?? 0;
    const frownL       = shapes?.mouthFrownLeft ?? 0;
    const mouthClose   = shapes?.mouthClose    ?? 0;

    const smile   = (smileL + smileR) / 2;
    const frown   = frownL;
    const eyeOpen = 1 - Math.max(eyeBlinkL, eyeBlinkR);
    const eyeWide = eyeWideL;
    const browUp  = browInnUp - browDownL;
    const mouth   = Math.max(0, jawOpen - mouthClose * 0.3);

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(cx + sway, cy + bob);
    ctx.scale(breathScale, breathScale);

    // halo de marca
    const halo = ctx.createRadialGradient(0, 0, 30*s, 0, 0, 170*s);
    halo.addColorStop(0, this._a(accent, 0.18));
    halo.addColorStop(1, this._a(accent, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, 170*s, 0, Math.PI*2); ctx.fill();

    // pelo trasero
    ctx.fillStyle = pal.hair;
    if (pal.hairStyle === 'female') {
      ctx.beginPath(); ctx.ellipse(-68*s, -8*s, 24*s, 60*s, 0.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( 68*s, -8*s, 24*s, 60*s,-0.2, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-94*s,-42*s); ctx.quadraticCurveTo(-126*s,52*s,-86*s,98*s);
      ctx.lineTo(-78*s,98*s);  ctx.quadraticCurveTo(-110*s,50*s,-78*s,-34*s);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(94*s,-42*s);  ctx.quadraticCurveTo(126*s,52*s,86*s,98*s);
      ctx.lineTo(78*s,98*s);   ctx.quadraticCurveTo(110*s,50*s,78*s,-34*s);
      ctx.fill();
    }

    // cara
    const hw = 88*s*pal.jaw, hh = 108*s;
    ctx.fillStyle = pal.skin;
    ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI*2); ctx.fill();

    // sombra lateral
    const shadowGrad = ctx.createLinearGradient(-hw, 0, hw, 0);
    shadowGrad.addColorStop(0, this._a(pal.shadow, 0.35));
    shadowGrad.addColorStop(0.25, this._a(pal.shadow, 0));
    shadowGrad.addColorStop(0.75, this._a(pal.shadow, 0));
    shadowGrad.addColorStop(1, this._a(pal.shadow, 0.35));
    ctx.fillStyle = shadowGrad;
    ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI*2); ctx.fill();

    // blush
    if (pal.blush) {
      ctx.fillStyle = this._a('#e87070', 0.12);
      ctx.beginPath(); ctx.ellipse(-44*s, 22*s, 24*s, 12*s, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( 44*s, 22*s, 24*s, 12*s, 0, 0, Math.PI*2); ctx.fill();
    }

    // ───── cejas ─────
    const browY = -54*s + browUp * 8*s;
    ctx.strokeStyle = pal.browCol; ctx.lineWidth = pal.brow * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-34*s, browY - browUp*2*s); ctx.quadraticCurveTo(-20*s, browY - 3*s, -6*s, browY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 34*s, browY - browUp*2*s); ctx.quadraticCurveTo( 20*s, browY - 3*s,  6*s, browY); ctx.stroke();

    // ───── ojos ─────
    const eyeY = -26*s;
    const eyeH = 14 * eyeOpen * s * (1 + eyeWide * 0.4);
    this._drawEye(ctx, -30*s, eyeY, 20*s, eyeH, pal, accent, s);
    this._drawEye(ctx,  30*s, eyeY, 20*s, eyeH, pal, accent, s);

    // ───── nariz ─────
    ctx.strokeStyle = this._a(pal.shadow, 0.6); ctx.lineWidth = 1.5*s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-7*s, 6*s); ctx.quadraticCurveTo(-12*s, 16*s, -5*s, 18*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 7*s, 6*s); ctx.quadraticCurveTo( 12*s, 16*s,  5*s, 18*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5*s, 18*s); ctx.quadraticCurveTo(0, 20*s, 5*s, 18*s); ctx.stroke();

    // ───── boca ─────
    const mouthY = 44*s;
    const mouthW = (34 + smile * 12 - frown * 6) * s;
    const mouthH = mouth * 18*s * pal.lipFull;
    // labio superior
    ctx.fillStyle = pal.lip;
    ctx.beginPath();
    ctx.moveTo(-mouthW, mouthY);
    ctx.quadraticCurveTo(-mouthW*0.5, mouthY - 5*s - smile*3*s, 0, mouthY - 4*s);
    ctx.quadraticCurveTo( mouthW*0.5, mouthY - 5*s - smile*3*s, mouthW, mouthY);
    ctx.quadraticCurveTo(0, mouthY + mouthH * 0.2, -mouthW, mouthY);
    ctx.fill();
    // apertura de boca
    if (mouthH > 1) {
      ctx.fillStyle = '#1a0a0a';
      ctx.beginPath();
      ctx.ellipse(0, mouthY + mouthH*0.4, mouthW*0.7, mouthH*0.6, 0, 0, Math.PI*2);
      ctx.fill();
      // dientes
      ctx.fillStyle = '#fff8f2';
      ctx.beginPath();
      ctx.ellipse(0, mouthY + mouthH*0.25, mouthW*0.55, mouthH*0.3, 0, 0, Math.PI*2);
      ctx.fill();
    }
    // labio inferior
    ctx.strokeStyle = this._a(pal.lip, 0.5); ctx.lineWidth = 1.8*s;
    ctx.beginPath();
    ctx.moveTo(-mouthW*0.7, mouthY + mouthH * 0.3);
    ctx.quadraticCurveTo(0, mouthY + mouthH + 8*s + smile*4*s - frown*6*s, mouthW*0.7, mouthY + mouthH * 0.3);
    ctx.stroke();

    // curva smile / frown
    if (smile > 0.1 || frown > 0.1) {
      ctx.strokeStyle = this._a(pal.lip, 0.4); ctx.lineWidth = 1.5*s;
      const curveY = mouthY + mouthH*0.2 + (smile - frown) * 6*s;
      ctx.beginPath();
      ctx.moveTo(-mouthW, mouthY);
      ctx.quadraticCurveTo(-mouthW * 1.1, curveY, -mouthW * 0.85, mouthY + mouthH * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mouthW, mouthY);
      ctx.quadraticCurveTo(mouthW * 1.1, curveY, mouthW * 0.85, mouthY + mouthH * 0.6);
      ctx.stroke();
    }

    // pelo frontal
    ctx.fillStyle = pal.hair;
    if (pal.hairStyle === 'female') {
      // moño
      ctx.beginPath(); ctx.ellipse(0, -92*s, 26*s, 18*s, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -88*s, 42*s, 24*s, 0, 0, Math.PI*2); ctx.fill();
      // banda horizontal
      ctx.fillRect(-44*s, -78*s, 88*s, 18*s);
      // cubrición de frente
      ctx.beginPath(); ctx.ellipse(0, -66*s, 86*s, 26*s, 0, 0, Math.PI*2); ctx.fill();
    } else {
      // cabello plateado abundante
      ctx.beginPath();
      ctx.ellipse(0, -82*s, 82*s, 38*s, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -58*s, 90*s, 22*s, 0, 0, Math.PI*2); ctx.fill();
      // patillas
      ctx.beginPath(); ctx.ellipse(-80*s, 0, 18*s, 42*s, 0.15, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( 80*s, 0, 18*s, 42*s,-0.15, 0, Math.PI*2); ctx.fill();
    }

    // pestañas (femenino)
    if (pal.lashes) {
      ctx.strokeStyle = '#1a0a08'; ctx.lineWidth = 1.8*s; ctx.lineCap = 'round';
      for (let i = -3; i <= 3; i++) {
        const lx = -30*s + i*5*s, ly = eyeY - eyeH;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + i*1.5*s, ly - 8*s); ctx.stroke();
        const rx = 30*s + i*5*s;
        ctx.beginPath(); ctx.moveTo(rx, ly); ctx.lineTo(rx + i*1.5*s, ly - 8*s); ctx.stroke();
      }
    }

    // collar
    const collarY = hh * 0.82;
    if (this._gender === 'female') {
      ctx.strokeStyle = '#d0d8e0'; ctx.lineWidth = 2*s;
      ctx.beginPath(); ctx.arc(0, collarY, 20*s, Math.PI*0.1, Math.PI*0.9); ctx.stroke();
    } else {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(0, collarY, 28*s, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.moveTo(-8*s, collarY - 28*s); ctx.lineTo(0, collarY + 6*s); ctx.lineTo(8*s, collarY - 28*s); ctx.fill();
    }

    ctx.restore();

    // scanlines holográficas (tenues)
    ctx.fillStyle = this._a('#000010', 0.12);
    for (let y = 0; y < H; y += 4) {
      ctx.fillRect(0, y, W, 1);
    }
  }

  _drawEye(ctx, ex, ey, ew, eh, pal, accent, s) {
    if (eh < 0.5) {
      // parpadeo
      ctx.strokeStyle = pal.shadow; ctx.lineWidth = 1.5*s;
      ctx.beginPath(); ctx.moveTo(ex - ew*0.8, ey); ctx.lineTo(ex + ew*0.8, ey); ctx.stroke();
      return;
    }
    // blanco
    ctx.fillStyle = '#fdf8f3';
    ctx.beginPath(); ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI*2); ctx.fill();
    // iris
    const irisCol = pal.eye || accent;
    ctx.fillStyle = irisCol;
    ctx.beginPath(); ctx.ellipse(ex, ey, ew*0.52, eh*0.78, 0, 0, Math.PI*2); ctx.fill();
    // pupila
    ctx.fillStyle = '#0d0508';
    ctx.beginPath(); ctx.ellipse(ex, ey, ew*0.24, eh*0.40, 0, 0, Math.PI*2); ctx.fill();
    // brillo
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.beginPath(); ctx.ellipse(ex - ew*0.18, ey - eh*0.22, ew*0.10, eh*0.12, 0, 0, Math.PI*2); ctx.fill();
    // borde superior del ojo
    ctx.strokeStyle = this._a(pal.browCol, 0.7); ctx.lineWidth = 1.2*s;
    ctx.beginPath(); ctx.ellipse(ex, ey, ew, eh, 0, Math.PI, Math.PI*2); ctx.stroke();
  }

  _updateBlink(dt, shapes) {
    if (shapes?.eyeBlinkLeft != null) { this._blink = 0; return; }
    this._blinkTimer -= dt;
    if (this._blinkTimer <= 0) {
      this._blink = 1;
      this._blinkTimer = 2.5 + Math.random() * 3;
      setTimeout(() => { this._blink = 0; }, 120);
    }
  }

  _a(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar3D — un avatar dentro de la escena Three.js
// ─────────────────────────────────────────────────────────────────────────────
export class Avatar3D {
  /**
   * @param {THREE.Scene} scene
   * @param {'female'|'male'} gender
   * @param {THREE.Vector3} position
   * @param {{ accent?:string, glbUrl?:string }} opts
   */
  constructor(scene, gender, position, opts = {}) {
    this.scene    = scene;
    this.gender   = gender;
    this.accent   = opts.accent || '#5fd0ff';
    this.position = position;
    this.group    = new THREE.Group();
    this.group.position.copy(position);
    scene.add(this.group);

    this.faceRenderer = new FaceRenderer(256, 342, this.accent);
    this.faceRenderer.setGender(gender);

    this.audio    = new AudioEngine();
    this.player   = new LipSyncPlayer();
    this._audioEl = null;
    this._shapes  = null;

    this._idle    = { t: 0, floatPhase: Math.random() * Math.PI * 2 };

    this._buildCanvas();
    this._buildFrame();
    this._buildGlow();
    this._buildNameTag(gender);

    if (opts.glbUrl) this.loadGLB(opts.glbUrl);
  }

  _buildCanvas() {
    this._canvasTex = new THREE.CanvasTexture(this.faceRenderer.canvas);
    const mat = new THREE.MeshBasicMaterial({ map: this._canvasTex, transparent: false });
    const geo = new THREE.PlaneGeometry(1.6, 2.14);
    this._facePlane = new THREE.Mesh(geo, mat);
    this.group.add(this._facePlane);
  }

  _buildFrame() {
    // Marco holográfico con bordes redondeados (EdgesGeometry de BoxGeometry plano)
    const geo = new THREE.BoxGeometry(1.72, 2.26, 0.02);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(this.accent), transparent: true, opacity: 0.85 });
    this._frame = new THREE.LineSegments(edges, mat);
    this._frame.position.z = -0.01;
    this.group.add(this._frame);

    // Segunda línea de marco más tenue (efecto doble borde)
    const geo2 = new THREE.BoxGeometry(1.78, 2.32, 0.02);
    const edges2 = new THREE.EdgesGeometry(geo2);
    const mat2 = new THREE.LineBasicMaterial({ color: new THREE.Color(this.accent), transparent: true, opacity: 0.25 });
    this._frame2 = new THREE.LineSegments(edges2, mat2);
    this._frame2.position.z = -0.015;
    this.group.add(this._frame2);
  }

  _buildGlow() {
    // Glow detrás del avatar (sprite con blending aditivo)
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    const c = new THREE.Color(this.accent);
    grad.addColorStop(0, `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},0.3)`);
    grad.addColorStop(0.4, `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},0.08)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true });
    this._glow = new THREE.Sprite(mat);
    this._glow.scale.set(3.5, 3.5, 1);
    this._glow.position.z = -0.1;
    this.group.add(this._glow);
  }

  _buildNameTag(gender) {
    // Etiqueta de nombre como sprite de canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    this._nameCanvas = canvas;
    this._nameTex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: this._nameTex, transparent: true });
    this._nameSprite = new THREE.Sprite(mat);
    this._nameSprite.scale.set(1.6, 0.4, 1);
    this._nameSprite.position.set(0, 1.4, 0.02);
    this.group.add(this._nameSprite);
    this.setNameLabel(gender === 'female' ? 'MOTHER' : 'FATHER');
  }

  setNameLabel(text) {
    const canvas = this._nameCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(5,16,26,0.75)`;
    ctx.roundRect?.(8, 12, canvas.width - 16, canvas.height - 24, 10);
    ctx.fill();
    ctx.strokeStyle = this.accent; ctx.lineWidth = 1.5;
    ctx.roundRect?.(8, 12, canvas.width - 16, canvas.height - 24, 10);
    ctx.stroke();
    ctx.fillStyle = this.accent;
    ctx.font = 'bold 22px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    this._nameTex.needsUpdate = true;
  }

  setLive(on) {
    // Pulsa el brillo del marco cuando el avatar está "hablando"
    this._live = on;
  }

  /** Carga un GLB con morph targets ARKIT y lo usa en lugar del canvas */
  loadGLB(url) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      this._glb = gltf.scene;
      // Buscar la malla con morph targets
      gltf.scene.traverse(node => {
        if (node.isMesh && node.morphTargetDictionary) {
          this._morphMesh = node;
          this._morphDict = node.morphTargetDictionary;
        }
      });
      // Ajustar escala/posición para que encaje en el frame
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const scale = 2.0 / Math.max(size.x, size.y);
      gltf.scene.scale.setScalar(scale);
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.sub(center.multiplyScalar(scale));
      gltf.scene.position.y += 0.1;
      // Ocultar el canvas y mostrar el GLB
      this._facePlane.visible = false;
      this.group.add(gltf.scene);
      console.log(`[Avatar3D] GLB cargado (${Object.keys(this._morphDict || {}).length} morph targets)`);
    }, undefined, err => {
      console.warn('[Avatar3D] GLB no cargado, usando canvas 2D:', err.message);
    });
  }

  /** Adjunta blendshapes de Nvidia ACE (sobrescriben al LipSyncPlayer) */
  setBlendshapes(frames) {
    this.player.load(frames);
  }

  /** Conecta el HTMLAudioElement para el fallback de AudioEngine */
  connectAudioElement(el) {
    this._audioEl = el;
    this.audio.connectElement(el);
    this.player.attach(el);
  }

  /** Llamado cada frame desde Scene3D.update() */
  update(delta) {
    const idle = this._idle;
    idle.t += delta;
    // Flotación suave
    this.group.position.y = this.position.y + Math.sin(idle.t * 0.7 + idle.floatPhase) * 0.04;
    // Pulso del marco cuando está en vivo
    if (this._live) {
      const pulse = 0.6 + Math.sin(idle.t * 6) * 0.4;
      this._frame.material.opacity = 0.7 + pulse * 0.3;
    } else {
      this._frame.material.opacity = 0.85;
    }

    // Obtener shapes: primero ACE player, luego AudioEngine, luego idle
    let shapes = null;
    if (this.player.hasFrames) {
      shapes = this.player.sample();
    } else if (this._audioEl && !this._audioEl.paused) {
      const ae = this.audio.sample();
      shapes = {
        jawOpen:         ae.open * 0.9,
        mouthSmileLeft:  ae.spread * 0.3,
        mouthSmileRight: ae.spread * 0.3,
        eyeBlinkLeft:    0,
        eyeBlinkRight:   0,
      };
    }

    // Aplicar shapes al GLB si está disponible
    if (this._morphMesh && shapes) {
      this._applyMorphShapes(shapes);
    }

    // Redibujar la cara en canvas (siempre, incluso si hay GLB — la textura se actualiza)
    this.faceRenderer.draw(shapes, delta);
    if (!this._glb) {
      this._canvasTex.needsUpdate = true;
    }
  }

  _applyMorphShapes(shapes) {
    const dict = this._morphDict;
    const influences = this._morphMesh.morphTargetInfluences;
    for (const [name, value] of Object.entries(shapes)) {
      const idx = dict[name] ?? dict[name.charAt(0).toUpperCase() + name.slice(1)];
      if (idx !== undefined) influences[idx] = value;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene3D — escena Three.js completa
// ─────────────────────────────────────────────────────────────────────────────
export class Scene3D {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ accent?:string }} opts
   */
  constructor(canvas, opts = {}) {
    this.canvas  = canvas;
    this.accent  = opts.accent || '#5fd0ff';
    this.avatars = {};
    this._clock  = new THREE.Clock();
    this._running = false;

    this._initRenderer();
    this._initCamera();
    this._initScene();
    this._initLights();
    this._initParticles();
    this._bindResize();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,          // fondo transparente → CSS maneja el gradiente
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._resize();
  }

  _initCamera() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    this.camera.position.set(0, 0.15, 7.5);
    this.camera.lookAt(0, 0, 0);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    // No background: deja que CSS dibuje el gradiente
  }

  _initLights() {
    // Ambiental
    this.scene.add(new THREE.AmbientLight(0xdff3ff, 0.55));
    // Luz principal (cálida, desde arriba-derecha)
    const main = new THREE.DirectionalLight(0xfff0e0, 1.2);
    main.position.set(3, 4, 5);
    this.scene.add(main);
    // Fill (fría, desde izquierda)
    const fill = new THREE.DirectionalLight(0xc0e8ff, 0.5);
    fill.position.set(-4, 1, 3);
    this.scene.add(fill);
    // Rim (desde atrás, azul accent)
    const rim = new THREE.DirectionalLight(new THREE.Color(this.accent), 0.3);
    rim.position.set(0, -2, -4);
    this.scene.add(rim);
  }

  _initParticles() {
    // Partículas flotantes de fondo
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 18;
      pos[i*3+1] = (Math.random() - 0.5) * 12;
      pos[i*3+2] = (Math.random() - 0.5) * 8 - 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(this.accent),
      size: 0.03,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._particles = new THREE.Points(geo, mat);
    this.scene.add(this._particles);
  }

  _bindResize() {
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
  }

  _resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Añade un avatar a la escena
   * @param {'female'|'male'} gender
   * @param {number} x  posición X
   * @param {{ glbUrl?:string }} opts
   * @returns {Avatar3D}
   */
  addAvatar(gender, x, opts = {}) {
    const pos = new THREE.Vector3(x, 0, 0);
    const av = new Avatar3D(this.scene, gender, pos, { accent: this.accent, ...opts });
    this.avatars[gender] = av;
    return av;
  }

  getAvatar(gender) { return this.avatars[gender] ?? null; }

  /** Inicia el loop de render */
  start() {
    this._running = true;
    this._clock.start();
    const loop = () => {
      if (!this._running) return;
      requestAnimationFrame(loop);
      const delta = this._clock.getDelta();
      // Rotar partículas suavemente
      this._particles.rotation.y += delta * 0.03;
      this._particles.rotation.x += delta * 0.01;
      // Actualizar avatares
      for (const av of Object.values(this.avatars)) av.update(delta);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  stop() {
    this._running = false;
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}
