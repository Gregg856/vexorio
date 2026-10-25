'use strict';
// Local patch preview: intentionally supports one narrow, review-required fix.
(function(root){
 function preview({path,source}={}){
  if(typeof path!=='string'||!/^[-\w./]+\.(?:js|cjs|mjs)$/.test(path)||path.includes('..')||path.startsWith('/')||typeof source!=='string'||source.length>100000)throw Error('Invalid source');
  const lines=source.split('\n'),changes=[];
  const output=lines.map((line,index)=>{
   if(!/\brejectUnauthorized\s*:\s*false\b/.test(line))return line;
   const next=line.replace(/\brejectUnauthorized(\s*:\s*)false\b/g,'rejectUnauthorized$1true');
   if(next!==line)changes.push({line:index+1,before:line,after:next});
   return next;
  });
  return {path,readOnly:true,applied:false,changes,proposedSource:output.join('\n'),warning:'Tylko propozycja. Przed wdrożeniem sprawdź certyfikaty i działanie aplikacji. Nic nie zapisano.'};
 }
 const api={preview};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GuardPatchPreview=api;
})(typeof window!=='undefined'?window:null);
