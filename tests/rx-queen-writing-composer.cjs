'use strict';
// RX Queen local Polish writing composer. Deterministic and offline, not a generative LLM.
const {answer}=require('./rx-queen-response-practice.cjs');
const normalize=s=>s.trim().replace(/\s+/gu,' ');
function compose({prompt,mode='answer',tone='friendly'}={}){
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>500)throw Error('Invalid prompt');
 if(!['answer','message','summary','reply'].includes(mode))throw Error('Invalid mode');
 if(!['friendly','formal','short'].includes(tone))throw Error('Invalid tone');
 const cleaned=normalize(prompt);
 if(mode==='answer'){
  const result=answer(cleaned);
  return {text:result.text,mode,tone,matched:result.matched,source:'approved-offline-examples',productionConnected:false};
 }
 // Explicitly supported variants only; no claim of open-ended language understanding.
 const instructions=[
  {kind:'oneSentence',mode:'summary',pattern:/^(?:Streszcz w jednym zdaniu|Podsumuj jednym zdaniem|Zrób streszczenie w jednym zdaniu):\s*/iu},
  {kind:'noGreeting',mode:'message',pattern:/^(?:Napisz krótką wiadomość bez powitania|Napisz wiadomość bez powitania|Wiadomość bez przywitania):\s*/iu},
  {kind:'noSignoff',mode:'reply',pattern:/^(?:Odpowiedz bez pożegnania|Napisz odpowiedź bez pożegnania|Odpowiedź bez zakończenia):\s*/iu},
  {kind:'paraphrase',mode:'message',pattern:/^(?:Przepisz sens bez cytowania|Sparafrazuj bez cytowania|Napisz własnymi słowami):\s*/iu}
 ];
 const instruction=instructions.find(x=>x.mode===mode&&x.pattern.test(cleaned));
 const contentPrompt=instruction?cleaned.replace(instruction.pattern,''):cleaned;
 const oneSentence=instruction?.kind==='oneSentence';
 const noGreeting=instruction?.kind==='noGreeting';
 const noSignoff=instruction?.kind==='noSignoff';
 if(mode==='summary'){
  const sentences=contentPrompt.match(/[^.!?]+[.!?]?/gu)||[];
  const text=normalize(sentences.slice(0,oneSentence?1:2).join(' '));
  return {text,mode,tone,matched:true,source:'user-supplied-text',productionConnected:false};
 }
 const content=contentPrompt.replace(/[.!?]+$/u,'');
 const prefix=noGreeting?'':tone==='formal'?'Dzień dobry,':tone==='friendly'?'Cześć!':'';
 const suffix=noSignoff?'':tone==='formal'?'Z poważaniem.':tone==='friendly'?'Pozdrawiam!':'';
 const text=[prefix,content.charAt(0).toLocaleUpperCase('pl')+content.slice(1)+'.',suffix].filter(Boolean).join(' ');
 return {text,mode,tone,matched:true,source:'user-supplied-text',productionConnected:false};
}
module.exports={compose};
