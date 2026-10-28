'use strict';
const {CHECKS}=require('./rx-mega-cloud-computer.cjs');
function queenDiagnosticsPlan({maxChecks=3}={}){
 if(!Number.isSafeInteger(maxChecks)||maxChecks<0||maxChecks>3)throw Error('Invalid diagnostics budget');
 return {schema:1,kind:'rx-queen-diagnostics-plan',checks:CHECKS.slice(0,maxChecks).map(file=>({file,status:'awaiting_execution'})),approvalRequired:true,executed:0,productionModified:false};
}
module.exports={queenDiagnosticsPlan};
