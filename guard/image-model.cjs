'use strict';
// Independently implemented nearest-centroid classifier over extracted pixel features.
// Experimental only: no pretrained weights, no claims of semantic content recognition.
// Predictions are advisory and always require human review.
const {extractPixelFeatures}=require('./pixel-features.cjs');
const LABELS=['safe','unsafe'];
function vector(f){
 if(!f||!Array.isArray(f.meanRGB)||f.meanRGB.length!==3||!Array.isArray(f.luminanceHistogram)||f.luminanceHistogram.length!==16)throw Error('Invalid image features');
 const spatial=f.spatialGrid===undefined?[]:f.spatialGrid;
 if(!Array.isArray(spatial)||!(spatial.length===0||spatial.length===9))throw Error('Invalid spatial features');
 const v=[...f.meanRGB,...f.luminanceHistogram,f.darkFraction,f.brightFraction,f.edgeContrast,...spatial];
 if(!(v.length===22||v.length===31)||v.some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('Invalid image feature values');
 return v;
}
function trainImageModel(examples){
 if(!Array.isArray(examples)||examples.length<4)throw Error('At least four labeled image examples required');
 const groups=new Map(LABELS.map(label=>[label,[]]));
 for(const example of examples){
  if(!example||!LABELS.includes(example.label))throw Error('Invalid image training label');
  const features=example.features??extractPixelFeatures(example.pixels);
  groups.get(example.label).push(vector(features));
 }
 if(groups.get('safe').length<2||groups.get('unsafe').length<2)throw Error('At least two examples of each class required');
 const centroid=label=>{
  const rows=groups.get(label);
  return rows[0].map((_,i)=>rows.reduce((s,row)=>s+row[i],0)/rows.length);
 };
 const centers={safe:centroid('safe'),unsafe:centroid('unsafe')};
 const distance=(a,b)=>Math.sqrt(a.reduce((s,x,i)=>s+(x-b[i])**2,0)/a.length);
 return Object.freeze({
  version:'0.1.0',
  trainedExamples:examples.length,
  predict(input){
   const v=vector(input?.features??extractPixelFeatures(input?.pixels));
   const distances={safe:distance(v,centers.safe),unsafe:distance(v,centers.unsafe)};
   const gap=Math.abs(distances.safe-distances.unsafe);
   // The gap is not a calibrated probability or reliable safety confidence.
   const candidate=distances.safe===distances.unsafe?'unknown':distances.safe<distances.unsafe?'safe':'unsafe';
   return {version:'0.1.0',candidate,distances,gap,classification:'unknown',requiresHumanReview:true,mode:'experimental_advisory',trainedExamples:examples.length};
  }
 });
}
module.exports={trainImageModel};
