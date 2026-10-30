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
async function start({port=Number(process.env.PORT||8787),host=process.env.HOST||'127.0.0.1'}={}) {
  if(!Number.isInteger(port)||port<0||port>65535) throw Error('Invalid port');
  const supabaseUrl=process.env.SUPABASE_URL||'';
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl)) throw Error('RX CLOUD requires an explicit SUPABASE_URL; refusing to start without staging configuration');
  const {default:worker} = await import(pathToFileURL(path.join(__dirname,'worker.js')).href);
  const env = {ASSETS:{fetch:staticFetch},SUPABASE_URL:supabaseUrl,SUPABASE_ANON_KEY:process.env.SUPABASE_ANON_KEY||'',RX_ADMIN_USER_ID:process.env.RX_ADMIN_USER_ID||'',RX_GITHUB_DISPATCH_TOKEN:process.env.RX_GITHUB_DISPATCH_TOKEN||'',VIEW_COUNT_ENABLED:process.env.VIEW_COUNT_ENABLED||'false',VIEW_COUNT_SECRET:process.env.VIEW_COUNT_SECRET||'',SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY||'',RX_AI_ENABLED:'false'};
  const startedAt=Date.now();
  let activeRequests=0,peakActiveRequests=0,completedRequests=0;
  const server=http.createServer(async(req,res)=>{
    activeRequests++;
    peakActiveRequests=Math.max(peakActiveRequests,activeRequests);
    try {
      const origin='http://localhost';
      const url=new URL(req.url||'/',origin);
      if(url.pathname==='/__rxcloud/health') {if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD','Cache-Control':'no-store'});res.end();return;}res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?'':JSON.stringify({ok:true,service:'rx-cloud-2',runtime:'node',uptimeSeconds:Math.floor((Date.now()-startedAt)/1000),memory:{rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed,heapTotalBytes:process.memoryUsage().heapTotal},connectionsLimit:server.maxConnections,load:{activeRequests,peakActiveRequests,completedRequests}}));return;}
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
            const data=JSON.parse(await fs.readFile(path.join(dir,name),'utf8'));
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
              verified.push({incidentId:item.incidentId.slice(0,120),resolution:item.resolution.slice(0,500),testReference:item.testReference,verifiedResolution:true});
            }catch{}
          }
        }catch(e){if(e.code!=='ENOENT')throw e;}
        const feed={kind:'rx-queen-verified-learning',lessons,verified,source:latestRunId===null?'NO_REPORT':'RX_BIBI_INBOX',...(latestRunId===null?{}:{runId:latestRunId})};
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
      const response=await worker.fetch(request,env);
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
module.exports={start,staticFetch};
