'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildBatch,CURRICULUM}=require('./rx-queen-writing-reviewed-batch.cjs');
test('curriculum contains unique prompts and more than one batch',()=>{assert.ok(CURRICULUM.length>=9);assert.equal(new Set(CURRICULUM.map(x=>x.mode+'|'+x.prompt)).size,CURRICULUM.length);});
test('next batch skips previously practiced prompts',()=>{const first=buildBatch(),second=buildBatch({previousKeys:first.candidates.map(x=>x.key)});assert.equal(first.status,'READY_FOR_REVIEW');assert.equal(second.status,'READY_FOR_REVIEW');assert.ok(second.candidates.every(x=>!first.candidates.some(y=>y.key===x.key)));});
test('curriculum rotates only after all prompts are seen',()=>{const b=buildBatch({previousKeys:CURRICULUM.map(x=>x.mode+'|'+x.prompt.trim().toLocaleLowerCase('pl'))});assert.equal(b.rotated,true);assert.equal(b.candidates.length,3);});
test('no exercise is automatically approved or applied',()=>{const b=buildBatch();assert.equal(b.autoApproved,0);assert.equal(b.autoApplied,0);assert.ok(b.candidates.every(x=>x.approved===false&&x.applied===false));});
