'use strict';
// Deterministic offline examiner: checks only observable properties, not semantic truth.
const normalize=s=>String(s).trim().replace(/\s+/gu,' ');
function examine({prompt,mode,text,mustInclude,maxLength=600}={}){
 if(typeof prompt!=='string'||typeof text!=='string'||typeof mustInclude!=='string'||!['message','reply','summary'].includes(mode))throw Error('Invalid examination');
 const input=normalize(prompt),output=normalize(text);
 const checks={
  nonempty:output.length>0,
  requiredPhrase:output.includes(mustInclude),
  length:output.length<=maxLength,
  notExactEcho:output.toLocaleLowerCase('pl')!==input.toLocaleLowerCase('pl'),
  summaryShorter:mode!=='summary'||output.length<input.length,
  noAdjacentRepetition:!/(\\b[^\\s.,!?]+\\b)(?:\\s+\\1){2,}/iu.test(output)
 };
 const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
 return {checks,passed:failed.length===0,failed,score:Object.values(checks).filter(Boolean).length,maximum:Object.keys(checks).length,semanticAccuracyVerified:false};
}
module.exports={examine};
