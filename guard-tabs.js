'use strict';
(()=>{
 const names=['Chat','Developer','Moderation','Queen'];
 const tabs=names.map(n=>document.getElementById('guardTab'+n));
 const panels=names.map(n=>document.getElementById('guardPanel'+n));
 if(tabs.some(t=>!t)||panels.some(p=>!p))return;
 function select(i,focus=false){
  tabs.forEach((tab,n)=>{const active=i===n;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;panels[n].hidden=!active;});
  if(focus)tabs[i].focus();
 }
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>select(i));
  tab.addEventListener('keydown',e=>{
   let next=i;
   if(e.key==='ArrowRight')next=(i+1)%tabs.length;
   else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;
   else if(e.key==='Home')next=0;
   else if(e.key==='End')next=tabs.length-1;
   else return;
   e.preventDefault();select(next,true);
  });
 });
 select(0);
})();
