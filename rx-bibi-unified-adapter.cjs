'use strict';
// RX unified CI report adapter. Reads existing BIBI JSON; never writes source.
const fs=require('node:fs');
const path=require('node:path');
const {reviewRX}=require('./rx-unified-review.cjs');
const {collectSources}=require('./rx-source-reader.cjs');
function readRequired(dir,name){
 const file=path.join(dir,name);
 const data=fs.readFileSync(file,'utf8');
 if(data.length>2000000)throw Error('RX report too large');
 return JSON.parse(data);
}
function reviewBibiReports({dir='rx-bibi-reports',runId='local',sources={},loadLocalSources=false,root=process.cwd()}={}){
 const supervisor=readRequired(dir,'rx-queen-ant-supervisor.json');
 let previousMemory=null;
 try{previousMemory=readRequired(dir,'rx-signal-memory.json')}catch(error){if(error.code!=='ENOENT')throw error;}
 // Stored memory is already updated for this run; avoid counting the same run twice.
 const preliminary=reviewRX({supervisor,previousMemory,runId,sources:{}});
 const loaded=loadLocalSources?collectSources(preliminary.board,{root}):{sources:{},skipped:[],loaded:0};
 const review=loadLocalSources?reviewRX({supervisor,previousMemory,runId,sources:loaded.sources}):reviewRX({supervisor,previousMemory,runId,sources});
 return {schema:1,kind:'rx-bibi-unified-adapter',runId,sourceLoad:{loaded:loaded.loaded,skipped:loaded.skipped},summary:{signals:review.medusa.signals.length,tasks:review.board.tasks.length,recurring:review.board.tasks.filter(x=>x.recurrent).length,patchPreviews:review.reviews.reduce((n,x)=>n+x.review.suggestions.length,0)},review,productionModified:false,requiresApproval:true};
}
if(require.main===module){
 const runId=process.env.GITHUB_RUN_ID||'local';
 const result=reviewBibiReports({runId,loadLocalSources:true});
 console.log('RX UNIFIED REVIEW:',JSON.stringify(result.summary),'read-only');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n## RX UNIFIED REVIEW (read-only)\n- Tasks: '+result.summary.tasks+'\n- Recurring: '+result.summary.recurring+'\n- No production changes.\n');
}
module.exports={reviewBibiReports};
