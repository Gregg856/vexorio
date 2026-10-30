// Shared read-only RX BIBI task reasoning: compatible with Node and Cloudflare Workers.
export function answerRXTaskQuery(message,tasks){
 if(typeof message!=='string'||message.length>2000||!Array.isArray(tasks)||tasks.length>50)return null;
 if(tasks.some(t=>!t||typeof t.title!=='string'||!t.title.trim()||t.title.length>160||!['pending','completed'].includes(t.status)))return null;
 const text=message.trim();
 const pending=/^(?:co (?:jeszcze )?(?:zostało|zostalo)(?: do zrobienia)?|pokaż (?:oczekujące|oczekujace|nieukończone|nieukonczone) zadania|jakie zadania (?:czekają|czekaja|są do zrobienia|sa do zrobienia))[?!.\s]*$/i.test(text);
 const completed=/^(?:co (?:już|juz) (?:zrobione|ukończone)|pokaż (?:ukończone|ukonczone|zakończone) zadania|co (?:jest )?gotowe)[?!.\s]*$/i.test(text);
 const status=/^(?:jaki status zadania|sprawdź status zadania|sprawdz status zadania):?\s+(.+)$/i.exec(text);
 const normalize=s=>s.normalize('NFC').toLocaleLowerCase('pl-PL').replace(/\s+/g,' ').trim();
 const duplicateQuery=/^(?:czy (?:mam |są |sa )?(?:duplikaty|podobne zadania)|pokaż (?:duplikaty|podobne zadania)|sprawdź (?:duplikaty|podobne zadania)|sprawdz (?:duplikaty|podobne zadania))[?!.\s]*$/i.test(text);
 if(duplicateQuery){
  const groups=new Map();
  for(const task of tasks){
   const key=normalize(task.title).replace(/^(?:paprawić|poprawić|naprawić)\s+/,'naprawić ').replace(/\bbibi\b/g,'bibi');
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(task);
  }
  const repeats=[...groups.values()].filter(group=>group.length>1);
  if(!repeats.length)return 'Nie znalazłam zadań o tej samej lub znormalizowanej nazwie. Inne podobieństwa wymagają ręcznej oceny.';
  return 'Możliwe duplikaty do sprawdzenia: '+repeats.map(group=>group.map(t=>t.title+' ['+(t.status==='completed'?'ukończone':'oczekujące')+']').join(' / ')).join('; ')+'. Nie zmieniłam żadnego statusu.';
 }
 if(status){
  const matched=tasks.filter(t=>normalize(t.title)===normalize(status[1]));
  if(matched.length===1)return 'Status zadania „'+matched[0].title+'”: '+(matched[0].status==='completed'?'ukończone':'oczekujące')+'.';
  return matched.length?'Znalazłam kilka zadań o tej samej nazwie. Wybierz dokładny wpis.':'Nie znalazłam takiego zadania w Twoim rejestrze.';
 }
 if(!pending&&!completed)return null;
 const selected=tasks.filter(t=>t.status===(completed?'completed':'pending'));
 if(!selected.length)return 'W Twoim rejestrze nie ma '+(completed?'ukończonych':'oczekujących')+' zadań.';
 return (completed?'Zadania ukończone':'Zadania oczekujące')+' w Twoim rejestrze: '+selected.map(t=>t.title).join('; ')+'.';
}
