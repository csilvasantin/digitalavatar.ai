// neo-digitalavatar — puerta pública del stream de Neo (Pixel Streaming en el MBP16).
// Proxy HTTP+WebSocket hacia Wilbur por Tailscale Funnel. En las páginas HTML inyecta
// /assets/da-turn.js de digitalavatar.ai al principio del <head>: así el reproductor pide
// credencial TURN de corta duración al grifo /turn de api.yokup.com y se ve y se oye
// también fuera de la red de casa (7-oct-2026). El worker no guarda ningún secreto.
const ORIGIN = "https://macbook-pro-16.tail48b61c.ts.net:8443";
const TURN_SCRIPT = "https://digitalavatar.ai/assets/da-turn.js?v=20261007-turn-1";

class InjectTurn {
  element(el) { el.prepend(`<script src="${TURN_SCRIPT}"></script>`, { html: true }); }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = ORIGIN + url.pathname + url.search;
    const resp = await fetch(new Request(targetUrl, request));
    if (resp.status === 101 || resp.webSocket) return resp;
    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("text/html")) {
      const out = new Response(resp.body, resp);
      out.headers.set("Cache-Control", "no-store");
      if (url.searchParams.get("turn") === "0") return out;
      return new HTMLRewriter().on("head", new InjectTurn()).transform(out);
    }
    return resp;
  }
};
