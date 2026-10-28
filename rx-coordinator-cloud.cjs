'use strict';
// Explicitly approved RX Coordinator -> existing allowlisted GitHub Actions/local Node checks.
// No arbitrary shell, production writes, or remote command execution.
const {coordinateRX}=require('./rx-coordinator.cjs');
const {runCloudComputer,CHECKS}=require('./rx-mega-cloud-computer.cjs');
function runCoordinatedChecks(command,{approved=false,execute=false,maxChecks=3}={}){
 if(typeof approved!=='boolean'||typeof execute!=='boolean'||!Number.isSafeInteger(maxChecks)||maxChecks<0||maxChecks>3)throw Error('Invalid execution controls');
 const plan=coordinateRX(command);
 const selected=[...new Set(plan.ants.map(ant=>ant.task).filter(target=>CHECKS.includes(target)))].slice(0,maxChecks);
 const allowed=approved&&execute;
 const report=runCloudComputer({execute:allowed,selectedChecks:selected,maxChecks});
 return {schema:1,kind:'rx-coordinator-cloud-report',request:plan.command.request,antDNA:plan.ants.map(a=>a.dna),selectedChecks:selected,approvalRequired:true,approved,executed:report.executed,passed:report.passed,failed:report.failed,checks:report.checks,executionEnvironment:report.executionEnvironment,productionModified:false,cloudServerProvisioned:false};
}
module.exports={runCoordinatedChecks};
if(require.main===module){
 const command=process.argv[2]||'Sprawdź testy w chmurze i model AI';
 const approved=process.env.RX_CHECKS_APPROVED==='true';
 const report=runCoordinatedChecks(command,{approved,execute:approved});
 console.log(JSON.stringify(report,null,2));
 if(report.failed)process.exitCode=1;
}
