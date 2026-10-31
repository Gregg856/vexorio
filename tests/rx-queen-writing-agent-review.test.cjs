'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {review,CASES}=require('./rx-queen-writing-agent-review.cjs');
test('writing review covers six different prompts',()=>assert.equal(CASES.length,6));
test('teacher, tester, guard and verifier review passes',()=>{const r=review();assert.equal(r.status,'PASS');assert.equal(r.passed,6);assert.equal(r.roles.length,4);});
test('review never claims production connection',()=>assert.equal(review().productionConnected,false));
