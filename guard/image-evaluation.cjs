'use strict';
// Offline held-out evaluation of the experimental visual-feature classifier.
// These statistics are not estimates of real-world content-safety performance.
const {trainCombinedImageModel}=require('./combined-image-model.cjs');
const {checkImageDataset}=require('./image-dataset-check.cjs');
const {checkSimilarImages}=require('./image-similarity.cjs');
function evaluateImageHoldout(training,testing,{similarityThreshold=0.95}={}){
 if(!Array.isArray(training)||!Array.isArray(testing)||testing.length<2)throw Error('Invalid image datasets');
 if(testing.some(x=>!x||!['safe','unsafe'].includes(x.label)||!x.pixels))throw Error('Invalid test image');
 if(!testing.some(x=>x.label==='safe')||!testing.some(x=>x.label==='unsafe'))throw Error('Both test classes required');
 // Prevent accidental reuse of the same pixel-buffer object in both sets.
 const audit=checkImageDataset(training,testing);
 if(!audit.clean)throw Error('Duplicate training and test images');
 const similarityAudit=checkSimilarImages(training,testing,{threshold:similarityThreshold});
 if(!similarityAudit.clean)throw Error('Similar training and test images');
 const model=trainCombinedImageModel(training),counts={tp:0,tn:0,fp:0,fn:0};
 const examples=testing.map((item,index)=>{
  const prediction=model.predict(item.pixels);
  const actual=item.label,predicted=prediction.candidate;
  if(predicted==='unknown')throw Error('Unexpected unknown candidate');
  counts[actual==='unsafe'?(predicted==='unsafe'?'tp':'fn'):(predicted==='unsafe'?'fp':'tn')]++;
  return {index,actual,predicted,correct:actual===predicted,requiresHumanReview:prediction.requiresHumanReview};
 });
 const {tp,tn,fp,fn}=counts,ratio=(a,b)=>b?a/b:null;
 return {status:'experimental_synthetic_holdout',samples:testing.length,counts,accuracy:(tp+tn)/testing.length,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn),falsePositiveRate:ratio(fp,fp+tn),automaticModeration:false,examples};
}
module.exports={evaluateImageHoldout};
