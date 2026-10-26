'use strict';
// RX GENESIS 1.0: bounded, deterministic inheritance of human-approved improvements.
// This is a simulation of digital selection, not autonomous AI training.
function createGenesis({maxVariants=100,maxGeneration=1000}={}){
 if(!Number.isSafeInteger(maxVariants)||maxVariants<1||maxVariants>10000||!Number.isSafeInteger(maxGeneration)||maxGeneration<1||maxGeneration>100000)throw Error('Invalid limits');
 const variants=new Map();let serial=0;
 function propose({parentId=null,area,description,score,testsPassed=false,securityPassed=false}){
  if(variants.size>=maxVariants)throw Error('Genesis full');
  const parent=parentId===null?null:variants.get(parentId);
  if(parentId!==null&&(!parent||parent.status!=='approved'))throw Error('Parent must be approved');
  const generation=parent?parent.generation+1:0;
  if(generation>maxGeneration)throw Error('Generation limit');
  if(!['memory','tests','performance','scheduler','security'].includes(area)||typeof description!=='string'||description.length<8||description.length>250||!Number.isFinite(score)||score<0||score>100||typeof testsPassed!=='boolean'||typeof securityPassed!=='boolean')throw Error('Invalid variant');
  const id='RXGEN-'+String(++serial).padStart(6,'0');
  const v={id,parentId,generation,area,description,score,testsPassed,securityPassed,status:'proposed',approvedBy:null};
  variants.set(id,v);return structuredClone(v);
 }
 function approve(id,reviewer){
  const v=variants.get(id);
  if(!v||v.status!=='proposed')throw Error('Invalid state');
  if(!v.testsPassed||!v.securityPassed)throw Error('Evidence gate failed');
  if(typeof reviewer!=='string'||!reviewer.trim())throw Error('Human approval required');
  v.status='approved';v.approvedBy=reviewer.trim();return structuredClone(v);
 }
 function best(area){
  const a=[...variants.values()].filter(v=>v.status==='approved'&&(!area||v.area===area)).sort((x,y)=>y.score-x.score||x.generation-y.generation);
  return a.length?structuredClone(a[0]):null;
 }
 return Object.freeze({propose,approve,best,list:()=>[...variants.values()].map(v=>structuredClone(v))});
}
module.exports={createGenesis};
