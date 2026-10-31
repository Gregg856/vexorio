'use strict';
// Offline writing curriculum rotation: deduplicates examples across scheduled runs.
// No private chats, automatic approval or production writes.
const fs=require('node:fs'),path=require('node:path');
const {CASES}=require('./rx-queen-writing-agent-review.cjs');
const {compose}=require('./rx-queen-writing-composer.cjs');
const {examine}=require('./rx-queen-writing-examiner.cjs');
const CURRICULUM=Object.freeze([
 {prompt:'miłego dnia',mode:'message',mustInclude:'Miłego dnia'},
 {prompt:'dziękuję za wiadomość',mode:'reply',mustInclude:'Dziękuję'},
 {prompt:'Pierwsze. Drugie. Trzecie.',mode:'summary',mustInclude:'Pierwsze. Drugie.'},
 {prompt:'udanego weekendu',mode:'message',mustInclude:'Udanego weekendu'},
 {prompt:'cieszę się z wiadomości',mode:'reply',mustInclude:'Cieszę się'},
 {prompt:'Jutro spotkanie. Pojutrze wyjazd. W piątek powrót.',mode:'summary',mustInclude:'Jutro spotkanie.'},
 {prompt:'spokojnego wieczoru',mode:'message',mustInclude:'Spokojnego wieczoru'},
 {prompt:'dziękuję za pomoc',mode:'reply',mustInclude:'Dziękuję za pomoc'},
 {prompt:'Przygotuj dokumenty. Sprawdź termin. Wyślij potwierdzenie.',mode:'summary',mustInclude:'Przygotuj dokumenty.'},
 {prompt:'udanego poniedziałku',mode:'message',mustInclude:'Udanego poniedziałku'},
 {prompt:'serdeczne pozdrowienia',mode:'message',mustInclude:'Serdeczne pozdrowienia'},
 {prompt:'powodzenia w pracy',mode:'message',mustInclude:'Powodzenia w pracy'},
 {prompt:'dziękuję za odpowiedź',mode:'reply',mustInclude:'Dziękuję za odpowiedź'},
 {prompt:'cieszę się z pomocy',mode:'reply',mustInclude:'Cieszę się z pomocy'},
 {prompt:'potwierdzam otrzymanie wiadomości',mode:'reply',mustInclude:'Potwierdzam otrzymanie wiadomości'},
 {prompt:'Najpierw przeczytaj instrukcję. Następnie wykonaj test. Na końcu zapisz wynik.',mode:'summary',mustInclude:'Najpierw przeczytaj instrukcję.'},
 {prompt:'Rano przygotuj plan. Po południu sprawdź zadania. Wieczorem odpocznij.',mode:'summary',mustInclude:'Rano przygotuj plan.'},
 {prompt:'Sprawdź datę. Zapisz godzinę. Potwierdź termin.',mode:'summary',mustInclude:'Sprawdź datę.'}
]);
const key=x=>x.mode+'|'+x.prompt.trim().toLocaleLowerCase('pl');
function validateHistory(data){
 if(!data||data.schema!==1||!Array.isArray(data.keys)||data.keys.length>CURRICULUM.length)throw Error('Invalid curriculum history');
 const allowed=new Set(CURRICULUM.map(key));
 if(data.keys.some(k=>typeof k!=='string'||!allowed.has(k))||new Set(data.keys).size!==data.keys.length)throw Error('Invalid curriculum keys');
 return {schema:1,keys:[...data.keys]};
}
function buildBatch({previousKeys=[],limit=3}={}){
 if(!Array.isArray(previousKeys)||!Number.isInteger(limit)||limit<1||limit>20)throw Error('Invalid batch options');
 const seen=new Set(previousKeys.filter(x=>typeof x==='string'));
 const pool=[...new Map(CURRICULUM.map(x=>[key(x),x])).values()];
 let selected=pool.filter(x=>!seen.has(key(x))).slice(0,limit);
 const rotated=selected.length===0;
 if(rotated)selected=pool.slice(0,limit);
 const candidates=selected.map((item,index)=>{
  const output=compose(item);
  const exam=examine({...item,text:output.text});
  const checks={...exam.checks,offline:output.productionConnected===false};
  return {id:'queen-writing-'+(index+1),key:key(item),exercise:{mode:item.mode,prompt:item.prompt,text:output.text,productionConnected:false},checks,exam:{score:exam.score,maximum:exam.maximum,failed:exam.failed,semanticAccuracyVerified:false},reviewPassed:Object.values(checks).every(Boolean),approved:false,applied:false};
 });
 return {schema:2,kind:'rx-queen-writing-reviewed-batch',status:candidates.every(c=>c.reviewPassed)?'READY_FOR_REVIEW':'NEEDS_REVIEW',curriculumSize:pool.length,rotated,candidates,autoApproved:0,autoApplied:0,productionConnected:false};
}
if(require.main===module){
 const dir=path.join(__dirname,'..','rx-bibi-reports'),history=path.join(dir,'rx-queen-writing-curriculum-history.json');
 fs.mkdirSync(dir,{recursive:true});
 let previousKeys=[];
 try{const saved=JSON.parse(fs.readFileSync(history,'utf8'));previousKeys=validateHistory(saved).keys;}catch(e){if(e.code!=='ENOENT')throw e;}
 const batch=buildBatch({previousKeys});
 fs.writeFileSync(path.join(dir,'rx-queen-writing-reviewed-batch.json'),JSON.stringify(batch,null,2)+'\n');
 if(batch.status==='READY_FOR_REVIEW'){
  const keys=batch.rotated?batch.candidates.map(x=>x.key):[...new Set([...previousKeys,...batch.candidates.map(x=>x.key)])];
  fs.writeFileSync(history,JSON.stringify({schema:1,keys},null,2)+'\n');
 }
 console.log('RX QUEEN WRITING BATCH',JSON.stringify({status:batch.status,candidates:batch.candidates.length,rotated:batch.rotated}));
 if(batch.status!=='READY_FOR_REVIEW')process.exitCode=1;
}
module.exports={buildBatch,CURRICULUM,validateHistory};
