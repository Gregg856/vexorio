'use strict';
// Unified read-only inventory of RX subsystems, based on persisted reports.
const fs=require('node:fs');
const path=require('node:path');
const SOURCES=Object.freeze({
 queen:'rx-queen-ant-supervisor.json',
 ants:'rx-ant-task-board.json',
 cosmos:'rx-cosmos-ant-queue.json',
 budget:'rx-bibi-budget.json',
 browser:'rx-queen-panel-browser.json',
 panel:'rx-queen-panel-check.json',
 programs:'rx-programs-browser.json',
 studio:'rx-bibi-studio-check.json',
 computer:'rx-mega-cloud-computer.json',
 medusa:'rx-medusa-signals.json',
 ai:'rx-ant-ai-training.json'
});
function buildRXSystemStatus({directory=path.join(__dirname,'rx-bibi-reports')}={}){
 const modules={};
 for(const [name,file] of Object.entries(SOURCES)){
  try{
   const raw=fs.readFileSync(path.join(directory,file),'utf8');
   const data=JSON.parse(raw);
   if(!data||typeof data!=='object'||Array.isArray(data)||data.schema!==1||typeof data.kind!=='string'||!data.kind.startsWith('rx-'))throw Error('Invalid RX report');
   if(Object.hasOwn(data,'ok')&&typeof data.ok!=='boolean')throw Error('Invalid RX test result');
   modules[name]={state:data.ok===false?'failed':data.ok===true?'passed':'reported',kind:data.kind,report:file};
  }catch(e){
   modules[name]={state:e.code==='ENOENT'?'missing':'invalid',report:file};
  }
 }
 const board=modules.ants.state==='reported'?JSON.parse(fs.readFileSync(path.join(directory,SOURCES.ants),'utf8')):null;
 const cosmos=modules.cosmos.state==='reported'?JSON.parse(fs.readFileSync(path.join(directory,SOURCES.cosmos),'utf8')):null;
 return {schema:1,kind:'rx-system-status',modules,available:Object.values(modules).filter(x=>x.state!=='missing'&&x.state!=='invalid').length,total:Object.keys(modules).length,reviewTasks:Array.isArray(board?.tasks)?board.tasks.length:null,cosmosPlanned:Array.isArray(cosmos?.planned)?cosmos.planned.length:null,automaticActions:0,productionTouched:false,note:'Read-only report inventory; presence is not proof of live integration, cloud hardware or operational readiness.'};
}
if(require.main===module){
 const report=buildRXSystemStatus();
 fs.mkdirSync(path.join(__dirname,'rx-bibi-reports'),{recursive:true});
 fs.writeFileSync(path.join(__dirname,'rx-bibi-reports','rx-system-status.json'),JSON.stringify(report,null,2)+'\n');
 console.log('RX SYSTEM STATUS:',report.available+'/'+report.total,'reports present');
}
module.exports={buildRXSystemStatus,SOURCES};
