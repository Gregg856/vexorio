'use strict';
// Explicit local adapter to the EXISTING RX brain. No production deployment or actions.
const http=require('node:http');
const {chatRXWithKnowledge,chatRXWithStoredMemory}=require('./rx-brain-chat-engine.cjs');
const {readTasks}=require('./rx-bibi-task-store.cjs');
const {getVerifiedRun}=require('./rx-bibi-github-evidence.cjs');
function start({port=0,host='127.0.0.1',taskFile=null,githubFetch=globalThis.fetch,knowledgeLookup,memoryFile=null}={}){
 if(!['127.0.0.1','::1'].includes(host))throw Error('Local host only');
 const server=http.createServer((req,res)=>{
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'||req.url!=='/chat'){res.writeHead(404);res.end(JSON.stringify({error:'Not found'}));return;}
  let body='';
  req.on('data',chunk=>{body+=chunk;if(body.length>4096)req.destroy();});
  req.on('end',async()=>{
   try{
    const data=JSON.parse(body);
    if(data.source!=='rx-bibi-learning-test'||typeof data.message!=='string')throw Error('Invalid request');
    const tasks=taskFile?readTasks(taskFile):[];
    const result=memoryFile?await chatRXWithStoredMemory(data.message,{tasks,memoryFile}):await chatRXWithKnowledge(data.message,{tasks,...(knowledgeLookup?{knowledgeLookup}:{})});
    const evidenceQuery=/^(?:sprawdź|sprawdz|pokaż|pokaz) (?:wynik |status )?(?:testu |testów |github actions )?(?:run |przebiegu )?(\d{8,20})[?!. ]*$/i.exec(data.message.trim());
    if(evidenceQuery){
      const evidence=await getVerifiedRun(evidenceQuery[1],{fetchImpl:githubFetch});
      result.answer=evidence.ok?`GitHub Actions: przebieg ${evidence.runId}, status ${evidence.status}, wynik ${evidence.conclusion}, commit ${evidence.headSha}. Źródło: ${evidence.url}. To potwierdza wynik testu, nie wdrożenie produkcyjne.`:`Nie udało się potwierdzić przebiegu GitHub Actions: ${evidence.reason}.`;
    }
    res.writeHead(200);res.end(JSON.stringify({reply:result.answer,executed:result.executed}));
   }catch{res.writeHead(400);res.end(JSON.stringify({error:'Invalid request'}));}
  });
 });
 return new Promise(resolve=>server.listen(port,host,()=>resolve(server)));
}
if(require.main===module){
 start({port:Number(process.env.RX_BIBI_LOCAL_PORT||8799)}).then(s=>console.log('RX BIBI local brain adapter on '+s.address().port));
}
module.exports={start};
