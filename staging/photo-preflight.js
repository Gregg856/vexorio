// Staging-only photo preflight. Use before storage upload and listing publication.
// Production uploads must not call this staging endpoint.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VexorioPhotoPreflight=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const ALLOWED=['image/jpeg','image/png','image/webp'];
async function check(files,client,readFile){
 if(!client||!/^https:\/\/owkjdlpawczrnwyszduj\.supabase\.co\/?$/.test(client.supabaseUrl||''))throw Error('staging_only');
 if(!Array.isArray(files)||files.length>5)throw Error('too_many_images');
 if(files.some(f=>!ALLOWED.includes(f.type)||f.size>2_000_000))throw Error('invalid_image');
 if(files.length===0)throw Error('no_images');
 const results=[];
 for(const file of files){
  let image;
  try{image=await readFile(file)}catch{results.push({status:'review',reason:'file_read_failed'});continue}
  try{
   const {data,error}=await client.functions.invoke('staging-image-moderation',{body:{image}});
   if(error||!data||typeof data.flagged!=='boolean'){results.push({status:'review',reason:'scanner_unavailable'});continue}
   results.push({status:data.flagged?'review':'screened',reason:data.flagged?'flagged':'no_signal'});
  }catch{results.push({status:'review',reason:'scanner_unavailable'})}
 }
 return {results,requiresReview:results.some(r=>r.status==='review'),allScreened:results.every(r=>r.status==='screened')};
}
return Object.freeze({check});
});
