'use strict';
// RX ANT HIBERNATION 1.0: logical compute budgets, no energy creation or paid resources.
function createAntHibernation({dailyCredits=100,maxActive=3}={}){
 if(!Number.isSafeInteger(dailyCredits)||dailyCredits<0||dailyCredits>1000000||!Number.isSafeInteger(maxActive)||maxActive<1||maxActive>100)throw Error('Invalid budget');
 let credits=dailyCredits;const active=new Set(),history=[];
 function wake(id,cost=1){
  if(typeof id!=='string'||!/^RX-[0-9]{6}$/.test(id)||!Number.isSafeInteger(cost)||cost<1||cost>dailyCredits)throw Error('Invalid wake request');
  if(active.has(id))return {status:'active',credits};
  if(active.size>=maxActive||credits<cost)return {status:'sleeping',credits};
  credits-=cost;active.add(id);history.push({id,cost,action:'wake'});return {status:'active',credits};
 }
 function sleep(id){const existed=active.delete(id);if(existed)history.push({id,action:'sleep'});return existed}
 function status(){return {credits,active:[...active],events:history.length,dailyCredits,maxActive}}
 return Object.freeze({wake,sleep,status});
}
module.exports={createAntHibernation};
