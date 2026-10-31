'use strict';
// Offline writing curriculum rotation: deduplicates examples across scheduled runs.
// No private chats, automatic approval or production writes.
const fs=require('node:fs'),path=require('node:path');
const {CASES}=require('./rx-queen-writing-agent-review.cjs');
const {compose}=require('./rx-queen-writing-composer.cjs');
const CURRICULUM=Object.freeze([
 {prompt:'miłego dnia',mode:'message',mustInclude:'Miłego dnia'},
 {prompt:'dziękuję za wiadomość',mode:'reply',mustInclude:'Dziękuję'},
 {prompt:'Pierwsze. Drugie. Trzecie.',mode:'summary',mustInclude:'Pierwsze. Drugie.'},
 {prompt:'udanego weekendu',mode:'message',mustInclude:'Udanego weekendu'},
 {prompt:'cieszę się z wiadomości',mode:'reply',mustInclude:'Cieszę się'},
 {prompt:'Jutro spotkanie. Pojutrze wyjazd. W piątek powrót.',mode:'summary',mustInclude:'Jutro spotkanie.'},
 {prompt:'spokojnego wieczoru',mode:'message',mustInclude:'Spokojnego wieczoru'},
 {prompt:'dziękuję za pomoc',mode:'reply',mustInclude:'Dziękuję za pomoc'},
 {prompt:'Przygotuj dokumenty. Sprawdź termin. Wyślij potwierdzenie.',mode:'summary',mustInclude:'Przygotuj dokumenty.'}
]);
const key=x=>x.mode+'|'+x.prompt.trim().toLocaleLowerCase('pl');
function buildBatch({previousKeys=[],limit=3}={}){
 if(!Array.isArray(previousKeys)||!Number.isInteger(limit)||limit<1||limit>20)throw Error('Invalid batch options');
 const seen=new Set(previousKeys.filter(x=>typeof x==='string'));
 const pool=[...new Map(CURRICULUM.map(x=>[key(x),x])).values()];
 let selected=pool.filter(x=>!seen.has(key(x))).slice(0,limit);
 const rotated=selected.length===0;
 if(rotated)selected=pool.slice(0,limit);
 const candidates=selected.map((item,index)=>{
  const output=compose(item);
  const checks={nonempty:!!output.text.trim(),relevant:output.text.includes(item.mustInclude),bounded:output.text.length<=600,offline:output.productionConnected===false};
  return {id:'queen-writing-'+(index+1),key:key(item),exercise:{mode:item.mode,prompt:item.prompt,text:output.text,productionConnected:false},checks,reviewPassed:Object.values(checks).every(Boolean),approved:false,applied:false};
 });
 return {schema:2,kind:'rx-queen-writing-reviewed-batch',status:candidates.every(c=>c.reviewPassed)?'READY_FOR_REVIEW':'NEEDS_REVIEW',curriculumSize:pool.length,rotated,candidates,autoApproved:0,autoApplied:0,productionConnected:false};
}
if(require.main===module){
 const dir=path.join(__dirname,'..','rx-bibi-reports'),history=path.join(dir,'rx-queen-writing-curriculum-history.json');
 fs.mkdirSync(dir,{recursive:true});
 let previousKeys=[];
 try{const saved=JSON.parse(fs.readFileSync(history,'utf8'));if(Array.isArray(saved.keys))previousKeys=saved.keys;}catch(e){if(e.code!=='ENOENT')throw e;}
 const batch=buildBatch({previousKeys});
 fs.writeFileSync(path.join(dir,'rx-queen-writing-reviewed-batch.json'),JSON.stringify(batch,null,2)+'\n');
 if(batch.status==='READY_FOR_REVIEW'){
  const keys=batch.rotated?batch.candidates.map(x=>x.key):[...new Set([...previousKeys,...batch.candidates.map(x=>x.key)])];
  fs.writeFileSync(history,JSON.stringify({schema:1,keys},null,2)+'\n');
 }
 console.log('RX QUEEN WRITING BATCH',JSON.stringify({status:batch.status,candidates:batch.candidates.length,rotated:batch.rotated}));
 if(batch.status!=='READY_FOR_REVIEW')process.exitCode=1;
}
module.exports={buildBatch,CURRICULUM};
