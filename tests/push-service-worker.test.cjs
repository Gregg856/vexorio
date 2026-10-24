const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const handlers={};
const notifications=[];
const opened=[];
const tabs=[];
const self={
 location:{origin:'https://vexorio.example'},
 registration:{showNotification:async(title,options)=>notifications.push({title,options})},
 addEventListener:(type,fn)=>{handlers[type]=fn},
 skipWaiting:async()=>{},
 clients:null
};
const clients={matchAll:async()=>tabs,openWindow:async url=>opened.push(url),claim:async()=>{}};
const context={self,clients,URL};
vm.runInNewContext(fs.readFileSync('push-sw.js','utf8'),context,{filename:'push-sw.js'});
async function push(data){
 let pending;
 handlers.push({data,waitUntil:p=>{pending=p}});
 await pending;
 return notifications.at(-1);
}
async function click(url){
 let pending;
 handlers.notificationclick({notification:{data:{url},close(){}},waitUntil:p=>{pending=p}});
 await pending;
}
(async()=>{
 let n=await push(null);
 assert.equal(n.title,'VEXORIO');
 assert.equal(n.options.data.url,'/?inbox=1');
 n=await push({json:()=>({title:'  Hi  ',body:'Hello',url:'//evil.test/path',tag:'t'})});
 assert.equal(n.title,'Hi');
 assert.equal(n.options.data.url,'/?inbox=1');
 n=await push({json:()=>({title:123,body:[],tag:{},url:'https://evil.test'})});
 assert.equal(n.title,'VEXORIO');
 assert.equal(n.options.body,'Masz nową wiadomość.');
 assert.equal(n.options.tag,'vexorio-message');
 n=await push({json:()=>({url:'/messages?inbox=1#latest',title:'x'.repeat(150),body:'b'.repeat(300),tag:'t'.repeat(90)})});
 assert.equal(n.options.data.url,'/messages?inbox=1#latest');
 assert.equal(n.title.length,100);
 assert.equal(n.options.body.length,240);
 assert.equal(n.options.tag.length,80);
 n=await push({json:()=>{throw Error('bad JSON')},text:()=> 'fallback text'});
 assert.equal(n.options.body,'fallback text');
 for(const url of ['/\\\\evil.test','/%5c%5cevil.test','http://evil.test','/\\bad']){
  n=await push({json:()=>({url})});
  if(url.includes('\\'))assert.equal(n.options.data.url,'/?inbox=1');
 }
 tabs.push({url:'https://vexorio.example/unrelated',focus:async()=>{throw Error('unrelated tab focused')}});
 await click('/?inbox=1');
 assert.equal(opened.at(-1),'https://vexorio.example/?inbox=1');
 const messages=[];
 tabs.push({url:'https://vexorio.example/?inbox=1',focus:async()=>{},postMessage:message=>messages.push(message)});
 const before=opened.length;
 await click('/?inbox=1');
 assert.equal(opened.length,before);
 assert.equal(messages.at(-1).type,'VEXORIO_OPEN_CONVERSATION');
 console.log('PASS: push payload, URL validation, limits, click routing and tab isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
