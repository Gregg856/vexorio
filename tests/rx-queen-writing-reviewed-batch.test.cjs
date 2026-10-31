'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildBatch,CURRICULUM,validateHistory}=require('./rx-queen-writing-reviewed-batch.cjs');
test('curriculum contains unique prompts and more than one batch',()=>{assert.ok(CURRICULUM.length>=9);assert.equal(new Set(CURRICULUM.map(x=>x.mode+'|'+x.prompt)).size,CURRICULUM.length);});
test('next batch skips previously practiced prompts',()=>{const first=buildBatch(),second=buildBatch({previousKeys:first.candidates.map(x=>x.key)});assert.equal(first.status,'READY_FOR_REVIEW');assert.equal(second.status,'READY_FOR_REVIEW');assert.ok(second.candidates.every(x=>!first.candidates.some(y=>y.key===x.key)));});
test('curriculum rotates only after all prompts are seen',()=>{const b=buildBatch({previousKeys:CURRICULUM.map(x=>x.mode+'|'+x.prompt.trim().toLocaleLowerCase('pl'))});assert.equal(b.rotated,true);assert.equal(b.candidates.length,3);});
test('no exercise is automatically approved or applied',()=>{const b=buildBatch();assert.equal(b.autoApproved,0);assert.equal(b.autoApplied,0);assert.ok(b.candidates.every(x=>x.approved===false&&x.applied===false));});

test('curriculum history survives serialization and next scheduled batch',()=>{
 let saved=validateHistory({schema:1,keys:[]});
 const batches=[];
 for(let i=0;i<4;i++){
  saved=validateHistory(JSON.parse(JSON.stringify(saved)));
  const b=buildBatch({previousKeys:saved.keys});
  batches.push(b);
  assert.equal(b.status,'READY_FOR_REVIEW');
  assert.equal(b.candidates.length,3);
  assert.equal(b.autoApproved,0);
  assert.equal(b.autoApplied,0);
  saved=validateHistory({schema:1,keys:b.rotated?b.candidates.map(c=>c.key):[...new Set([...saved.keys,...b.candidates.map(c=>c.key)])]});
 }
 assert.equal(new Set(batches.slice(0,3).flatMap(b=>b.candidates.map(c=>c.key))).size,9);
 assert.equal(batches[3].rotated,true);
 assert.deepEqual(batches[3].candidates.map(c=>c.key),batches[0].candidates.map(c=>c.key));
});
test('history rejects private text, unknown keys and duplicate keys',()=>{
 const k=CURRICULUM[0].mode+'|'+CURRICULUM[0].prompt.trim().toLocaleLowerCase('pl');
 assert.throws(()=>validateHistory({schema:1,keys:[k,k]}));
 assert.throws(()=>validateHistory({schema:1,keys:['private chat text']}));
 assert.deepEqual(validateHistory({schema:1,keys:[k],privateChat:'secret'}),{schema:1,keys:[k]});
});
