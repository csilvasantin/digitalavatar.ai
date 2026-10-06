/* Shared conversation controls: native handlers remain on their original buttons. */
(function(root){
 'use strict';
 var doc=root.document,context=root.DAContext;
 var mic=doc.getElementById('mic')||doc.getElementById('btnMic'),stop=doc.getElementById('cut')||doc.getElementById('btnStop'),ask=doc.getElementById('send')||doc.getElementById('btnSend');
 if(!mic||!stop||!ask||!context)return;
 var row=mic.parentElement;row.classList.add('da-control-row');
 var labels={es:{language:'Idioma del avatar',mic:'Micrófono',stop:'Detener',ask:'Preguntar',micTitle:'Hablar por micrófono',stopTitle:'Detener voz y escucha',askTitle:'Enviar pregunta'},en:{language:'Avatar language',mic:'Microphone',stop:'Stop',ask:'Ask',micTitle:'Speak using the microphone',stopTitle:'Stop speech and listening',askTitle:'Send question'}};
 var icons={mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',stop:'<rect x="5" y="5" width="14" height="14" rx="3"/>',ask:'<path d="m5 12 7-7 7 7M12 5v15"/>'};
 var selector=doc.createElement('div');selector.className='da-conversation-language';selector.setAttribute('role','group');
 var name=doc.createElement('span');name.className='da-language-label';selector.append(name);
 var languageButtons={};['es','en'].forEach(function(lang){var button=doc.createElement('button');button.type='button';button.className='da-language-choice';button.textContent=lang==='es'?'ESP':'ENG';button.setAttribute('aria-label',lang==='es'?'Español':'English');button.addEventListener('click',function(){choose(lang);});languageButtons[lang]=button;selector.append(button);});
 row.parentElement.insertBefore(selector,row);
 function language(){return context.get().lang==='en'?'en':'es';}
 function paint(){
  var lang=language(),t=labels[lang];selector.setAttribute('aria-label',t.language);name.textContent=t.language;
  ['es','en'].forEach(function(l){languageButtons[l].setAttribute('aria-pressed',String(l===lang));});
  [[mic,'mic'],[stop,'stop'],[ask,'ask']].forEach(function(pair){var button=pair[0],kind=pair[1];button.type='button';button.classList.add('da-conversation-action','da-action-'+kind);button.setAttribute('aria-label',t[kind]);button.title=t[kind+'Title'];var html='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+icons[kind]+'</svg><span>'+t[kind]+'</span>';if(button.innerHTML!==html)button.innerHTML=html;});
 }
 function choose(lang){
  if(lang!=='es'&&lang!=='en'||lang===language())return;
  // Change the context and cancel the previous listening/answer through native Stop.
  context.set({lang:lang});stop.click();paint();
  // The embedding wall may retain this explicit choice; no question or audio is sent.
  try{if(root.parent!==root){var origin=new URL(doc.referrer).origin;if(/^https:\/\/([a-z0-9-]+\.)*(admira\.store|xpaceos\.com|admiranext\.com)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))root.parent.postMessage({type:'da-language-selected',lang:lang},origin);}}catch(_){}
 }
 context.on(function(kind){if(kind==='lang'||kind==='profile')paint();});
 root.DAConversationControls={choose:choose,paint:paint};paint();
})(window);
