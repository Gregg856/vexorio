'use strict';
(()=>{
 const form=document.getElementById('guardChatForm'),input=document.getElementById('guardChatInput'),messages=document.getElementById('guardChatMessages'),tasksBox=document.getElementById('guardTasks');
 if(!form||!input||!messages||!window.GuardCommands||!window.GuardTaskQueue)return;
 const storageKey='vexorio-guard-local-tasks-v1';
 let saved=[];
 try{const parsed=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(parsed))saved=parsed;}catch(_){}
 let queue;
 try{queue=window.GuardTaskQueue.createTaskQueue(saved);}catch(_){queue=window.GuardTaskQueue.createTaskQueue();}
 function persist(){try{localStorage.setItem(storageKey,JSON.stringify(queue.list()));}catch(_){}}

 function append(role,message){
  const p=document.createElement('p');p.className='guard-chat-message';
  const strong=document.createElement('strong');strong.textContent=role+': ';
  p.append(strong,document.createTextNode(message));messages.append(p);messages.scrollTop=messages.scrollHeight;
 }
 function renderTasks(){
  if(!tasksBox)return;
  tasksBox.replaceChildren();
  for(const task of queue.list()){
   const item=document.createElement('div');item.className='guard-task-item';
   const title=document.createElement('p');title.textContent='#'+task.id+' — '+task.title+' ('+task.status+')';item.append(title);
   for(const [label,action] of task.status==='pending'?[['Zatwierdź','approve'],['Anuluj','cancel']]:task.status==='approved'?[['Oznacz jako zakończone','complete'],['Anuluj','cancel']]:[]){
    const button=document.createElement('button');button.type='button';button.textContent=label;button.className='guard-task-button';
    button.addEventListener('click',()=>{
     const result=queue[action](task.id);
     if(result){persist();append('Strażak','Zadanie #'+task.id+': '+result.status+'. To wyłącznie zmiana statusu, bez wykonania kodu.');renderTasks();}
    });
    item.append(button);
   }
   tasksBox.append(item);
  }
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();const command=input.value.trim();if(!command)return;
  append('Ty',command);input.value='';
  const answer=window.GuardCommands.respond(command);
  if(answer.kind==='plan'){
   const task=queue.add(command.slice(command.indexOf(':')+1).trim());
   append('Strażak','Zadanie #'+task.id+' dodane do lokalnej kolejki. Zatwierdzenie nie uruchamia zmian w GitHubie.');
   persist();renderTasks();
  }else append('Strażak',answer.message);
 });
 renderTasks();
})();
