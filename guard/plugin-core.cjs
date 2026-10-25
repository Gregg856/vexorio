'use strict';
// Strażak Plugin Core 1.0: isolated, allowlisted local plugins; no dynamic code loading.
const NAME=/^[a-z][a-z0-9-]{1,47}$/;
const ALLOWED_PERMISSIONS=new Set(['read:task','read:status']);
function createRegistry(){
 const plugins=new Map();
 const health=new Map();
 function register(definition){
  if(!definition||typeof definition!=='object'||!NAME.test(definition.id||'')||typeof definition.run!=='function'||plugins.has(definition.id))throw Error('Invalid or duplicate plugin');
  if(!Array.isArray(definition.permissions)||definition.permissions.some(p=>!ALLOWED_PERMISSIONS.has(p)))throw Error('Permission denied');
  const permissions=[...new Set(definition.permissions)];
  const plugin=Object.freeze({id:definition.id,description:String(definition.description||'').slice(0,200),permissions:Object.freeze(permissions),run:definition.run});
  plugins.set(plugin.id,plugin);health.set(plugin.id,{checks:0,failures:0,lastError:null});return plugin.id;
 }
 function list(){return [...plugins.values()].map(({id,description,permissions})=>({id,description,permissions:[...permissions]}));}
 async function execute(id,request,approved=false){
  const plugin=plugins.get(id);if(!plugin)throw Error('Unknown plugin');
  if(approved!==true)throw Error('Explicit approval required');
  if(!request||typeof request!=='object'||typeof request.task!=='string'||request.task.length>2000)throw Error('Invalid request');
  const input=Object.freeze({task:request.task.slice(0,2000)});
  const stats=health.get(id);
  stats.checks++;
  try{
   const result=await plugin.run(input);
   if(!result||typeof result!=='object'||typeof result.message!=='string')throw Error('Invalid plugin result');
   stats.lastError=null;
   return Object.freeze({plugin:id,message:result.message.slice(0,4000)});
  }catch(error){
   stats.failures++;
   // Never store or display arbitrary exception text: it may contain private task data.
   stats.lastError='Błąd wykonania lub nieprawidłowa odpowiedź modułu';
   throw error;
  }
 }
 function diagnostics(){
  return list().map(plugin=>{
   const stats=health.get(plugin.id);
   return {id:plugin.id,status:stats.lastError?'error':stats.checks?'ok':'not-tested',checks:stats.checks,failures:stats.failures,lastError:stats.lastError};
  });
 }
 return Object.freeze({register,list,execute,diagnostics});
}
if(typeof module!=='undefined'&&module.exports)module.exports={createRegistry};
if(typeof window!=='undefined')window.GuardPluginCore={createRegistry};
