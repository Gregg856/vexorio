self.addEventListener('push',event=>{let payload={};try{payload=event.data?event.data.json():{}}catch(e){payload={body:event.data?.text()||''}}const title=String(payload.title||'VEXORIO').slice(0,100);const body=String(payload.body||'Masz nową wiadomość.').slice(0,240);const path=typeof payload.url==='string'&&payload.url.startsWith('/')&&!payload.url.startsWith('//')?payload.url:'/?inbox=1';event.waitUntil(self.registration.showNotification(title,{body,tag:payload.tag||'vexorio-message',icon:'/favicon.ico',data:{url:path}}));});
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  let target;
  try { target=new URL(event.notification.data?.url||'/?inbox=1',self.location.origin); }
  catch(e) { target=new URL('/?inbox=1',self.location.origin); }
  if(target.origin!==self.location.origin)return;
  const list=await clients.matchAll({type:'window',includeUncontrolled:true});
  // Do not replace an unrelated open page with the inbox.
  for(const client of list){
   if(client.url===target.href){await client.focus();client.postMessage({type:'VEXORIO_OPEN_CONVERSATION',url:target.pathname+target.search});return;}
  }
  await clients.openWindow(target.href);
 })());
});