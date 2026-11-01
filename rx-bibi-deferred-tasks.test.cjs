'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {createDeferredTasks}=require('./rx-bibi-deferred-tasks.cjs');
test('defer, snapshot and resume without losing next step',()=>{
 const m=createDeferredTasks();
 m.put({id:'cloud-sync',topic:'Synchronizacja rozmów',nextStep:'Wróć po testach dwóch kont',status:'deferred'});
 const restored=createDeferredTasks(m.snapshot().tasks);
 assert.equal(restored.list('deferred').length,1);
 assert.equal(restored.resume('cloud-sync').nextStep,'Wróć po testach dwóch kont');
 assert.equal(restored.get('cloud-sync').status,'active');
});
test('completed tasks cannot resume',()=>{
 const m=createDeferredTasks([{id:'done',topic:'Zadanie',nextStep:'Brak',status:'done'}]);
 assert.equal(m.resume('done'),null);
});
test('reject malformed task IDs',()=>{
 const m=createDeferredTasks();
 assert.throws(()=>m.put({id:'../bad',topic:'x',nextStep:'y',status:'deferred'}));
});
