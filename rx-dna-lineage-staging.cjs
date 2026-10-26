'use strict';
// STAGING ONLY. Requires an actual logged-in admin JWT and publishable key.
// No service-role credentials, no browser auto-run, no production writes.
const {createCloudLineage}=require('./rx-dna-cloud-memory.cjs');
function createStagingLineage({baseUrl,publicKey,fetchImpl=fetch}={}){
 const url=new URL(baseUrl);
 if(url.protocol!=='https:'||url.hostname!=='owkjdlpawczrnwyszduj.supabase.co'||url.pathname!=='/'||!publicKey||typeof fetchImpl!=='function')throw Error('Invalid staging config');
 async function rpc(session,name,params){
  if(typeof session?.token!=='string'||session.token.length<21)throw Error('Missing admin session');
  const response=await fetchImpl(new URL('/rest/v1/rpc/'+name,url),{method:'POST',headers:{apikey:publicKey,Authorization:'Bearer '+session.token,'Content-Type':'application/json'},body:JSON.stringify(params),signal:AbortSignal.timeout(8000)});
  if(!response.ok){if([401,403].includes(response.status))throw Error('RX DNA access denied');throw Error('RX DNA staging RPC HTTP '+response.status);}
  return response.json();
 }
 return createCloudLineage({
  authorize:async s=>typeof s?.token==='string'&&s.token.length>=21, // Database independently verifies admin identity.
  read:(key,s)=>rpc(s,'rx_dna_lineage_staging_read',{p_key:key}),
  compareAndSwap:(key,snapshot,expected,s)=>rpc(s,'rx_dna_lineage_staging_write',{p_key:key,p_snapshot:snapshot,p_expected_revision:expected})
 });
}
module.exports={createStagingLineage};
