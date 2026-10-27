'use strict';
// RX ANT ACADEMY CI adapter: scores only explicitly supplied completed checks.
const {createVerifiedAcademy}=require('./rx-ant-academy-proof.cjs');
function rankChecks(checks,{runId='local'}={}){
 if(!Array.isArray(checks)||checks.length>100||typeof runId!=='string'||!/^[A-Za-z0-9_-]{1,40}$/.test(runId))throw Error('Invalid checks');
 const academy=createVerifiedAcademy();
 for(let i=0;i<checks.length;i++){
  const c=checks[i];
  if(!c||!/^RX-[0-9]{6}$/.test(c.antId)||typeof c.passed!=='boolean')throw Error('Invalid check');
  academy.record({receiptId:'RXPROOF-'+runId+'-'+String(i).padStart(6,'0'),antId:c.antId,kind:'test',passed:c.passed,source:'trusted_ci'});
 }
 return {schema:1,kind:'rx-ant-academy-ci',runId,rankings:academy.leaderboard(),receipts:academy.receiptCount(),note:'Only supplied CI checks; no inferred performance or autonomous training.'};
}
module.exports={rankChecks};
