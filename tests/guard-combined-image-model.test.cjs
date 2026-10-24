'use strict';
const assert=require('node:assert/strict');
const {trainCombinedImageModel}=require('../guard/combined-image-model.cjs');
function pattern(reverse=false){
 const data=new Uint8Array(3*3*3);
 for(let i=0;i<9;i++){
  const v=(reverse?8-i:i)*28;
  data.fill(v,i*3,i*3+3);
 }
 return {width:3,height:3,channels:3,data};
}
const train=[
 {label:'safe',pixels:pattern(false)},{label:'safe',pixels:pattern(false)},
 {label:'unsafe',pixels:pattern(true)},{label:'unsafe',pixels:pattern(true)}
];
const model=trainCombinedImageModel(train);
const a=model.predict(pattern(false)),b=model.predict(pattern(true));
assert.equal(a.candidate,'safe');
assert.equal(b.candidate,'unsafe');
assert.equal(a.classification,'unknown');
assert.equal(b.classification,'unknown');
assert.equal(a.requiresHumanReview,true);
assert.equal(b.requiresHumanReview,true);
assert.equal(a.features,'color_contrast_spatial_3x3');
assert.throws(()=>trainCombinedImageModel([]),/At least four/);
console.log('PASS: Guard spatial features distinguish layouts with identical global color statistics');
