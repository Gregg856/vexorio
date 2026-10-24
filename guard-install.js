'use strict';
(()=>{
 const button=document.getElementById('installGuard');
 if(!button)return;
 let promptEvent=null;
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  promptEvent=event;
  button.hidden=false;
 });
 button.addEventListener('click',async()=>{
  if(!promptEvent)return;
  const event=promptEvent;promptEvent=null;button.hidden=true;
  await event.prompt();
 });
 window.addEventListener('appinstalled',()=>{button.hidden=true;promptEvent=null});
})();
