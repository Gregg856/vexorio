import catalog from './rx-task-catalog.cjs';
// RX chat planner: pure, read-only module for the Cloudflare Worker.
// Intent identifiers match rx-command-bridge.cjs; no Node-only dependencies.
const RULES=catalog.RULES;

export function planRXChat(message,history=[]){
 if(typeof message!=='string'||!message.trim()||message.length>8000)throw new TypeError('Invalid message');
 if(!Array.isArray(history)||history.length>20||history.some(x=>typeof x!=='string'||x.length>8000))throw new TypeError('Invalid history');
 const last=history.at(-1)||'';
 const previous=history.slice(-5).filter(x=>x.trim());
 const followup=/^(a |i |oraz |a co |co z |dalej|sprawdź też|sprawdz tez)/i.test(message.trim());
 const contextual=followup&&last?previous.join(' ')+' '+message:message;
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
 const asksHelp=/(pomoc|pomoz|jak rozmawiac|co moge napisac)/.test(plain);
 let answer;
 if(greet)answer='👑 Cześć! Jestem Królowa RX. Możemy rozmawiać o Mrówkach, Wirniku, chmurze i budowie VEXORIO. Napisz, co chcesz sprawdzić albo zaplanować.';
 else if(thanks)answer='👑 Jasne! Jestem gotowa na kolejne pytanie. Możemy omówić Mrówki, Wirnik lub testy RX.';
 else if(asksName)answer='👑 Jestem Królowa RX — rozmowna część VEXORIO. Mogę odpowiadać na pytania i pomagać planować testy, ale nie udaję niezależnego modelu AI.';
 else if(asksMemory)answer='🧠 Mam ograniczony kontekst ostatnich wiadomości. Trwałą notatkę możesz zapisać poleceniem „Zapamiętaj: temat | treść”, a odczytać przez „Przypomnij: temat”. Zapis wymaga poprawnego połączenia z serwerem.';
 else if(asksConversation)answer='👑 Jasne, porozmawiajmy! Co dziś najbardziej chcesz ulepszyć w VEXORIO albo co Cię ciekawi?';
 else if(asksTurbine)answer='⚙️ RX Wirnik służy do ograniczonego, równoległego wykonywania zatwierdzonych testów. Nie zwiększa fizycznej mocy komputera. Ostatni przebieg sprawdzisz w panelu Królowej przez „RX Wirnik — ostatni przebieg”. Samo pytanie nie uruchamia pracy.';
 else if(asksAnts)answer='🐜 Mrówki RX to moduły zadań i testów, nie niezależne istoty AI. Mogę zaplanować ich pracę, ale rzeczywiste wykonanie wymaga zatwierdzenia i uruchomienia wykonawcy. Stan kolejki sprawdzisz w kategorii Mrówki.';
 else if(asksBuilding)answer='👑 Rozwijamy RX etapami: mózg rozmowy, Mrówki i Wirnik. W tym czacie mogę przygotować plan, wyjaśnić stan systemu i wskazać testy. Nie mogę twierdzić, że samodzielnie buduję lub wykonuję zadania w tle.';
 else if(asksStatus)answer='👑 Czat RX odpowiada przez serwerowy planer. Aby poznać rzeczywisty stan pracy, wybierz „Odśwież raport RX Coordinator” albo „RX Wirnik — ostatni przebieg”. Nie mam tutaj transmisji pracy Mrówek na żywo.';
 else if(asksHelp)answer='👑 Napisz np. „Co robią Mrówki?”, „Jak działa Wirnik?”, „Jakie testy wykonać?” lub „Co budujemy dalej?”. Mogę prowadzić rozmowę i przygotowywać bezpieczne plany.';
 else if(topics.length)answer='👑 Rozumiem temat: '+[...new Set(topics)].join(', ')+'. Mogę pomóc przygotować plan testów i wyjaśnić kolejne kroki. Niczego nie uruchomiłam bez zatwierdzenia.';
 else answer='👑 Chcę dobrze zrozumieć. Czy pytasz o Mrówki, Wirnik, model RX czy o konkretny błąd? Napisz jednym zdaniem, co mam sprawdzić lub wyjaśnić.';

 return {ok:true,answer,topics,tasks,plan,contextUsed:followupContext,executed:0,modelInferenceUsed:false};
}
