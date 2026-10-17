# Avatar Metahuman bajo demanda (#5733)

UnrealEditor no se queda encendido. Wilbur (puerto 8888) y el relevo de voz (8799) siguen como están. El streamer solo arranca cuando entra un visor o alguien llama al despertador, y se apaga a los 10 minutos sin visores.

Esto no enciende la GPU. La prueba de horas y de % de GPU se hace en el MBP16, con el visor abierto y luego cerrado.

## Política

El módulo `policy.js` es la decisión, sin procesos:

- 0 visores y dormido: no arranca.
- El primer visor, o `wake()`, pide un arranque y la página debe decir «despertando el avatar…».
- Un segundo visor o un segundo `wake()` no lanza otro Unreal.
- Cuando el host de Pixel Streaming responde, pasa a encendido y el texto de despertar desaparece.
- 10 minutos seguidos sin visores: una sola parada. A los 9 minutos sigue encendido.
- Si vuelve un visor, la cuenta atrás se anula.

`com.admiranext.avatar-streamer.plist` no lleva `KeepAlive` y `RunAtLoad` es falso, para que el login del Mac no lo levante otra vez. Jobs ya hizo `launchctl bootout` del agente que estaba siempre encendido.

## Qué falta en el MBP16

1. Instalar este plist en el sitio del LaunchAgent del streamer, sin `KeepAlive` y sin `RunAtLoad`.
2. Un portero pequeño, cargado al login, que lea los visores de Wilbur y llame a `viewers(n)` / `wake()`. Ese portero es el que ejecuta el arranque y la parada de UnrealEditor. No está en este repo porque el binario y la ruta son del Mac.
3. Mientras `phase` sea `waking`, `metahuman.html` y `embed-mh.html` muestran «despertando el avatar…». Hoy, si el host no responde, la página cae al avatar web. No cambio ese comportamiento hasta que el portero exista: si no, el visitante leería que el avatar despierta y no despertaría.
4. Prueba en la máquina: sin visores, sin `UnrealEditor` y la GPU en reposo; al abrir el visor arranca y se ve; 10 minutos después de cerrarlo se apaga. Anotar horas y % de GPU.

## Comprobar la política desde cualquier máquina

```bash
node --test ops/avatar-on-demand/policy.test.js
```
