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
 if(mode==='summary'){
  const sentences=cleaned.match(/[^.!?]+[.!?]?/gu)||[];
  const text=normalize(sentences.slice(0,2).join(' '));
  return {text,mode,tone,matched:true,source:'user-supplied-text',productionConnected:false};
 }
 const content=cleaned.replace(/[.!?]+$/u,'');
 const prefix=tone==='formal'?'Dzień dobry,':tone==='friendly'?'Cześć!':'';
 const suffix=tone==='formal'?'Z poważaniem.':tone==='friendly'?'Pozdrawiam!':'';
 const text=[prefix,content.charAt(0).toLocaleUpperCase('pl')+content.slice(1)+'.',suffix].filter(Boolean).join(' ');
 return {text,mode,tone,matched:true,source:'user-supplied-text',productionConnected:false};
}
module.exports={compose};
