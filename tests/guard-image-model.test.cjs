'use strict';
const assert=require('node:assert/strict');
const {trainImageModel}=require('../guard/image-model.cjs');
const px=(v)=>({width:1,height:1,channels:3,data:Uint8Array.from([v,v,v])});
const training=[
 {label:'safe',pixels:px(0)},{label:'safe',pixels:px(20)},
 {label:'unsafe',pixels:px(235)},{label:'unsafe',pixels:px(255)}
];
const model=trainImageModel(training);
const dark=model.predict({pixels:px(10)});
const light=model.predict({pixels:px(245)});
assert.equal(dark.candidate,'safe');
assert.equal(light.candidate,'unsafe');
for(const prediction of [dark,light]){
 assert.equal(prediction.classification,'unknown');
 assert.equal(prediction.requiresHumanReview,true);
 assert.equal(prediction.mode,'experimental_advisory');
 assert.ok(Number.isFinite(prediction.gap));
}
assert.throws(()=>trainImageModel(training.slice(0,3)),/At least four/);
assert.throws(()=>trainImageModel([...training.slice(0,2),training[2],{label:'bad',pixels:px(100)}]),/Invalid image training label/);
assert.throws(()=>model.predict({pixels:{width:1,height:1,data:new Uint8Array(2)}}),/Invalid pixel buffer/);
console.log('PASS: Guard experimental local image classifier, validation, mandatory review');
