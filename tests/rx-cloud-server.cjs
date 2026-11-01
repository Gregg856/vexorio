'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const net=require('node:net');
process.env.SUPABASE_URL='https://rxcloud-staging-test.supabase.co';
process.env.SUPABASE_ANON_KEY='rx-cloud-local-test-public-key';
const {start,staticFetch}=require('../rx-cloud-server.cjs');
(async()=>{
 const traversal=await staticFetch(new Request('http://localhost/%2e%2e/%2e%2e/etc/passwd'));
 assert.notEqual(traversal.status,200);
 for(const blocked of ['/config.env','/.git/config','/backup.json','/admin-token.txt','/rx-cloud-server.cjs','/secret-data.json','/nested/.hidden.js']){
   const response=await staticFetch(new Request('http://localhost'+blocked));
   assert.equal(response.status,403,'Static asset must be denied: '+blocked);
 }
 for(const blocked of ['/data%00.json','/nested/%2ehidden.js','/config%5csecret.json','/private-backup.json','/file.pem','/file.key','/module.mjs']){
   const response=await staticFetch(new Request('http://localhost'+blocked));
   assert.notEqual(response.status,200,'Unsafe static asset must not be served: '+blocked);
 }
 const symlink=path.resolve(__dirname,'../public/rxcloud-link-test.txt');
 try{
   await fs.symlink(path.resolve(__dirname,'../rx-cloud-server.cjs'),symlink);
   const linked=await staticFetch(new Request('http://localhost/rxcloud-link-test.txt'));
   assert.equal(linked.status,403,'Public symlink to server source must be denied');
 }finally{await fs.rm(symlink,{force:true});}
 const configured=process.env.SUPABASE_URL;
 delete process.env.SUPABASE_URL;
 await assert.rejects(start({port:0,host:'127.0.0.1'}),/explicit SUPABASE_URL/);
 process.env.SUPABASE_URL=configured;
 process.env.RX_BIBI_MODEL_ENABLED='true';
 process.env.RX_BIBI_MODEL_PORT='0';
 await assert.rejects(start({port:0,host:'127.0.0.1'}),/Invalid RX_BIBI_MODEL_PORT/);
 delete process.env.RX_BIBI_MODEL_ENABLED;
 delete process.env.RX_BIBI_MODEL_PORT;
 process.env.RX_QUEEN_LOCAL_TOKEN='rx-queen-test-token-32-chars-minimum';
 const server=await start({port:0,host:'127.0.0.1'});
 try{
  assert.equal(server.headersTimeout,15000,'Header timeout must be bounded');
  assert.equal(server.requestTimeout,30000,'Request timeout must be bounded');
  assert.equal(server.keepAliveTimeout,5000,'Keep-alive timeout must be bounded');
  assert.equal(server.maxRequestsPerSocket,100,'Requests per socket must be bounded');
  assert.equal(server.maxHeadersCount,100,'Header count must be bounded');
  assert.equal(server.maxConnections,128,'Concurrent connection count must be bounded');
  const {port}=server.address();
  const base='http://127.0.0.1:'+port;
  // Offline-only Queen learning bridge: real loopback HTTP, no public hosting.
  const learningRoute=base+'/__rxcloud/bibi/learning';
  assert.equal((await fetch(learningRoute)).status,401,'Private learning must require a token');
  assert.equal((await fetch(learningRoute,{headers:{Authorization:'Bearer invalid'}})).status,401);
  const learningAuth={Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN};
  assert.equal((await fetch(learningRoute,{method:'POST',headers:learningAuth})).status,405);
  const learningResponse=await fetch(learningRoute,{headers:learningAuth});
  assert.equal(learningResponse.status,200,'Queen learning must respond over local loopback');
  const offlineLearningData=await learningResponse.json();
  assert.equal(offlineLearningData.kind,'rx-queen-verified-learning');
  assert(Array.isArray(offlineLearningData.lessons)&&Array.isArray(offlineLearningData.verified));
  const capability=await fetch(base+'/__rxcloud/model/capabilities');
  assert.equal(capability.status,200);
  assert.equal(capability.headers.get('cache-control'),'no-store');
  assert.deepEqual(await capability.json(),{ok:true,modelConfigured:false,modelVerified:false,mode:'configuration-only',service:'rx-cloud-2'});
  const capabilityHead=await fetch(base+'/__rxcloud/model/capabilities',{method:'HEAD'});
  assert.equal(capabilityHead.status,200);
  assert.equal(await capabilityHead.text(),'');
  const capabilityPost=await fetch(base+'/__rxcloud/model/capabilities',{method:'POST'});
  assert.equal(capabilityPost.status,405);
  const health=await fetch(base+'/__rxcloud/health');
  assert.equal(health.status,200);
  const healthData=await health.json();
  assert.equal(healthData.service,'rx-cloud-2');
  assert.equal(healthData.connectionsLimit,128);
  assert.equal(healthData.load.activeRequests,1,'Health request should count itself');
  assert.equal(healthData.load.peakActiveRequests,1,'First request should establish peak');
  assert.equal(healthData.load.completedRequests,7,'Three capability and four private learning checks must complete before health snapshot');
  for(const key of ['rssBytes','heapUsedBytes','heapTotalBytes']){
    assert(Number.isSafeInteger(healthData.memory[key])&&healthData.memory[key]>0,'Invalid memory metric: '+key);
  }
  assert(healthData.memory.heapUsedBytes<=healthData.memory.heapTotalBytes,'Heap usage cannot exceed heap total');
  assert.equal(health.headers.get('cache-control'),'no-store');
  assert.equal(health.headers.get('x-content-type-options'),'nosniff');
  const healthHead=await fetch(base+'/__rxcloud/health',{method:'HEAD'});
  assert.equal(healthHead.status,200);
  assert.equal(await healthHead.text(),'');
  const healthPost=await fetch(base+'/__rxcloud/health',{method:'POST',body:'test'});
  assert.equal(healthPost.status,405);
  assert.equal(healthPost.headers.get('allow'),'GET, HEAD');
  // RX Brain private feed: live file, authorization, method and malformed snapshot.
  const brainFile=path.join(await fs.mkdtemp(path.join(require('node:os').tmpdir(),'rx-brain-test-')),'brain.json');
  const previousBrainFile=process.env.RX_BRAIN_MEMORY_FILE;
  process.env.RX_BRAIN_MEMORY_FILE=brainFile;
  try{
   const route=base+'/__rxcloud/bibi/brain-memory';
   assert.equal((await fetch(route)).status,401);
   assert.equal((await fetch(route,{headers:{Authorization:'Bearer wrong'}})).status,401);
   const headers={Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN};
   assert.equal((await fetch(route,{method:'POST',headers})).status,405);
   assert.equal((await fetch(route,{headers})).status,503,'Missing memory file must not become empty successful memory');
   const snapshot={schema:1,kind:'rx-brain-memory',trainedModel:false,autoExecuted:0,records:[{key:'android_chat',action:'inspect_logs',successes:2,failures:1,lastEvidence:'Verified test evidence 123'}]};
   await fs.writeFile(brainFile,JSON.stringify(snapshot),{mode:0o600});
   const response=await fetch(route,{headers});
   assert.equal(response.status,200);
   assert.equal(response.headers.get('cache-control'),'no-store');
   const result=await response.json();
   assert.equal(result.kind,'rx-brain-memory');
   assert.equal(result.snapshot.records[0].key,'android_chat');
   assert.equal(result.snapshot.records[0].successes,2);
   await fs.writeFile(brainFile,'not-json');
   assert.equal((await fetch(route,{headers})).status,503,'Corrupted snapshot must fail closed');
  }finally{
   if(previousBrainFile===undefined)delete process.env.RX_BRAIN_MEMORY_FILE;
   else process.env.RX_BRAIN_MEMORY_FILE=previousBrainFile;
   await fs.rm(path.dirname(brainFile),{recursive:true,force:true});
  }

  assert.equal((await fetch(base+'/__rxcloud/queen/status')).status,401);
  // RX CLOUD security regression: local Queen and BIBI inbox require a valid private token.
  for(const endpoint of ['/__rxcloud/queen/status','/__rxcloud/bibi/learning','/__rxcloud/bibi/inbox']){
    const denied=await fetch(base+endpoint,{headers:{Authorization:'Bearer invalid-token'}});
    assert.equal(denied.status,401,'Invalid token must be rejected: '+endpoint);
  }
  // RX CLOUD #598: negative authentication and recovery scenarios (localhost only).
  const learningPath=base+'/__rxcloud/bibi/learning';
  const validLearningToken=process.env.RX_QUEEN_LOCAL_TOKEN;
  const badHeaders=[
    undefined,
    {Authorization:'Bearer incorrect-token'},
    {Authorization:validLearningToken},
    {Authorization:'Basic '+validLearningToken},
    {Authorization:'bearer '+validLearningToken},
    {Authorization:'Bearer  '+validLearningToken},
    {Authorization:'Bearer '+validLearningToken+' extra'},
  ];
  for(const headers of badHeaders){
    const response=await fetch(learningPath,headers?{headers}:{});
    assert.equal(response.status,401,'Private learning feed must reject missing or malformed authorization');
    assert.equal(response.headers.get('cache-control'),'no-store');
  }
  // RX CLOUD #600: reject writes before reading the private learning feed.
  for(const method of ['POST','PUT','PATCH','DELETE']){
    const response=await fetch(learningPath,{method,headers:{Authorization:'Bearer '+validLearningToken}});
    assert.equal(response.status,405,'Private learning feed must reject '+method);
    assert.equal(response.headers.get('cache-control'),'no-store');
  }
  // Reject an invalid credential even when the caller attempts a write.
  const unauthorizedWrite=await fetch(learningPath,{method:'POST',headers:{Authorization:'Bearer wrong-token'}});
  assert.equal(unauthorizedWrite.status,401,'Authentication must run before method handling');
  const recoveredLearning=await fetch(learningPath,{headers:{Authorization:'Bearer '+validLearningToken}});
  assert.equal(recoveredLearning.status,200,'Valid token must still work after rejected requests');
  const queen=await fetch(base+'/__rxcloud/queen/status',{headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}});
  assert.equal(queen.status,200);
  assert.equal((await queen.json()).taskExecution,false);
  // Queen/BIBI local bridge: authenticated learning feed must be read-only and structured.
  const learningDeniedMethod=await fetch(base+'/__rxcloud/bibi/learning',{method:'POST',headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}});
  assert.equal(learningDeniedMethod.status,405,'Learning feed must not allow writes');
  const learning=await fetch(base+'/__rxcloud/bibi/learning',{headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}});
  assert.equal(learning.status,200,'Queen must read BIBI learning feed with valid token');
  const learningData=await learning.json();
  assert.equal(learningData.kind,'rx-queen-verified-learning');
  assert(Array.isArray(learningData.lessons),'Queen learning feed must return lessons array');
  assert(learningData.lessons.every(item=>item.verifiedResolution===false),'Unverified reports must never be treated as learned fixes');
  // The private learning reader must never follow symlinks or load unbounded report files.
  const cloudSource=await fs.readFile(path.join(__dirname,'..','rx-cloud-server.cjs'),'utf8');
  assert.match(cloudSource,/reportStat\.isSymbolicLink\(\)/,'Learning feed rejects symlink reports');
  assert.match(cloudSource,/reportStat\.size>65536/,'Learning feed bounds report file size');
  // RX NEURON GitHub API sync: authentication, input validation, and fail-closed responses.
  const syncPath='/__rxcloud/neuron/sync-run';
  assert.equal((await fetch(base+syncPath+'?runId=41040503573',{method:'POST'})).status,401);
  assert.equal((await fetch(base+syncPath+'?runId=41040503573',{method:'GET',headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}})).status,405);
  assert.equal((await fetch(base+syncPath+'?runId=not-a-number',{method:'POST',headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}})).status,400);
  assert.equal((await fetch(base+syncPath+'?runId=123/../../bad',{method:'POST',headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}})).status,400);
  // Offline GitHub API simulation: only real successful completed runs create evidence.
  const githubMockDir=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'rx-github-sync-test-'));
  const originalFetch=globalThis.fetch;
  const originalEvidenceDir=process.env.RX_NEURON_EVIDENCE_DIR;
  process.env.RX_NEURON_EVIDENCE_DIR=githubMockDir;
  try{
    const tokenHeaders={Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN};
    const scenarios=[
      {runId:'12345678901',conclusion:'success',repository:'Gregg856/vexorio',expected:200,stored:true},
      {runId:'12345678902',conclusion:'failure',repository:'Gregg856/vexorio',expected:409,stored:false},
      {runId:'12345678903',conclusion:'success',repository:'foreign/repo',expected:409,stored:false},
      {runId:'12345678904',conclusion:'success',repository:'Gregg856/vexorio',status:'in_progress',expected:409,stored:false}
    ];
    for(const scenario of scenarios){
      globalThis.fetch=(input,options)=>String(input).startsWith('https://api.github.com/')
        ? Promise.resolve(new Response(JSON.stringify({id:Number(scenario.runId),repository:{full_name:scenario.repository},status:scenario.status||'completed',conclusion:scenario.conclusion,head_sha:'abc123'}),{status:200,headers:{'Content-Type':'application/json'}}))
        : originalFetch(input,options);
      const result=await originalFetch(base+syncPath+'?runId='+scenario.runId,{method:'POST',headers:tokenHeaders});
      assert.equal(result.status,scenario.expected,'GitHub sync scenario '+scenario.runId);
      const filename=path.join(githubMockDir,'rx-run-'+scenario.runId+'.json');
      assert.equal(await fs.stat(filename).then(()=>true,()=>false),scenario.stored,'Evidence file mismatch '+scenario.runId);
    }
    globalThis.fetch=(input,options)=>String(input).startsWith('https://api.github.com/')
      ? Promise.resolve(new Response('unavailable',{status:503}))
      : originalFetch(input,options);
    assert.equal((await originalFetch(base+syncPath+'?runId=12345678905',{method:'POST',headers:tokenHeaders})).status,502);
    assert.equal(await fs.stat(path.join(githubMockDir,'rx-run-12345678905.json')).then(()=>true,()=>false),false);
  }finally{
    globalThis.fetch=originalFetch;
    if(originalEvidenceDir===undefined)delete process.env.RX_NEURON_EVIDENCE_DIR;
    else process.env.RX_NEURON_EVIDENCE_DIR=originalEvidenceDir;
    await fs.rm(githubMockDir,{recursive:true,force:true});
  }
  // Verified fixes are isolated from raw incidents and require explicit approval + test evidence.
  const verifiedDir=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'rx-verified-test-'));
  const previousVerifiedDir=process.env.RX_NEURON_VERIFIED_DIR;
  const previousEvidenceDir=process.env.RX_NEURON_EVIDENCE_DIR;
  process.env.RX_NEURON_EVIDENCE_DIR=verifiedDir;
  process.env.RX_NEURON_VERIFIED_DIR=verifiedDir;
  try{
    const testReference='https://github.com/Gregg856/vexorio/actions/runs/41040503573';
    await fs.writeFile(path.join(verifiedDir,'rx-run-41040503573.json'),JSON.stringify({kind:'rx-github-actions-evidence',runId:'41040503573',repository:'Gregg856/vexorio',status:'completed',conclusion:'success',source:'github-api',headSha:'a'.repeat(40)}));
    const commitSha='a'.repeat(40);
    const approved={kind:'rx-neuron-verified-fix',ownerApproved:true,testResult:'passed',incidentId:'incident-1',resolution:'Naprawa sprawdzona testem',testReference,commitSha};
    await fs.writeFile(path.join(verifiedDir,'rx-fix-approved.json'),JSON.stringify(approved));
    await fs.writeFile(path.join(verifiedDir,'rx-fix-unapproved.json'),JSON.stringify({...approved,incidentId:'incident-2',ownerApproved:false}));
    await fs.writeFile(path.join(verifiedDir,'rx-fix-failed.json'),JSON.stringify({...approved,incidentId:'incident-3',testResult:'failed'}));
    await fs.writeFile(path.join(verifiedDir,'rx-fix-wrong-repo.json'),JSON.stringify({...approved,incidentId:'incident-4',testReference:'https://github.com/other/repo/actions/runs/41040503573'}));
    await fs.writeFile(path.join(verifiedDir,'rx-fix-bad-run.json'),JSON.stringify({...approved,incidentId:'incident-5',testReference:'https://github.com/Gregg856/vexorio/actions/runs/not-a-number'}));
    await fs.writeFile(path.join(verifiedDir,'rx-fix-malformed.json'),'{invalid-json');
    await fs.writeFile(path.join(verifiedDir,'rx-fix-wrong-commit.json'),JSON.stringify({...approved,incidentId:'incident-6',commitSha:'b'.repeat(40)}));
    await fs.writeFile(path.join(verifiedDir,'rx-fix-no-commit.json'),JSON.stringify({...approved,incidentId:'incident-7',commitSha:undefined}));
    const response=await fetch(base+'/__rxcloud/bibi/learning',{headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}});
    assert.equal(response.status,200);
    const memory=await response.json();
    assert.equal(memory.verified.length,1,'Only explicitly approved and test-backed fixes may enter verified memory');
    assert.equal(memory.verified[0].incidentId,'incident-1');
    assert.equal(memory.verified[0].verifiedResolution,true);
    assert(Array.isArray(memory.suggestions),'Queen feed must expose suggestions');
    assert(memory.suggestions.every(s=>s.matches.every(m=>m.verifiedResolution===true&&m.automaticApplication===false)),'Suggestions must never execute repairs');
    // Same incident must match its tested fix even when text differs.
    const suggestionIncidentDir=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'rx-neuron-match-'));
    const previousInboxDir=process.env.RX_BIBI_INBOX_DIR;
    process.env.RX_BIBI_INBOX_DIR=suggestionIncidentDir;
    try{
      await fs.writeFile(path.join(suggestionIncidentDir,'rx-bibi-900.json'),JSON.stringify({
        kind:'rx-bibi-smart-error-memory',runId:'900',
        developerHandoff:[
          {id:'incident-1',module:'Czat',problem:'Wiadomości nie docierają'},
          {id:'unrelated-77',module:'Płatności',problem:'Błąd faktury'}
        ]
      }));
      const matchingResponse=await fetch(base+'/__rxcloud/bibi/learning',{headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}});
      assert.equal(matchingResponse.status,200);
      const matching=await matchingResponse.json();
      assert.equal(matching.suggestions.length,1,'Unrelated incidents must not receive unrelated fix suggestions');
      assert.equal(matching.suggestions[0].incidentId,'incident-1');
      assert.equal(matching.suggestions[0].matches[0].matchType,'same-incident');
      assert.equal(matching.suggestions[0].matches[0].similarityScore,1,'Exact incident must rank highest');
      assert.equal(matching.suggestions[0].matches[0].automaticApplication,false);
      // Training-quality regression: keyword overlap alone must not trigger unrelated fixes.
      await fs.writeFile(path.join(suggestionIncidentDir,'rx-bibi-901.json'),JSON.stringify({
        kind:'rx-bibi-smart-error-memory',runId:'901',
        developerHandoff:[
          {id:'incident-1',module:'Czat',problem:'Wiadomości nie docierają'},
          {id:'unrelated-88',module:'Płatności',problem:'Błąd panel test'},
          {id:'unrelated-89',module:'Powiadomienia',problem:'System moduł naprawa'}
        ]
      }));
      const qualityResponse=await fetch(base+'/__rxcloud/bibi/learning',{headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}});
      assert.equal(qualityResponse.status,200);
      const quality=await qualityResponse.json();
      assert.equal(quality.suggestions.length,1,'Generic filler words must not suggest a chat repair for unrelated errors');
      assert.equal(quality.suggestions[0].incidentId,'incident-1');
      assert(quality.suggestions[0].matches.every(m=>m.similarityScore>=0&&m.similarityScore<=1));

    }finally{
      if(previousInboxDir===undefined)delete process.env.RX_BIBI_INBOX_DIR;
      else process.env.RX_BIBI_INBOX_DIR=previousInboxDir;
      await fs.rm(suggestionIncidentDir,{recursive:true,force:true});
    }
  }finally{
    if(previousEvidenceDir===undefined)delete process.env.RX_NEURON_EVIDENCE_DIR;
    else process.env.RX_NEURON_EVIDENCE_DIR=previousEvidenceDir;
    if(previousVerifiedDir===undefined)delete process.env.RX_NEURON_VERIFIED_DIR;
    else process.env.RX_NEURON_VERIFIED_DIR=previousVerifiedDir;
    await fs.rm(verifiedDir,{recursive:true,force:true});
  }
  // RX NEURON regression: aggregate two local BIBI reports and deduplicate observations.
  const neuronDir=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'rx-neuron-test-'));
  const priorInbox=process.env.RX_BIBI_INBOX_DIR;
  process.env.RX_BIBI_INBOX_DIR=neuronDir;
  try{
    const makeReport=(runId,items)=>({kind:'rx-bibi-smart-error-memory',runId,developerHandoff:items});
    await fs.writeFile(path.join(neuronDir,'rx-bibi-100.json'),JSON.stringify(makeReport('100',[
      {id:'old-1',problem:'Błąd czatu',module:'RX CHAT'},
      {id:'old-2',problem:'Błąd logowania',module:'RX AUTH'}
    ])));
    await fs.writeFile(path.join(neuronDir,'rx-bibi-101.json'),JSON.stringify(makeReport('101',[
      {id:'new-1',problem:'Błąd czatu',module:'RX CHAT'},
      {id:'new-2',problem:'Błąd powiadomień',module:'RX ALERT'}
    ])));
    const response=await fetch(base+'/__rxcloud/bibi/learning',{headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}});
    assert.equal(response.status,200);
    const memory=await response.json();
    assert.equal(memory.source,'RX_BIBI_INBOX');
    assert.equal(memory.runId,'101');
    assert.equal(memory.lessons.length,3,'Two reports must yield three unique incidents');
    assert.deepEqual(memory.lessons.map(x=>x.observation),['Błąd czatu','Błąd powiadomień','Błąd logowania']);
    assert(memory.lessons.every(x=>x.verifiedResolution===false),'Incidents are not verified solutions');
  }finally{
    if(priorInbox===undefined)delete process.env.RX_BIBI_INBOX_DIR;
    else process.env.RX_BIBI_INBOX_DIR=priorInbox;
    await fs.rm(neuronDir,{recursive:true,force:true});
  }
  assert.equal((await fetch(base+'/__rxcloud/queen/status',{method:'POST'})).status,405);
  // RX BIBI client must be served by our self-hosted RX CLOUD, with its own API route.
  const clientPage=await fetch(base+'/rx-client.html');
  assert.equal(clientPage.status,200,'RX BIBI client page must load on RX CLOUD');
  assert.match(await clientPage.text(),/api\/rx\/client\/chat/,'Client must use RX chat API');
  const chatWithoutLogin=await fetch(base+'/api/rx/client/chat',{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://localhost'},body:JSON.stringify({message:'Cześć',history:[]})});
  assert.equal(chatWithoutLogin.status,401,'RX BIBI must reject unauthenticated chat on RX CLOUD');
  const home=await fetch(base+'/');
  assert.equal(home.status,200,'VEXORIO home must load on RX CLOUD');
  assert.match(home.headers.get('content-type')||'',/text\/html/);
  const html=await home.text();
  assert.match(html,/<html/i);
  const manifest=await fetch(base+'/manifest.webmanifest');
  assert.equal(manifest.status,200,'VEXORIO manifest must load');
  const sensitive=await fetch(base+'/rx-cloud-server.cjs');
  assert.notEqual(sensitive.status,200,'Server source must not be publicly served');
  const missing=await fetch(base+'/nonexistent-rx-cloud-file-2026');
  assert.equal(missing.status,403,'Extensionless public paths are denied by the static asset allowlist');
  const notFound=await fetch(base+'/nonexistent-rx-cloud-file-2026.json');
  assert.equal(notFound.status,404,'Missing permitted-extension assets should return 404');
  const head=await fetch(base+'/manifest.webmanifest',{method:'HEAD'});
  assert.equal(head.status,200);
  assert.equal(await head.text(),'');
  const oversized=await fetch(base+'/nonexistent-rx-cloud-file-2026',{method:'POST',body:'x'.repeat(2*1024*1024+1)});
  assert.equal(oversized.status,413);
  const declaredOversized=await fetch(base+'/nonexistent-rx-cloud-file-2026',{method:'POST',headers:{'Content-Length':String(2*1024*1024+1)},body:'x'.repeat(2*1024*1024+1)});
  assert.equal(declaredOversized.status,413,'Oversized declared Content-Length must be rejected');
  const hostileHost=await fetch(base+'/__rxcloud/health',{headers:{Host:'invalid-host:bad-port'}});
  assert.equal(hostileHost.status,200,'Malformed Host must not break local request parsing');
  const stillHealthy=await fetch(base+'/__rxcloud/health');
  assert.equal(stillHealthy.status,200,'Server must remain healthy after oversized request');
  const finalLoad=(await stillHealthy.json()).load;
  assert.equal(finalLoad.activeRequests,1,'Only health request should remain active');
  assert(finalLoad.completedRequests>=8,'Request completion counter should advance');
  assert(finalLoad.peakActiveRequests>=1,'Peak request counter should be populated');
  // RX CLOUD 5.7: bounded, localhost-only burst; never targets a public endpoint.
  const sampleCount=24;
  const concurrency=4;
  const latencies=[];
  for(let offset=0;offset<sampleCount;offset+=concurrency){
    const batch=Array.from({length:Math.min(concurrency,sampleCount-offset)},async()=>{
      const started=performance.now();
      const response=await fetch(base+'/__rxcloud/health',{signal:AbortSignal.timeout(5000)});
      assert.equal(response.status,200,'Local burst request failed');
      await response.json();
      latencies.push(performance.now()-started);
    });
    await Promise.all(batch);
  }
  latencies.sort((a,b)=>a-b);
  const p95=latencies[Math.ceil(latencies.length*.95)-1];
  const mean=latencies.reduce((sum,n)=>sum+n,0)/latencies.length;
  const loadResponse=await fetch(base+'/__rxcloud/health');
  const load=(await loadResponse.json()).load;
  assert.equal(latencies.length,sampleCount,'All local burst samples must complete');
  assert(load.completedRequests>=sampleCount,'Completed request count must include burst');
  assert(Number.isFinite(p95)&&p95>=0,'Invalid p95 latency');
  console.log('RX CLOUD 5.7 localhost-only burst: '+JSON.stringify({requests:sampleCount,concurrency,meanMs:Number(mean.toFixed(2)),p95Ms:Number(p95.toFixed(2)),peakActiveRequests:load.peakActiveRequests}));
  // RX CLOUD 5.8: verify real simultaneous TCP connections, not just fast health requests.
  // Four idle sockets remain open until explicitly destroyed; localhost only.
  const sockets=[];
  try{
    for(let i=0;i<4;i++){
      const socket=net.connect({host:'127.0.0.1',port});
      sockets.push(socket);
      await new Promise((resolve,reject)=>{
        socket.once('connect',resolve);
        socket.once('error',reject);
        socket.setTimeout(3000,()=>socket.destroy(new Error('Local socket timeout')));
      });
    }
    const openConnections=await new Promise((resolve,reject)=>server.getConnections((err,n)=>err?reject(err):resolve(n)));
    assert(openConnections>=4,'Server must accept at least four simultaneous TCP connections');
    assert(openConnections<=server.maxConnections,'Server must respect configured connection capacity');
    console.log('RX CLOUD 5.8 localhost TCP capacity: '+JSON.stringify({heldSockets:4,observedConnections:openConnections,configuredLimit:server.maxConnections}));
  }finally{
    for(const socket of sockets)socket.destroy();
  }
  // RX CLOUD 5.9: progressive localhost-only load with bounded 3s timeout per request.
  const stages=[2,4,8,16];
  const stageReports=[];
  for(const parallel of stages){
    const started=performance.now();
    const results=await Promise.all(Array.from({length:parallel},async()=>{
      const response=await fetch(base+'/__rxcloud/health',{signal:AbortSignal.timeout(3000)});
      assert.equal(response.status,200,'Progressive local load must remain healthy');
      const data=await response.json();
      assert.equal(data.ok,true);
      return data;
    }));
    const durationMs=performance.now()-started;
    assert.equal(results.length,parallel);
    assert(Number.isFinite(durationMs)&&durationMs>=0);
    stageReports.push({parallel,completed:results.length,durationMs:Number(durationMs.toFixed(2))});
  }
  const stageHealth=await fetch(base+'/__rxcloud/health');
  const stageData=await stageHealth.json();
  assert(stageData.load.completedRequests>=stages.reduce((a,b)=>a+b,0),'Load counter must include progressive stages');
  assert(stageData.load.activeRequests>=1,'Health snapshot must include current request');
  console.log('RX CLOUD 5.9 progressive localhost load: '+JSON.stringify({stages:stageReports,peakActiveRequests:stageData.load.peakActiveRequests,connectionsLimit:stageData.connectionsLimit}));
  console.log('RX CLOUD 5.9 progressive localhost load and TCP tests passed');
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
// Enabled mode is configuration only: a real inference response is not asserted.
 process.env.RX_BIBI_MODEL_ENABLED='true';
 process.env.RX_BIBI_MODEL_PORT='11434';
 const enabledServer=await start({port:0,host:'127.0.0.1'});
 try{
   const enabledUrl='http://127.0.0.1:'+enabledServer.address().port;
   const response=await fetch(enabledUrl+'/__rxcloud/model/capabilities');
   assert.equal(response.status,200);
   const result=await response.json();
   assert.equal(result.modelConfigured,true);
   assert.equal(result.modelVerified,false);
 }finally{
   await new Promise((resolve,reject)=>enabledServer.close(e=>e?reject(e):resolve()));
   delete process.env.RX_BIBI_MODEL_ENABLED;
   delete process.env.RX_BIBI_MODEL_PORT;
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
