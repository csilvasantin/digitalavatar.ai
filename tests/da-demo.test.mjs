// /demo <solución> desde el avatar (7-oct-2026, demo Alsea): presenta y luego pide a la página abrir la demo.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync(new URL('../assets/da-context.js',import.meta.url),'utf8');
function load({embedded=true,search=''}={}){
 const posts=[],went=[],timers=[];
 const ls={};
 const win={location:{search,assign:u=>went.push(u)},addEventListener:(t,f)=>{(ls[t]=ls[t]||[]).push(f);},parent:{postMessage:(...v)=>posts.push(v)}};
 win.self=win;win.top=embedded?{}:win;
 vm.runInNewContext(code,{window:win,URLSearchParams,setTimeout:(f,ms)=>timers.push({f,ms}),clearTimeout(){},fetch:async()=>({ok:false,json:async()=>({})})});
 const msg=(data,origin='https://www.admira.studio')=>(ls.message||[]).forEach(f=>f({data,origin}));
 return {api:win.DAContext,posts,went,timers,msg};
}
test('/demo a secas sigue siendo el pitch; /demo store presenta y abre la demo en la página madre',()=>{
 const h=load();
 assert.equal(h.api.demoAsk('/demo'),'/demo');
 h.api.demoDone('respuesta');assert.equal(h.timers.length,0);
 const q=h.api.demoAsk('/demo store');assert.match(q,/admira\.store/);assert.match(q,/Alsea/);
 h.api.demoDone('Hola, esto es el gemelo digital del Starbucks de Alsea y te lo enseño ahora.');
 assert.equal(h.timers.length,1);assert.ok(h.timers[0].ms>=1500&&h.timers[0].ms<=30000);h.timers[0].f();
 assert.equal(h.posts.length,1);assert.equal(h.posts[0][0].type,'da-demo');assert.equal(h.posts[0][0].id,'store');
});
test('números, alias y admira. prefijo; desconocido no toca la pregunta',()=>{
 const h=load();
 for(const [t,id] of [['/demo 1','studio'],['/demo yokup','app'],['demo admira.tv','tv'],['/demo 5','biz']]){h.api.demoAsk(t);h.api.demoDone('ok');h.timers.pop().f();assert.equal(h.posts.pop()[0].id,id);}
 assert.equal(h.api.demoAsk('/demo tpv'),'/demo tpv');h.api.demoDone('x');assert.equal(h.timers.length,0);
});
test('sin página madre abre la URL de la demo aquí',()=>{
 const h=load({embedded:false});h.api.demoAsk('/demo store');h.api.demoDone('ok');h.timers[0].f();
 assert.equal(h.posts.length,0);assert.match(h.went[0],/admira-xp\/.*demo=tpv/);
});

// admira.studio / pixeria.com: avatar.js manda sus subdemos y /demo 1…5 pasan a ser de la plataforma.
const SUB={type:'da-subdemos',plataforma:'studio',nombre:'Admira Studio / Pixeria',subdemos:[
 {n:1,id:'voz',nombre:'Crear locución',desc:'De un guion breve a una voz lista para escuchar.',aliases:['locucion','voz']},
 {n:2,id:'musica',nombre:'Crear música',desc:'x',aliases:['musica']},{n:3,id:'imagen',nombre:'Crear imagen',desc:'x',aliases:['imagen']},
 {n:4,id:'video',nombre:'Crear vídeo',desc:'x',aliases:['video']},{n:5,id:'adaptar',nombre:'Adaptar formatos',desc:'x',aliases:['adaptar','formatos','adaptacion']}]};
test('subdemos locales: /demo N y alias de Studio, help lista solo Studio, nombres globales siguen',()=>{
 const h=load();h.msg(SUB);
 for(const [t,id,texto] of [['/demo 1','studio/voz','/demo 1'],['/demo locución','studio/voz','/demo 1'],['/demo VÍDEO','studio/video','/demo 4'],['/demo formatos','studio/adaptar','/demo 5']]){
  const q=h.api.demoAsk(t);assert.match(q,/muestra preparada/);h.api.demoDone('ok');h.timers.pop().f();
  const p=h.posts.pop()[0];assert.equal(p.type,'da-demo');assert.equal(p.id,id);assert.equal(p.texto,texto);
 }
 const q=h.api.demoAsk('/demo help');assert.match(q,/1 Crear locución.*5 Adaptar formatos/);assert.doesNotMatch(q,/admira\.tv/);
 h.api.demoDone('ok');h.timers.pop().f();assert.equal(h.posts.pop()[0].texto,'/demo help');
 assert.equal(h.api.demoAsk('/demo 6'),'/demo 6');
 h.api.demoAsk('/demo store');h.api.demoDone('ok');h.timers.pop().f();assert.equal(h.posts.pop()[0].id,'store');
});
test('subdemos de un origen no permitido se ignoran',()=>{
 const h=load();h.msg(SUB,'https://evil.example');h.api.demoAsk('/demo 1');h.api.demoDone('ok');h.timers.pop().f();assert.equal(h.posts.pop()[0].id,'studio');
});
