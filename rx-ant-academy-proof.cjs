'use strict';
// RX ANT ACADEMY 2.0: bounded proof receipts and idempotent scoring.
// Receipt issuance is trusted only if caller is a verified CI adapter; no cryptographic attestation yet.
const {createAntAcademy}=require('./rx-ant-academy.cjs');
function createVerifiedAcademy({maxAnts=1000,maxReceipts=10000}={}){
 const academy=createAntAcademy({maxAnts});
 if(!Number.isSafeInteger(maxReceipts)||maxReceipts<1||maxReceipts>100000)throw Error('Invalid receipt capacity');
 const receipts=new Map(),totals=new Map();
 function record({receiptId,antId,kind,passed,source}){
  if(typeof receiptId!=='string'||!/^RXPROOF-[A-Za-z0-9_-]{6,80}$/.test(receiptId)||typeof antId!=='string'||!/^RX-[0-9]{6}$/.test(antId)||!['test','improvement','task'].includes(kind)||typeof passed!=='boolean'||source!=='trusted_ci')throw Error('Invalid proof receipt');
  const old=receipts.get(receiptId);
  if(old){
   if(old.antId!==antId||old.kind!==kind||old.passed!==passed||old.source!==source)throw Error('Receipt collision');
   return {duplicate:true,record:structuredClone(totals.get(antId)||null)};
  }
  if(receipts.size>=maxReceipts)throw Error('Receipt limit');
  const t=totals.get(antId)||{passedTests:0,verifiedImprovements:0,successfulTasks:0};
  const next={...t};
  if(passed){const key={test:'passedTests',improvement:'verifiedImprovements',task:'successfulTasks'}[kind];next[key]++;}
  // Validate academy capacity/metrics before recording receipt.
  const ranking=academy.award({antId,...next});
  totals.set(antId,next);receipts.set(receiptId,{antId,kind,passed,source});
  return {duplicate:false,record:ranking};
 }
 return Object.freeze({record,leaderboard:academy.leaderboard,receiptCount:()=>receipts.size});
}
module.exports={createVerifiedAcademy};
