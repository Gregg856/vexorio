'use strict';
// Exact decoded-pixel fingerprint, independent of object identity.
// No persistent storage, no network, no image data in diagnostic output.
const crypto=require('node:crypto');
function fingerprint(pixels){
 if(!pixels||!Number.isSafeInteger(pixels.width)||!Number.isSafeInteger(pixels.height)||![3,4].includes(pixels.channels)||!(pixels.data instanceof Uint8Array)||pixels.data.length!==pixels.width*pixels.height*pixels.channels)throw Error('Invalid image dataset pixels');
 const hash=crypto.createHash('sha256');
 hash.update(pixels.width+':'+pixels.height+':'+pixels.channels+':');
 hash.update(pixels.data);
 return hash.digest('hex');
}
function checkImageDataset(training,testing){
 if(!Array.isArray(training)||!Array.isArray(testing))throw Error('Invalid image datasets');
 const seen=new Map(),overlaps=[];
 training.forEach((item,i)=>{const key=fingerprint(item?.pixels);if(!seen.has(key))seen.set(key,i)});
 testing.forEach((item,i)=>{const key=fingerprint(item?.pixels);if(seen.has(key))overlaps.push({trainingIndex:seen.get(key),testingIndex:i})});
 return {clean:overlaps.length===0,overlaps};
}
module.exports={fingerprint,checkImageDataset};
