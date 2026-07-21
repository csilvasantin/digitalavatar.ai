/*
  digitalavatar.ai · mh-embed.js — incrusta el MetaHuman de Neo (Keanu, Pixel Streaming) en cualquier web.
  Uso mínimo (solo ver):
    <script src="https://digitalavatar.ai/mh-embed.js"></script>
  Con caja de preguntas y tamaño:
    <script src="https://digitalavatar.ai/mh-embed.js" data-ask="1" data-width="380" data-ratio="9x16"></script>
  Atributos opcionales (en el <script>):
    data-ask="1"        muestra la caja de preguntas (habla con Neo). Por defecto: solo ver.
    data-ratio          "9x16" (retrato, def.) · "16x9" · "1x1". Ignorado si das data-height.
    data-width          ancho máximo en px (def. 360). El embed es responsive hasta ese ancho.
    data-height         alto fijo en px (útil con data-ask="1", p.ej. 720). Prioritario sobre data-ratio.
    data-autostart="1"  carga el stream sin póster (⚠ machaca el host de render en cada visita).
    data-target="#id"   CSS selector donde montar; por defecto se inserta donde está el <script>.

  Nota: es un stream EN VIVO compartido (una instancia de render). Las mejoras hechas en
  digitalavatar.ai llegan solas a quien lo embebe. Cae al avatar web si el host está apagado.
*/
(function(){
  var s = document.currentScript;
  if(!s){ var all=document.getElementsByTagName('script'); s=all[all.length-1]; }
  function attr(n,d){ var v=s.getAttribute(n); return (v==null||v==='')?d:v; }

  var ask       = attr('data-ask','0')==='1';
  var autostart = attr('data-autostart','0')==='1';
  var ratio     = attr('data-ratio','9x16');
  var width     = parseInt(attr('data-width','360'),10) || 360;
  var height    = parseInt(attr('data-height',''),10) || 0;
  var targetSel = attr('data-target','');

  var base='https://digitalavatar.ai/embed-mh.html';
  var qp=[]; if(ask) qp.push('ask=1'); if(autostart) qp.push('autostart=1');
  var src=base + (qp.length?('?'+qp.join('&')):'');

  var pad = ({'16x9':56.25,'1x1':100,'9x16':177.78})[ratio] || 177.78;

  var wrap=document.createElement('div');
  wrap.style.cssText='width:100%;max-width:'+width+'px;margin:0 auto';

  var box=document.createElement('div');
  if(height){ box.style.cssText='position:relative;width:100%;height:'+height+'px'; }
  else { box.style.cssText='position:relative;width:100%;padding-top:'+pad+'%'; }

  var ifr=document.createElement('iframe');
  ifr.src=src; ifr.loading='lazy'; ifr.title='Neo · MetaHuman en vivo';
  ifr.allow='autoplay; fullscreen; microphone';
  ifr.setAttribute('allowfullscreen','');
  ifr.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0';

  box.appendChild(ifr); wrap.appendChild(box);

  var mount = targetSel ? document.querySelector(targetSel) : null;
  if(mount){ mount.appendChild(wrap); }
  else if(s && s.parentNode){ s.parentNode.insertBefore(wrap, s.nextSibling); }
  else { document.body.appendChild(wrap); }
})();
