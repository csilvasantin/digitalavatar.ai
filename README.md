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
  `POST https://brain.digitalavatar.ai/metahuman/ask`.
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
- [ ] Portero bajo demanda en el MBP16 (#5733). La política y el plist sin `KeepAlive`/`RunAtLoad` están en [`ops/avatar-on-demand/`](ops/avatar-on-demand/CLOUD-RUNBOOK.md). La prueba de GPU sigue en el Mac.
- [ ] Añadir el hostname del stand al CORS del worker omnipublicity.
- [ ] (Opcional) registrar el dominio `digitalavatar.ai`.

# Idioma y controles del avatar / Avatar language and controls

ES: Al abrir el avatar se hereda el idioma actual del site: ESP en castellano y ENG en inglés. El modelo inicial es Avatar · Admirito, independiente de la calidad del Xpacio (también en Matrix). El selector Modelo del avatar permite elegir Avatar · Admirito, Better · Luna o Metahuman · Neo; también sirven /avatar digital good, /avatar digital better y /avatar digital best. Una elección explícita de modelo se conserva en esta pestaña. ESP muestra Micrófono, Detener y Preguntar; ENG muestra Microphone, Stop y Ask. Cambiar ESP/ENG dentro de la conversación conserva la pregunta escrita y detiene la voz/escucha anterior, sin enviar una pregunta ni activar el micrófono. Al cerrar y reabrir vuelve a heredarse el idioma del site; cambiar el idioma del site actualiza la conversación abierta sin recargar el iframe. Best utiliza el MetaHuman Neo y conserva el respaldo web existente cuando el host no emite.

EN: Opening the avatar inherits the current site language: ESP for Spanish and ENG for English. The initial model is Avatar · Admirito, independent of Xpace quality (including Matrix). The Avatar model selector offers Avatar · Admirito, Better · Luna or Metahuman · Neo; /avatar digital good, /avatar digital better and /avatar digital best also work. An explicit model choice is retained for this tab. ESP shows Micrófono, Detener and Preguntar; ENG shows Microphone, Stop and Ask. Switching ESP/ENG in the conversation preserves the typed question and stops the previous speech/listening without sending a question or enabling the microphone. Closing and reopening inherits the site language again; changing the site language updates the open conversation without reloading its iframe. Best uses the Neo MetaHuman and retains the existing web fallback when the render host is unavailable.

## Contrato / Contract

- Categories (07-10-2026): avatar=Admirito, human=Luna (formerly Alex), metahuman=Neo; good/better/best kept as aliases — separate profiles/facts in brain (`avatar` on every ask). Slash on nube: `/quien soy`, `/perfil`, `/aprender` (needs admin token), `/help`.
- Admirito idle moves (07-10-2026): five attention-grabbers every ~9–15 s of idle (giro, baile, voltereta, gelatina, lluvia+arcoíris), never while talking/thinking/asleep, cut on touch or question, skipped with prefers-reduced-motion. Demo: `/nube.html?dance=1` (all five) or `?dance=giro|baile|voltereta|gelatina|lluvia` (aliases spin|dance|flip|jelly|rain). Slash: `/animacion 1|giro`…`/animacion help`. Compact composer: chips, ESP|ENG, mic/stop/ask live inside the text box.
- Renderers: `/nube.html` (Good), `/best.html` (Better), `/metahuman.html` (Best); `/better.html` retains historical 3D controls. Assets: `/assets/da-conversation-controls.js`, `/assets/da-conversation-controls.css`.
- Language source: `DAContext.lang`, initially `?lang=es|en`; native language listeners also update placeholders, chips and recognition/request language. No new API or voices.
- Parent notification: `{type:"da-language-selected",lang:"es"|"en"}` sent only to the trusted embedding origin. XpaceOS validates `event.source`, `https://digitalavatar.ai`, the expanded conversation and the language.
- Opening language source: current site `<html lang>`; legacy language storage never overrides it. Manual conversation-language choice is local to the open conversation. Model choice uses sessionStorage `admira-avatar:nivel-elegido`, shared with the existing CLI. No shared MCP write or physical-screen configuration change.
- Native Stop cancels listening/speech using each renderer’s existing handler. The render host and speech providers retain their existing availability requirements.
- Tutorial ES: ampliar la pared → Hablar con el avatar → ESP/ENG → escribir y Preguntar, o Micrófono; Detener interrumpe la voz. Cerrar vuelve al kiosko.
- Tutorial EN: enlarge wall → Talk to the avatar → ESP/ENG → type and Ask, or Microphone; Stop interrupts speech. Close returns to the kiosk.

## Controles locales de demo del avatar incrustado / Embedded demo controls

ES: En Good (`nube.html`), Better (`best.html`), Best (`metahuman.html`) y el renderer histórico `better.html`, `DAContext.demoCommand(text)` intercepta `/demo auto|todas|todos|all`, `/demo pausa|pause`, `/demo reanudar|resume|continuar`, `/demo siguiente|next`, `/demo stop|off|parar` y `/demo estado|status` cuando el avatar está incrustado. Envía la orden inmediatamente a la página anfitriona, sin pregunta al cerebro, voz generada ni espera de locución. La plataforma decide qué muestras preparadas reproduce y qué controles admite. `/demo help|ayuda|lista|?` sigue esta misma ruta silenciosa también como primera orden, antes de que llegue el catálogo local y muestra el listado real del padre tras su ACK. `/demo`, números y nombres mantienen su flujo de presentación; el avatar independiente conserva su comportamiento anterior.

EN: In Good (`nube.html`), Better (`best.html`), Best (`metahuman.html`) and the historical `better.html` renderer, `DAContext.demoCommand(text)` handles the aliases above only when embedded. It sends the command directly to the host without a brain request, generated speech or a speech delay. The host decides which prepared samples and controls it supports. `/demo help|ayuda|lista|?` follows this silent route and displays the host’s actual listing after its ACK, including the first command before the local catalog arrives. Bare `/demo`, numbers and names retain their presentation flow; standalone behavior is unchanged.

Contract: the avatar posts `{type:"da-demo", id:"", texto:"/demo …", requestId}` to the exact trusted parent origin obtained from the referrer or a trusted parent context/catalog message. The host validates iframe source and origin, deduplicates `requestId`, awaits its actual dispatcher, then replies `{type:"da-demo-result", requestId, ok, message, estado?}`; `estado` is the engine state `{activo, pausado, demo, fase, fases, numero, total}`. Optional `result` from the host is not rendered by this API. The avatar accepts only its parent source, that exact origin and an outstanding request ID, displays a waiting message before the ACK and the host's text after it, and ignores stale replies. The host waits for its demo engine to be ready before returning its real help listing. Embedded help never falls through to the provider, even if no trusted parent is available. Error, missing host or a 20-second timeout never counts as successful execution. A control cancels any scheduled opening from an earlier narrated demo. No provider permissions, credentials, real generation, sales or physical emission are changed.

Validation: `node --test tests/*.test.mjs` covers the legacy demo flow, alias routing, trusted ACKs, timeout/failure and the real `ask` functions of all four renderers, without calling a provider.

## Pieles de Admirito / Admirito skins (`nube.html?personaje=<id>`)

ES: Admirito admite disfraces con el mismo motor: la tabla `PIELES` de `assets/nube.js` (admirito por defecto, `bugito`, y las que vengan, como `arquitecto`). Añadir una = su entrada en `PIELES` (textos y chips), sus piezas en `nube.html` (`class="piel-parte" data-piel="<id>"` + su CSS bajo `html[data-personaje="<id>"]`) y sus ganchos (`frame`, `mouth`, `droop`, `gaze`, `ask`, `identidad`, `mensaje`, `titulo`, `estado`). El anfitrión le habla con `{type:"da-<id>"}`; un `personaje` desconocido es Admirito.

EN: Admirito supports costumes on the same engine: the `PIELES` table in `assets/nube.js`. A new skin = its `PIELES` entry, its parts in `nube.html` and its hooks; the host talks to it with `{type:"da-<id>"}`; an unknown `personaje` is plain Admirito.

## Bugito, la piel diablillo de Admirito / Bugito, Admirito's imp skin

ES: `nube.html?personaje=bugito` es Admirito con otra piel (Carlos, 14-oct-2026: «Bugito es una adaptación de Admirito»): la misma página y el mismo `assets/nube.js` (cuerpo, vida propia, bailes y lip-sync), en rojo y negro, con cuernos, rabito, cejas pícaras y colmillo. Es el creador de incidencias del banco de pruebas de admira.biz (`/bugito.html`): no pregunta al cerebro; sus chips («Gira la pantalla», «Cambia la resolución», «Lanza un popup», «Ábrela a medias», «Vuelve a la normalidad») piden el fallo al anfitrión y el anfitrión le cuenta qué pasa. Sin el parámetro, Admirito no cambia. Se carga como Admirito, por el cargador común `https://www.admiranext.com/assets/avatar.js` (`/bugito` en el ⌘ Experto).

EN: `nube.html?personaje=bugito` is Admirito with another skin: same page and same `assets/nube.js`, in red and black with horns, tail, mischievous brows and a fang. It is the incident creator of the admira.biz test bench: it never asks the brain; its chips ask the host for a fault and the host tells it what happens. Without the parameter Admirito is unchanged.

Contract: embedded, Bugito posts `{type:"da-bugito-listo"}` and `{type:"da-bugito-lanzar", incidencia, lang}` (incidencia ∈ formato-girado | cambio-resolucion | popup-encima | medio-abrir | normal) only to the trusted host origin (`DAContext.hostOrigin()`). The host sends `{type:"da-bugito", estado, incidencia?, ticket?, texto?, lang?}` with estado ∈ aburrido | tramando | lanzando | celebrando | derrotado | rechazado; Bugito accepts it only from its parent window and an allowed network origin (`DAContext.allowed`). `ticket` must look like a Yokup id (`INC-ABC12`). Tests: `tests/bugito.test.mjs`.

## El Arquitecto, Admirito con casco de obra / The Architect, Admirito in a hard hat

ES: `nube.html?personaje=arquitecto` es Admirito disfrazado de arquitecto (Carlos, 14-oct-2026: «si escribimos en modo experto /arquitecto, admirito se disfrace de arquitecto»): el mismo Admirito blanco y verde, con casco amarillo de obra, gafas redondas, lápiz en la oreja y rollo de planos, sobre papel de plano azul. Es el anfitrión del estudio del Arquitecto de admira.biz (`/arquitecto.html`), que **crea** Xpacios nuevos, **reforma** los que hay (desde foto, vídeo o lo que se le cuente) e **inventaría** (plano + inventario ITIL que se da de alta en Yokup). No pregunta al cerebro: lo que se le dice —escrito o por su micro— va al estudio. Estados: reposo, escuchando (ondas), midiendo (cinta métrica, cejas concentradas), dibujando (trazos de plano, lápiz que tiembla), entregando (el plano se desenrolla, ojos satisfechos) y dudando. Frases suyas: «Vamos a medir», «Esto pide una reforma», «Inventario listo, firmo el acta».

EN: `nube.html?personaje=arquitecto` is Admirito dressed as an architect: same white-and-green Admirito with a yellow hard hat, round glasses, a pencil behind the ear and a blueprint roll, on blueprint paper. It hosts the admira.biz Architect studio (create, renovate and survey Xpaces). It never asks the brain: what it is told goes to the studio.

Contract: embedded, the Architect posts `{type:"da-arquitecto-listo"}` and `{type:"da-arquitecto-orden", orden, texto, lang}` (orden ∈ crear | reformar | inventariar | "" = a description for the open order; texto ≤ 2000 chars) only to the trusted host origin. The host sends `{type:"da-arquitecto", estado, orden?, texto?, silencio?, lang?}` with estado ∈ reposo | escuchando | midiendo | dibujando | entregando | dudando, accepted only from its parent window and an allowed network origin. Tests: `tests/arquitecto.test.mjs`.
