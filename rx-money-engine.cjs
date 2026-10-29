'use strict';
// RX MONEY ENGINE 1.0: local, deterministic task queue and ledger. No payments/network.
const ROLES=Object.freeze(['SCOUT','SALES','TESTER','REPORT','TREASURER','BUILDER']);
const STATUSES=Object.freeze(['queued','in_progress','review','approved','blocked','done']);
const ALLOCATION=Object.freeze({development:70,reserve:30});
const CHANNELS=Object.freeze(['rx_subscription','ant_service']);
function money(cents){if(!Number.isSafeInteger(cents)||cents<0)throw Error('Invalid cents');return cents}
function createMoneyEngine(){
 const tasks=new Map(),events=[],offers=[];let nextId=1;
 function addTask({role,title,description='',requiresApproval=true}){
  if(!ROLES.includes(role)||typeof title!=='string'||title.length<3||title.length>120||typeof description!=='string'||description.length>2000)throw Error('Invalid task');
  const id='RXM-'+String(nextId++).padStart(6,'0');
  const task={id,role,title,description,requiresApproval:true,status:'queued',history:[{status:'queued',at:new Date().toISOString()}]};
  tasks.set(id,task);return structuredClone(task);
 }
 function transition(id,to,{approvedBy=null}={}){
  const task=tasks.get(id);if(!task||!STATUSES.includes(to))throw Error('Invalid transition');
  const allowed={queued:['in_progress','blocked'],in_progress:['review','blocked'],review:['approved','blocked'],approved:['done','blocked'],blocked:['queued'],done:[]};
  if(!allowed[task.status].includes(to))throw Error('Transition not allowed');
  if(to==='approved'&&(typeof approvedBy!=='string'||!approvedBy.trim()))throw Error('Human approval required');
  task.status=to;task.history.push({status:to,at:new Date().toISOString(),...(to==='approved'?{approvedBy}: {})});return structuredClone(task);
 }
 function record({kind,amountCents,reference,approvedBy}){
  if(!['income','expense'].includes(kind)||typeof reference!=='string'||!reference.trim()||reference.length>200)throw Error('Invalid ledger entry');
  money(amountCents);
  if(typeof approvedBy!=='string'||!approvedBy.trim())throw Error('Human approval required');
  const entry=Object.freeze({id:'RXE-'+String(events.length+1).padStart(6,'0'),kind,amountCents,reference,approvedBy,at:new Date().toISOString()});
  events.push(entry);return {...entry};
 }
 function proposeOffer({channel,title,priceCents,role='SALES'}){
  if(!CHANNELS.includes(channel)||typeof title!=='string'||title.trim().length<3||title.length>120||!ROLES.includes(role))throw Error('Invalid offer');
  money(priceCents);
  if(priceCents===0||priceCents>100000000)throw Error('Invalid offer price');
  const offer=Object.freeze({id:'RXO-'+String(offers.length+1).padStart(6,'0'),channel,title,priceCents,status:'proposal',requiresApproval:true,paymentEnabled:false});
  offers.push(offer);
  const task=addTask({role,title:'Review offer: '+title.slice(0,100),description:channel+' / '+priceCents+' cents',requiresApproval:true});
  return {offer:{...offer},reviewTaskId:task.id};
 }
 function summary(){
  const income=events.filter(e=>e.kind==='income').reduce((n,e)=>n+e.amountCents,0);
  const expense=events.filter(e=>e.kind==='expense').reduce((n,e)=>n+e.amountCents,0);
  const available=Math.max(0,income-expense);
  const development=Math.floor(available*70/100);
  return {incomeCents:income,expenseCents:expense,availableCents:available,developmentCents:development,reserveCents:available-development,allocation:ALLOCATION};
 }
 return Object.freeze({addTask,transition,record,proposeOffer,summary,offers:()=>offers.map(e=>({...e})),tasks:()=>[...tasks.values()].map(structuredClone),ledger:()=>events.map(e=>({...e}))});
}
module.exports={createMoneyEngine,ROLES,ALLOCATION,CHANNELS};
