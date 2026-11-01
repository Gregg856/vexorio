'use strict';
// RX BIBI #708 — deferred tasks, independent of training evidence.
const MAX_TASKS = 100;
function createDeferredTasks(initial = []) {
  if (!Array.isArray(initial) || initial.length > MAX_TASKS) throw Error('Invalid tasks');
  const tasks = new Map();
  function validate(t) {
    if (!t || typeof t.id !== 'string' || !/^[a-z0-9_-]{1,80}$/.test(t.id) ||
      typeof t.topic !== 'string' || !t.topic.trim() || t.topic.length > 240 ||
      typeof t.nextStep !== 'string' || !t.nextStep.trim() || t.nextStep.length > 500 ||
      !['deferred','active','done'].includes(t.status)) throw Error('Invalid task');
  }
  function put(task) {
    validate(task);
    if (!tasks.has(task.id) && tasks.size >= MAX_TASKS) throw Error('Task limit reached');
    const record = {id:task.id,topic:task.topic,nextStep:task.nextStep,status:task.status};
    tasks.set(record.id,record);
    return {...record};
  }
  for (const task of initial) {
    if (tasks.has(task.id)) throw Error('Duplicate task');
    put(task);
  }
  function get(id) { const t=tasks.get(id); return t ? {...t} : null; }
  function list(status) { return [...tasks.values()].filter(t=>!status||t.status===status).map(t=>({...t})); }
  function resume(id) {
    const task=get(id);
    if (!task || task.status==='done') return null;
    return put({...task,status:'active'});
  }
  function snapshot() { return {schema:1,kind:'rx-bibi-deferred-tasks',tasks:list()}; }
  return Object.freeze({put,get,list,resume,snapshot});
}
module.exports={createDeferredTasks};
