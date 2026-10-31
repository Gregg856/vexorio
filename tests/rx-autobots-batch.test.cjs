'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {batch}=require('./rx-autobots-batch.cjs');
test('AutoBots completes five unattended cycles',()=>{
 let calls=0;
 const result=batch({cycles:5,learn:()=>{calls++;return {latest:{status:'PASS',correct:8,total:10},regressionDetected:false};}});
 assert.equal(calls,5);assert.equal(result.status,'PASS');assert.equal(result.completed,5);
});
test('AutoBots stops on regression without continuing',()=>{
 let calls=0;
 const result=batch({cycles:5,learn:()=>{calls++;return {latest:{status:'PASS',correct:4,total:10},regressionDetected:true};}});
 assert.equal(calls,1);assert.equal(result.status,'FAIL');
});
test('AutoBots rejects unbounded work',()=>assert.throws(()=>batch({cycles:100}),/1\.\.10/));
