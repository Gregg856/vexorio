// RX WIEDZA: small, auditable, self-hosted knowledge base.
// Every entry has a source and can be reviewed in Git before publication.
export const RX_KNOWLEDGE=[
 {id:'rx',terms:['rx','krolowa rx','mozg rx'],title:'Mózg RX',summary:'RX to rozwijany w VEXORIO system rozmowy i planowania zadań. Regułowy planer nie jest samodzielnym modelem językowym.',source:'VEXORIO — rx-chat-planner.mjs'},
 {id:'ants',terms:['mrowki rx','mrowki','mrówki rx','mrówki','mrowkach rx','mrowkach','mrówkach rx','mrówkach'],title:'Mrówki RX',summary:'Mrówki RX reprezentują moduły i zadania testowe. Plan zadania nie oznacza jego wykonania; wykonanie wymaga zatwierdzenia.',source:'VEXORIO — rx-chat-planner.mjs'},
 {id:'turbine',terms:['wirnik rx','wirnik','wirniku rx','wirniku','rx turbine'],title:'Wirnik RX',summary:'Wirnik koordynuje ograniczone równoległe wykonywanie zatwierdzonych testów. Nie tworzy dodatkowej fizycznej mocy obliczeniowej.',source:'VEXORIO — rx-turbine-engine.cjs'},
 {id:'knowledge',terms:['wiedza swiata','wiedzy swiata','rx wiedza swiata','encyklopedia rx'],title:'RX Wiedza Świata',summary:'Moduł udostępnia lokalne wpisy i wyszukiwanie zewnętrznej encyklopedii z podaniem źródła. Nie jest pełną kopią Wikipedii.',source:'VEXORIO — rx-world-knowledge.mjs'}
];
export function findRXKnowledge(question){
 if(typeof question!=='string'||question.length>300)return null;
 const normalized=s=>s.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
 const q=normalized(question);
 const matches=RX_KNOWLEDGE.flatMap(entry=>entry.terms.map(term=>({entry,term:normalized(term)}))).filter(({term})=>q===term||q.startsWith(term+' ')||q.endsWith(' '+term)||q.includes(' '+term+' '));
 // The most specific term wins: 'mrówki RX' must not be swallowed by generic 'RX'.
 matches.sort((a,b)=>b.term.length-a.term.length);
 const entry=matches[0]?.entry;
 // Multiple distinct modules in one question are ambiguous; do not pretend one answers all.
 const distinct=new Set(matches.map(match=>match.entry.id));
 if(distinct.size>1){
  const mostSpecific=matches[0]?.term||'';
  const topEntries=new Set(matches.filter(match=>match.term===mostSpecific).map(match=>match.entry.id));
  // Generic 'RX' inside a specific module name is not a second topic.
  const specific=matches.filter(match=>match.entry.id!=='rx');
  if(new Set(specific.map(match=>match.entry.id)).size>1||topEntries.size>1)return null;
 }
 return entry?{title:entry.title,summary:entry.summary,source:entry.source,local:true}:null;
}
