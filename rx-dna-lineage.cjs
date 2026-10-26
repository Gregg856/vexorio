'use strict';
// RX DIGITAL DNA: immutable lineage records, bounded memory, no autonomous deployment.
function createDNALineage({maxVersions=1000,maxDepth=100}={}){
 if(!Number.isSafeInteger(maxVersions)||maxVersions<1||maxVersions>100000||!Number.isSafeInteger(maxDepth)||maxDepth<1||maxDepth>1000)throw Error('Invalid limits');
 const versions=new Map();
 const validId=x=>typeof x==='string'&&/^RXDNA-[A-Za-z0-9_-]{1,64}$/.test(x);
 function register({id,parentId=null,approved=false,testsPassed=false,notes=''}) {
  if(!validId(id)||(parentId!==null&&!validId(parentId))||typeof approved!=='boolean'||typeof testsPassed!=='boolean'||typeof notes!=='string'||notes.length>500)throw Error('Invalid DNA');
  if(versions.has(id))throw Error('DNA already exists');
  if(versions.size>=maxVersions)throw Error('DNA capacity');
  let depth=0;
  if(parentId!==null){
   const parent=versions.get(parentId);
   if(!parent)throw Error('Parent not found');
   if(!parent.approved||!parent.testsPassed)throw Error('Parent not verified');
   depth=parent.depth+1;
  }
  if(depth>maxDepth)throw Error('DNA depth limit');
  if(approved&&!testsPassed)throw Error('Approval requires passing tests');
  const v=Object.freeze({id,parentId,approved,testsPassed,notes,depth});
  versions.set(id,v);return {...v};
 }
 function lineage(id){
  if(!versions.has(id))return [];
  const chain=[];let cursor=versions.get(id);
  while(cursor){chain.push({...cursor});cursor=cursor.parentId?versions.get(cursor.parentId):null;}
  return chain.reverse();
 }
 function snapshot(){return {schema:1,versions:[...versions.values()].map(v=>({...v}))};}
 function get(id){const v=versions.get(id);return v?{...v}:null;}
 return Object.freeze({register,lineage,get,snapshot,count:()=>versions.size});
}
function restoreDNALineage(snapshot,limits={}){
 if(!snapshot||snapshot.schema!==1||!Array.isArray(snapshot.versions)||snapshot.versions.length>100000)throw Error('Invalid DNA snapshot');
 const store=createDNALineage(limits);
 for(const v of snapshot.versions){
  if(!v||Object.keys(v).sort().join(',')!=='approved,depth,id,notes,parentId,testsPassed')throw Error('Invalid DNA record');
  const restored=store.register({id:v.id,parentId:v.parentId,approved:v.approved,testsPassed:v.testsPassed,notes:v.notes});
  if(restored.depth!==v.depth)throw Error('Invalid DNA depth');
 }
 return store;
}
module.exports={createDNALineage,restoreDNALineage};
