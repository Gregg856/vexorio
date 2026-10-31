'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {queue,nextExercise}=require('./rx-learning-memory.cjs');
test('RX learning queue has four unique ordered tasks',()=>{
 const q=queue();assert.equal(q.length,4);
 assert.equal(new Set(q.map(x=>x.id)).size,4);
 assert.ok(q.every(x=>x.status==='QUEUED'));
 assert.equal(q[0].role,'nauczyciel');
});
test('RX chooses weakest category based on held-out errors',()=>{
 assert.equal(nextExercise([{expected:'memory'},{expected:'math'},{expected:'memory'}]),'memory');
 assert.equal(nextExercise([]),'generalization');
});
test('RX learning tasks declare dependency',()=>{
 const q=queue();assert.equal(q.find(x=>x.id==='review-results').after,'regression-check');
});
