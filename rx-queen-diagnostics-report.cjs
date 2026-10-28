'use strict';
const {queenDiagnosticsPlan}=require('./rx-queen-diagnostics-plan.cjs');
const {runCloudComputer}=require('./rx-mega-cloud-computer.cjs');
function queenDiagnosticsReport({approved=false,execute=false,maxChecks=3}={}){
 if(typeof approved!=='boolean'||typeof execute!=='boolean')throw Error('Invalid approval controls');
 const plan=queenDiagnosticsPlan({maxChecks});
 const report=runCloudComputer({execute:approved&&execute,selectedChecks:plan.checks.map(x=>x.file),maxChecks});
 const failures=report.checks.filter(x=>x.status==='failed').map(x=>({file:x.file,action:'review_test_failure',requiresApproval:true}));
 return {schema:1,kind:'rx-queen-diagnostics-report',approvalRequired:true,approved,executed:report.executed,passed:report.passed,failed:report.failed,checks:report.checks,queen:{status:failures.length?'review_required':report.executed?'tests_completed':'awaiting_approval',failures},productionModified:false,codeModified:false};
}
module.exports={queenDiagnosticsReport};
