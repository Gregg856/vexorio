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
const testSafe=pattern(false,-2);testSafe.data.fill(255,0,3);
const testUnsafe=pattern(true,2);testUnsafe.data.fill(0,24,27);
const testing=[
 {label:'safe',pixels:testSafe},
 {label:'unsafe',pixels:testUnsafe}
];
const result=evaluateImageHoldout(training,testing);
assert.equal(result.samples,2);
assert.equal(Object.values(result.counts).reduce((a,b)=>a+b,0),2);
assert.ok(result.coverage>=0&&result.coverage<=1);
assert.ok(result.accuracy>=0&&result.accuracy<=1);
assert.equal(result.automaticModeration,false);
assert.ok(result.examples.every(x=>x.requiresHumanReview&&!('pixels' in x)));
assert.throws(()=>evaluateImageHoldout(training,[testing[0],testing[0]]),/Both test classes required/);
assert.throws(()=>evaluateImageHoldout(training,[training[0],testing[1]]),/Duplicate training and test images/);
assert.throws(()=>evaluateImageHoldout(training,[{label:'safe',pixels:pattern(false,0)},testing[1]]),/Duplicate training and test images/);
assert.throws(()=>evaluateImageHoldout(training,[{label:'safe',pixels:pattern(false,-2)},{label:'unsafe',pixels:pattern(true,2)}]),/Similar training and test images/);
console.log('PASS: Guard synthetic image holdout metrics and no auto moderation');
