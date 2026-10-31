'use strict';
// Automatic offline teacher/tester batch; human approval is still required.
const fs=require('node:fs'),path=require('node:path');
const {CASES}=require('./rx-queen-writing-agent-review.cjs');
const {compose}=require('./rx-queen-writing-composer.cjs');
function buildBatch(){
 const candidates=CASES.filter(x=>['message','reply','summary'].includes(x.mode)).map((item,index)=>{
  const output=compose(item);
  const checks={nonempty:!!output.text.trim(),relevant:output.text.includes(item.mustInclude),bounded:output.text.length<=600,offline:output.productionConnected===false};
  return {id:'queen-writing-'+(index+1),exercise:{mode:item.mode,prompt:item.prompt,text:output.text,productionConnected:false},checks,reviewPassed:Object.values(checks).every(Boolean),approved:false,applied:false};
 });
 return {schema:1,kind:'rx-queen-writing-reviewed-batch',status:candidates.every(c=>c.reviewPassed)?'READY_FOR_REVIEW':'NEEDS_REVIEW',candidates,autoApproved:0,autoApplied:0,productionConnected:false};
}
if(require.main===module){const batch=buildBatch(),dir=path.join(__dirname,'..','rx-bibi-reports');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'rx-queen-writing-reviewed-batch.json'),JSON.stringify(batch,null,2)+'\n');console.log('RX QUEEN WRITING BATCH',JSON.stringify({status:batch.status,candidates:batch.candidates.length}));if(batch.status!=='READY_FOR_REVIEW')process.exitCode=1;}
module.exports={buildBatch};
