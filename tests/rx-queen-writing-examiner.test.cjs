'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {examine}=require('./rx-queen-writing-examiner.cjs');
const {buildBatch,CURRICULUM}=require('./rx-queen-writing-reviewed-batch.cjs');
test('examiner accepts valid non-echo reply',()=>{
 const e=examine({prompt:'dziękuję za wiadomość',mode:'reply',text:'Cześć! Dziękuję za wiadomość. Pozdrawiam!',mustInclude:'Dziękuję'});
 assert.equal(e.passed,true);assert.equal(e.semanticAccuracyVerified,false);
});
test('examiner rejects exact echo, absent phrase and empty response',()=>{
 const echo=examine({prompt:'Miłego dnia',mode:'message',text:'Miłego dnia',mustInclude:'Miłego dnia'});
 assert.equal(echo.passed,false);assert.ok(echo.failed.includes('notExactEcho'));
 const empty=examine({prompt:'test',mode:'reply',text:'',mustInclude:'Test'});
 assert.ok(empty.failed.includes('nonempty'));assert.ok(empty.failed.includes('requiredPhrase'));
});
test('examiner rejects summary that does not shorten input',()=>{
 const e=examine({prompt:'Pierwsze. Drugie.',mode:'summary',text:'Pierwsze. Drugie.',mustInclude:'Pierwsze.'});
 assert.ok(e.failed.includes('summaryShorter'));
});
test('all 18 existing curriculum examples pass the stricter offline examiner',()=>{
 let keys=[];
 for(let i=0;i<6;i++){
  const batch=buildBatch({previousKeys:keys});
  assert.equal(batch.status,'READY_FOR_REVIEW');
  assert.ok(batch.candidates.every(c=>c.exam.score===c.exam.maximum&&c.exam.semanticAccuracyVerified===false&&c.reviewPassed));
  keys.push(...batch.candidates.map(c=>c.key));
 }
 assert.equal(new Set(keys).size,CURRICULUM.length);
});
