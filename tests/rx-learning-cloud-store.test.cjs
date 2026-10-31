'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {validate}=require('../rx-learning-cloud-store.cjs');
test('learning history validates bounds',()=>{
 const result=validate({schema:1,runs:[{id:'a',at:'today',status:'PASS',correct:6,total:8,winner:'bigram'}]});
 assert.equal(result.runs.length,1);
 assert.throws(()=>validate({schema:1,runs:[{id:'a',at:'today',status:'PASS',correct:9,total:8,winner:'bad'}]}));
});
