'use strict';
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const {getRXKnowledgeFollowupPrior:prior}=await import(pathToFileURL(path.resolve(__dirname,'../rx-world-knowledge.mjs')).href);
 const sourced='📚 Fotosynteza\nRośliny wykorzystują światło.\nŹródło: https://pl.wikipedia.org/wiki/Fotosynteza';
 const h=['Co to jest fotosynteza?',sourced];
 assert.equal(prior('A dlaczego?',h),h[0]);
 assert.equal(prior('Opowiedz więcej',h),h[0]);
 assert.equal(prior('A dlaczego?',['Co to jest fotosynteza?','Nie wiem']),null);
 assert.equal(prior('A dlaczego?',['Co to jest RX BIBI?',sourced]),null);
 assert.equal(prior('A dlaczego?',['Ile jest 2+2?',sourced]),null);
 assert.equal(prior('Dalej',h),null);
 assert.equal(prior('A dlaczego?',[]),null);
 console.log('RX BIBI sourced followup behavior: 7/7 passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
