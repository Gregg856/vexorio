'use strict';
// HTTP transport for RX DNA staging. Requires user JWT; no service-role secret.
function createRXStagingRequest({fetchImpl=fetch,timeoutMs=8000}={}){
 return async function request({baseUrl,publicKey,token,procedure,params}){
  const url=new URL(baseUrl);
  if(url.protocol!=='https:'||!/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)||url.pathname!=='/'||url.search||url.hash)throw Error('Invalid Supabase URL');
  if(!['rx_dna_staging_read','rx_dna_staging_write'].includes(procedure))throw Error('Invalid RPC');
  if(typeof publicKey!=='string'||!publicKey||typeof token!=='string'||!/^[A-Za-z0-9._~-]{21,8192}$/.test(token))throw Error('Missing session');
  const response=await fetchImpl(new URL('/rest/v1/rpc/'+procedure,url),{
   method:'POST',
   headers:{apikey:publicKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify(params),
   signal:AbortSignal.timeout(timeoutMs)
  });
  if(!response.ok){
   if(response.status===401||response.status===403)throw Error('RX Queen access denied');
   if(response.status===409)return Promise.reject(Error('RX memory conflict'));
   throw Error('RX staging request failed: HTTP '+response.status);
  }
  return response.json();
 };
}
module.exports={createRXStagingRequest};
