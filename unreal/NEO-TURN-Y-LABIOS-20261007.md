# Neo · relé TURN y labios (7-oct-2026)

## 1. Se ve y se oye fuera de la red de casa (TURN)
- El stream de Neo (Pixel Streaming en el MBP16, señalización Wilbur) solo ofrecía candidatos
  `host` y `srflx`. Quien está detrás de una red sin UDP o con NAT estricto se quedaba en negro y sin voz.
- El worker `neo-digitalavatar` (fuente en `workers/neo-digitalavatar/`) inyecta
  `/assets/da-turn.js` al principio del `<head>` del reproductor.
- `da-turn.js` pide la credencial al grifo `https://api.yokup.com/turn` (worker yokup-rtc, repo
  csilvasantin/tool). El grifo usa Cloudflare Realtime TURN, credenciales de 10 min, 10 por hora y por
  IP, y solo orígenes autorizados (se añadieron `neo-digitalavatar.csilvasantin.workers.dev`,
  `neo.digitalavatar.ai` y `digitalavatar.ai`).
  Añade los puertos 443/TLS y 80/TCP, y renueva la credencial con `setConfiguration()` solo si el relé
  está en uso.
- Ningún secreto vive en el cliente ni en git. La señalización de Wilbur no se ha tocado: el streamer
  ya tiene `srflx` y el relé del espectador basta.
- Verificado desde fuera (caja sin UDP, solo 443): par `relay/tls -> srflx`, vídeo 1080 px, y audio
  con RMS de 0,06–0,09 mientras Neo habla.
- `?turn=0` en la URL del reproductor desactiva la inyección (diagnóstico).

## 2. Labios (Unreal, `UDigitalAvatarBridge`)
- `labios-envolvente-20261007.patch` es el cambio aplicado en el MBP16
  (`~/Projects/csilvasantin/digitalavatar-metahuman`; copia previa en `Tools/backup-labios-20261007/`).
- La envolvente RMS del PCM real (100 muestras por segundo, normalizada al percentil 95) guía la
  mandíbula: abre en las sílabas fuertes y cierra en las pausas.
- Las poses de visema se escalan con la energía de la voz (`VisemeGain` 1,45, `JawEnvGain` 0,80).
- Reloj real (`FPlatformTime`) en vez del tiempo de juego para sincronizar con el audio, más un
  adelanto de 50 ms.
- Compilado con Xcode 27. `Engine/Config/Apple/Apple_SDK.json` se amplió (MaxVersion 27.9.0; copia
  `.bak-pre-xcode27-20261007`).
- Vuelta atrás: copiar el `.dylib` de `Tools/backup-labios-20261007/` a `Binaries/Mac/` y hacer
  `launchctl kickstart -k gui/$(id -u)/com.admiranext.avatar-streamer`.

## 3. Relé de voz 8799 (mandíbula en vivo desde el móvil)
- Vuelve a estar arriba y arranca solo: LaunchAgent `com.admiranext.avatar-voice-relay`
  (copia en este directorio), que ejecuta `node ~/Claude/avatar-voice/relay.js`.
  Unreal se conecta a él al arrancar (`Voz WS conectado`).

## Pendiente conocido
- El canal `say` (`omnipublicity-api`, KV) es eventualmente consistente entre colos de Cloudflare.
  Si la pregunta sale de un colo lejano al MBP16, la voz puede tardar entre 15 y 60 s. Desde Madrid
  tarda menos de 1 s. La solución es mover la cola a un Durable Object.
