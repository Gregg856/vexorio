// VEXORIO staging moderation queue. Load only in a staging environment.
(()=>{'use strict';
const $=id=>document.getElementById(id);
const dialog=$('adminDashboardDialog');
if(!dialog)return;
const client=window.vexorioStagingSupabase;
if(!client||typeof client.rpc!=='function')return;
if(!/^https:\/\/owkjdlpawczrnwyszduj\.supabase\.co\/?$/.test(client.supabaseUrl||''))return;
const section=document.createElement('section');section.id='stagingModerationQueue';
section.innerHTML='<h3>🛡️ Ogłoszenia oczekujące na moderację (STAGING)</h3><button type="button" class="btn small" id="pendingRefresh">↻ Odśwież kolejkę</button><p id="pendingStatus" role="status"></p><div id="pendingList"></div>';
dialog.insertBefore(section,$('dashOverview'));
const status=$('pendingStatus'),list=$('pendingList');
const triage=window.VexorioModerationTriage;
// This is an advisory ordering only; server-side moderation remains authoritative.
const photoKeys=['listing_images','Images','image_urls','images','photos','photo_urls','image_url','photo_url'];
function hasPhoto(item){return photoKeys.some(key=>Array.isArray(item[key])?item[key].length>0:item[key]&&typeof item[key]==='object'?Object.keys(item[key]).length>0:typeof item[key]==='string'&&item[key].trim().length>0)||item.hasImages===true||Number(item.imageCount)>0}
const levels={'review-high':'Wysoki priorytet',review:'Do sprawdzenia',low:'Niski priorytet'};
async function load(){
 list.replaceChildren();status.textContent='Sprawdzanie uprawnień…';
 const {data:allowed,error:authError}=await client.rpc('is_vexorio_admin');
 if(authError||allowed!==true){status.textContent='Brak uprawnień do moderacji.';return}
 const {data,error}=await client.rpc('vexorio_admin_pending_listings_v2',{p_limit:50});
 if(error){status.textContent='Nie można pobrać kolejki: '+error.message;return}
 const items=(data||[]).map(item=>({...item,_risk:triage&&typeof triage.evaluate==='function'?triage.evaluate({...item,hasImages:hasPhoto(item)}):null}));
 items.sort((a,b)=>(b._risk?.score||0)-(a._risk?.score||0)||String(a.created_at||'').localeCompare(String(b.created_at||'')));
 const withPhotos=items.filter(item=>hasPhoto(item)).length;
 status.textContent='Pobrano '+items.length+' oczekujących (maks. 50) · ze zdjęciami: '+withPhotos+(triage?' · według ryzyka':' · bez oceny ryzyka');
 for(const item of items){
  const card=document.createElement('article');card.className='notice';
  const title=document.createElement('strong');title.textContent=item.title||'Bez tytułu';
  const desc=document.createElement('p');desc.textContent=item.description||'';
  const risk=document.createElement('p');risk.className='muted';risk.textContent=item._risk?('Priorytet: '+levels[item._risk.level]+' · '+item._risk.score+'/100'+(item._risk.reasons.length?' · Sygnały: '+item._risk.reasons.join(', '):'')+(item._risk.photoReviewRequired?' · Zdjęcia: wymagają osobnej kontroli':'') ):'Ocena ryzyka niedostępna';
  const buttons=document.createElement('div');buttons.className='tools';
  let photoConfirmed=null;
  if(hasPhoto(item)){
   const photoLabel=document.createElement('label');
   photoConfirmed=document.createElement('input');photoConfirmed.type='checkbox';photoConfirmed.setAttribute('aria-label','Potwierdzam ręczną kontrolę zdjęć');
   photoLabel.append(photoConfirmed,document.createTextNode(' Potwierdzam, że zdjęcia zostały sprawdzone (ręcznie lub przez skaner)'));
   card.append(photoLabel);
  }
  for(const [decision,label] of [['approved','Zatwierdź'],['rejected','Odrzuć']]){
   const button=document.createElement('button');button.type='button';button.className='btn small';button.textContent=label;
   button.onclick=async()=>{
    if(decision==='approved'&&photoConfirmed&&!photoConfirmed.checked){status.textContent='Przed zatwierdzeniem potwierdź kontrolę zdjęć.';return}
    if(!confirm(label+' ogłoszenie #'+item.listing_id+'?'))return;
    buttons.querySelectorAll('button').forEach(b=>b.disabled=true);
    let result,e;
    try{({data:result,error:e}=await client.rpc('vexorio_admin_review_listing',{p_listing_id:item.listing_id,p_decision:decision}))}catch(err){e=err}
    if(e||result===false){status.textContent='Nie zapisano decyzji: '+(e?.message||'Serwer odrzucił decyzję');buttons.querySelectorAll('button').forEach(b=>b.disabled=false);return}
    status.textContent='Zapisano decyzję. Odświeżanie…';
    await load();
   };buttons.append(button);
  }
  card.append(title,risk,desc,buttons);list.append(card);
 }
}
$('pendingRefresh').onclick=load;
if(dialog.open)load();
const observer=new MutationObserver(()=>{if(dialog.open)load()});
observer.observe(dialog,{attributes:true,attributeFilter:['open']});
})();