'use strict';
// VEXORIO Guard 1.2: image moderation gateway (advisory, no external API).
// Image safety classification is UNKNOWN until a real model adapter is installed.
// No image bytes or personal data are stored.
const MAX_BYTES=5*1024*1024;
const FORMATS=Object.freeze(['image/jpeg','image/png','image/webp']);
function inspectImage(metadata){
 if(!metadata||typeof metadata!=='object'||Array.isArray(metadata))return {status:'review',signals:['invalid_image_metadata'],classification:'unknown'};
 const {mime,size,width,height}=metadata;
 const signals=[];
 if(!FORMATS.includes(mime))signals.push('unsupported_format');
 if(!Number.isSafeInteger(size)||size<1||size>MAX_BYTES)signals.push('invalid_file_size');
 if(width!==undefined&&(!Number.isSafeInteger(width)||width<1||width>12000))signals.push('invalid_width');
 if(height!==undefined&&(!Number.isSafeInteger(height)||height<1||height>12000))signals.push('invalid_height');
 return {status:'review',signals:signals.length?signals:['visual_review_required'],classification:'unknown'};
}
async function moderateImage(metadata,modelAdapter){
 const preliminary=inspectImage(metadata);
 if(preliminary.signals[0]!=='visual_review_required')return preliminary;
 if(typeof modelAdapter!=='function')return preliminary;
 try{
  const result=await modelAdapter(metadata);
  if(!result||!['safe','unsafe','uncertain'].includes(result.classification))return preliminary;
  // Never auto-publish or auto-reject based solely on the model.
  return {status:'review',signals:result.classification==='unsafe'?['model_flagged']:result.classification==='uncertain'?['model_uncertain']:['model_no_flags'],classification:result.classification};
 }catch{return {status:'review',signals:['model_unavailable'],classification:'unknown'};}
}
module.exports={MAX_BYTES,FORMATS,inspectImage,moderateImage};
