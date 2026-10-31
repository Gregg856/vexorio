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
 const oneSentence=mode==='summary'&&/^Streszcz w jednym zdaniu:\s*/iu.test(cleaned);
 const noGreeting=mode==='message'&&/^Napisz krótką wiadomość bez powitania:\s*/iu.test(cleaned);
 const noSignoff=mode==='reply'&&/^Odpowiedz bez pożegnania:\s*/iu.test(cleaned);
 const paraphrase=mode==='message'&&/^Przepisz sens bez cytowania:\s*/iu.test(cleaned);
 const contentPrompt=cleaned.replace(/^(?:Streszcz w jednym zdaniu|Napisz krótką wiadomość bez powitania|Odpowiedz bez pożegnania|Przepisz sens bez cytowania):\s*/iu,'');
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
