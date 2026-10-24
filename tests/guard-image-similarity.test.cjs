'use strict';
const assert=require('node:assert/strict');
const {similarity,checkSimilarImages}=require('../guard/image-similarity.cjs');
function gradient(reverse=false,delta=0){
 const data=new Uint8Array(8*8*3);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const v=Math.max(0,Math.min(255,(reverse?7-x:x)*32+delta));
  data.fill(v,(y*8+x)*3,(y*8+x)*3+3);
 }
 return {width:8,height:8,channels:3,data};
}
const a=gradient(),similar=gradient(false,2),different=gradient(true);
assert.equal(similarity(a,similar),1);
assert.equal(similarity(a,different),0);
const report=checkSimilarImages([{pixels:a}],[{pixels:similar}],{threshold:0.95});
assert.equal(report.clean,false);
assert.equal(report.overlaps[0].trainingIndex,0);
assert.equal(report.overlaps[0].testingIndex,0);
assert.equal(checkSimilarImages([{pixels:a}],[{pixels:different}]).clean,true);
assert.throws(()=>checkSimilarImages([],[],{threshold:NaN}),/Invalid similarity threshold/);
const flat=(value)=>({width:8,height:8,channels:3,data:new Uint8Array(8*8*3).fill(value)});
assert.equal(similarity(flat(0),flat(255)),0);
assert.equal(checkSimilarImages([{pixels:flat(0)}],[{pixels:flat(255)}]).clean,true);
console.log('PASS: Guard luminance similarity identifies matching layout and rejects inverted pattern');
