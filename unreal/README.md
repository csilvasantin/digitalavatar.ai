# unreal/ — Proyecto Unreal Engine 5 del avatar

Aquí va el proyecto UE5 del MetaHuman (lo crea/añade el dev o artista de Unreal).

## Qué construir
Ver la spec completa: [`../docs/integration-UE.md`](../docs/integration-UE.md). Resumen:

1. **Entorno** de tienda fotorrealista (prefab de Fab/Marketplace redecorado como Xtanco).
2. **Config por punto:** lee `?loc=<id>` (Pixel Streaming / Remote Control) → `fetch` al KV
   `https://omnipublicity-api.csilvasantin.workers.dev/locations` → nombre/dirección en rótulos,
   nº de pantallas, hilo musical, cámaras, equipo.
3. **Pantallas = signage real:** `MediaTexture` con polling a
   `https://pixer-eleven.csilvasantin.workers.dev/signage/feed?screen=<id>&limit=1`.
4. **MetaHuman + voz:** `POST https://omnipublicity-api.csilvasantin.workers.dev/metahuman/ask`
   `{loc, question}` → `{answer, audioBase64, mime}`. Reproducir el audio en un `SoundWave` y
   alimentarlo a **Nvidia Audio2Face (ACE)** para el lip-sync.
5. **Pixel Streaming:** empaquetar con el plugin, levantar el Signalling server y exponerlo
   por **Tailscale Funnel**; dar la URL pública → se enchufa en `admira.app` (`TWIN_HD_BASE`).

## Plugins
Pixel Streaming · MetaHuman · Nvidia ACE / Audio2Face (o, como fallback, lip-sync por visemas
en runtime con el mismo audio).

## Convenciones
- No versionar `Binaries/ Build/ Intermediate/ Saved/ DerivedDataCache/` (ya en `.gitignore`).
- Assets pesados (`.uasset/.umap`) → Git LFS si hace falta (plantilla comentada en `.gitignore`).
