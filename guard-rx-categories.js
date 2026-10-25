'use strict';
(()=>{
 const nav=document.getElementById('rxCategoryNav');
 if(!nav)return;
 nav.addEventListener('click',event=>{
  const button=event.target.closest('button[data-rx-tab]');
  if(!button||!nav.contains(button))return;
  const tab=document.getElementById(button.dataset.rxTab);
  if(!tab)return;
  tab.click();
  const target=button.dataset.rxTarget&&document.getElementById(button.dataset.rxTarget);
  (target||tab).scrollIntoView({behavior:'smooth',block:'start'});
  if(button.dataset.rxTarget==='guardChatInput')target?.focus({preventScroll:true});
 });
})();
