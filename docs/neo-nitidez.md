# Nitidez de Neo — lo que tiene que cambiar en el host de render

La página (`metahuman.html` y `embed-mh.html`) ya pide al reproductor de Pixel Streaming una imagen del tamaño real de la pantalla. Si el host no responde, el marco muestra el avatar web en silencio (`best.html?kiosk=1&embed=1&audio=off&listen=0`) y la voz sale del navegador, para no doblarla. El proceso de Unreal que corre en el Mac (`macbook-pro-16`, Tailscale, puerto 8443) puede ignorar esa petición. Esto es lo que hay que poner **en el arranque de Unreal**, no en el repo.

Causa que se ve en el navegador: el iframe de Neo es un retrato 9:16 de unos 380 px CSS. En una pantalla retina eso son unos 760×1350 píxeles físicos. Si el streamer sigue emitiendo la resolución con la que arrancó la ventana (a menudo 1280×720 o menos) y el `<video>` del player la estira hasta llenar el iframe, la cara sale suave. El repo no puede reescribir ese `<video>`: está en otro origen (`uiless.html`).

## Qué ya hace la web

Query del player (kbps, como los lee el frontend de Epic):

- `MatchViewportRes=true` — le dice a Unreal que iguale la resolución del vídeo.
- `ViewportResolutionScale=1` — el player no vuelve a multiplicar; el iframe ya va a `devicePixelRatio` (tope 1920 en el lado largo).
- `MinQP=4` y `MaxQP=18` — el player los manda al encoder si el proceso acepta órdenes.
- `WebRTCMinBitrate=8000` y `WebRTCMaxBitrate=20000` — 8–20 Mbps.
- `WebRTCFPS=60`
- `StartVideoMuted=true` al entrar (para que se vea la cara sin gesto) y `false` en el primer clic de la demo, para que suene.

Sin `-AllowPixelStreamingCommands` y sin `-windowed -ForceRes`, MatchViewport y los QP de la URL no hacen efecto. La cara sigue borrosa aunque la web esté bien.

## Arranque exacto (Unreal Engine 5.4+, Pixel Streaming)

Añadir estos argumentos al ejecutable. No sustituyen al resto del arranque; se suman.

```
-windowed -ForceRes -ResX=1080 -ResY=1920 -AllowPixelStreamingCommands -PixelStreamingEncoderMinQP=4 -PixelStreamingEncoderMaxQP=18 -PixelStreamingEncoderTargetBitrate=20000000 -PixelStreamingEncoderMaxBitrate=20000000 -PixelStreamingWebRTCMinBitrate=8000000 -PixelStreamingWebRTCMaxBitrate=20000000 -PixelStreamingWebRTCMaxFps=60
```

| Argumento | Valor | Por qué |
|---|---|---|
| `-windowed -ForceRes` | — | Match viewport solo puede cambiar el tamaño si la ventana no está clavada a pantalla completa ni al tamaño del monitor. |
| `-ResX=1080 -ResY=1920` | 1080×1920 | Retrato 9:16, el mismo marco que el escenario de la web. Es el tamaño de partida antes de que el navegador pida el suyo. |
| `-AllowPixelStreamingCommands` | — | Sin esto, Unreal descarta `MinQP`, `MaxQP` y el cambio de resolución que manda el player. |
| `-PixelStreamingEncoderMinQP=4` | 4 | QP bajo = menos compresión. 4 deja margen de calidad (0 sería el máximo y dispara el bitrate). |
| `-PixelStreamingEncoderMaxQP=18` | 18 | Tapa la calidad peor. Con el máximo por defecto (51) el encoder emborrona la piel en cuanto falta bitrate. |
| `-PixelStreamingEncoderTargetBitrate=20000000` | 20 000 000 bps | Objetivo del encoder, en bits por segundo (no kbps). |
| `-PixelStreamingEncoderMaxBitrate=20000000` | 20 000 000 bps | Techo del encoder, alineado con los 20 000 kbps que pide la web. |
| `-PixelStreamingWebRTCMinBitrate=8000000` | 8 000 000 bps | Suelo de WebRTC. Por debajo, la cara se lava. |
| `-PixelStreamingWebRTCMaxBitrate=20000000` | 20 000 000 bps | Techo de WebRTC. Tiene que ser ≥ que el de la URL (`WebRTCMaxBitrate=20000` kbps). |
| `-PixelStreamingWebRTCMaxFps=60` | 60 | Igual que `WebRTCFPS=60` de la página. |

En la consola del editor o en `DefaultEngine.ini` (`[/Script/Engine.RendererSettings]` no aplica; son comandos de runtime):

```
r.ScreenPercentage 100
sg.ResolutionQuality 100
r.Tonemapper.Sharpen 1
```

`r.ScreenPercentage` por debajo de 100 renderiza menos píxeles y el stream, aunque sea 1080×1920, sale blando. Tiene que quedarse en 100.

## Comprobar que obedeció

1. Abrir `https://digitalavatar.ai/metahuman.html` en el Mac que renderiza (o en un cliente con el host encendido).
2. En el player, la estadística de resolución del stream tiene que acercarse al tamaño del iframe × `devicePixelRatio` (en una pantalla 2×, unos 760×1350 dentro del marco de 380 px), no quedarse en 1280×720 estirado.
3. Si la resolución no se mueve al cambiar el tamaño de la ventana, falta `-AllowPixelStreamingCommands` o `-windowed -ForceRes`.
