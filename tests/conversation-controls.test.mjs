import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync(new URL('../assets/da-conversation-controls.js',import.meta.url),'utf8');
function mount(ids=['mic','cut','send'],referrer='https://www.admira.store/admira-xp/'){
 class Node{constructor(){this.attrs={};this.events={};this.children=[];this.classList={add(){}};}setAttribute(k,v){this.attrs[k]=v;}append(n){this.children.push(n);}addEventListener(k,f){this.events[k]=f;}click(){this.onclick?.();this.events.click?.();}insertBefore(n){this.children.unshift(n);}}
 const row=new Node(),panel=new Node();row.parentElement=panel;const nodes={};for(const id of ids){nodes[id]=new Node();nodes[id].parentElement=row;}
 let stopped=0,asked=0,recorded=0;nodes[ids[0]].onclick=()=>recorded++;nodes[ids[1]].onclick=()=>stopped++;nodes[ids[2]].onclick=()=>asked++;nodes[ids[2]].disabled=true;
 const listeners=[],ctx={lang:'es',loc:'alsea-sbux-021',sector:'cafeteria',tier:'best'};const posts=[];
 const win={document:{referrer,getElementById:id=>nodes[id],createElement:()=>new Node()},parent:{postMessage:(...v)=>posts.push(v)},DAContext:{get:()=>({...ctx}),set:v=>{Object.assign(ctx,v);listeners.forEach(f=>f('lang'));},on:f=>listeners.push(f)}};
 vm.runInNewContext(code,{window:win,URL});return {win,nodes,ctx,posts,row,panel,counts:()=>({stopped,asked,recorded})};
}
for(const ids of [['mic','cut','send'],['btnMic','btnStop','btnSend']])test('language choices repaint the native controls without asking, recording or replacing their handlers: '+ids.join('/'),()=>{
 const h=mount(ids),initial=h.nodes[ids[2]].onclick;assert.equal(h.nodes[ids[2]].attrs['aria-label'],'Preguntar');assert.equal(h.panel.children[0].children[1].attrs['aria-pressed'],'true');
 h.win.DAConversationControls.choose('en');assert.deepEqual(h.counts(),{stopped:1,asked:0,recorded:0});assert.equal(h.ctx.loc,'alsea-sbux-021');assert.equal(h.ctx.tier,'best');assert.equal(h.nodes[ids[1]].attrs['aria-label'],'Stop');assert.equal(h.nodes[ids[2]].attrs['aria-label'],'Ask');assert.equal(h.nodes[ids[2]].disabled,true);assert.equal(h.nodes[ids[2]].onclick,initial);assert.equal(h.posts[0][1],'https://www.admira.store');
 h.win.DAConversationControls.choose('en');assert.equal(h.counts().stopped,1);
 h.win.DAConversationControls.choose('es');assert.equal(h.nodes[ids[1]].attrs['aria-label'],'Detener');assert.equal(h.nodes[ids[0]].attrs['aria-label'],'Micrófono');assert.match(h.nodes[ids[0]].innerHTML,/<svg/);
 h.win.DAConversationControls.choose('fr');assert.equal(h.ctx.lang,'es');
});
test('language is not posted to an unrelated embedding origin',()=>{const h=mount(undefined,'https://example.net/');h.win.DAConversationControls.choose('en');assert.equal(h.posts.length,0);});
