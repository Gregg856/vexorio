'use strict';
(()=> {
 const button=document.getElementById('rxQueenCompare'),result=document.getElementById('rxQueenResult');
 if(!button||!result)return;
 const snapshotField=document.getElementById('rxQueenSnapshot');
 const save=document.getElementById('rxQueenSaveMemory');
 const clear=document.getElementById('rxQueenClearMemory');
 const key='rx_queen_verified_memory_v1';
 const safe=x=>typeof x==='string'&&/^[a-z0-9_-]{1,64}$/i.test(x);
 function sanitize(raw){
  const data=JSON.parse(raw);
  if(data?.version!==1||!Array.isArray(data.patterns)||data.patterns.length>200)throw Error('Invalid memory');
  const keys=new Set(),patterns=[];
  for(const p of data.patterns){
   if(!p||!safe(p.cell)||!safe(p.code)||!Number.isSafeInteger(p.count)||p.count<1||
      (p.verifiedFix!==undefined&&!safe(p.verifiedFix)))throw Error('Invalid pattern');
   const id=p.cell+':'+p.code;
   if(keys.has(id))throw Error('Duplicate pattern');
   keys.add(id);
   if(p.verifiedFix)patterns.push({cell:p.cell,code:p.code,count:p.count,verifiedFix:p.verifiedFix});
  }
  return JSON.stringify({version:1,patterns});
 }
 try{
  const saved=localStorage.getItem(key);
  if(saved&&snapshotField){
   snapshotField.value=sanitize(saved);
   result.textContent='Wczytano zapisane lokalnie identyfikatory potwierdzonych napraw. Wybierz komórkę i kod błędu.';
  }
 }catch(_){result.textContent='Lokalna pamięć jest niedostępna lub niepoprawna. Możesz wkleić eksport ręcznie.';}
 save?.addEventListener('click',()=>{
  try{
   const cleaned=sanitize(snapshotField?.value||'');
   localStorage.setItem(key,cleaned);
   snapshotField.value=cleaned;
   result.textContent='Zapisano wyłącznie zatwierdzone identyfikatory napraw na tym urządzeniu. Przy następnym otwarciu panel wczyta je sam.';
  }catch(_){result.textContent='Nie udało się zapisać pamięci. Sprawdź eksport i dostępność pamięci przeglądarki.';}
 });
 clear?.addEventListener('click',()=>{
  try{localStorage.removeItem(key);if(snapshotField)snapshotField.value='';result.textContent='Lokalna pamięć królowej została wyczyszczona.';}
  catch(_){result.textContent='Nie udało się wyczyścić lokalnej pamięci.';}
 });
 button.addEventListener('click',()=>{
  const learned=document.getElementById('rxQueenLearned').value.trim();
  const manual=document.getElementById('rxQueenMemory').value.trim();
  const snapshot=document.getElementById('rxQueenSnapshot')?.value.trim()||'';
  const cell=document.getElementById('rxQueenCell')?.value.trim()||'';
  const code=document.getElementById('rxQueenCode')?.value.trim()||'';
  const valid=x=>typeof x==='string'&&/^[a-z0-9_-]{1,64}$/i.test(x);
  if((manual&&!valid(manual))||(learned&&!valid(learned))){result.textContent='Nieprawidłowy identyfikator naprawy.';return;}
  let memory=manual,source='ręcznie';
  if(snapshot){
   try{
    const data=JSON.parse(snapshot);
    if(data?.version!==1||!Array.isArray(data.patterns)||data.patterns.length>1000||!valid(cell)||!valid(code))throw Error();
    const patterns=data.patterns;
    for(const p of patterns)if(!p||!valid(p.cell)||!valid(p.code)||!Number.isSafeInteger(p.count)||p.count<1||(p.verifiedFix!==undefined&&!valid(p.verifiedFix)))throw Error();
    const matches=patterns.filter(p=>p.cell===cell&&p.code===code);
    if(matches.length>1)throw Error();
    memory=matches[0]?.verifiedFix||'';
    source='eksport pamięci RX';
   }catch(_){result.textContent='Nieprawidłowy eksport pamięci RX lub kod błędu. Nie wykonano porównania.';return;}
  }
  const state=memory&&learned?(memory===learned?'ZGODNOŚĆ':'KONFLIKT'):memory?'TYLKO PAMIĘĆ':learned?'TYLKO MODEL':'NIEZNANY BŁĄD';
  result.textContent='RX NEURON 2.2 — '+state+'\nPamięć ('+source+'): '+(memory||'brak')+'\nModel (wpis ręczny): '+(learned||'brak')+'\n'+(state==='ZGODNOŚĆ'?'Propozycja do ręcznej oceny: '+memory:'Brak wspólnej, potwierdzonej propozycji.')+'\nBez wykonywania napraw. Dane nie są wysyłane do serwera.';
 });
})();
