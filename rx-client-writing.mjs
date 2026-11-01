// Deterministic client-safe writing helper; no AI inference or privileged actions.
export function composeClientWriting(message){
 if(typeof message!=='string'||message.length>2000)return null;
 const m=/^(?:(?:proszę|prosze)\s+)?(napisz|ułóż|uloz|przygotuj|odpowiedz|sformułuj|sformuluj|stwórz|stworz)\s+(?:(wiadomość|wiadomosc|odpowiedź|odpowiedz|streszczenie)\s*)?([^:]{0,180}):\s*(.{1,1500})$/isu.exec(message.trim());
 if(!m)return null;
 const instruction=m[3].toLocaleLowerCase('pl');
 // Reject unsupported instructions instead of claiming they were understood.
 const tokens=instruction.replace(/(?:bez\s+(?:powitania|przywitania|pożegnania|zakończenia|podpisu)|z\s+(?:powitaniem|pożegnaniem|podpisem)|dodaj\s+(?:powitanie|pożegnanie|podpis)|krótko|krotko|krótką|krotka|krótki|krotki|krótkie|krotkie|zwięźle|zwiezle|zwięzłą|zwiezla|szczegółowo|obszernie|nieformalnie|formalnie|oficjalnie|i|[,;\s])/gu,'').trim();
 if(tokens)return null;
 const has=re=>re.test(instruction);
 const noGreeting=has(/bez\s+(?:powitania|przywitania)(?=[\s,;]|$)/u);
 const yesGreeting=has(/(?:z\s+powitaniem|dodaj\s+powitanie)(?=[\s,;]|$)/u);
 const noSignoff=has(/bez\s+(?:pożegnania|zakończenia|podpisu)(?=[\s,;]|$)/u);
 const yesSignoff=has(/(?:z\s+(?:pożegnaniem|podpisem)|dodaj\s+(?:pożegnanie|podpis))(?=[\s,;]|$)/u);
 const short=has(/(?:krótko|krotko|krótką|krotka|krótki|krotki|krótkie|krotkie|zwięźle|zwiezle|zwięzłą|zwiezla)(?=[\s,;]|$)/u);
 const long=has(/(?:szczegółowo|obszernie)(?=[\s,;]|$)/u);
 const formal=has(/(?:^|[\s,;])(?:formalnie|oficjalnie)(?=[\s,;]|$)/u);
 const informal=has(/nieformalnie(?=[\s,;]|$)/u);
 const conflicts=[formal&&informal?'styl':null,noGreeting&&yesGreeting?'powitanie':null,noSignoff&&yesSignoff?'pożegnanie':null,short&&long?'długość':null].filter(Boolean);
 if(conflicts.length)return {answer:'Polecenie zawiera sprzeczne wymagania. Doprecyzuj: '+conflicts.join(', ')+'.',requiresClarification:true};
 // A deterministic formatter cannot genuinely expand the supplied text.
 if(long)return {answer:'Nie potrafię jeszcze wiarygodnie rozwinąć tekstu w szczegółową wiadomość. Podaj dodatkowe informacje, które mam uwzględnić.',requiresClarification:true};
 const content=m[4].trim();
 // Explicit semantic transformations cannot be performed reliably by a formatter.
 if(/\b(?:własnymi\s+słowami|bez\s+cytowania|sparafrazuj)\b/iu.test(message.slice(0,message.indexOf(':'))))return {answer:'Nie potrafię jeszcze wiarygodnie sparafrazować tekstu. Skorzystaj z modelu AI.',requiresClarification:true};
 if(!content)return null;
 if(m[2]==='streszczenie')return {answer:'Nie potrafię jeszcze wiarygodnie streścić dowolnego tekstu. Podaj krótszy fragment lub sprecyzuj cel.',requiresClarification:true};
 const normalized=content.trim().replace(/\s+/gu,' ');
 const ending=/[.!?…]$/u.test(normalized)?'':'.';
 const answer=[noGreeting||short?'':formal?'Dzień dobry!':'Cześć!',normalized.charAt(0).toLocaleUpperCase('pl')+normalized.slice(1)+ending,noSignoff||short?'':formal?'Z poważaniem!':'Pozdrawiam!'].filter(Boolean).join(' ');
 return {answer,requiresClarification:false};
}
