'use strict';
// Local in-memory task queue: explicit approval, no remote execution or persistence.
function createTaskQueue(){
 const tasks=[];let sequence=0;
 function snapshot(task){return {id:task.id,title:task.title,status:task.status};}
 return Object.freeze({
  add(title){
   if(typeof title!=='string'||!title.trim()||title.length>500)throw Error('Invalid task');
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
