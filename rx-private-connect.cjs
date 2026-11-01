'use strict';
// RX PRIVATE CONNECT: read-only, browser/Node 22 compatible HTTPS reachability probe.
// This is NOT a VPN and does not expose private RX Brain or admin endpoints.
const DEFAULT_URL='https://vexorio.grzegorzbub1985.workers.dev/';
async function checkRxPublicConnection({url=DEFAULT_URL,fetchImpl=fetch,timeoutMs=5000}={}){
 let target;
 try{
  target=new URL(url);
  if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||target.pathname!=='/'||target.hostname!=='vexorio.grzegorzbub1985.workers.dev')throw Error('host');
 }catch{return {ok:false,status:'INVALID_TARGET'};}
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),Math.max(100,Math.min(10000,timeoutMs)));
 try{
  const response=await fetchImpl(target.toString(),{method:'GET',redirect:'error',signal:controller.signal,cache:'no-store'});
  return {ok:response.ok,status:response.ok?'PUBLIC_HTTPS_OK':'HTTP_ERROR',httpStatus:response.status};
 }catch{return {ok:false,status:'UNREACHABLE'};}
 finally{clearTimeout(timer);}
}
module.exports={checkRxPublicConnection,DEFAULT_URL};
