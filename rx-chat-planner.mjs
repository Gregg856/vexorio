import catalog from './rx-task-catalog.cjs';
import math from './rx-math-core.cjs';
// RX chat planner: pure, read-only module for the Cloudflare Worker.
// Intent identifiers match rx-command-bridge.cjs; no Node-only dependencies.
const RULES=catalog.RULES;

export function planRXChat(message,history=[],learning=null){
 if(typeof message!=='string'||!message.trim()||message.length>8000)throw new TypeError('Invalid message');
 if(!Array.isArray(history)||history.length>20||history.some(x=>typeof x!=='string'||x.length>8000))throw new TypeError('Invalid history');
 const last=history.at(-1)||'';
 const previous=history.slice(-5).filter(x=>x.trim());
 const followup=/^(a |i |oraz |a co |co z |dalej|sprawdź też|sprawdz tez|a ten |a tamten |co z tym|co z nim|co z nimi|zrob drugi punkt|zrób drugi punkt)/i.test(message.trim());
 // Use the most recent meaningful topic for short follow-ups; avoid mixing unrelated old intents.
 const normalizeRX=text=>text.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/ł/g,'l');
 const recentTopic=previous.slice().reverse().find(x=>(/(mrowk|wirnik|turbina|chmur|cloudflare|test|bled|blad|kolejk|pamiec|wiedz|neural|math|matematyk|neuron|model)/.test(normalizeRX(x))||RULES.some(r=>r.words.some(w=>normalizeRX(x).includes(normalizeRX(w))))))||last;
 const contextual=followup&&last?recentTopic+' '+message:message;
 const q=contextual.toLocaleLowerCase('pl-PL');
 const found=RULES.filter(r=>r.words.some(word=>q.includes(word)));
 const topics=found.map(r=>r.topic);
 const tasks=found.map(r=>({module:r.module,role:r.role,action:r.id,status:'proposed',requiresApproval:true}));
 const plan={kind:'rx-coordinated-chat-proposal',queen:{status:'awaiting_approval',requiresApproval:true},ants:tasks.filter(t=>t.module==='ants'),cloud:{executionConnected:false},executed:0};
 const plain=message.trim().toLocaleLowerCase('pl-PL').normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]','g'),'').replace(/ł/g,'l');
 const greet=/^(czesc|hej|halo|witaj|dzien dobry|siema|bibi|krolowa|rx)[!.? ]*$/.test(plain);
 const thanks=/^(dzieki|dziekuje|super|dobrze|ok|gotowe)[!.? ]*$/.test(plain);
 const contextPlain=contextual.toLocaleLowerCase('pl-PL').normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]','g'),'').replace(/ł/g,'l');
 const followupContext=Boolean(followup&&last);
 const asksAnts=/(mrowk|ants)/.test(contextPlain);
 const asksTurbine=/(wirnik|wirnika|turbine|turbina|silnik)/.test(contextPlain);
 const asksBuilding=/(buduj|buduje|budow|rozwij|ulepsz|pracuj|dzialaj)/.test(plain);
 const asksStatus=/(status|co robisz|jak idzie|co teraz|co potrafisz)/.test(plain);
 const asksName=/(jak (masz na imie|sie nazywasz)|kim jestes)/.test(plain);
 const asksMemory=/(czy (pamietasz|zapamietujesz)|jak dziala pamiec)/.test(plain);
 const asksConversation=/(pogadajmy|porozmawiajmy|chce pogadac|mozemy pogadac)/.test(plain);
 const asksTests=/(jakie testy|ktore testy|wyniki testow|czy testy przeszly|testy zielone)/.test(plain);
 const asksError=/(blad|bledy|nie dziala|awaria|napraw)/.test(plain);
 const asksCloud=/(chmura|\bcloud\b|cloudflare|serwer|wdrozenie|deploy)/.test(plain);
 const asksQueue=/(kolejk|zadania w kolejce|ile zadan)/.test(plain);
 const asksSafety=/(bezpieczenstwo|bezpieczne|uprawnienia|dostep)/.test(plain);
 const asksCosts=/(koszt|platn|darmow|limit)/.test(plain);
 const asksKnowledge=/(wiedza swiata|wikipedia|encyklopedia|zrodla)/.test(plain);
 const asksPrivacy=/(prywatn|moje dane|moimi danymi|moich danych|kto widzi)/.test(plain);
 const asksNext=/(co dalej|nastepny krok|od czego zaczac)/.test(plain);
 const asksProgress=/(co (juz|wczoraj|ostatnio) (zrobil|zrobilismy|robil)|na czym skonczyl|co mamy gotowe|co jest gotowe|co zostalo zrobione|nie powtarzaj|krecimy sie w kolko|krecic sie w kolko)/.test(plain);

 const asksCapabilities=/(co umiesz|co potrafisz|jakie funkcje)/.test(plain);
 const asksHelp=/(pomoc|pomoz|jak rozmawiac|co moge napisac)/.test(plain);
 const multiParts=[
  {id:'ants',match:asksAnts,label:'🐜 Mrówki',detail:'Mogę przygotować plan ich pracy; faktyczny stan wymaga raportu.'},
  {id:'errors',match:asksError,label:'🔧 Błędy',detail:'Potrzebuję komunikatu lub raportu, aby wskazać przyczynę.'},
  {id:'tests',match:asksTests,label:'🧪 Testy',detail:'Wynik trzeba odczytać z RX Coordinator.'},
  {id:'queue',match:asksQueue,label:'📦 Kolejka',detail:'Jest zapisana lokalnie w przeglądarce.'},
  {id:'cloud',match:asksCloud,label:'☁️ Chmura',detail:'Stan wdrożenia wymaga sprawdzenia Cloudflare i GitHub.'},
  {id:'turbine',match:asksTurbine,label:'⚙️ Wirnik',detail:'Uruchamia wyłącznie zatwierdzone testy.'},
  {id:'knowledge',match:asksKnowledge,label:'📚 Wiedza',detail:'Źródła można odczytać z modułu wiedzy świata.'},
  {id:'next',match:asksNext,label:'👑 Kolejne kroki',detail:'Najpierw raport, potem wybór poprawki i zatwierdzenie.'}
 ];
 const selectedParts=multiParts.filter(x=>x.match);
 const multiIntent=selectedParts.length>=2;
 const requestedPoint=plain.match(/^(?:zrob|pokaz|omow|wyjasnij|sprawdz|przejdz do|punkt)\s+(?:punkt\s+)?(pierwszy|drugi|trzeci|czwarty|piaty|[1-5])(?:\s+punkt)?[.!? ]*$/);
 const pointIndex=requestedPoint?({'pierwszy':0,'drugi':1,'trzeci':2,'czwarty':3,'piaty':4,'1':0,'2':1,'3':2,'4':3,'5':4}[requestedPoint[1]]):-1;
 const priorPlan=history.slice().reverse().find(x=>/\b1[.)]\s/.test(x)&&/\b2[.)]\s/.test(x));
 const planItems=priorPlan?[...priorPlan.matchAll(/(?:^|\n)\s*([1-5])[.)]\s*([^\n]+)/g)].map(x=>x[2].trim()):[];
 const selectedPoint=pointIndex>=0&&pointIndex<planItems.length?planItems[pointIndex]:null;
 // Explicit, bounded Float32 dot-product command. No eval, network or training.
 const dotRequest=message.trim().match(/^rx\s+dot\s*:\s*\[([^\]]*)\]\s*;\s*\[([^\]]*)\]\s*$/i);
 let dotResult=null;
 if(dotRequest){
  const parseVector=value=>{
   const parts=value.split(',').map(x=>x.trim());
   if(parts.length<1||parts.length>16||parts.some(x=>!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(x)))return null;
   const numbers=parts.map(Number);
   if(numbers.some(x=>!Number.isFinite(x)||Math.abs(x)>1000000))return null;
   return new Float32Array(numbers);
  };
  const a=parseVector(dotRequest[1]),b=parseVector(dotRequest[2]);
  dotResult=a&&b&&a.length===b.length?math.dot(a,b):null;
 }
 // Small matrices only (up to 4x4). RX MMUL uses the existing Float32 kernel.
 const matrixRequest=message.trim().match(/^RX\s+(MADD|MMUL)\s*:\s*(.+)$/is);
 let matrixResult=null;
 if(matrixRequest){
  const parseMatrix=raw=>{
   try{
    const value=JSON.parse(raw);
    if(!Array.isArray(value)||value.length<1||value.length>4||!Array.isArray(value[0])||value[0].length<1||value[0].length>4)return null;
    const cols=value[0].length;
    if(value.some(row=>!Array.isArray(row)||row.length!==cols||row.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1000000)))return null;
    return {rows:value.length,cols,flat:new Float32Array(value.flat())};
   }catch{return null;}
  };
  const parts=matrixRequest[2].split(';');
  if(parts.length===2){
   const a=parseMatrix(parts[0].trim()),b=parseMatrix(parts[1].trim());
   if(a&&b){
    const multiply=matrixRequest[1].toUpperCase()==='MMUL';
    if((multiply&&a.cols===b.rows)||(!multiply&&a.rows===b.rows&&a.cols===b.cols)){
     const out=multiply?math.matmul(a.flat,b.flat,a.rows,a.cols,b.cols):Float32Array.from(a.flat,(v,i)=>v+b.flat[i]);
     if([...out].every(Number.isFinite)){
      const cols=multiply?b.cols:a.cols;
      matrixResult=Array.from({length:a.rows},(_,i)=>Array.from(out.slice(i*cols,(i+1)*cols)));
     }
    }
   }
  }
 }
 let answer;
 if(matrixRequest)answer=matrixResult?'🧮 RX Math Core — '+matrixRequest[1].toUpperCase()+' (Float32): '+JSON.stringify(matrixResult)+'. Obliczenie bez zewnętrznego AI.':'🧮 Nieprawidłowe macierze lub wymiary. Użyj: RX MADD: [[1,2],[3,4]]; [[5,6],[7,8]] albo RX MMUL: [[1,2]]; [[3],[4]] (maks. 4×4).';
 else if(dotRequest)answer=dotResult!==null&&Number.isFinite(dotResult)?'🧮 RX Math Core — iloczyn skalarny (Float32): '+dotResult+'. Obliczenie lokalne, bez zewnętrznego AI.':'🧮 Nieprawidłowe wektory. Użyj: RX DOT: [1,2]; [3,4] (po 1–16 liczb, jednakowa długość).';
 else if(requestedPoint&&selectedPoint)answer='👑 Punkt '+(pointIndex+1)+' z poprzedniego planu: '+selectedPoint+'\\n🔒 Mogę omówić ten krok, ale nie uruchamiam go bez zatwierdzenia.';
 else if(requestedPoint)answer='👑 Nie widzę w ostatnich wiadomościach numerowanego planu z tym punktem. Wklej plan albo napisz, który krok masz na myśli.';
 else if(multiIntent)answer='👑 Rozumiem kilka spraw w jednym poleceniu:\\n'+selectedParts.map((x,i)=>(i+1)+'. '+x.label+': '+x.detail).join('\\n')+'\\n🔒 To plan odpowiedzi, nie uruchomienie zadań.';
 else if(/^(?:napisz|uloz|stworz)\s+(?:mi\s+)?(?:krotkie\s+)?zyczenia\s+(?:urodzinowe\s+)?(?:dla\s+)?([\p{L} -]{2,55})[.!? ]*$/iu.test(plain)){
  const recipient=message.trim().replace(/^(?:napisz|ułóż|uloz|stwórz|stworz)\s+(?:mi\s+)?(?:krótkie|krotkie)?\s*życzenia\s+(?:urodzinowe\s+)?(?:dla\s+)?/iu,'').replace(/[.!? ]+$/u,'').trim();
  answer='🎂 '+(recipient?'Dla '+recipient+': ':'')+'Wszystkiego najlepszego! Dużo zdrowia, radości, spokoju i spełnienia marzeń. Niech każdy dzień przynosi coś dobrego!';
 }
 else if(/^(?:popraw|popraw tekst)\s*:\s*[^\n]+/iu.test(message.trim())){
  const source=message.trim().replace(/^(?:popraw|popraw tekst)\s*:\s*/iu,'').trim();
  const cleaned=source.replace(/\s+/g,' ').replace(/\s+([,.!?;:])/g,'$1');
  const fixed=cleaned.charAt(0).toLocaleUpperCase('pl-PL')+cleaned.slice(1)+(/[.!?]$/.test(cleaned)?'':'.');
  answer='✍️ Prosta korekta interpunkcji i odstępów (nie pełna korekta językowa): '+fixed;
 }
 else if(/^(?:ile to|oblicz)\s+[-+]?\d+(?:[.,]\d+)?\s*[+*\/\-]\s*[-+]?\d+(?:[.,]\d+)?\s*\??$/iu.test(plain)){
  const m=plain.match(/([-+]?\d+(?:[.,]\d+)?)\s*([+*\/\-])\s*([-+]?\d+(?:[.,]\d+)?)/);
  const a=Number(m[1].replace(',','.')),b=Number(m[3].replace(',','.'));
  const n=m[2]==='+'?a+b:m[2]==='-'?a-b:m[2]==='*'?a*b:b===0?NaN:a/b;
  answer=Number.isFinite(n)?'🧮 Wynik: '+n:'🧮 Nie mogę wykonać tego działania (np. dzielenie przez zero).';
 }
 else if(/^(?:przetlumacz|tlumacz)\s+(?:na\s+)?(?:angielski|niemiecki|polski)\s*:/iu.test(plain))answer='🌍 Nie mam jeszcze silnika tłumaczeń dowolnych zdań. Mogę pomóc z prostymi przykładami, ale nie będę wymyślać tłumaczenia.';
 else if(greet)answer='👑 Cześć! Jestem Królowa RX. Możemy rozmawiać o Mrówkach, Wirniku, chmurze i budowie VEXORIO. Napisz, co chcesz sprawdzić albo zaplanować.';
 else if(thanks)answer='👑 Jasne! Jestem gotowa na kolejne pytanie. Możemy omówić Mrówki, Wirnik lub testy RX.';
 else if(asksName)answer='👑 Jestem Królowa RX — rozmowna część VEXORIO. Mogę odpowiadać na pytania i pomagać planować testy, ale nie udaję niezależnego modelu AI.';
 else if(asksMemory)answer='🧠 Mam ograniczony kontekst ostatnich wiadomości. Trwałą notatkę możesz zapisać poleceniem „Zapamiętaj: temat | treść”, a odczytać przez „Przypomnij: temat”. Zapis wymaga poprawnego połączenia z serwerem.';
 else if(asksConversation)answer='👑 Jasne, porozmawiajmy! Co dziś najbardziej chcesz ulepszyć w VEXORIO albo co Cię ciekawi?';
 else if(asksTests)answer='🧪 Mogę wskazać testy i pomóc odczytać raport. Ich rzeczywisty wynik sprawdź przez „Sprawdź testy RX” lub raport RX Coordinator. Nie zgaduję, czy ostatni przebieg był zielony.';
 else if(asksError)answer='🔧 Opisz błąd albo wklej dokładny komunikat. Pomogę ustalić możliwą przyczynę i zaproponować test. Bez raportu nie potwierdzę naprawy.';
 else if(asksQueue)answer='🐜 Kolejka Warsztatu jest zapisana lokalnie w Twojej przeglądarce. Rozwiń Warsztat, aby zobaczyć liczbę zadań i pobrać paczkę. Sama kolejka nie uruchamia kodu.';
 else if(asksSafety)answer='🔒 Wykonanie zatwierdzonych testów wymaga sesji administratora i osobnego potwierdzenia. Wklejony kod nie jest uruchamiany automatycznie.';
 else if(asksCosts)answer='💰 RX korzysta z własnego planera i dostępnych usług. Nie uruchamiam płatnego modelu bez konfiguracji. Limity GitHub i Cloudflare nadal obowiązują.';
 else if(asksKnowledge)answer='📚 Mogę szukać faktów przez moduł wiedzy świata z podaniem źródła. Nie oznacza to, że cała Wikipedia jest zapisana lokalnie.';
 else if(asksPrivacy)answer='🔐 Dostęp do panelu jest ograniczony do administratora. Trwała pamięć używa danych właściciela w Supabase; lokalne szkice Warsztatu pozostają w tej przeglądarce.';
 else if(asksProgress)answer='👑 W naszym repozytorium mamy już czat RX ADMIN, endpoint /api/rx/chat, pamięć na polecenia Zapamiętaj / Przypomnij, RX Neural Core, Math Core i planowanie Mrówek. Nie budujmy ich ponownie. Aktualne commity, wyniki testów i punkt kontynuacji są zapisane w PROJECT_STATUS.md na GitHubie. Nie mam tu automatycznego odczytu tego pliku, więc nie będę zgadywać, co dokładnie zrobiono wczoraj. Następny cel: ulepszać odpowiedzi w istniejącym czacie RX ADMIN. Zmiany wymagają zatwierdzenia.';
 else if(/^rx pomoc$/i.test(message.trim()))answer='👑 Dostępne umiejętności: RX DOT, RX MMUL, RX MADD, planowanie zadań, analiza błędów, pamięć i testy RX. Napisz polecenie, aby rozpocząć.';
 else if(asksNext)answer='👑 Najpierw sprawdź raport ostatnich testów, potem wybierz jedną poprawkę i przygotuj zadanie w Warsztacie. Wykonanie wymaga zatwierdzenia.';
 else if(/(?:rx\s*)?(?:neural|math|matematy|sie[cć]|sieci neuronow|model neuronow)/i.test(contextPlain))answer='🧠 RX Neural Core i RX Math Core to nasze istniejące moduły eksperymentalne: mała sieć neuronowa i operacje na macierzach Float32. Ich kod jest w repozytorium, ale nie są podłączone do generowania odpowiedzi czatu i nie zastępują modelu językowego. Mogę zaplanować testy integracji bez uruchamiania treningu ani dodatkowych kosztów.';
 else if(/(?:pami[eę][cć]|zapami[eę]t|histori[aę] rozmow)/i.test(q))answer='🧠 RX ma istniejący moduł trwałych notatek oraz ograniczony kontekst rozmowy przesyłany przez panel. Trwały zapis lub odczyt wykonuję tylko na wyraźne polecenie „zapamiętaj:” albo „przypomnij:”. Nie zapisuję automatycznie treści rozmowy do pamięci treningowej.';
 else if(asksCapabilities)answer='👑 Mogę rozmawiać o RX, proponować zadania, objaśniać testy, odczytywać wiedzę i korzystać z pamięci na wyraźne polecenie. Nie pracuję samodzielnie w tle.';
 else if(asksCloud)answer='☁️ Cloudflare udostępnia panel RX, a GitHub Actions uruchamia zatwierdzone testy. Status wdrożenia i raporty trzeba sprawdzać osobno; sam czat nie potwierdza publikacji.';
 else if(asksTurbine)answer='⚙️ RX Wirnik służy do ograniczonego, równoległego wykonywania zatwierdzonych testów. Nie zwiększa fizycznej mocy komputera. Ostatni przebieg sprawdzisz w panelu Królowej przez „RX Wirnik — ostatni przebieg”. Samo pytanie nie uruchamia pracy.';
 else if(asksAnts)answer='🐜 Mrówki RX to moduły zadań i testów, nie niezależne istoty AI. Mogę zaplanować ich pracę, ale rzeczywiste wykonanie wymaga zatwierdzenia i uruchomienia wykonawcy. Stan kolejki sprawdzisz w kategorii Mrówki.';
 else if(asksBuilding)answer='👑 Rozwijamy RX etapami: mózg rozmowy, Mrówki i Wirnik. W tym czacie mogę przygotować plan, wyjaśnić stan systemu i wskazać testy. Nie mogę twierdzić, że samodzielnie buduję lub wykonuję zadania w tle.';
 else if(asksStatus)answer='👑 Czat RX odpowiada przez serwerowy planer. Aby poznać rzeczywisty stan pracy, wybierz „Odśwież raport RX Coordinator” albo „RX Wirnik — ostatni przebieg”. Nie mam tutaj transmisji pracy Mrówek na żywo.';
 else if(asksHelp)answer='👑 Napisz np. „Co robią Mrówki?”, „Jak działa Wirnik?”, „Jakie testy wykonać?” lub „Co budujemy dalej?”. Mogę prowadzić rozmowę i przygotowywać bezpieczne plany.';
 else if(topics.length)answer='👑 Rozumiem temat: '+[...new Set(topics)].join(', ')+'. Mogę pomóc przygotować plan testów i wyjaśnić kolejne kroki. Niczego nie uruchomiłam bez zatwierdzenia.';
 else answer='👑 Chcę dobrze zrozumieć. Czy pytasz o Mrówki, Wirnik, model RX czy o konkretny błąd? Napisz jednym zdaniem, co mam sprawdzić lub wyjaśnić.';

 // RX Queen work planner: natural-language work requests, with BIBI as verifier.
 // A plan is not execution; RX Developer must be connected to a real executor.
 const workIntent=/(zbuduj|stw[oó]rz|napisz|dodaj|ulepsz|rozbuduj|popraw|napraw|przygotuj|zaprojektuj)/i.test(message)
  &&/(rx|kr[oó]low|m[oó]zg|model|modu[lł]|panel|kod|mr[oó]wk|czat|bibi)/i.test(message);
 if(workIntent&&!matrixRequest&&!dotRequest){
  const requested=message.trim().slice(0,500);
  plan.work={
   kind:'rx-queen-work-order',request:requested,status:'proposed',executed:false,
   verification:{module:'RX BIBI',required:true,status:'pending',passed:null},
   stages:[
    {module:'RX Queen',action:'Rozbij polecenie na małe, sprawdzalne kroki',status:'proposed'},
    {module:'RX Developer',action:'Przygotuj zmianę w istniejącym kodzie RX',status:'awaiting_executor'},
    {module:'RX BIBI',action:'Sprawdź zmianę testami i zgłoś wynik',status:'awaiting_executor'},
    {module:'RX Queen',action:'Pokaż wynik właścicielowi do zatwierdzenia',status:'awaiting_approval'}
   ],requiresApproval:true
  };
  answer='👑 Przyjęłam zadanie: '+requested+'\\n🐜 Plan: analiza → RX Developer przygotowuje kod → RX BIBI sprawdza → pokazuję wynik do zatwierdzenia.\\n🔒 To na razie plan pracy; nie uruchomiłam jeszcze wykonawcy ani nie zmieniłam plików.';
 }
 // Evidence-aware suggestions only when trusted server-side learning is explicitly supplied.
 const verifiedLessons=learning&&learning.kind==='rx-queen-verified-learning'&&Array.isArray(learning.lessons)
  ?learning.lessons.filter(x=>x&&typeof x.observation==='string'&&typeof x.incidentId==='string').slice(0,3):[];
 if(asksError&&verifiedLessons.length){
  const lesson=verifiedLessons[0];
  answer+='\\n🧠 RX BIBI wykrył wcześniej: '+lesson.observation.slice(0,180)+'. Obszar: '+String(lesson.panelArea||'RX').slice(0,90)+'. To wskazówka do diagnostyki, nie potwierdzona naprawa. Wymagana weryfikacja testem.';
 }
 return {ok:true,answer,topics,tasks,plan,contextUsed:followupContext,multiIntent,intents:selectedParts.map(x=>x.id),executed:0,modelInferenceUsed:false};
}
