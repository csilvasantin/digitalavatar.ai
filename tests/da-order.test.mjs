// Modo pedido (7-oct-2026): la cara pasa mode/store/order al cerebro y reenvía la acción
// order-draft al quiosco anfitrión dentro de da-answer, solo a su origen exacto.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync(new URL('../assets/da-context.js',import.meta.url),'utf8');
function load({embedded=true,search='',referrer=''}={}){
 const posts=[],ls={};
 const parent={postMessage:(...v)=>posts.push(v)};
 const win={location:{search,hostname:'digitalavatar.ai'},addEventListener:(t,f)=>{(ls[t]=ls[t]||[]).push(f);},parent};
 win.self=win;win.top=embedded?{}:win;
 const document={referrer,getElementById:()=>null,createElement:()=>({}),head:{appendChild(){}}};
 vm.runInNewContext(code,{window:win,document,URL,URLSearchParams,setTimeout(){},clearTimeout(){},fetch:async()=>({ok:false,json:async()=>({})})});
 const msg=(data,origin)=>(ls.message||[]).forEach(f=>f({data,origin,source:parent}));
 return {api:win.DAContext,posts,msg};
}
const DRAFT={type:'order-draft',version:1,store:'starbucks-paseo-de-gracia',lines:[{id:'caffe-latte',qty:1,options:{tamano:'grande',leche:'avena'}}],customerName:'Carlos',ready:true,missing:[],summary:'1 Caffè Latte grande con leche de avena'};
const KIOSK='https://www.ainimation.studio';

test('?mode=order&store= viaja al cerebro y el borrador recibido vuelve como order',()=>{
 const h=load({search:'?brand=starbucks&mode=order&store=starbucks-paseo-de-gracia'});
 let b=h.api.body();
 assert.equal(b.mode,'order');assert.equal(b.store,'starbucks-paseo-de-gracia');assert.equal(b.order,undefined);
 h.api.action(DRAFT);
 b=h.api.body();
 assert.deepEqual(JSON.parse(JSON.stringify(b.order)),{type:'order-draft',version:1,lines:DRAFT.lines,store:DRAFT.store,customerName:'Carlos'});
 assert.equal(h.posts.length,0,'action() no publica nada');
});

test('sin modo pedido el cuerpo no cambia',()=>{
 const h=load({search:'?brand=starbucks&store=x'});
 const b=h.api.body();
 assert.equal(b.mode,undefined);assert.equal(b.order,undefined);assert.equal(b.store,undefined);
 assert.equal(load({search:'?mode=otro'}).api.body().mode,undefined);
});

test('da-context del quiosco activa el modo pedido y su carrito manda (order:null lo vacía)',()=>{
 const h=load({search:'?brand=starbucks'});
 h.msg({type:'da-context',mode:'order',store:'starbucks-paseo-de-gracia',order:{lines:[{id:'cookie',qty:2}]}},KIOSK);
 let b=h.api.body();
 assert.equal(b.mode,'order');assert.deepEqual(JSON.parse(JSON.stringify(b.order.lines)),[{id:'cookie',qty:2,options:{}}]);
 h.msg({type:'da-context',order:null},KIOSK);
 assert.equal(h.api.body().order,undefined);
 h.msg({type:'da-context',mode:'order',order:{lines:[{id:'x',qty:1}]}},'https://evil.example');
 assert.equal(h.api.body().order,undefined,'un origen no permitido no toca el pedido');
});

test('da-answer con action va al origen exacto del quiosco, nunca a *',()=>{
 const h=load({search:'?mode=order&brand=starbucks'});
 h.msg({type:'da-context',mode:'order'},KIOSK);
 h.api.notify({answer:'Hola',spoke:true,action:DRAFT});
 const [m,origin]=h.posts.pop();
 assert.equal(origin,KIOSK);assert.equal(m.type,'da-answer');assert.equal(m.answer,'Hola');assert.equal(m.spoke,true);
 assert.deepEqual(m.action,DRAFT);
 h.api.notify({answer:'Sin acción',spoke:false});
 const [m2,o2]=h.posts.pop();assert.equal(o2,'*');assert.equal(m2.action,undefined,'sin acción, como siempre');
 h.api.notify({error:'xai_http_502'});assert.equal(h.posts.pop()[0].error,'xai_http_502');
});

test('anfitrión fuera de la lista de pedido o desconocido: da-answer sin action',()=>{
 const tv=load();tv.msg({type:'da-context',lang:'es'},'https://admira.tv');
 tv.api.notify({answer:'Hola',action:DRAFT});
 const [m,o]=tv.posts.pop();assert.equal(o,'*');assert.equal(m.action,undefined);
 const none=load();none.api.notify({answer:'Hola',action:DRAFT});
 const [m2,o2]=none.posts.pop();assert.equal(o2,'*');assert.equal(m2.action,undefined);
 const top=load({embedded:false});top.api.notify({answer:'x',action:DRAFT});assert.equal(top.posts.length,0);
});

test('el origen del anfitrión también sale del referrer (localhost y xpaceos valen)',()=>{
 for(const ref of ['http://localhost:8080/kiosko/','https://www.xpaceos.com/gemelo/','https://admiranext.com/x','https://www.admira.store/']){
  const h=load({referrer:ref});h.api.notify({answer:'ok',action:DRAFT});
  const [m,o]=h.posts.pop();assert.equal(o,new URL(ref).origin);assert.deepEqual(m.action,DRAFT);
 }
});

test('las caras reenvían la acción del cerebro en da-answer y no usan * para ella',()=>{
 const nube=fs.readFileSync(new URL('../assets/nube.js',import.meta.url),'utf8');
 const best=fs.readFileSync(new URL('../best.html',import.meta.url),'utf8');
 const mh=fs.readFileSync(new URL('../metahuman.html',import.meta.url),'utf8');
 assert.match(nube,/function notifyParent\(payload\) \{ if \(DACTX\.notify\)/);
 assert.equal((nube.match(/notifyParent\(\{ answer: answer, action: j\.action,/g)||[]).length,3);
 assert.match(best,/function notifyParent\(payload\)\{ if\(DACTX\.notify\)/);
 assert.equal((best.match(/notifyParent\(\{answer:answer,action:j\.action,/g)||[]).length,6);
 assert.match(mh,/DACTX\.notify\(d\.ok \? \{answer:a, [^}]*action:d\.action\}/);
});
