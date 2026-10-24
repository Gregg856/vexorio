'use strict';
const assert=require('node:assert/strict');
const {evaluateImageHoldout}=require('../guard/image-evaluation.cjs');
function pattern(reverse=false,shift=0){
 const data=new Uint8Array(27);
 for(let i=0;i<9;i++)data.fill(Math.min(255,Math.max(0,(reverse?8-i:i)*28+shift)),i*3,i*3+3);
 return {width:3,height:3,channels:3,data};
}
const training=[
 {label:'safe',pixels:pattern(false,0)},{label:'safe',pixels:pattern(false,2)},
 {label:'unsafe',pixels:pattern(true,0)},{label:'unsafe',pixels:pattern(true,-2)}
];
const testing=[
 {label:'safe',pixels:pattern(false,-2)},
 {label:'unsafe',pixels:pattern(true,2)}
];
const result=evaluateImageHoldout(training,testing);
assert.equal(result.samples,2);
assert.equal(Object.values(result.counts).reduce((a,b)=>a+b,0),2);
assert.equal(result.accuracy,1);
assert.equal(result.automaticModeration,false);
assert.ok(result.examples.every(x=>x.requiresHumanReview&&!('pixels' in x)));
assert.throws(()=>evaluateImageHoldout(training,[testing[0],testing[0]]),/Both test classes required/);
assert.throws(()=>evaluateImageHoldout(training,[training[0],testing[1]]),/Shared training and test pixel buffers/);
console.log('PASS: Guard synthetic image holdout metrics and no auto moderation');
