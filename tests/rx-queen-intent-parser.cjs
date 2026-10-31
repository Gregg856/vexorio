'use strict';
// Conservative rule-based Polish intent parser. Parse only explicit instruction before ':'.
const normalize=s=>s.trim().replace(/\s+/gu,' ');
function parseIntent({prompt,mode}={}){
 if(typeof prompt!=='string'||!['message','reply','summary'].includes(mode))throw Error('Invalid intent input');
 const colon=prompt.indexOf(':');
 if(colon<0)return {content:normalize(prompt),constraints:[],recognized:false};
 const head=normalize(prompt.slice(0,colon)).toLocaleLowerCase('pl');
 const content=normalize(prompt.slice(colon+1));
 if(!content)return {content:normalize(prompt),constraints:[],recognized:false};
 const writing=/(?:^|\s)(?:napisz|wiadomość|wiadomosc|odpowiedz|odpowiedź|streszcz|podsumuj|streszczenie|sparafrazuj|przepisz)(?=\s|$)/u.test(head);
 const constraints=[];
 const conflicts=[];
 // Explicit opposing instructions: refuse ambiguous combinations rather than guessing.
 const has=(pattern)=>pattern.test(head);
 if(['message','reply'].includes(mode)&&writing){
  if(has(/(?:^|\s)bez\s+(?:powitania|przywitania)(?=\s|$)/u)&&has(/(?:^|\s)(?:z\s+powitaniem|dodaj\s+powitanie|zacz[nń]ij\s+od\s+powitania)(?=\s|$)/u))conflicts.push('greeting');
  if(has(/(?:^|\s)bez\s+(?:pożegnania|zakończenia)(?=[\s,;]|$)/u)&&has(/(?:^|\s)(?:z\s+pożegnaniem|dodaj\s+pożegnanie)(?=\s|$)/u))conflicts.push('signoff');
  if(has(/(?:^|\s)(?:krótko|zwięźle)(?=[\s,;]|$)/u)&&has(/(?:^|\s)(?:szczegółowo|obszernie)(?=[\s,;]|$)/u))conflicts.push('length');
 }
 if(conflicts.length)return {content, constraints:[],recognized:false,conflicts,requiresClarification:true};
 if(['message','reply'].includes(mode)&&writing&&/(?:^|\s)bez\s+(?:powitania|przywitania)(?=\s|$)/u.test(head))constraints.push('noGreeting');
 if(['message','reply'].includes(mode)&&writing&&/(?:^|\s)bez\s+(?:pożegnania|zakonczenia|zakończenia)(?=\s|$)/u.test(head))constraints.push('noSignoff');
 if(['message','reply'].includes(mode)&&writing&&/(?:^|\s)(?:krótko|krotko|zwięźle|zwiezle)(?=[\s,;]|$)/u.test(head))constraints.push('short');
 if(mode==='summary'&&writing&&/(?:^|\s)(?:jednym|jedno)\s+zdani(?:u|e|em)(?=\s|$)/u.test(head))constraints.push('oneSentence');
 if(mode==='message'&&writing&&/(?:\bbez\s+cytowania\b|(?:^|\s)własnymi\s+słowami(?=\s|$))/u.test(head))constraints.push('paraphrase');
 return constraints.length?{content,constraints,recognized:true}:{content:normalize(prompt),constraints:[],recognized:false};
}
module.exports={parseIntent};
