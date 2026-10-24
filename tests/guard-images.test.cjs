'use strict';
const assert=require('node:assert/strict');
const {inspectImage,moderateImage}=require('../guard/images.cjs');
const image={mime:'image/jpeg',size:1024,width:800,height:600};
(async()=>{
 assert.deepEqual(inspectImage(image).signals,['visual_review_required']);
 assert.equal(inspectImage(image).classification,'unknown');
 assert.ok(inspectImage({...image,mime:'text/html'}).signals.includes('unsupported_format'));
 assert.ok(inspectImage({...image,size:6*1024*1024}).signals.includes('invalid_file_size'));
 assert.equal((await moderateImage(image)).classification,'unknown');
 assert.deepEqual((await moderateImage(image,async()=>({classification:'unsafe'}))).signals,['model_flagged']);
 assert.deepEqual((await moderateImage(image,async()=>({classification:'safe'}))).signals,['model_no_flags']);
 assert.equal((await moderateImage(image,async()=>{throw Error('offline')})).classification,'unknown');
 let called=false;
 await moderateImage({...image,mime:'application/pdf'},async()=>{called=true;return {classification:'safe'}});
 assert.equal(called,false);
 console.log('PASS: Guard image validation, fail-closed review and adapter contract');
})().catch(e=>{console.error(e);process.exitCode=1});
