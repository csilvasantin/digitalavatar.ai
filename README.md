# DigitalAvatar.ai

**Avatar de IA hiperrealista para retail físico** — un MetaHuman (Unreal Engine 5) que
atiende, conoce la tienda y a su equipo, y habla con la voz de Admira. Es la capa
fotorrealista del gemelo digital de [Admira XP // The Xpace OS](https://www.carlossilva.info/01.-AdmiraXperience-Game/).

> Estado: **MVP para Shoptalk Europe (Fira BCN, 9–11 jun 2026, stand Lenovo × Nvidia).**
> Entrega: Pixel Streaming al navegador. Render nativo en la workstation del stand.

---

## Arquitectura (una config, varios gemelos)

```
 admira.app (mapa)  ──►  ?loc=<id>  ──►  Gemelo HD (UE5 + Pixel Streaming)
                                              │
        Misma fuente de verdad que el gemelo 2D:
        · KV omnipublicity  (/locations)        → config del punto + equipo
        · signage feed      (/signage/feed)      → creativos reales en las pantallas
        · MetaHuman brain   (/metahuman/ask)     → Grok + ElevenLabs (ver abajo)
```

El avatar **no inventa backend**: reutiliza el mismo cerebro (Grok), voz (ElevenLabs) y
datos (KV) que ya alimentan el gemelo 2D. Identifica el punto por `?loc=<id>`.

## El MetaHuman en 4 etapas

```
[visitante: voz/texto] ─(STT)─► POST /metahuman/ask {loc, question}
                                    │ contexto del punto (KV) + Grok → texto
                                    │ ElevenLabs → audio
                                    ▼
                          { answer, audioBase64, mime }
                                    │
                                    ▼  en Unreal:
              MetaHuman reproduce el audio + Nvidia Audio2Face → lip-sync
```

- **Cerebro + voz** (etapas 2-3): ya hechos. Endpoint
  `POST https://omnipublicity-api.csilvasantin.workers.dev/metahuman/ask`.
- **Cara** (etapa 4): la monta el dev UE con MetaHuman + Audio2Face (ACE). Ver
  [`docs/integration-UE.md`](docs/integration-UE.md).

## Estructura del repo

| Carpeta | Qué hay |
|---|---|
| [`docs/`](docs/) | `integration-UE.md` — spec ejecutable para el dev/artista UE (contrato, plan 6 días, checklist). |
| [`index.html`](index.html) | Tester web del cerebro+voz (la home del sitio): eliges un punto, escribes una pregunta y oyes la respuesta del MetaHuman. Sin Unreal. Servido en GitHub Pages → `digitalavatar.ai`. |
| [`unreal/`](unreal/) | Proyecto Unreal Engine 5 (lo añade el dev UE). `.gitignore` de UE listo. |

## Probar el cerebro + voz (sin Unreal)

Abre `index.html` (doble clic o sírvelo), o vía la web publicada en `digitalavatar.ai`. Elige un punto, escribe una pregunta
("¿tenéis tabaco de liar?") y pulsa **Preguntar** → verás la respuesta y oirás la voz.

> **Requisito (1 vez):** la clave de xAI debe estar como secret del worker. En
> `01.-AdmiraXperience-Game/workers/omnipublicity-api/`:
> ```
> npx wrangler secret put XAI_API_KEY      # pega tu clave de api.x.ai
> npx wrangler secret put XAI_MODEL        # opcional
> ```
> Hasta entonces el endpoint responde `503 xai_key_not_set` (el tester lo indica).

## Stack
Unreal Engine 5 (Lumen/Nanite) · Pixel Streaming · MetaHuman · **Nvidia Audio2Face (ACE)** ·
cerebro **Grok (xAI)** · voz **ElevenLabs** · config **Cloudflare Workers + KV** (OmniPublicity).

## Pendiente
- [ ] `XAI_API_KEY` como secret del worker (Carlos).
- [ ] Proyecto Unreal + integración Audio2Face (dev/artista UE — ver spec).
- [ ] URL pública del player Pixel Streaming (Tailscale Funnel) → se enchufa en admira.app (`TWIN_HD_BASE`).
- [ ] Añadir el hostname del stand al CORS del worker omnipublicity.
- [ ] (Opcional) registrar el dominio `digitalavatar.ai`.
