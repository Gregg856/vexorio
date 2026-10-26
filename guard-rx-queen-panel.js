'use strict';
(()=> {
 const button=document.getElementById('rxQueenCompare'),result=document.getElementById('rxQueenResult');
 if(!button||!result)return;
 button.addEventListener('click',()=>{
  const memory=document.getElementById('rxQueenMemory').value.trim();
  const learned=document.getElementById('rxQueenLearned').value.trim();
  const valid=x=>/^[a-z0-9_-]{1,64}$/i.test(x);
  if((memory&&!valid(memory))||(learned&&!valid(learned))){result.textContent='Nieprawidłowy identyfikator naprawy.';return;}
  const state=memory&&learned?(memory===learned?'ZGODNOŚĆ':'KONFLIKT'):memory?'TYLKO PAMIĘĆ':learned?'TYLKO MODEL':'NIEZNANY BŁĄD';
  result.textContent='RX NEURON 2.1 — '+state+'\nPamięć: '+(memory||'brak')+'\nModel: '+(learned||'brak')+'\n'+(state==='ZGODNOŚĆ'?'Propozycja do ręcznej oceny: '+memory:'Brak wspólnej, potwierdzonej propozycji.')+'\nTryb demonstracyjny — dane wpisane ręcznie, bez odczytu pamięci produkcyjnej i bez wykonywania napraw.';
 });
})();
