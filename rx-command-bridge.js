'use strict';
// RX COMMAND BRIDGE 2076 — explicit, inspectable command recipes.
// Only registered handlers run; this module does not call external services.
const RECIPES=Object.freeze({
  'RX AUDYT':Object.freeze([{cell:'code',priority:5},{cell:'security',priority:8},{cell:'tests',priority:7},{cell:'performance',priority:4}]),
  'RX BEZPIECZENSTWO':Object.freeze([{cell:'security',priority:9},{cell:'diagnostics',priority:7}]),
  'RX TEST':Object.freeze([{cell:'tests',priority:8},{cell:'diagnostics',priority:5}])
});
async function executeRXCommand(rx,command,{signal}={}){
  if(typeof command!=='string')throw new TypeError('Command must be text');
  const normalized=command.trim().toUpperCase().replace(/\s+/g,' ');
  const recipe=RECIPES[normalized];
  if(!recipe)throw new Error('Unknown RX command');
  if(!rx||typeof rx.dispatch!=='function')throw new TypeError('RX scheduler required');
  const steps=recipe.map(({cell,priority})=>({cell,priority}));
  // Sequential dispatch avoids queue overload and keeps each report deterministic.
  const results=[];
  for(const step of steps){
    if(signal?.aborted)throw signal.reason||new Error('Aborted');
    try{
      const value=await rx.dispatch(step.cell,{command:normalized},{signal,priority:step.priority});
      const status=value?.status||'completed';
      const ok=status==='completed'||status==='checked'||status==='success'||status==='ok';
      results.push({cell:step.cell,ok,status});
    }catch(error){
      results.push({cell:step.cell,ok:false,status:'failed'});
    }
  }
  return {command:normalized,steps:results,ok:results.every(item=>item.ok),requiresApproval:true};
}
if(typeof module!=='undefined'&&module.exports)module.exports={RECIPES,executeRXCommand};
if(typeof window!=='undefined')window.RXCommandBridge={RECIPES,executeRXCommand};
