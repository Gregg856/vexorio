'use strict';
// Explicit local adapter to the EXISTING RX brain. No production deployment or actions.
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chatRXWithKnowledge,chatRXWithStoredMemory}=require('./rx-brain-chat-engine.cjs');
const {readTasks}=require('./rx-bibi-task-store.cjs');
const {getVerifiedRun}=require('./rx-bibi-github-evidence.cjs');
const SAFE_DIAGNOSTICS=Object.freeze({
 AUTH_REQUIRED:'Sprawdź, czy klient przesyła prawidłowy token historii. Nie wklejaj tokenu do czatu ani logów.',
 HISTORY_UNAVAILABLE:'Sprawdź uprawnienia, dostępność i poprawność pliku historii. Zachowaj kopię przed naprawą.',
 INVALID_REQUEST:'Sprawdź format JSON, źródło żądania, treść wiadomości i dopuszczalne limity.',
});
function sendError(res,status,code){
 res.writeHead(status);
 res.end(JSON.stringify({error:code==='AUTH_REQUIRED'?'Unauthorized':code==='HISTORY_UNAVAILABLE'?'History unavailable':'Invalid request',code,diagnostic:SAFE_DIAGNOSTICS[code]}));
}
function start({port=0,host='127.0.0.1',taskFile=null,githubFetch=globalThis.fetch,knowledgeLookup,memoryFile=null,historyFile=null,historyToken=null}={}){
 if(!['127.0.0.1','::1'].includes(host))throw Error('Local host only');
 if(historyFile&&(!historyToken||typeof historyToken!=='string'||historyToken.length<32))throw Error('History token required');
 let historyQueue=Promise.resolve();
 const server=http.createServer((req,res)=>{
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'||req.url!=='/chat'){res.writeHead(404);res.end(JSON.stringify({error:'Not found'}));return;}
  let body='';
  req.on('data',chunk=>{body+=chunk;if(body.length>4096)req.destroy();});
  req.on('end',()=>{
   const handle=async()=>{
   try{
    const data=JSON.parse(body);
    if(data.source!=='rx-bibi-learning-test'||typeof data.message!=='string')throw Error('Invalid request');
    if(historyFile&&data.historyToken!==historyToken){sendError(res,401,'AUTH_REQUIRED');return;}
    const tasks=taskFile?readTasks(taskFile):[];
    let history=data.history===undefined?[]:data.history;
    if(historyFile){
     try{const stat=await fs.stat(historyFile);if(stat.size>8192)throw Error('History too large');history=JSON.parse(await fs.readFile(historyFile,'utf8'));}
     catch(error){if(error.code!=='ENOENT'){sendError(res,503,'HISTORY_UNAVAILABLE');return;}}
    }
    if(!Array.isArray(history)||history.length>6||history.some(item=>typeof item!=='string'||item.length>1000)){
     sendError(res,historyFile?503:400,historyFile?'HISTORY_UNAVAILABLE':'INVALID_REQUEST');return;
    }
    const diagnosticQuery=/^(?:diagnoza|diagnostyka|pomoc dla błędu|pomoc dla bledu):?\\s+(AUTH_REQUIRED|HISTORY_UNAVAILABLE|INVALID_REQUEST)\\??$/i.exec(data.message.trim());
    let result;
    if(diagnosticQuery){
     const code=diagnosticQuery[1].toUpperCase();
     let advisory='';
     if(memoryFile){
      const {loadBrain}=require('./rx-brain-store.cjs');
      const brain=await loadBrain(memoryFile);
      const recommendation=brain.recommend(code.toLowerCase());
      if(recommendation.known&&typeof recommendation.action==='string')advisory=' RX Brain: '+recommendation.action.slice(0,120)+'. To tylko zapisana wskazówka, nie dowód naprawy.';
     }
     result={answer:'Diagnostyka '+code+': '+SAFE_DIAGNOSTICS[code]+advisory,executed:0};
    }else result=memoryFile?await chatRXWithStoredMemory(data.message,{tasks,memoryFile,history}):await chatRXWithKnowledge(data.message,{tasks,history,...(knowledgeLookup?{knowledgeLookup}:{})});
    const evidenceQuery=/^(?:sprawdź|sprawdz|pokaż|pokaz) (?:wynik |status )?(?:testu |testów |github actions )?(?:run |przebiegu )?(\d{8,20})[?!. ]*$/i.exec(data.message.trim());
    if(evidenceQuery){
      const evidence=await getVerifiedRun(evidenceQuery[1],{fetchImpl:githubFetch});
      result.answer=evidence.ok?`GitHub Actions: przebieg ${evidence.runId}, status ${evidence.status}, wynik ${evidence.conclusion}, commit ${evidence.headSha}. Źródło: ${evidence.url}. To potwierdza wynik testu, nie wdrożenie produkcyjne.`:`Nie udało się potwierdzić przebiegu GitHub Actions: ${evidence.reason}.`;
    }
    if(historyFile){
     const turns=[...history,data.message,result.answer];
     let next=turns.slice(-6);
     if(turns.length>6){
      const short=/^(?:dalej|gotowe|zielone|błąd|blad|ok|super|kontynuuj|sprawdź to|sprawdz to|co dalej)[.!?\\s]*$/i;
      let anchor=-1;
      for(let i=0;i<turns.length;i+=2){if(!short.test(turns[i].trim()))anchor=i;}
      if(anchor>=0&&anchor<turns.length-6)next=[turns[anchor],turns[anchor+1],...turns.slice(-4)];
     }
     const tmp=historyFile+'.'+process.pid+'.tmp';
     await fs.mkdir(path.dirname(historyFile),{recursive:true});
     try{await fs.writeFile(tmp,JSON.stringify(next),{mode:0o600,flag:'wx'});await fs.rename(tmp,historyFile);}
     finally{await fs.rm(tmp,{force:true});}
    }
    res.writeHead(200);res.end(JSON.stringify({reply:result.answer,executed:result.executed}));
   }catch{sendError(res,400,'INVALID_REQUEST');}
   };
   if(historyFile){historyQueue=historyQueue.then(handle,handle);}else{void handle();}
  });
 });
 return new Promise(resolve=>server.listen(port,host,()=>resolve(server)));
}
if(require.main===module){
 start({port:Number(process.env.RX_BIBI_LOCAL_PORT||8799)}).then(s=>console.log('RX BIBI local brain adapter on '+s.address().port));
}
module.exports={start};
