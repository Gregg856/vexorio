'use strict';
const REPO='Gregg856/vexorio';
async function getVerifiedRun(runId,{fetchImpl=globalThis.fetch}={}){
 if(!/^\d{8,20}$/.test(String(runId)))return {ok:false,reason:'nieprawidłowy numer'};
 try{
  const response=await fetchImpl('https://api.github.com/repos/'+REPO+'/actions/runs/'+runId,{headers:{Accept:'application/vnd.github+json','User-Agent':'RX-BIBI-local-evidence'},signal:AbortSignal.timeout(7000)});
  if(!response.ok)return {ok:false,reason:'GitHub API HTTP '+response.status};
  const data=await response.json();
  if(String(data.id)!==String(runId)||data.repository?.full_name!==REPO)return {ok:false,reason:'niezgodne repozytorium lub numer'};
  if(!['completed','queued','in_progress','waiting','requested','pending'].includes(data.status))return {ok:false,reason:'nieznany status'};
  const url='https://github.com/'+REPO+'/actions/runs/'+runId;
  return {ok:true,runId:String(runId),status:data.status,conclusion:data.conclusion||'brak (test trwa)',headSha:typeof data.head_sha==='string'?data.head_sha.slice(0,12):'nieznany',url};
 }catch{return {ok:false,reason:'GitHub API niedostępne'};}
}
module.exports={getVerifiedRun};
