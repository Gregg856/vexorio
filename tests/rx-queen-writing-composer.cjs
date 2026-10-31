'use strict';
// RX Queen local Polish writing composer. Deterministic and offline, not a generative LLM.
const {answer}=require('./rx-queen-response-practice.cjs');
const {parseIntent}=require('./rx-queen-intent-parser.cjs');
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
 const intent=parseIntent({prompt:cleaned,mode});
 const contentPrompt=intent.content;
 const oneSentence=intent.constraints.includes('oneSentence');
 const noGreeting=intent.constraints.includes('noGreeting');
 const noSignoff=intent.constraints.includes('noSignoff');
 const short=intent.constraints.includes('short');
 if(mode==='summary'){
  const sentences=contentPrompt.match(/[^.!?]+[.!?]?/gu)||[];
  const text=normalize(sentences.slice(0,oneSentence?1:2).join(' '));
  return {text,mode,tone,matched:true,source:'user-supplied-text',productionConnected:false};
 }
 const content=contentPrompt.replace(/[.!?]+$/u,'');
 const prefix=(noGreeting||short)?'':tone==='formal'?'Dzień dobry,':tone==='friendly'?'Cześć!':'';
 const suffix=(noSignoff||short)?'':tone==='formal'?'Z poważaniem.':tone==='friendly'?'Pozdrawiam!':'';
 const text=[prefix,content.charAt(0).toLocaleUpperCase('pl')+content.slice(1)+'.',suffix].filter(Boolean).join(' ');
 return {text,mode,tone,matched:true,source:'user-supplied-text',productionConnected:false};
}
module.exports={compose};
