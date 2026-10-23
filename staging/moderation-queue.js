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
async function load(){
 list.replaceChildren();status.textContent='Sprawdzanie uprawnień…';
 const {data:allowed,error:authError}=await client.rpc('is_vexorio_admin');
 if(authError||allowed!==true){status.textContent='Brak uprawnień do moderacji.';return}
 const {data,error}=await client.rpc('vexorio_admin_pending_listings',{p_limit:50});
 if(error){status.textContent='Nie można pobrać kolejki: '+error.message;return}
 status.textContent='Oczekujące ogłoszenia: '+(data||[]).length;
 for(const item of data||[]){
  const card=document.createElement('article');card.className='notice';
  const title=document.createElement('strong');title.textContent=item.title||'Bez tytułu';
  const desc=document.createElement('p');desc.textContent=item.description||'';
  const buttons=document.createElement('div');buttons.className='tools';
  for(const [decision,label] of [['approved','Zatwierdź'],['rejected','Odrzuć']]){
   const button=document.createElement('button');button.type='button';button.className='btn small';button.textContent=label;
   button.onclick=async()=>{
    if(!confirm(label+' ogłoszenie #'+item.listing_id+'?'))return;
    buttons.querySelectorAll('button').forEach(b=>b.disabled=true);
    const {error:e}=await client.rpc('vexorio_admin_review_listing',{p_listing_id:item.listing_id,p_decision:decision});
    if(e){status.textContent='Nie zapisano decyzji: '+e.message;buttons.querySelectorAll('button').forEach(b=>b.disabled=false);return}
    await load();
   };buttons.append(button);
  }
  card.append(title,desc,buttons);list.append(card);
 }
}
$('pendingRefresh').onclick=load;
const observer=new MutationObserver(()=>{if(dialog.open)load()});
observer.observe(dialog,{attributes:true,attributeFilter:['open']});
})();