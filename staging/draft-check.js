// Staging-only simulation. Never writes listings or uploads images to storage.
(()=>{'use strict';const $=id=>document.getElementById(id),button=$('draftCheck');if(!button)return;
button.onclick=async()=>{
 const output=$('draftResult'),files=Array.from($('draftPhotos').files||[]);
 const title=$('draftTitle').value.trim(),description=$('draftDescription').value.trim();
 if(!title||!files.length){output.textContent='Wpisz tytuł i dodaj zdjęcie';return}
 const client=window.vexorioStagingSupabase;
 const {data:{session}}=await client.auth.getSession();
 if(!session){output.textContent='Zaloguj się do STAGING';return}
 button.disabled=true;output.textContent='Trwa kontrola…';
 try{
 const readFile=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
 const photos=await window.VexorioPhotoPreflight.check(files,client,readFile);
 const text=window.VexorioModerationTriage.evaluate({title,description,hasImages:true});
 output.textContent=photos.requiresReview||text.requiresHumanReview?'WYMAGA KONTROLI ADMINISTRATORA — symulacja, nie zapisano':'WSTĘPNIE OK — symulacja, nie opublikowano';
 }catch{output.textContent='Analiza niedostępna — wymaga ręcznej kontroli'}
 finally{button.disabled=false}
};
})();