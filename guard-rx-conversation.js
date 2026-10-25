'use strict';
// RX Conversation 1.0: local intent routing, not a generative language model.
// Advisory only. No network, credentials, code execution or writes.
(function(root){
 function respondNatural(value,analyze){
  if(typeof value!=='string'||!value.trim()||value.length>2000)return null;
  const input=value.trim();
  const text=input.toLocaleLowerCase('pl');
  if(/^(co potrafisz|co umiesz|jakie masz możliwości|co możesz zrobić)[?!. ]*$/iu.test(text))
   return 'Potrafię analizować zadania, oceniać ryzyko zmian, sprawdzać fragmenty kodu i pokazywać raporty GitHub. Nie jestem jeszcze generatywnym modelem AI i sam nie zmieniam repozytorium. Wpisz np. „sprawdź wyszukiwarkę VEXORIO” albo „audyt: ...”.';
  if(/^(dziękuję|dziekuje|dzięki|dzieki|super|świetnie|swietnie)[! .]*$/iu.test(text))
   return 'Dzięki! Możemy kontynuować. Napisz, jaki element VEXORIO mam przeanalizować.';
  if(/^(dalej|kontynuuj|rób|rob)[! .]*$/iu.test(text))
   return 'Mogę przygotować kolejny plan, ale nie znam jeszcze zakresu. Napisz np. „sprawdź panel moderacji” lub „plan: popraw powiadomienia”. Nie wykonuję zmian samodzielnie.';
  const action=/(sprawdź|sprawdz|przeanalizuj|oceń|ocen|napraw|popraw|dodaj|zbuduj|przetestuj|testuj|zoptymalizuj|wdroż|wdroz|opublikuj|usuń|usun|wyczyść|wyczysc|przetłumacz|przetlumacz)/iu;
  if(!action.test(input)||typeof analyze!=='function')return null;
  const result=analyze(input);
  if(!result||!result.ok)return 'Nie mogę bezpiecznie przeanalizować tego polecenia. Podaj krótszy, konkretny zakres (do 2000 znaków).';
  const labels={security:'bezpieczeństwo',deployment:'publikacja',testing:'testy',translation:'tłumaczenia',development:'programowanie',general:'ogólne'};
  const risks={high:'wysokie',medium:'średnie',low:'niskie'};
  return 'RX Strażak — analiza polecenia\\nObszar: '+(labels[result.intent]||result.intent)+'\\nRyzyko: '+(risks[result.risk]||result.risk)+'\\nPlan:\\n'+result.steps.map((step,i)=>(i+1)+'. '+step).join('\\n')+'\\n\\nTo propozycja, nie wykonanie. Aby zapisać zadanie do kolejki, wpisz „plan: '+input+'”.'.replaceAll('\\n',String.fromCharCode(10));
 }
 const api={respondNatural};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GuardRXConversation=api;
})(typeof window!=='undefined'?window:null);
