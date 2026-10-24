'use strict';
const assert=require('node:assert/strict');
const {extractPixelFeatures}=require('../guard/pixel-features.cjs');
const {extractSpatialFeatures}=require('../guard/spatial-features.cjs');
const {trainCombinedImageModel}=require('../guard/combined-image-model.cjs');
const {checkImageDataset}=require('../guard/image-dataset-check.cjs');
const {checkSimilarImages}=require('../guard/image-similarity.cjs');
const {evaluateImageHoldout}=require('../guard/image-evaluation.cjs');
function picture(kind,variation=0){
 const width=8,height=8,channels=3,data=new Uint8Array(width*height*channels);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const on=kind==='vertical'?x<4:kind==='horizontal'?y<4:(x+y)%2===0;
  const v=on?220-variation:30+variation;
  data.fill(v,(y*width+x)*channels,(y*width+x+1)*channels);
 }
 return {width,height,channels,data};
}
const training=[
 {label:'safe',pixels:picture('vertical',0)},
 {label:'safe',pixels:picture('vertical',3)},
 {label:'unsafe',pixels:picture('horizontal',0)},
 {label:'unsafe',pixels:picture('horizontal',3)}
];
const test=[
 {label:'safe',pixels:picture('checker',0)},
 {label:'unsafe',pixels:picture('checker',3)}
];
const raw=picture('vertical');
assert.equal(extractPixelFeatures(raw).classification,'unknown');
assert.equal(extractSpatialFeatures(raw).grid.length,9);
assert.equal(checkImageDataset(training,test).clean,true);
assert.equal(checkSimilarImages(training,test).clean,true);
const model=trainCombinedImageModel(training);
for(const item of test){
 const prediction=model.predict(item.pixels);
 assert.equal(prediction.classification,'unknown');
 assert.equal(prediction.requiresHumanReview,true);
 assert.equal(prediction.mode,'experimental_advisory');
}
const report=evaluateImageHoldout(training,test);
assert.equal(report.samples,2);
assert.ok(report.coverage>=0&&report.coverage<=1);
assert.equal(report.automaticModeration,false);
assert.equal(Object.values(report.counts).reduce((a,b)=>a+b,0),2);
assert.ok(report.examples.every(x=>x.requiresHumanReview&&!('pixels' in x)));
assert.throws(()=>evaluateImageHoldout(training,[training[0],test[1]]),/Duplicate training and test images/);
assert.throws(()=>evaluateImageHoldout(training,[{label:'safe',pixels:picture('vertical',1)},test[1]]),/Similar training and test images/);
console.log('PASS: Guard image pipeline integrates extraction, similarity, training and holdout without auto moderation');
