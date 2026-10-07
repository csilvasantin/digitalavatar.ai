import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../assets/da-context.js',import.meta.url),'utf8');
function load({embedded=true,referrer='https://www.admira.store/admira-xp/',search=''}={}){
 const posts=[],timers=new Map(),listeners=[],fetches=[];let nextTimer=0;
 const parent={postMessage:(...v)=>posts.push(v)};
 const win={location:{search,assign(){}},parent,addEventListener:(t,f)=>{if(t==='message')listeners.push(f);}};
 win.self=win;win.top=embedded?{}:win;
 vm.runInNewContext(code,{window:win,URL,URLSearchParams,document:{referrer},setTimeout:(f,ms)=>{timers.set(++nextTimer,{f,ms});return nextTimer;},clearTimeout:id=>timers.delete(id),fetch:async(...v)=>{fetches.push(v);return{ok:false};}});
 const msg=(data,{origin='https://www.admira.store',source=parent}={})=>listeners.forEach(f=>f({data,origin,source}));
 const ack=(p,extra={})=>msg({type:'da-demo-result',requestId:p.requestId,ok:true,message:'Demo pausada.',estado:{activo:true,pausado:true},...extra});
 return{api:win.DAContext,posts,timers,fetches,parent,msg,ack};
}
test('every local alias sends immediately to exact parent origin and waits for its ACK, without provider or voice',async()=>{
 const h=load();
 for(const alias of ['auto','todas','todos','all','pausa','pause','reanudar','resume','continuar','siguiente','next','stop','off','parar','estado','status']){
  let settled=false;const pending=h.api.demoCommand('/DEMO '+alias.toUpperCase());pending.then(()=>settled=true);
  const [p,target]=h.posts.at(-1);assert.equal(p.type,'da-demo');assert.equal(p.texto,'/demo '+alias);assert.equal(target,'https://www.admira.store');assert.match(p.requestId,/^da-demo-/);
  await Promise.resolve();assert.equal(settled,false);assert.equal(h.timers.size,1);
  h.ack(p);const result=await pending;assert.equal(result.ok,true);assert.equal(result.confirmed,true);assert.equal(result.message,'Demo pausada.');assert.equal(result.estado.pausado,true);assert.equal(h.timers.size,0);
 }
 assert.equal(new Set(h.posts.map(([p])=>p.requestId)).size,16);assert.equal(h.fetches.length,0);
});
test('ACK requires matching request, parent source and exact trusted origin; duplicate and unsolicited ACKs are harmless',async()=>{
 const h=load();let settled=false;const pending=h.api.demoCommand('/demo auto');pending.then(()=>settled=true);const p=h.posts[0][0];
 const reply={type:'da-demo-result',requestId:p.requestId,ok:true,message:'real'};
 h.msg(reply,{origin:'https://evil.example'});h.msg(reply,{origin:'https://www.admira.biz'});h.msg(reply,{source:{}});
 h.msg({...reply,requestId:'unknown'});h.msg({...reply,requestId:'__proto__'});h.msg({...reply,requestId:{}});
 await Promise.resolve();assert.equal(settled,false);
 h.msg(reply);assert.equal((await pending).message,'real');h.msg(reply);assert.equal(h.timers.size,0);
});
test('error ACK, timeout and missing host never report an executed command',async()=>{
 const h=load();const error=h.api.demoCommand('/demo siguiente');h.ack(h.posts[0][0],{ok:false,message:'No hay una demo activa.'});assert.equal((await error).ok,false);
 const pending=h.api.demoCommand('/demo pausa');const timer=[...h.timers.values()][0];assert.equal(timer.ms,20000);timer.f();const timeout=await pending;assert.equal(timeout.ok,false);assert.equal(timeout.confirmed,false);assert.match(timeout.message,/no confirmó/);
 const noHost=load({referrer:'https://evil.example/'});const result=await noHost.api.demoCommand('/demo auto');assert.equal(result.ok,false);assert.equal(result.confirmed,false);assert.equal(noHost.posts.length,0);
});
test('trusted parent context establishes origin without referrer, but other frames cannot',async()=>{
 const h=load({referrer:''});h.msg({type:'da-subdemos',subdemos:[]},{source:{}});
 assert.equal((await h.api.demoCommand('/demo estado')).confirmed,false);
 h.msg({type:'da-subdemos',subdemos:[]});const pending=h.api.demoCommand('/demo estado');h.ack(h.posts[0][0]);assert.equal((await pending).confirmed,true);
});
test('numbers, names, help, bare demo and standalone input keep the existing route; controls cancel a delayed legacy opening',async()=>{
 const h=load();for(const q of ['/demo','/demo help','/demo 1','/demo store','/demo unknown','hello'])assert.equal(h.api.demoCommand(q),null);
 assert.equal(load({embedded:false}).api.demoCommand('/demo auto'),null);
 h.api.demoAsk('/demo store');h.api.demoDone('presentación');assert.equal(h.timers.size,1);
 const pending=h.api.demoCommand('/demo stop');assert.equal(h.timers.size,1);assert.equal([...h.timers.values()][0].ms,20000);
 h.ack(h.posts[0][0]);await pending;assert.equal(h.posts.length,1);
});

// Execute each real renderer's ask function with host ACK pending. No brain/voice stub may run.
const renderers=[['assets/nube.js','  window.__nubeAsk = ask;'],['best.html','// Saludo del sector'],['better.html','/* ===== push-to-talk'],['metahuman.html','    function doCut()']];
for(const [file,end] of renderers)test(file+' handles a typed control before provider/voice and renders only the current ACK',async()=>{
 const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');const start=source.indexOf('async function ask(');const fn=source.slice(start,source.indexOf(end,start));assert.ok(start>=0&&fn.length>100);
 const nodes={q:{value:'/demo pausa'},btnSend:{disabled:true}},statuses=[],captions=[],requests=[];
 const forbidden=()=>{throw Error('provider/voice path must not run');};const DADemo={stop(){},setState(){},unlock:forbidden};
 const sandbox={DACTX:{demoCommand:q=>new Promise(resolve=>requests.push({q,resolve}))},DADemo,window:{DADemo},LANG:'es',lang:()=> 'es',audioEl:{pause(){}},thinking:true,demoAskSequence:0,asking:0,seq:0,talkTimer:0,q:nodes.q,send:nodes.btnSend,$:id=>nodes[id],touch(){},stopDance(){},stopAll(){},stopSpeaking(){},clearHelpClass(){},clearTimeout(){},setStatus:(...v)=>statuses.push(v),setCaption:v=>captions.push(v),setAns:v=>captions.push(v),paint:(...v)=>statuses.push(v),fetch:forbidden,warmGraph:forbidden,DANeoPlayer:{whenHost:forbidden},armStream:forbidden};
 vm.createContext(sandbox);vm.runInContext(fn,sandbox);
 const first=sandbox.ask('/demo pausa');assert.equal(requests[0].q,'/demo pausa');assert.ok(statuses.flat().some(s=>String(s).includes('Esperando'))||captions.some(s=>String(s).includes('Esperando')));assert.equal(captions.includes('Demo pausada.'),false);assert.equal(nodes.btnSend.disabled,false);
 nodes.q.value='/demo estado';const second=sandbox.ask('/demo estado');requests[0].resolve({ok:true,message:'stale'});await first;assert.equal(captions.includes('stale'),false);
 requests[1].resolve({ok:false,message:'No hay una demo activa.'});await second;assert.equal(captions.at(-1),'No hay una demo activa.');
});
