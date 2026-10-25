'use strict';
// Local in-memory task queue: explicit approval, no remote execution or persistence.
function createTaskQueue(initial=[]){
 const tasks=[];let sequence=0;
 if(!Array.isArray(initial)||initial.length>100)throw Error("Invalid saved tasks");
 for(const value of initial){
  if(!value||!Number.isSafeInteger(value.id)||value.id<=sequence||typeof value.title!=="string"||!value.title.trim()||value.title.length>500||!["pending","approved","completed","cancelled"].includes(value.status))throw Error("Invalid saved task");
  tasks.push({id:value.id,title:value.title.trim(),status:value.status});sequence=value.id;
 }
 function snapshot(task){return {id:task.id,title:task.title,status:task.status};}
 return Object.freeze({
  add(title){
   if(typeof title!=='string'||!title.trim()||title.length>500||tasks.length>=100)throw Error('Invalid task');
   const task={id:++sequence,title:title.trim(),status:'pending'};
   tasks.push(task);return snapshot(task);
  },
  list(){return tasks.map(snapshot);},
  approve(id){
   const task=tasks.find(x=>x.id===id);
   if(!task||task.status!=='pending')return null;
   task.status='approved';return snapshot(task);
  },
  complete(id){
   const task=tasks.find(x=>x.id===id);
   if(!task||task.status!=='approved')return null;
   task.status='completed';return snapshot(task);
  },
  cancel(id){
   const task=tasks.find(x=>x.id===id);
   if(!task||task.status==='completed'||task.status==='cancelled')return null;
   task.status='cancelled';return snapshot(task);
  }
 });
}
if(typeof module!=='undefined')module.exports={createTaskQueue};
if(typeof window!=='undefined')window.GuardTaskQueue={createTaskQueue};
