'use strict';
// RX ANT ACADEMY: deterministic non-monetary rankings; no autonomous behavior.
function createAntAcademy({maxAnts=1000}={}){
 if(!Number.isSafeInteger(maxAnts)||maxAnts<1||maxAnts>100000)throw Error('Invalid capacity');
 const ants=new Map();
 const ranks=['Robotnica','Specjalistka','Inzynier RX','Mistrzyni RX','Legenda RX'];
 function award({antId,passedTests=0,verifiedImprovements=0,successfulTasks=0}){
  if(typeof antId!=='string'||!/^RX-[0-9]{6}$/.test(antId)||[passedTests,verifiedImprovements,successfulTasks].some(n=>!Number.isSafeInteger(n)||n<0||n>100000))throw Error('Invalid award data');
  if(!ants.has(antId)&&ants.size>=maxAnts)throw Error('Academy full');
  // Input metrics must be supplied by a trusted verifier in future integration.
  const points=passedTests*2+verifiedImprovements*10+successfulTasks;
  const level=points>=250&&verifiedImprovements>=10?4:points>=100&&verifiedImprovements>=4?3:points>=40&&verifiedImprovements>=1?2:points>=10?1:0;
  const record={antId,points,level:level+1,rank:ranks[level],priority:level+1,metrics:{passedTests,verifiedImprovements,successfulTasks},commercialEligible:false,earnings:0};
  ants.set(antId,record);return structuredClone(record);
 }
 function leaderboard(){return [...ants.values()].sort((a,b)=>b.points-a.points||a.antId.localeCompare(b.antId)).map(a=>structuredClone(a))}
 return Object.freeze({award,leaderboard});
}
module.exports={createAntAcademy};
