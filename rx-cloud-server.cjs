'use strict';
// RX CLOUD 2.0 — self-hosted Node.js adapter for the EXISTING VEXORIO Worker.
// This is a real HTTP server, not cloud provisioning. Requires Node.js >=22.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {timingSafeEqual} = require('node:crypto');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, 'public');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json'};
async function staticFetch(request) {
  const url = new URL(request.url);
  let name;
  try { name = decodeURIComponent(url.pathname); } catch { return new Response('Bad request',{status:400}); }
  if(name.includes('\\') || name.includes('\\0') || name.split('/').includes('..')) return new Response('Forbidden',{status:403});
  if(name.includes('\0')) return new Response('Bad request',{status:400});
  const segments=name.split('/').filter(Boolean);
  if(segments.some(part=>part.startsWith('.') || /(?:secret|credential|private|backup|token|password|\.env)/i.test(part))) return new Response('Forbidden',{status:403});
  const allowed=new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.ico','.json','.txt','.webmanifest']);
  if(name!=='/' && !name.endsWith('/') && !allowed.has(path.posix.extname(name).toLowerCase())) return new Response('Forbidden',{status:403});
  if(name==='/' || name.endsWith('/')) name += 'index.html';
  const full = path.resolve(root, '.' + name);
  if(!full.startsWith(root + path.sep)) return new Response('Forbidden',{status:403});
  try {
    const stat = await fs.lstat(full);
    if(stat.isSymbolicLink()) return new Response('Forbidden',{status:403});
    const realRoot = await fs.realpath(root);
    const realFull = await fs.realpath(full);
    if(!realFull.startsWith(realRoot + path.sep)) return new Response('Forbidden',{status:403});
    if(!stat.isFile()) return new Response('Not found',{status:404});
    const data = await fs.readFile(full);
    const headers = {'Content-Type':types[path.extname(full).toLowerCase()] || 'application/octet-stream','X-Content-Type-Options':'nosniff'};
    if(request.method==='HEAD') return new Response(null,{status:200,headers});
    return new Response(data,{status:200,headers});
  } catch(e) { if(e.code==='ENOENT'||e.code==='ENOTDIR') return new Response('Not found',{status:404}); throw e; }
}
function createLocalModelService(port){
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid RX_BIBI_MODEL_PORT');
 return {fetch:async(_url,options={})=>fetch('http://127.0.0.1:'+port+'/infer',{
  method:'POST',headers:{'Content-Type':'application/json'},body:options.body,
  signal:options.signal||AbortSignal.timeout(8000)
 })};
}
async function start({port=Number(process.env.PORT||8787),host=process.env.HOST||'127.0.0.1'}={}) {
  if(!Number.isInteger(port)||port<0||port>65535) throw Error('Invalid port');
  const supabaseUrl=process.env.SUPABASE_URL||'';
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl)) throw Error('RX CLOUD requires an explicit SUPABASE_URL; refusing to start without staging configuration');
  const {default:worker} = await import(pathToFileURL(path.join(__dirname,'worker.js')).href);
  const env = {ASSETS:{fetch:staticFetch},SUPABASE_URL:supabaseUrl,SUPABASE_ANON_KEY:process.env.SUPABASE_ANON_KEY||'',RX_ADMIN_USER_ID:process.env.RX_ADMIN_USER_ID||'',RX_GITHUB_DISPATCH_TOKEN:process.env.RX_GITHUB_DISPATCH_TOKEN||'',VIEW_COUNT_ENABLED:process.env.VIEW_COUNT_ENABLED||'false',VIEW_COUNT_SECRET:process.env.VIEW_COUNT_SECRET||'',SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY||'',RX_AI_ENABLED:'false',RX_QUEEN_LOCAL_TOKEN:process.env.RX_QUEEN_LOCAL_TOKEN||'',RX_CLOUD_BRAIN_MEMORY_URL:process.env.RX_CLOUD_BRAIN_MEMORY_URL||''};
  // Optional self-hosted inference on loopback only. No external host or secrets.
  // Disabled unless explicitly opted in; never exposed as a public proxy.
  const modelEnabled=process.env.RX_BIBI_MODEL_ENABLED==='true';
  if(modelEnabled){
    const modelPort=Number(process.env.RX_BIBI_MODEL_PORT||'');
    env.RX_BIBI_MODEL_SERVICE=createLocalModelService(modelPort);
    env.RX_BIBI_MODEL_ENABLED='true';
  }
  const startedAt=Date.now();
  let activeRequests=0,peakActiveRequests=0,completedRequests=0;
  const server=http.createServer(async(req,res)=>{
    activeRequests++;
    peakActiveRequests=Math.max(peakActiveRequests,activeRequests);
    try {
      const origin='http://localhost';
      const url=new URL(req.url||'/',origin);
      if(url.pathname==='/__rxcloud/health') {if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD','Cache-Control':'no-store'});res.end();return;}res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?'':JSON.stringify({ok:true,service:'rx-cloud-2',runtime:'node',uptimeSeconds:Math.floor((Date.now()-startedAt)/1000),memory:{rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed,heapTotalBytes:process.memoryUsage().heapTotal},connectionsLimit:server.maxConnections,load:{activeRequests,peakActiveRequests,completedRequests}}));return;}
      // Read-only local capability snapshot. Does not assert an LLM is running.
      if(url.pathname==='/__rxcloud/model/capabilities'){
        if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD','Cache-Control':'no-store'});res.end();return;}
        const available=env.RX_BIBI_MODEL_ENABLED==='true'&&typeof env.RX_BIBI_MODEL_SERVICE?.fetch==='function';
        res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
        res.end(req.method==='HEAD'?'':JSON.stringify({ok:true,modelConfigured:available,modelVerified:false,mode:'configuration-only',service:'rx-cloud-2'}));
        return;
      }
      if(url.pathname==='/__rxcloud/queen/status') {
        res.setHeader('Cache-Control','no-store');
        res.setHeader('X-Content-Type-Options','nosniff');
        if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});res.end();return;}
        const secret=process.env.RX_QUEEN_LOCAL_TOKEN||'';
        const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');
        const valid=secret.length>=32 && supplied.length===secret.length &&
          timingSafeEqual(Buffer.from(supplied),Buffer.from(secret));
        if(!valid){res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:'Unauthorized'}));return;}
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true,service:'rx-cloud-2',queenBridge:'connected',mode:'read-only',taskExecution:false,productionChanges:false}));
        return;
      }
      // Private, read-only training preview for the existing Queen panel.
      if(url.pathname==='/__rxcloud/bibi/training-preview'){
        res.setHeader('Cache-Control','no-store');
        res.setHeader('Content-Type','application/json');
        res.setHeader('X-Content-Type-Options','nosniff');
        const secret=process.env.RX_QUEEN_LOCAL_TOKEN||'';
        const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');
        const valid=secret.length>=32&&supplied.length===secret.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(secret));
        if(!valid){res.writeHead(401);res.end(JSON.stringify({ok:false,error:'Unauthorized'}));return;}
        if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});res.end(JSON.stringify({ok:false,error:'Method not allowed'}));return;}
        if(!process.env.RX_BIBI_TRAINING_FILE||!process.env.RX_BIBI_HISTORY_FILE||!process.env.RX_BIBI_HOLDOUT_FILE){
          res.writeHead(503);res.end(JSON.stringify({ok:false,error:'Training preview not configured'}));return;
        }
        try{
          const casesData=JSON.parse(await fs.readFile(process.env.RX_BIBI_HOLDOUT_FILE,'utf8'));
          const cases=Array.isArray(casesData)?casesData:casesData.cases;
          const {preview}=require('./rx-bibi-supervised-cycle.cjs');
          const result=await preview(process.env.RX_BIBI_TRAINING_FILE,process.env.RX_BIBI_HISTORY_FILE,cases);
          // Expose aggregate counts only: no training samples or private prompts.
          res.writeHead(200);res.end(JSON.stringify({ok:true,mode:'read-only',total:result.report.total,correct:result.report.correct,incorrect:result.report.total-result.report.correct,pending:result.pending.length,accuracy:result.report.accuracy}));return;
        }catch(error){
          res.writeHead(503);res.end(JSON.stringify({ok:false,error:'Training preview unavailable'}));return;
        }
      }
      // Private RX learning history: same bearer authentication as Queen bridge.
      if(url.pathname==='/__rxcloud/bibi/learning-history'){
        const secret=process.env.RX_QUEEN_LOCAL_TOKEN||'';
        const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');
        const valid=secret.length>=32&&supplied.length===secret.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(secret));
        res.setHeader('Cache-Control','no-store');
        res.setHeader('Content-Type','application/json');
        res.setHeader('X-Content-Type-Options','nosniff');
        if(!valid){res.writeHead(401);res.end(JSON.stringify({ok:false,error:'Unauthorized'}));return;}
        if(!['GET','PUT'].includes(req.method)){res.writeHead(405,{'Allow':'GET, PUT'});res.end(JSON.stringify({ok:false,error:'Method not allowed'}));return;}
        const store=require('./rx-learning-cloud-store.cjs');
        try{
          if(req.method==='GET'){res.writeHead(200);res.end(JSON.stringify(await store.read()));return;}
          const chunks=[];let size=0;
          for await(const chunk of req){size+=chunk.length;if(size>32768){res.writeHead(413);res.end(JSON.stringify({ok:false,error:'Payload too large'}));return;}chunks.push(chunk);}
          const result=await store.write(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          res.writeHead(200);res.end(JSON.stringify({ok:true,...result}));return;
        }catch(e){
          const bad=e instanceof SyntaxError||/^Invalid/.test(e.message);
          res.writeHead(bad?400:500);res.end(JSON.stringify({ok:false,error:bad?'Invalid learning metrics':'Storage unavailable'}));return;
        }
      }
      // Explicit, authenticated GitHub Actions evidence sync; never trusts client-supplied status.
      if(url.pathname==='/__rxcloud/neuron/sync-run'){
        const secret=process.env.RX_QUEEN_LOCAL_TOKEN||'';
        const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');
        const valid=secret.length>=32&&supplied.length===secret.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(secret));
        res.setHeader('Cache-Control','no-store');
        res.setHeader('Content-Type','application/json');
        if(!valid){res.writeHead(401);res.end(JSON.stringify({ok:false,error:'Unauthorized'}));return;}
        if(req.method!=='POST'){res.writeHead(405,{'Allow':'POST'});res.end(JSON.stringify({ok:false,error:'Method not allowed'}));return;}
        const runId=url.searchParams.get('runId')||'';
        if(!/^[0-9]{1,20}$/.test(runId)){res.writeHead(400);res.end(JSON.stringify({ok:false,error:'Invalid runId'}));return;}
        try{
          const headers={'Accept':'application/vnd.github+json','User-Agent':'RX-NEURON-evidence-sync','X-GitHub-Api-Version':'2022-11-28'};
          if(process.env.RX_GITHUB_TOKEN)headers.Authorization='Bearer '+process.env.RX_GITHUB_TOKEN;
          const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/runs/'+runId,{headers,signal:AbortSignal.timeout(7000)});
          if(!response.ok){res.writeHead(502);res.end(JSON.stringify({ok:false,error:'GitHub verification unavailable'}));return;}
          const data=await response.json();
          if(String(data.id)!==runId||data.repository?.full_name!=='Gregg856/vexorio'||data.status!=='completed'||data.conclusion!=='success'){
            res.writeHead(409);res.end(JSON.stringify({ok:false,error:'Run is not a successful completed VEXORIO run'}));return;
          }
          const evidenceDir=path.resolve(process.env.RX_NEURON_EVIDENCE_DIR||path.join(__dirname,'rx-cloud-private-evidence'));
          await fs.mkdir(evidenceDir,{recursive:true,mode:0o700});
          const record={kind:'rx-github-actions-evidence',runId,repository:'Gregg856/vexorio',status:'completed',conclusion:'success',source:'github-api',headSha:data.head_sha};
          await fs.writeFile(path.join(evidenceDir,'rx-run-'+runId+'.json'),JSON.stringify(record),{flag:'w',mode:0o600});
          res.writeHead(200);res.end(JSON.stringify({ok:true,runId,verified:true}));return;
        }catch{
          res.writeHead(502);res.end(JSON.stringify({ok:false,error:'GitHub verification unavailable'}));return;
        }
      }
      // Private read-only RX Brain snapshot from the existing self-hosted server.
      if(url.pathname==='/__rxcloud/bibi/brain-memory'){
        const secret=process.env.RX_QUEEN_LOCAL_TOKEN||'';
        const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');
        const valid=secret.length>=32&&supplied.length===secret.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(secret));
        res.setHeader('Cache-Control','no-store');
        res.setHeader('Content-Type','application/json');
        res.setHeader('X-Content-Type-Options','nosniff');
        if(!valid){res.writeHead(401);res.end(JSON.stringify({ok:false,error:'Unauthorized'}));return;}
        if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});res.end(JSON.stringify({ok:false,error:'Method not allowed'}));return;}
        const file=path.resolve(process.env.RX_BRAIN_MEMORY_FILE||path.join(__dirname,'rx-cloud-private-inbox','rx-brain-memory.json'));
        try{
          const stat=await fs.lstat(file);
          if(!stat.isFile()||stat.isSymbolicLink()||stat.size>100000)throw Error('Invalid snapshot file');
          const {loadBrain}=require('./rx-brain-store.cjs');
          const brain=await loadBrain(file);
          const snapshot=brain.snapshot();
          res.writeHead(200);
          res.end(JSON.stringify({ok:true,kind:'rx-brain-memory',snapshot}));
        }catch{
          res.writeHead(503);
          res.end(JSON.stringify({ok:false,error:'RX Brain memory unavailable'}));
        }
        return;
      }
      // Private read-only learning feed for the RX Queen coordinator.
      if(url.pathname==='/__rxcloud/bibi/learning'){
        const secret=process.env.RX_QUEEN_LOCAL_TOKEN||'';
        const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');
        const valid=secret.length>=32&&supplied.length===secret.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(secret));
        res.setHeader('Cache-Control','no-store');
        res.setHeader('Content-Type','application/json');
        if(!valid){res.writeHead(401);res.end(JSON.stringify({ok:false,error:'Unauthorized'}));return;}
        if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});res.end(JSON.stringify({ok:false,error:'Method not allowed'}));return;}
        const dir=path.resolve(process.env.RX_BIBI_INBOX_DIR||path.join(__dirname,'rx-cloud-private-inbox'));
        let names=[];
        try{names=(await fs.readdir(dir)).filter(n=>/^rx-bibi-[0-9]{1,30}\.json$/.test(n)).sort((a,b)=>BigInt(b.match(/[0-9]+/)[0])>BigInt(a.match(/[0-9]+/)[0])?1:-1);}catch(e){if(e.code!=='ENOENT')throw e;}
        // RX NEURON: bounded cross-report incident memory, never invent verified fixes.
        const lessons=[];
        const seen=new Set();
        let latestRunId=null;
        for(const name of names.slice(0,10)){
          try{
            const reportFile=path.join(dir,name);
            const reportStat=await fs.lstat(reportFile);
            if(!reportStat.isFile()||reportStat.isSymbolicLink()||reportStat.size>65536)continue;
            const data=JSON.parse(await fs.readFile(reportFile,'utf8'));
            if(data.kind!=='rx-bibi-smart-error-memory'||!Array.isArray(data.developerHandoff))continue;
            if(latestRunId===null)latestRunId=data.runId;
            for(const item of data.developerHandoff.slice(0,10)){
              if(!item||typeof item.problem!=='string'||typeof item.id!=='string')continue;
              const observation=item.problem.trim().slice(0,240);
              const panelArea=String(item.module||'RX').slice(0,90);
              const key=panelArea.toLowerCase()+'|'+observation.toLowerCase();
              if(!observation||seen.has(key))continue;
              seen.add(key);
              lessons.push({incidentId:item.id.slice(0,120),observation,panelArea,verifiedResolution:false});
              if(lessons.length>=30)break;
            }
            if(lessons.length>=30)break;
          }catch{}
        }
        // Verified resolutions live in a separate private, manually curated directory.
        // No incident report or model output may promote itself to a verified fix.
        const verified=[];
        const verifiedDir=path.resolve(process.env.RX_NEURON_VERIFIED_DIR||path.join(__dirname,'rx-cloud-private-verified'));
        try{
          const files=(await fs.readdir(verifiedDir)).filter(n=>/^rx-fix-[a-zA-Z0-9_-]{1,64}\.json$/.test(n)).sort().slice(0,30);
          for(const file of files){
            try{
              const stat=await fs.lstat(path.join(verifiedDir,file));
              if(!stat.isFile()||stat.isSymbolicLink()||stat.size>8192)continue;
              const item=JSON.parse(await fs.readFile(path.join(verifiedDir,file),'utf8'));
              if(item.kind!=='rx-neuron-verified-fix'||item.ownerApproved!==true||item.testResult!=='passed'||typeof item.incidentId!=='string'||typeof item.resolution!=='string'||typeof item.testReference!=='string')continue;
              if(!item.incidentId.trim()||!item.resolution.trim()||!item.testReference.startsWith('https://github.com/Gregg856/vexorio/actions/runs/')||!/^\d+$/.test(item.testReference.slice('https://github.com/Gregg856/vexorio/actions/runs/'.length)))continue;
              // Fail closed: do not trust a self-declared passed test without independent GitHub evidence.
              const runId=item.testReference.slice('https://github.com/Gregg856/vexorio/actions/runs/'.length);
              const evidenceDir=path.resolve(process.env.RX_NEURON_EVIDENCE_DIR||path.join(__dirname,'rx-cloud-private-evidence'));
              let evidence;
              try{
                const evidenceFile=path.join(evidenceDir,'rx-run-'+runId+'.json');
                const stat=await fs.lstat(evidenceFile);
                if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)continue;
                evidence=JSON.parse(await fs.readFile(evidenceFile,'utf8'));
              }catch{continue;}
              if(evidence?.kind!=='rx-github-actions-evidence'||evidence.runId!==runId||evidence.repository!=='Gregg856/vexorio'||evidence.status!=='completed'||evidence.conclusion!=='success'||evidence.source!=='github-api')continue;
              // Tie each resolution to the exact tested commit, not merely any successful workflow.
              if(typeof item.commitSha!=='string'||!(/^[a-f0-9]{40}$/i.test(item.commitSha)))continue;
              if(typeof evidence.headSha!=='string'||evidence.headSha.toLowerCase()!==item.commitSha.toLowerCase())continue;
              verified.push({incidentId:item.incidentId.slice(0,120),resolution:item.resolution.slice(0,500),testReference:item.testReference,commitSha:item.commitSha,verifiedResolution:true});
            }catch{}
          }
        }catch(e){if(e.code!=='ENOENT')throw e;}
        // Deterministic, read-only matching: exact incident ID first, then shared keywords.
        // Never present a suggested match as a newly verified repair.
        // Score only meaningful terms; common filler words must not cause false matches.
        const stop=new Set(['problem','blad','błąd','naprawa','naprawić','test','testy','system','modul','moduł','panel','sprawdzone','sprawdzony','przez','oraz','jest','brak','przy','dla','tego','który','która']);
        const words=s=>new Set((String(s).toLocaleLowerCase('pl').match(/[\p{L}\p{N}]{4,}/gu)||[]).filter(w=>!stop.has(w)));
        const suggestions=[];
        for(const incident of lessons){
          const incidentWords=words(incident.observation+' '+incident.panelArea);
          const candidates=verified.map(fix=>{
            const exact=fix.incidentId===incident.incidentId;
            const fixWords=words(fix.resolution);
            let overlap=0;
            for(const word of incidentWords)if(fixWords.has(word))overlap++;
            const union=new Set([...incidentWords,...fixWords]).size;
            const similarity=union?overlap/union:0;
            return {fix,exact,overlap,similarity};
          }).filter(x=>x.exact||(x.overlap>=2&&x.similarity>=0.25))
            .sort((a,b)=>Number(b.exact)-Number(a.exact)||b.similarity-a.similarity||b.overlap-a.overlap)
            .slice(0,3);
          if(candidates.length)suggestions.push({incidentId:incident.incidentId,matches:candidates.map(x=>({resolution:x.fix.resolution,testReference:x.fix.testReference,commitSha:x.fix.commitSha,matchType:x.exact?'same-incident':'keyword-similarity',similarityScore:x.exact?1:Number(x.similarity.toFixed(3)),verifiedResolution:true,automaticApplication:false}))});
          if(suggestions.length>=20)break;
        }
        const feed={kind:'rx-queen-verified-learning',lessons,verified,suggestions,source:latestRunId===null?'NO_REPORT':'RX_BIBI_INBOX',...(latestRunId===null?{}:{runId:latestRunId})};
        res.writeHead(200);res.end(JSON.stringify(feed));return;
      }
      // Private local RX BIBI report inbox: explicit token, bounded JSON, no public access.
      if(url.pathname==='/__rxcloud/bibi/inbox'){
        const secret=process.env.RX_QUEEN_LOCAL_TOKEN||'';
        const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');
        const valid=secret.length>=32&&supplied.length===secret.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(secret));
        res.setHeader('Cache-Control','no-store');
        res.setHeader('X-Content-Type-Options','nosniff');
        res.setHeader('Content-Type','application/json');
        if(!valid){res.writeHead(401);res.end(JSON.stringify({ok:false,error:'Unauthorized'}));return;}
        if(req.method!=='POST'){res.writeHead(405,{'Allow':'POST'});res.end(JSON.stringify({ok:false,error:'Method not allowed'}));return;}
        const declared=Number(req.headers['content-length']||0);
        if(declared>262144){res.writeHead(413);res.end(JSON.stringify({ok:false,error:'Report too large'}));req.resume();return;}
        const chunks=[];let total=0;
        for await(const chunk of req){total+=chunk.length;if(total>262144){res.writeHead(413);res.end(JSON.stringify({ok:false,error:'Report too large'}));return;}chunks.push(chunk);}
        let payload;
        try{payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{res.writeHead(400);res.end(JSON.stringify({ok:false,error:'Invalid JSON'}));return;}
        if(!payload||payload.kind!=='rx-bibi-smart-error-memory'||!Array.isArray(payload.history)||payload.history.length>150||typeof payload.runId!=='string'||!/^[0-9]{1,30}$/.test(payload.runId)){
          res.writeHead(422);res.end(JSON.stringify({ok:false,error:'Invalid BIBI report'}));return;
        }
        const dir=path.resolve(process.env.RX_BIBI_INBOX_DIR||path.join(__dirname,'rx-cloud-private-inbox'));
        await fs.mkdir(dir,{recursive:true,mode:0o700});
        const file=path.join(dir,'rx-bibi-'+payload.runId+'.json');
        await fs.writeFile(file,JSON.stringify(payload)+'\\n',{flag:'wx',mode:0o600}).catch(e=>{if(e.code!=='EEXIST')throw e;});
        res.writeHead(202);res.end(JSON.stringify({ok:true,stored:true,runId:payload.runId}));
        return;
      }
      const maxBodyBytes=2*1024*1024; // Preserve verified upload bound until tests and upload flow are updated together.
      const declaredLength=req.headers['content-length'];
      if(declaredLength!==undefined && /^\d+$/.test(declaredLength) && Number(declaredLength)>maxBodyBytes){res.writeHead(413,{'Cache-Control':'no-store'});res.end();req.resume();return;}
      const chunks=[];let total=0;
      for await(const chunk of req){total+=chunk.length;if(total>maxBodyBytes){res.writeHead(413);res.end();req.resume();return;}chunks.push(chunk);}
      const headers=new Headers();
      for(const [key,val] of Object.entries(req.headers)) if(val!==undefined) headers.set(key,Array.isArray(val)?val.join(', '):val);
      const method=req.method||'GET';
      const request=new Request(url,{method,headers,body:['GET','HEAD'].includes(method)?undefined:Buffer.concat(chunks)});
      let response=await worker.fetch(request,env);
      // Self-hosted, authenticated RX client shadow mode. Only decorate an already
      // successful worker response; never bypass worker authentication or change answers.
      // Disabled by default and unavailable on the public Worker-only runtime.
      if(process.env.RX_BIBI_INTENT_SHADOW==='true'&&url.pathname==='/api/rx/client/chat'&&method==='POST'&&response.status===200){
        try{
          const original=await response.clone().json();
          const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if(original?.ok===true&&typeof original.answer==='string'&&typeof payload?.message==='string'&&payload.message.trim()&&payload.message.length<=1000){
            const {chatRXWithIntentDiagnostics}=require('./rx-brain-chat-engine.cjs');
            const diagnostics=chatRXWithIntentDiagnostics(payload.message).intentDiagnostics;
            const body=JSON.stringify({...original,intentDiagnostics:diagnostics});
            const outHeaders=new Headers(response.headers);
            outHeaders.delete('Content-Length');
            outHeaders.delete('Content-Encoding');
            outHeaders.delete('ETag');
            outHeaders.set('Content-Type','application/json');
            outHeaders.set('Cache-Control','no-store');
            response=new Response(body,{status:200,headers:outHeaders});
          }
        }catch{
          // Advisory model failures never affect the authenticated original reply.
        }
      }
      // Opt-in writing mode for the EXISTING authenticated RX client chat.
      // Preserve upstream auth: only consider a successful authenticated response.
      // No code execution, message retention or background training.
      if(process.env.RX_BIBI_WRITING_ENABLED==='true'&&url.pathname==='/api/rx/client/chat'&&method==='POST'&&response.status===200){
        try{
          const original=await response.clone().json();
          const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if(original?.ok===true&&typeof original.answer==='string'&&typeof payload?.message==='string'&&payload.message.length<=1000&&/^(?:napisz|ułóż|uloz|przygotuj)\\s+(?:wiadomość|wiadomosc|odpowiedź|odpowiedz|streszczenie)\\s*:/iu.test(payload.message.trim())){
            const {chatRXWithWriting}=require('./rx-brain-chat-engine.cjs');
            const written=chatRXWithWriting(payload.message);
            if(typeof written.answer==='string'&&written.writingMode){
              const body=JSON.stringify({...original,answer:written.answer,writingMode:written.writingMode,writingSource:written.writingSource});
              const outHeaders=new Headers(response.headers);
              outHeaders.delete('Content-Length');outHeaders.delete('Content-Encoding');outHeaders.delete('ETag');
              outHeaders.set('Content-Type','application/json');outHeaders.set('Cache-Control','no-store');
              response=new Response(body,{status:200,headers:outHeaders});
            }
          }
        }catch{
          // Fail open to the original authenticated chat response.
        }
      }
      // Reviewed memory is applied only after the existing worker has authenticated the chat.
      if(process.env.RX_BIBI_APPROVED_MEMORY_ENABLED==='true'&&url.pathname==='/api/rx/client/chat'&&method==='POST'){
        const {applyApprovedMemory}=require('./rx-queen-live-memory-gate.cjs');
        let payload;
        try{payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}
        const memoryFile=process.env.RX_QUEEN_APPROVED_FILE||path.join(__dirname,'rx-cloud-private-inbox','rx-queen-approved-responses.json');
        response=await applyApprovedMemory({response,message:payload?.message,enabled:true,file:memoryFile});
      }
      res.writeHead(response.status,Object.fromEntries(response.headers));
      if(method==='HEAD'||!response.body){res.end();return;}
      for await(const chunk of response.body) res.write(chunk);
      res.end();
    }catch(e){console.error('RX CLOUD request failed:',e?.name||'Error');if(!res.headersSent)res.writeHead(500,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('Internal server error');}
    finally {activeRequests--;completedRequests++;}
  });
  server.headersTimeout=15000;
  server.requestTimeout=30000;
  server.keepAliveTimeout=5000;
  server.maxRequestsPerSocket=100;
  server.maxHeadersCount=100;
  server.maxConnections=128;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  return server;
}
if(require.main===module)start().then(s=>{console.log('RX CLOUD listening on '+JSON.stringify(s.address()));const shutdown=()=>s.close(()=>process.exit(0));process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);}).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={start,staticFetch,createLocalModelService};
