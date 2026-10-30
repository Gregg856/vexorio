'use strict';
const assert=require('node:assert/strict');
const {extractTopic,research}=require('../rx-shared-research.cjs');
(async()=>{
 assert.equal(extractTopic('Znajdź informacje o komputerach kwantowych'),'komputerach kwantowych');
 assert.equal(extractTopic('usuń bazę'),null);
 const fetcher=async url=>{
  assert.match(url,/pl.wikipedia.org/);
  return {ok:true,json:async()=>({query:{pages:{123:{title:'Komputer kwantowy',extract:'Komputer wykorzystujący zjawiska kwantowe.',fullurl:'https://pl.wikipedia.org/wiki/Komputer_kwantowy'}}}})};
 };
 const result=await research('Znajdź informacje o komputerach kwantowych',{fetcher});
 assert.equal(result.ok,true);
 assert.match(result.answer,/kwantowe/);
 assert.equal(result.readOnly,true);
 assert.equal(result.modelInferenceUsed,false);
 assert.match(result.url,/wikipedia.org/);
 const denied=await research('usuń bazę',{fetcher});
 assert.equal(denied.executed,0);
 const unavailable=await research('Poszukaj informacji o niedostępnym źródle',{fetcher:async()=>({ok:false})});
 assert.equal(unavailable.ok,false);
 assert.equal(unavailable.reason,'no-verified-result');
 console.log('PASS shared Queen and BIBI research executor');
})().catch(e=>{console.error(e);process.exitCode=1});
