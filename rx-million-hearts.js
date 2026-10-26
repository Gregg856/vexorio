'use strict';
// RX MILION SERC 1.0 — bounded, event-driven logical cells.
// A "heart" is a lightweight task handler, not an AI model or OS process.
class RXMillionHearts {
  constructor({maxConcurrent=4,maxQueue=1000,memoryLimit=200,logicalHeads=1000}={}){
    for(const [key,value] of Object.entries({maxConcurrent,maxQueue,memoryLimit,logicalHeads})){
      if(!Number.isSafeInteger(value)||value<1)throw new RangeError(key+' must be a positive integer');
    }
    this.maxConcurrent=maxConcurrent;this.maxQueue=maxQueue;this.memoryLimit=memoryLimit;this.logicalHeads=logicalHeads;
    this.handlers=new Map();this.queue=[];this.active=0;this.memory=[];this.failurePatterns=new Map();
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
  dispatch(name,payload,{signal}={}){
    if(!this.handlers.has(name))return Promise.reject(new Error('Unknown cell: '+name));
    if(signal?.aborted)return Promise.reject(signal.reason||new Error('Aborted'));
    if(this.queue.length>=this.maxQueue){this.stats.rejected++;return Promise.reject(new Error('RX hearts queue full'));}
    this.stats.accepted++;
    return new Promise((resolve,reject)=>{
      const job={name,payload,signal,resolve,reject};
      this.queue.push(job);this._drain();
    });
  }
  _drain(){
    while(this.active<this.maxConcurrent&&this.queue.length){
      const job=this.queue.shift();
      if(job.signal?.aborted){job.reject(job.signal.reason||new Error('Aborted'));continue;}
      this.active++;
      Promise.resolve().then(()=>this.handlers.get(job.name)(job.payload,{signal:job.signal}))
        .then(result=>{this.stats.completed++;this._remember(job.name,'ok');job.resolve(result);},
          error=>{this.stats.failed++;this._remember(job.name,'error');job.reject(error);})
        .finally(()=>{this.active--;this._drain();});
    }
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
  _remember(cell,status){
    this.memory.push({cell,status,time:new Date().toISOString()});
    if(this.memory.length>this.memoryLimit)this.memory.shift();
  }
  snapshot(){
    return {registeredCells:this.handlers.size,logicalHeads:this.logicalHeads,active:this.active,queued:this.queue.length,
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
