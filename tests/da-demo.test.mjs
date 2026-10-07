// /demo <solución> desde el avatar (7-oct-2026, demo Alsea): presenta y luego pide a la página abrir la demo.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync(new URL('../assets/da-context.js',import.meta.url),'utf8');
function load({embedded=true,search=''}={}){
 const posts=[],went=[],timers=[];
 const win={location:{search,assign:u=>went.push(u)},addEventListener(){},parent:{postMessage:(...v)=>posts.push(v)}};
 win.self=win;win.top=embedded?{}:win;
 vm.runInNewContext(code,{window:win,URLSearchParams,setTimeout:(f,ms)=>timers.push({f,ms}),clearTimeout(){},fetch:async()=>({ok:false,json:async()=>({})})});
 return {api:win.DAContext,posts,went,timers};
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
