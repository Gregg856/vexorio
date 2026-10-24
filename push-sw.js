'use strict';
const FALLBACK_URL='/?inbox=1';
const MAX_TITLE=100;
const MAX_BODY=240;
const MAX_TAG=80;
function safeText(value,fallback,max){
  if(typeof value!=='string')return fallback;
  const clean=value.replace(/[\\u0000-\\u001F\\u007F]/g,' ').trim();
  return clean?clean.slice(0,max):fallback;
}
function safePath(value){
  if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||value.includes('\\\\'))return FALLBACK_URL;
  try{
    const url=new URL(value,self.location.origin);
    if(url.origin!==self.location.origin||url.username||url.password)return FALLBACK_URL;
    if(!/^https?:$/.test(url.protocol))return FALLBACK_URL;
    return url.pathname+url.search+url.hash;
  }catch{return FALLBACK_URL}
}
function readPayload(event){
  if(!event.data)return {};
  try{
    const value=event.data.json();
    if(value&&typeof value==='object'&&!Array.isArray(value))return value;
  }catch{}
  try{return {body:event.data.text()}}catch{return {}}
}
self.addEventListener('push',event=>{
  const payload=readPayload(event);
  const title=safeText(payload.title,'VEXORIO',MAX_TITLE);
  const body=safeText(payload.body,'Masz nową wiadomość.',MAX_BODY);
  const tag=safeText(payload.tag,'vexorio-message',MAX_TAG);
  const url=safePath(payload.url);
  event.waitUntil(self.registration.showNotification(title,{
    body,tag,icon:'/favicon.ico',data:{url}
  }));
});
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const target=new URL(safePath(event.notification.data?.url),self.location.origin);
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of list){
      try{
        if(new URL(client.url).origin!==target.origin)continue;
        if(new URL(client.url).pathname+new URL(client.url).search!==target.pathname+target.search)continue;
        await client.focus();
        client.postMessage({type:'VEXORIO_OPEN_CONVERSATION',url:target.pathname+target.search});
        return;
      }catch{/* A closed or inaccessible tab should not block opening the inbox. */}
    }
    await clients.openWindow(target.href);
  })());
});
