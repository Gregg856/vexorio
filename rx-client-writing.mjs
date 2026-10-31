// Deterministic client-safe writing helper; no AI inference or privileged actions.
export function composeClientWriting(message){
 if(typeof message!=='string'||message.length>2000)return null;
 const m=/^(napisz|ułóż|uloz|przygotuj|odpowiedz|sformułuj|sformuluj|stwórz|stworz)\s+(?:(wiadomość|wiadomosc|odpowiedź|odpowiedz|streszczenie)\s*)?([^:]{0,180}):\s*(.{1,1500})$/isu.exec(message.trim());
 if(!m)return null;
 const instruction=m[3].toLocaleLowerCase('pl');
 // Reject unsupported instructions instead of claiming they were understood.
 const tokens=instruction.replace(/(?:bez\s+(?:powitania|przywitania|pożegnania|zakończenia)|z\s+(?:powitaniem|pożegnaniem)|dodaj\s+(?:powitanie|pożegnanie)|krótko|krotko|zwięźle|zwiezle|szczegółowo|obszernie|i|[,;\s])/gu,'').trim();
 if(tokens)return null;
 const has=re=>re.test(instruction);
 const noGreeting=has(/bez\s+(?:powitania|przywitania)(?=[\s,;]|$)/u);
 const yesGreeting=has(/(?:z\s+powitaniem|dodaj\s+powitanie)(?=[\s,;]|$)/u);
 const noSignoff=has(/bez\s+(?:pożegnania|zakończenia)(?=[\s,;]|$)/u);
 const yesSignoff=has(/(?:z\s+pożegnaniem|dodaj\s+pożegnanie)(?=[\s,;]|$)/u);
 const short=has(/(?:krótko|krotko|zwięźle|zwiezle)(?=[\s,;]|$)/u);
 const long=has(/(?:szczegółowo|obszernie)(?=[\s,;]|$)/u);
 const conflicts=[noGreeting&&yesGreeting?'powitanie':null,noSignoff&&yesSignoff?'pożegnanie':null,short&&long?'długość':null].filter(Boolean);
 if(conflicts.length)return {answer:'Polecenie zawiera sprzeczne wymagania. Doprecyzuj: '+conflicts.join(', ')+'.',requiresClarification:true};
 const content=m[4].trim();
 if(!content)return null;
 if(m[2]==='streszczenie')return {answer:'Nie potrafię jeszcze wiarygodnie streścić dowolnego tekstu. Podaj krótszy fragment lub sprecyzuj cel.',requiresClarification:true};
 const normalized=content.trim();
 const ending=/[.!?…]$/u.test(normalized)?'':'.';
 const answer=[noGreeting||short?'':'Cześć!',normalized.charAt(0).toLocaleUpperCase('pl')+normalized.slice(1)+ending,noSignoff||short?'':'Pozdrawiam!'].filter(Boolean).join(' ');
 return {answer,requiresClarification:false};
}
