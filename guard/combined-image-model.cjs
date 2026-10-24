'use strict';
// Experimental own classifier using color, contrast AND spatial luminance.
// No external API, pretrained weights or automatic moderation decisions.
const {extractPixelFeatures}=require('./pixel-features.cjs');
const {extractSpatialFeatures}=require('./spatial-features.cjs');
const {trainImageModel}=require('./image-model.cjs');
function features(pixels){
 const base=extractPixelFeatures(pixels),spatial=extractSpatialFeatures(pixels);
 // Empty cells use the global mean luminance; always deterministic.
 const mean=base.meanRGB.reduce((a,b)=>a+b,0)/3;
 return {...base,luminanceHistogram:spatial.grid.map(x=>x===null?mean:x).concat(base.luminanceHistogram.slice(0,7))};
}
function trainCombinedImageModel(examples){
 if(!Array.isArray(examples))throw Error('Invalid training examples');
 const prepared=examples.map(x=>({label:x?.label,features:features(x?.pixels)}));
 const model=trainImageModel(prepared);
 return Object.freeze({version:'0.1.0',trainedExamples:model.trainedExamples,predict(pixels){
  const result=model.predict({features:features(pixels)});
  return {...result,features:'color_contrast_spatial_3x3',classification:'unknown',requiresHumanReview:true};
 }});
}
module.exports={trainCombinedImageModel};
