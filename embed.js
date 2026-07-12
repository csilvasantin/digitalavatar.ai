// digitalavatar.ai · EMBED — avatar digital embebible (fuente única).
// Cualquier web (p.ej. Yokup) lo consume EN VIVO:
//   import { mount } from "https://digitalavatar.ai/embed.js";
//   mount({ brainUrl:"https://.../copilot", title:"Admira", greeting:"Hola…" });
// Las mejoras que se hagan AQUÍ (modelo, render, lip-sync, voz) llegan solas a quien lo embebe.
//
// El módulo se auto-localiza sus assets con import.meta.url → SIEMPRE los de digitalavatar.ai,
// aunque se ejecute en otro origen. three.js se carga con import() dinámico (tolerante a fallos):
// la UI + chat + voz aparecen siempre; el 3D es una capa que degrada con elegancia.
const SELF = new URL(".", import.meta.url).href;      // → https://digitalavatar.ai/
const V = "0.160.0";

// ---- lip-sync (visemes ARKit) — independiente de three.js ----
const VIS = {
  sil:{}, aa:{jawOpen:.55,mouthLowerDown_L:.18,mouthLowerDown_R:.18},
  E:{jawOpen:.30,mouthSmile_L:.16,mouthSmile_R:.16,mouthStretch_L:.12,mouthStretch_R:.12},
  I:{jawOpen:.16,mouthSmile_L:.34,mouthSmile_R:.34,mouthStretch_L:.18,mouthStretch_R:.18},
  O:{jawOpen:.42,mouthFunnel:.52,mouthPucker:.30}, U:{jawOpen:.20,mouthPucker:.70,mouthFunnel:.26},
  PP:{mouthPress_L:.4,mouthPress_R:.4,jawOpen:.03}, FF:{mouthLowerDown_L:.2,mouthLowerDown_R:.2,jawOpen:.14,mouthFunnel:.12},
  DD:{jawOpen:.22,mouthShrugUpper:.1}, nn:{jawOpen:.14}, RR:{jawOpen:.24,mouthFunnel:.2},
  SS:{jawOpen:.10,mouthSmile_L:.12,mouthSmile_R:.12}, kk:{jawOpen:.26}, CH:{jawOpen:.20,mouthFunnel:.36,mouthPucker:.2}, TH:{jawOpen:.20}
};
const MOUTH = ["jawOpen","mouthLowerDown_L","mouthLowerDown_R","mouthSmile_L","mouthSmile_R","mouthStretch_L","mouthStretch_R","mouthFunnel","mouthPucker","mouthPress_L","mouthPress_R","mouthShrugUpper"];
function charToViseme(c, n) {
  c = (c || "").toLowerCase(); const two = c + (n || "").toLowerCase();
  if (two==="ch"||two==="sh") return "CH"; if (two==="qu") return "kk"; if (two==="th") return "TH"; if (two==="rr") return "RR"; if (two==="ll") return "I";
  if ("aá".includes(c)) return "aa"; if ("eé".includes(c)) return "E"; if ("iíyï".includes(c)) return "I"; if ("oó".includes(c)) return "O"; if ("uúü".includes(c)) return "U";
  if ("pbm".includes(c)) return "PP"; if ("fv".includes(c)) return "FF"; if ("w".includes(c)) return "U"; if ("tdl".includes(c)) return "DD"; if ("n".includes(c)) return "nn";
  if ("r".includes(c)) return "RR"; if ("szxç".includes(c)) return "SS"; if ("kgqc".includes(c)) return "kk"; if ("jñ".includes(c)) return "CH";
  if (/[\s.,;:!?¡¿"'()\-]/.test(c)) return "sil"; return "DD";
}
function buildTrackFromText(text, dur){ const ch=[...text], n=Math.max(1,ch.length), step=dur/n, tr=[]; for(let i=0;i<ch.length;i++) tr.push({v:charToViseme(ch[i],ch[i+1]),t0:i*step,t1:(i+1)*step}); return tr; }

let mounted = false;
export function mount(cfg = {}) {
  if (mounted) return;             // idempotente
  mounted = true;
  const C = {
    brainUrl: cfg.brainUrl || "",                 // POST {question,lang} -> {text}
    voiceUrl: cfg.voiceUrl || "",                 // opcional POST {text,lang} -> {audioBase64,mime,alignment?}
    model: cfg.model || SELF + "assets/facecap.glb",
    title: cfg.title || "Avatar digital",
    greeting: cfg.greeting || "Hola, ¿en qué te ayudo?",
    placeholder: cfg.placeholder || "Escribe o pulsa el micro…",
    lang: cfg.lang || "es-ES",
    accent: cfg.accent || "#78f3ff",
  };

  const css = `
#da-av{position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
#da-bubble{position:relative;width:64px;height:64px;border-radius:50%;cursor:pointer;border:1px solid ${C.accent}66;background:radial-gradient(circle at 50% 35%,${C.accent}40,#0a1620);box-shadow:0 8px 30px rgba(0,0,0,.5),0 0 24px ${C.accent}40;display:grid;place-items:center;transition:.2s}
#da-bubble:hover{transform:scale(1.06)}#da-bubble b{font-size:26px}
#da-bubble .pulse{position:absolute;inset:0;border-radius:50%;border:2px solid ${C.accent};animation:dap 2.2s infinite}
@keyframes dap{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.5);opacity:0}}
#da-panel{position:absolute;right:0;bottom:0;width:320px;background:#02080d;border:1px solid ${C.accent}4d;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6);display:none;flex-direction:column}
#da-av.open #da-panel{display:flex}#da-av.open #da-bubble{display:none}
#da-head{position:relative;height:220px;background:radial-gradient(120% 90% at 50% 10%,#12324a,#040c14)}
#da-head canvas{display:block;width:100%;height:100%}
#da-hdr{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;z-index:2}
#da-hdr .t{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#dff8ff;display:flex;align-items:center;gap:7px}
#da-hdr .t i{width:7px;height:7px;border-radius:50%;background:${C.accent};box-shadow:0 0 12px ${C.accent}}
#da-hdr .x{cursor:pointer;color:#75aab9;font-size:15px;background:none;border:0}#da-hdr .x:hover{color:#ff8866}
#da-cap{position:absolute;left:0;right:0;bottom:0;padding:10px 12px;font-family:system-ui,sans-serif;font-size:13px;line-height:1.4;color:#eef7ff;background:linear-gradient(0deg,rgba(2,8,13,.92),transparent);min-height:34px;z-index:2}
#da-ld{position:absolute;inset:0;display:grid;place-items:center;color:#4d7a88;font-size:11px;letter-spacing:.1em;text-transform:uppercase;text-align:center;padding:0 20px}
#da-bar{display:flex;gap:7px;padding:11px;border-top:1px solid ${C.accent}24}
#da-in{flex:1;background:#0a1620;border:1px solid ${C.accent}29;border-radius:9px;color:#dff8ff;font-family:system-ui,sans-serif;font-size:13px;padding:9px 11px;outline:none}
#da-in:focus{border-color:${C.accent}}
.da-b{background:#0a1620;border:1px solid ${C.accent}33;border-radius:9px;color:#dff8ff;cursor:pointer;font-size:15px;width:38px;display:grid;place-items:center}
.da-b:hover{border-color:${C.accent}}.da-b.rec{border-color:#ff8866;color:#ff8866;animation:dap2 1s infinite}
@keyframes dap2{50%{opacity:.5}}`;

  const wrap = document.createElement("div"); wrap.id = "da-av";
  wrap.innerHTML = `<style>${css}</style>
<div id="da-bubble" title="${C.title}"><span class="pulse"></span><b>🤖</b></div>
<div id="da-panel">
  <div id="da-head"><div id="da-ld">cargando avatar…</div>
    <div id="da-hdr"><div class="t"><i></i>${C.title}</div><button class="x" title="cerrar">✕</button></div>
    <div id="da-cap">${C.greeting}</div>
  </div>
  <div id="da-bar"><input id="da-in" placeholder="${C.placeholder}"><button class="da-b" id="da-mic" title="hablar">🎙️</button><button class="da-b" id="da-send" title="enviar">➤</button></div>
</div>`;
  document.body.appendChild(wrap);
  const $ = s => wrap.querySelector(s);
  const cap = $("#da-cap");
  let inited = false, greeted = false;
  $("#da-bubble").onclick = () => { wrap.classList.add("open"); if (!inited) { inited = true; initThree(); } };
  $("#da-hdr .x").onclick = () => wrap.classList.remove("open");

  // ---- estado de habla ----
  let speaking = false, curVis = "sil", track = null, audioEl = null, energy = 0;
  let renderer, scene, camera, clock, head, headDict, headInf, avatarGroup, grpEyeL, grpEyeR, analyser, aBuf;
  let cur = {}, nextBlink = 1.5, blinkT = -1, gyaw = 0, gpit = 0, gazeYaw = 0, gazePitch = 0, sacT = 0;
  const setInf = (n, v) => { const i = headDict ? headDict[n] : undefined; if (i !== undefined) headInf[i] = v; };

  async function initThree() {
    let THREE, GLTFLoader, KTX2Loader, MeshoptDecoder, RoomEnvironment;
    try {
      const base = `https://esm.sh/three@${V}`;
      [THREE, { GLTFLoader }, { KTX2Loader }, { MeshoptDecoder }, { RoomEnvironment }] = await Promise.all([
        import(base),
        import(`${base}/examples/jsm/loaders/GLTFLoader.js`),
        import(`${base}/examples/jsm/loaders/KTX2Loader.js`),
        import(`${base}/examples/jsm/libs/meshopt_decoder.module.js`),
        import(`${base}/examples/jsm/environments/RoomEnvironment.js`),
      ]);
    } catch (e) { $("#da-ld").textContent = "avatar 3D no disponible · sigo funcionando"; if (!greeted) greet(); return; }
    const host = $("#da-head");
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), .03).texture;
    camera = new THREE.PerspectiveCamera(28, host.clientWidth / host.clientHeight, .1, 100); camera.position.set(0, .06, .62);
    const key = new THREE.SpotLight(0xffe9d6, 9, 12, Math.PI/4.2, .7, 1.1); key.position.set(.7, 1, 1.4); scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fc2ff, 1.4); rim.position.set(-1.3, .5, -1.1); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xcfeaff, .5); fill.position.set(-.7, -.3, 1.2); scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xdff1ff, 0x0b1622, .55));
    clock = new THREE.Clock();
    addEventListener("resize", () => { if (!renderer) return; camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); });
    const ktx2 = new KTX2Loader().setTranscoderPath(`https://unpkg.com/three@${V}/examples/jsm/libs/basis/`).detectSupport(renderer);
    const loader = new GLTFLoader(); loader.setKTX2Loader(ktx2); loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(C.model, (gltf) => {
      const root = gltf.scene;
      root.traverse(o => { if (o.isMesh && o.morphTargetDictionary && o.morphTargetDictionary.jawOpen !== undefined) { head = o; headDict = o.morphTargetDictionary; headInf = o.morphTargetInfluences; o.material = o.material.clone(); o.material.color = new THREE.Color(0xc99a7e); o.material.roughness = .66; o.material.metalness = 0; if ("envMapIntensity" in o.material) o.material.envMapIntensity = .7; } });
      grpEyeL = root.getObjectByName("grp_eyeLeft"); grpEyeR = root.getObjectByName("grp_eyeRight");
      root.traverse(o => { if (o.isMesh && (o.name === "mesh_0" || o.name === "mesh_1")) { o.material = o.material.clone(); o.material.roughness = .12; if ("envMapIntensity" in o.material) o.material.envMapIntensity = 1.7; } });
      avatarGroup = new THREE.Group(); avatarGroup.add(root); scene.add(avatarGroup);
      const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      root.position.sub(center); const h = size.y || .3; const bs = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); const dist = bs / .62; const eyeY = h * .18;
      camera.position.set(0, eyeY + h * .04, dist); camera.lookAt(0, eyeY - h * .16, 0); camera.updateProjectionMatrix();
      $("#da-ld").style.display = "none"; animate(); if (!greeted) greet();
    }, undefined, () => { $("#da-ld").textContent = "avatar 3D no disponible · sigo funcionando"; if (!greeted) greet(); });

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
      if (analyser && speaking) { analyser.getByteTimeDomainData(aBuf); let s = 0; for (let i = 0; i < aBuf.length; i++) { const d = (aBuf[i] - 128) / 128; s += d * d; } energy = Math.min(1, Math.sqrt(s / aBuf.length) * 3.4); }
      else if (speaking) energy = .55 + .45 * Math.abs(Math.sin(t * 11));
      else energy *= .9;
      if (head) {
        const target = {}; MOUTH.forEach(m => target[m] = 0);
        let vis = curVis;
        if (speaking && track && audioEl) { const tt = audioEl.currentTime; let a = null; for (let i = 0; i < track.length; i++) { if (tt >= track[i].t0 - .02 && tt <= track[i].t1 + .04) { a = track[i]; break; } if (track[i].t0 > tt) { a = track[i - 1] || track[i]; break; } } if (a) vis = a.v; }
        if (speaking) { const w = VIS[vis] || {}; for (const k in w) target[k] = w[k]; if (target.jawOpen !== undefined) target.jawOpen = Math.min(.85, (target.jawOpen || .12) * (.65 + .6 * energy)); }
        const k = 1 - Math.exp(-dt * 22); for (const m of MOUTH) { cur[m] = (cur[m] || 0) + (target[m] - (cur[m] || 0)) * k; setInf(m, cur[m]); }
        nextBlink -= dt; if (blinkT >= 0) { blinkT += dt; const p = blinkT / .13, v = p < .5 ? p * 2 : Math.max(0, 2 - 2 * p); setInf("eyeBlink_L", v); setInf("eyeBlink_R", v); if (blinkT > .13) { blinkT = -1; setInf("eyeBlink_L", 0); setInf("eyeBlink_R", 0); } } else if (nextBlink <= 0) { blinkT = 0; nextBlink = 2.2 + Math.random() * 4; }
        sacT -= dt; if (sacT <= 0) { gazeYaw = (Math.random() - .5) * .16; gazePitch = (Math.random() - .5) * .09; sacT = 1.1 + Math.random() * 2.8; }
        gyaw += (gazeYaw - gyaw) * Math.min(1, dt * 9); gpit += (gazePitch - gpit) * Math.min(1, dt * 9);
        if (grpEyeL) { grpEyeL.rotation.set(gpit, gyaw, 0); grpEyeR.rotation.set(gpit, gyaw, 0); }
        if (avatarGroup) { avatarGroup.rotation.y = Math.sin(t * .45) * .05 + (speaking ? Math.sin(t * 2.1) * .012 : 0); avatarGroup.rotation.x = Math.sin(t * .33) * .025; avatarGroup.position.y = Math.sin(t * .9) * .004; }
        setInf("browInnerUp", speaking ? .1 : 0);
      }
      renderer.render(scene, camera);
    }
  }

  // ---- voz ----
  let esVoice = null;
  const pickVoice = () => { const vs = speechSynthesis.getVoices(); esVoice = vs.find(v => v.lang === C.lang) || vs.find(v => v.lang && v.lang.slice(0,2) === C.lang.slice(0,2)) || null; };
  try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
  function speakLocal(text) {
    try {
      speechSynthesis.cancel(); track = null; audioEl = null; analyser = null;
      const u = new SpeechSynthesisUtterance(text); u.lang = C.lang; if (esVoice) u.voice = esVoice; u.rate = 1.02;
      u.onstart = () => { speaking = true; };
      u.onboundary = (e) => { const i = e.charIndex || 0; curVis = charToViseme(text[i], text[i + 1]); };
      u.onend = u.onerror = () => { speaking = false; curVis = "sil"; };
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  async function speakRemote(text) {
    try {
      const r = await fetch(C.voiceUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang: C.lang }) });
      const d = await r.json();
      if (!d.audioBase64) return speakLocal(text);
      audioEl = new Audio("data:" + (d.mime || "audio/mpeg") + ";base64," + d.audioBase64);
      try { const AC = window.AudioContext || window.webkitAudioContext; const ctx = new AC(); const src = ctx.createMediaElementSource(audioEl); analyser = ctx.createAnalyser(); analyser.fftSize = 512; aBuf = new Uint8Array(analyser.fftSize); src.connect(analyser); analyser.connect(ctx.destination); } catch (e) { analyser = null; }
      audioEl.onplay = () => { speaking = true; };
      audioEl.onended = audioEl.onerror = () => { speaking = false; curVis = "sil"; };
      audioEl.onloadedmetadata = () => { track = d.alignment && d.alignment.chars ? d.alignment.chars.map((c, i) => ({ v: charToViseme(c, d.alignment.chars[i + 1]), t0: d.alignment.starts[i], t1: d.alignment.ends[i] })) : buildTrackFromText(text, audioEl.duration || text.length * .06); };
      audioEl.play();
    } catch (e) { speakLocal(text); }
  }
  const speak = (text) => C.voiceUrl ? speakRemote(text) : speakLocal(text);

  function greet() { greeted = true; cap.textContent = C.greeting; speak(C.greeting); }
  async function ask(q) {
    if (!q || !q.trim()) return;
    cap.textContent = "…";
    if (!C.brainUrl) { cap.textContent = "(sin cerebro configurado)"; return; }
    try {
      const r = await fetch(C.brainUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, lang: C.lang }) });
      const d = await r.json(); const text = d.text || d.answer || "No he podido responder.";
      cap.textContent = text; speak(text);
    } catch (e) { cap.textContent = "Sin conexión."; }
  }
  $("#da-send").onclick = () => { const v = $("#da-in").value; $("#da-in").value = ""; ask(v); };
  $("#da-in").addEventListener("keydown", e => { if (e.key === "Enter") { const v = e.target.value; e.target.value = ""; ask(v); } });

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  $("#da-mic").onclick = () => {
    if (!SR) { cap.textContent = "Micro no soportado en este navegador."; return; }
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = C.lang; rec.interimResults = false; $("#da-mic").classList.add("rec");
    rec.onresult = (e) => { const txt = e.results[0][0].transcript; $("#da-in").value = txt; ask(txt); };
    rec.onend = rec.onerror = () => { $("#da-mic").classList.remove("rec"); rec = null; };
    rec.start();
  };

  return { ask, open: () => $("#da-bubble").click(), close: () => wrap.classList.remove("open") };
}

export default { mount };
