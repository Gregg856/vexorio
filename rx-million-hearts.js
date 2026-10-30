'use strict';
// RX MILION SERC 1.0 — bounded, event-driven logical cells.
// A "heart" is a lightweight task handler, not an AI model or OS process.
class RXMillionHearts {
  constructor({maxConcurrent=4,maxQueue=1000,memoryLimit=200,logicalHeads=1000}={}){
    for(const [key,value] of Object.entries({maxConcurrent,maxQueue,memoryLimit,logicalHeads})){
      if(!Number.isSafeInteger(value)||value<1)throw new RangeError(key+' must be a positive integer');
    }
    this.maxConcurrent=maxConcurrent;this.maxQueue=maxQueue;this.memoryLimit=memoryLimit;this.logicalHeads=logicalHeads;
    this.handlers=new Map();this.queue=[];this.active=0;this.running=new Map();this.nextJobId=0;this.memory=[];this.failurePatterns=new Map();this.antMemories=new Map();
    this.stats={accepted:0,completed:0,failed:0,rejected:0};
  }
  register(name,handler){
    if(typeof name!=='string'||!/^[a-z][a-z0-9_-]{0,63}$/i.test(name))throw new TypeError('Invalid cell name');
    if(typeof handler!=='function')throw new TypeError('Cell handler must be a function');
    if(this.handlers.has(name))throw new Error('Cell already registered: '+name);
    this.handlers.set(name,handler);return this;
  }
  // Logical head IDs are virtual labels; no workers or AI models are spawned.
  headId(index){
    if(!Number.isSafeInteger(index)||index<0||index>=this.logicalHeads)throw new RangeError('Invalid logical head index');
    return 'RX-'+String(index+1).padStart(6,'0');
  }
  // Event-driven impulse: one bounded task per signal, no polling or mass worker creation.
  pulse(name,payload,{signal,priority=0}={}){
    return this.dispatch(name,payload,{signal,priority});
  }
  dispatch(name,payload,{signal,priority=0}={}){
    if(!Number.isSafeInteger(priority)||priority<0||priority>9)return Promise.reject(new RangeError('Priority must be 0..9'));
    if(!this.handlers.has(name))return Promise.reject(new Error('Unknown cell: '+name));
    if(signal?.aborted)return Promise.reject(signal.reason||new Error('Aborted'));
    if(this.queue.length>=this.maxQueue){this.stats.rejected++;return Promise.reject(new Error('RX hearts queue full'));}
    this.stats.accepted++;
    return new Promise((resolve,reject)=>{
      const job={id:++this.nextJobId,name,payload,signal,priority,resolve,reject};
      // Stable priority order: urgent jobs first, FIFO within the same priority.
      const next=this.queue.findIndex(queued=>queued.priority<priority);
      if(next<0)this.queue.push(job);else this.queue.splice(next,0,job);
      this._drain();
    });
  }
  _drain(){
    while(this.active<this.maxConcurrent&&this.queue.length){
      const job=this.queue.shift();
      if(job.signal?.aborted){job.reject(job.signal.reason||new Error('Aborted'));continue;}
      this.active++;
      this.running.set(job.id,{cell:job.name,startedAt:Date.now()});
      Promise.resolve().then(()=>this.handlers.get(job.name)(job.payload,{signal:job.signal}))
        .then(result=>{this.stats.completed++;this._remember(job.name,'ok');return {ok:true,result};},
          error=>{this.stats.failed++;this._remember(job.name,'error');return {ok:false,error};})
        .then(outcome=>{
          // Finish bookkeeping before settling the public promise: await pulse() means idle.
          this.running.delete(job.id);this.active--;this._drain();
          if(outcome.ok)job.resolve(outcome.result);else job.reject(outcome.error);
        });
    }
  }
  stalledJobs(thresholdMs=30000){
    if(!Number.isSafeInteger(thresholdMs)||thresholdMs<1)throw new RangeError('Invalid stall threshold');
    const now=Date.now();
    return [...this.running].filter(([,job])=>now-job.startedAt>=thresholdMs)
      .map(([id,job])=>({id,cell:job.cell,elapsedMs:now-job.startedAt}));
  }
  // RX ANT MEMORY 1.0: compact, bounded, per-head verified references only.
  rememberAnt(headIndex,code,fixId,{testsPassed=false}={}){
    if(!testsPassed)throw new Error('Verified tests required');
    const head=this.headId(headIndex);
    if(typeof code!=='string'||!/^[a-z0-9_-]{1,48}$/i.test(code))throw new TypeError('Invalid memory code');
    if(typeof fixId!=='string'||!/^[a-z0-9_-]{1,64}$/i.test(fixId))throw new TypeError('Invalid fix ID');
    let entries=this.antMemories.get(head);
    if(!entries){
      if(this.antMemories.size>=this.memoryLimit)this.antMemories.delete(this.antMemories.keys().next().value);
      entries=new Map();this.antMemories.set(head,entries);
    }
    entries.delete(code);entries.set(code,fixId);
    while(entries.size>8)entries.delete(entries.keys().next().value);
    return {head,code,fixId};
  }
  recallAnt(headIndex,code){
    const head=this.headId(headIndex);
    if(typeof code!=='string'||!/^[a-z0-9_-]{1,48}$/i.test(code))throw new TypeError('Invalid memory code');
    const fixId=this.antMemories.get(head)?.get(code);
    return fixId?{head,code,fixId,requiresApproval:true}:null;
  }
  exportAntMemory(){
    return {version:1,ants:[...this.antMemories].map(([head,entries])=>({head,entries:[...entries].map(([code,fixId])=>({code,fixId}))}))};
  }
  importAntMemory(data){
    if(!data||data.version!==1||!Array.isArray(data.ants)||data.ants.length>this.memoryLimit)throw new TypeError('Invalid ant memory');
    const next=new Map();
    for(const ant of data.ants){
      if(!ant||typeof ant.head!=='string'||!/^RX-\\d{6}$/.test(ant.head)||!Array.isArray(ant.entries)||ant.entries.length>8||next.has(ant.head))throw new TypeError('Invalid ant');
      const index=Number(ant.head.slice(3))-1;
      if(this.headId(index)!==ant.head)throw new TypeError('Unknown ant');
      const entries=new Map();
      for(const item of ant.entries){
        if(!item||typeof item.code!=='string'||!/^[a-z0-9_-]{1,48}$/i.test(item.code)||typeof item.fixId!=='string'||!/^[a-z0-9_-]{1,64}$/i.test(item.fixId)||entries.has(item.code))throw new TypeError('Invalid ant entry');
        entries.set(item.code,item.fixId);
      }
      next.set(ant.head,entries);
    }
    this.antMemories=next;
    return next.size;
  }
  // Aggregate only bounded, sanitized error categories; never store raw payloads or secrets.
  rememberFailure(cell,code){
    if(!this.handlers.has(cell))throw new Error('Unknown cell: '+cell);
    if(typeof code!=='string'||!/^[a-z0-9_-]{1,48}$/i.test(code))throw new TypeError('Invalid failure code');
    const key=cell+':'+code;
    const previous=this.failurePatterns.get(key)||{cell,code,count:0};
    this.failurePatterns.delete(key);
    this.failurePatterns.set(key,{cell,code,count:previous.count+1});
    while(this.failurePatterns.size>this.memoryLimit)this.failurePatterns.delete(this.failurePatterns.keys().next().value);
    return this.failurePatterns.get(key).count;
  }
  recurringFailures(minCount=2){
    if(!Number.isSafeInteger(minCount)||minCount<1)throw new RangeError('Invalid minimum count');
    return [...this.failurePatterns.values()].filter(x=>x.count>=minCount).map(x=>({...x}));
  }
  // RX 2076: record only validated, named repair references (not executable code).
  rememberVerifiedFix(cell,code,fixId,{testsPassed=false}={}){
    if(!testsPassed)throw new Error('Verified tests required');
    if(typeof fixId!=='string'||!/^[a-z0-9_-]{1,64}$/i.test(fixId))throw new TypeError('Invalid fix ID');
    const key=cell+':'+code;
    if(!this.failurePatterns.has(key))throw new Error('Unknown failure pattern');
    const pattern=this.failurePatterns.get(key);
    this.failurePatterns.set(key,{...pattern,verifiedFix:fixId});
    return {...this.failurePatterns.get(key)};
  }
  // Portable, bounded pattern memory; excludes raw jobs, payloads and secrets.
  exportFailureMemory(){
    return {version:1,patterns:[...this.failurePatterns.values()].map(({cell,code,count,verifiedFix})=>({
      cell,code,count,...(verifiedFix?{verifiedFix}:{})
    }))};
  }
  importFailureMemory(data){
    if(!data||data.version!==1||!Array.isArray(data.patterns)||data.patterns.length>this.memoryLimit)
      throw new TypeError('Invalid RX memory format');
    const next=new Map();
    for(const item of data.patterns){
      if(!item||!this.handlers.has(item.cell)||typeof item.code!=='string'||!/^[a-z0-9_-]{1,48}$/i.test(item.code)||
         !Number.isSafeInteger(item.count)||item.count<1||
         (item.verifiedFix!==undefined&&(typeof item.verifiedFix!=='string'||!/^[a-z0-9_-]{1,64}$/i.test(item.verifiedFix))))
        throw new TypeError('Invalid RX memory pattern');
      const key=item.cell+':'+item.code;
      if(next.has(key))throw new TypeError('Duplicate RX memory pattern');
      next.set(key,{cell:item.cell,code:item.code,count:item.count,...(item.verifiedFix?{verifiedFix:item.verifiedFix}:{})});
    }
    this.failurePatterns=next;
    return next.size;
  }
  suggestKnownFix(cell,code){
    const pattern=this.failurePatterns.get(cell+':'+code);
    return pattern?.verifiedFix?{cell,code,fixId:pattern.verifiedFix,requiresApproval:true}:null;
  }
  _remember(cell,status){
    this.memory.push({cell,status,time:new Date().toISOString()});
    if(this.memory.length>this.memoryLimit)this.memory.shift();
  }
  snapshot(){
    return {registeredCells:this.handlers.size,logicalHeads:this.logicalHeads,active:this.active,queued:this.queue.length,urgentQueued:this.queue.filter(job=>job.priority>=7).length,stalled:this.stalledJobs().length,
      stats:{...this.stats},recurringFailures:this.recurringFailures(),recent:this.memory.slice(-10)};
  }
}
function createRXHearts(){
  const rx=new RXMillionHearts();
  const cells=['code','security','tests','translations','diagnostics','history','performance','moderation','deploy','memory'];
  for(const cell of cells)rx.register(cell,async payload=>({cell,status:'needs-integration',inputReceived:payload!==undefined}));
  return rx;
}
if(typeof module!=='undefined'&&module.exports)module.exports={RXMillionHearts,createRXHearts};
if(typeof window!=='undefined')window.RXMillionHearts={RXMillionHearts,createRXHearts};
