# Idioma y controles del avatar / Avatar language and controls

ES: El avatar ofrece ESP y ENG junto a la pregunta, también en modo integrado. ESP muestra Micrófono, Detener y Preguntar; ENG muestra Microphone, Stop y Ask. Los controles conservan sus acciones de voz, escucha y envío, con iconos SVG, etiquetas legibles y foco de teclado. Al cambiar de idioma se detiene la conversación anterior, se mantienen la pregunta escrita, el nivel y el contexto de la tienda; el cambio no envía preguntas ni activa el micrófono. La pared Alsea recuerda la elección durante esta pestaña, incluso al cerrar y reabrir el avatar, sin recargar la conversación al elegir idioma.

EN: The avatar offers ESP and ENG next to the question, including embedded mode. ESP shows Micrófono, Detener and Preguntar; ENG shows Microphone, Stop and Ask. Controls retain their speech, listening and send actions, with SVG icons, readable labels and keyboard focus. Changing language stops the previous conversation while preserving the typed question, tier and store context; switching neither sends questions nor enables the microphone. The Alsea wall remembers the choice for this tab, including closing and reopening the avatar, without reloading the conversation when selecting a language.

## Contrato / Contract

- Renderers: `/nube.html` (Good), `/best.html` (Better), `/metahuman.html` (Best); `/better.html` retains historical 3D controls. Assets: `/assets/da-conversation-controls.js`, `/assets/da-conversation-controls.css`.
- Language source: `DAContext.lang`, initially `?lang=es|en`; native language listeners also update placeholders, chips and recognition/request language. No new API or voices.
- Parent notification: `{type:"da-language-selected",lang:"es"|"en"}` sent only to the trusted embedding origin. XpaceOS validates `event.source`, `https://digitalavatar.ai`, the expanded conversation and the language.
- Wall persistence: sessionStorage `admira-avatar:language:alsea-sbux-021`; scope is this browser tab/Xpace. No shared MCP write; no physical-screen configuration change.
- Native Stop cancels listening/speech using each renderer’s existing handler. The render host and speech providers retain their existing availability requirements.
- Tutorial ES: ampliar la pared → Hablar con el avatar → ESP/ENG → escribir y Preguntar, o Micrófono; Detener interrumpe la voz. Cerrar vuelve al kiosko.
- Tutorial EN: enlarge wall → Talk to the avatar → ESP/ENG → type and Ask, or Microphone; Stop interrupts speech. Close returns to the kiosk.
