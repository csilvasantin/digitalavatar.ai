// neo-digitalavatar — puerta pública del stream de Neo (Pixel Streaming).
// Proxy HTTP+WebSocket hacia Wilbur por Tailscale Funnel, con failover:
//   Plan A: Mac Studio (siempre encendido)  ->  Plan B: MBP16.
// Antes de cada petición se elige el primer origen que responde a un health-check
// (GET / del Wilbur, timeout corto); el resultado se cachea unos segundos por isolate.
// En las páginas HTML inyecta /assets/da-turn.js de digitalavatar.ai al principio del <head>
// para que el reproductor pida credencial TURN de corta duración (7-oct-2026).
// El worker no guarda ningún secreto. Forzar un origen: ?neo_origin=studio|mbp16
const ORIGINS = [
  { id: "studio", url: "https://macstudio.tail48b61c.ts.net:8443" },
  { id: "mbp16",  url: "https://macbook-pro-16.tail48b61c.ts.net:8443" },
];
const TURN_SCRIPT = "https://digitalavatar.ai/assets/da-turn.js?v=20261007-turn-2";
const HEALTH_TIMEOUT_MS = 2500;
const HEALTH_TTL_MS = 15000;
let cached = { id: null, at: 0 };

class InjectTurn {
  element(el) { el.prepend(`<script src="${TURN_SCRIPT}"></script>`, { html: true }); }
}

async function healthy(origin) {
  try {
    const r = await fetch(origin.url + "/", {
      method: "GET", signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      cf: { cacheTtl: 0 },
    });
    return r.ok;
  } catch { return false; }
}

async function pickOrigin(forced) {
  const f = ORIGINS.find(o => o.id === forced);
  if (f) return f;
  const now = Date.now();
  if (cached.id && now - cached.at < HEALTH_TTL_MS) return ORIGINS.find(o => o.id === cached.id);
  for (const o of ORIGINS) {
    if (await healthy(o)) { cached = { id: o.id, at: now }; return o; }
  }
  cached = { id: null, at: 0 };
  return ORIGINS[ORIGINS.length - 1]; // nadie responde: último recurso
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const forced = url.searchParams.get("neo_origin");
    if (url.pathname === "/__neo_health") {
      const res = {};
      for (const o of ORIGINS) res[o.id] = await healthy(o);
      return Response.json({ origins: res, active: (await pickOrigin(forced)).id });
    }
    const origin = await pickOrigin(forced);
    const targetUrl = origin.url + url.pathname + url.search;
    const resp = await fetch(new Request(targetUrl, request));
    if (resp.status === 101 || resp.webSocket) return resp;
    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("text/html")) {
      const out = new Response(resp.body, resp);
      out.headers.set("Cache-Control", "no-store");
      out.headers.set("X-Neo-Origin", origin.id);
      if (url.searchParams.get("turn") === "0") return out;
      return new HTMLRewriter().on("head", new InjectTurn()).transform(out);
    }
    return resp;
  }
};
