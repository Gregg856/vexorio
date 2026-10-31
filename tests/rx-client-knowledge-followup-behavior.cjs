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
 assert.equal(prior('A dlaczego?',['Co to jest fotosynteza?',sourced,'Opowiedz więcej',sourced]),'Co to jest fotosynteza?');
 assert.equal(prior('A dlaczego?',['Co to jest fotosynteza?',sourced,'Ile to 2+2?','4']),null);
 assert.equal(prior('A dlaczego?',['Co to jest fotosynteza?',sourced,'Co to jest grawitacja?', '📚 Grawitacja\\nPrzyciąganie.\\nŹródło: https://pl.wikipedia.org/wiki/Grawitacja']),'Co to jest grawitacja?');

 console.log('RX BIBI sourced followup behavior: 10/10 passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
