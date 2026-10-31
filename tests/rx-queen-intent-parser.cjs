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
 const writing=/\b(?:napisz|wiadomość|wiadomosc|odpowiedz|odpowiedź|streszcz|podsumuj|streszczenie|sparafrazuj|przepisz)\b/u.test(head);
 const constraints=[];
 if(mode==='message'&&writing&&/\bbez\s+(?:powitania|przywitania)\b/u.test(head))constraints.push('noGreeting');
 if(mode==='reply'&&writing&&/\bbez\s+(?:pożegnania|zakonczenia|zakończenia)\b/u.test(head))constraints.push('noSignoff');
 if(mode==='summary'&&writing&&/\b(?:jednym|jedno)\s+zdani(?:u|e)\b/u.test(head))constraints.push('oneSentence');
 if(mode==='message'&&writing&&/(?:\bbez\s+cytowania\b|\bwłasnymi\s+słowami\b)/u.test(head))constraints.push('paraphrase');
 return constraints.length?{content,constraints,recognized:true}:{content:normalize(prompt),constraints:[],recognized:false};
}
module.exports={parseIntent};
