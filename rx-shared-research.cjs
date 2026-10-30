'use strict';
// One read-only research executor shared by Queen RX and BIBI.
// No privileged tools, writes, dispatches, or deployment.
const {RULES}=require('./rx-task-catalog.cjs');
const RESEARCH=RULES.find(rule=>rule.id==='research_info');
function extractTopic(message){
 if(typeof message!=='string'||message.length>300)return null;
 const normalized=message.trim().toLocaleLowerCase('pl-PL');
 const word=RESEARCH.words.find(w=>normalized.startsWith(w+' '));
 if(!word)return null;
 const topic=message.trim().slice(word.length).trim().replace(/^[o:]\s*/i,'').trim();
 return topic.length>=3&&topic.length<=160?topic:null;
}
async function research(message,{fetcher}={}){
 const topic=extractTopic(message);
 if(!topic)return {ok:false,reason:'unsupported-intent',executed:0};
 try{
  const {searchWorldKnowledge}=await import('./rx-world-knowledge.mjs');
  const found=await searchWorldKnowledge(topic,fetcher?{fetcher}:{});
  if(!found)return {ok:false,reason:'no-verified-result',topic,executed:1,answer:'Nie znalazłam potwierdzonej informacji. Spróbuj dokładniejszego pytania.'};
  return {ok:true,topic,title:found.title,answer:found.summary,source:found.source,url:found.url,executed:1,readOnly:true,modelInferenceUsed:false};
 }catch{
  return {ok:false,reason:'lookup-failed',topic,executed:1,answer:'Nie mogę teraz sprawdzić źródeł. Spróbuj ponownie później.'};
 }
}
module.exports={extractTopic,research};
