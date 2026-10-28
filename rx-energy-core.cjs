'use strict';
// RX ENERGY CORE: earned scheduling credits, never physical electricity.
const MAX=10000;
function createEnergyCore({capacity=1000,initial=0}={}){
 if(!Number.isSafeInteger(capacity)||capacity<1||capacity>MAX||!Number.isSafeInteger(initial)||initial<0||initial>capacity)throw Error('Invalid energy configuration');
 let balance=initial,earned=0,spent=0;const seen=new Set();
 function earn({taskId,verified,passed,credit=10}){
  if(typeof taskId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(taskId)||typeof verified!=='boolean'||typeof passed!=='boolean'||!Number.isSafeInteger(credit)||credit<1||credit>100)throw Error('Invalid ant result');
  if(seen.has(taskId))return {accepted:false,reason:'duplicate',...status()};
  seen.add(taskId);
  if(!verified||!passed)return {accepted:false,reason:'not_verified_success',...status()};
  const awarded=Math.min(credit,capacity-balance);balance+=awarded;earned+=awarded;
  return {accepted:true,awarded,...status()};
 }
 function reserve({taskId,cost,approved=false}){
  if(typeof taskId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(taskId)||!Number.isSafeInteger(cost)||cost<1||cost>capacity||typeof approved!=='boolean')throw Error('Invalid reservation');
  if(!approved)return {accepted:false,reason:'approval_required',...status()};
  if(cost>balance)return {accepted:false,reason:'insufficient_credits',...status()};
  balance-=cost;spent+=cost;return {accepted:true,taskId,cost,...status()};
 }
 function status(){return {schema:1,kind:'rx-energy-core',capacity,balance,earned,spent,levelPercent:Math.round(100*balance/capacity),physicalEnergyProduced:false,realComputeResourcesAllocated:false,autoExecuted:0};}
 return Object.freeze({earn,reserve,status});
}
module.exports={createEnergyCore};
