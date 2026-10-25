'use strict';
(()=>{
 const form=document.getElementById('guardChatForm'),input=document.getElementById('guardChatInput'),messages=document.getElementById('guardChatMessages'),tasksBox=document.getElementById('guardTasks');
 if(!form||!input||!messages||!window.GuardCommands||!window.GuardTaskQueue)return;
 const plugins=window.GuardPluginCore?.createRegistry();
 if(plugins&&window.GuardTaskAnalyzerPlugin&&window.GuardEngine2)window.GuardTaskAnalyzerPlugin.installTaskAnalyzer(plugins,window.GuardEngine2.analyzeTask);
 if(plugins&&window.GuardChangesReportPlugin){
  window.GuardChangesReportPlugin.installChangesReport(plugins,async()=>{
   const response=await fetch('/guard-changes-summary.json',{cache:'no-store'});
   if(!response.ok)throw Error('Report unavailable');
   return response.json();
  });
 }
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
 form.addEventListener('submit',async event=>{
  event.preventDefault();const command=input.value.trim();if(!command)return;
  append('Ty',command);input.value='';
  if(/^(github|zmiany|raport github)$/i.test(command)){
   if(!plugins){append('Strażak','Wtyczki są chwilowo niedostępne.');return;}
   try{const result=await plugins.execute('changes-report',{task:command},true);append('Strażak GitHub',result.message);}
   catch(_){append('Strażak','Raport GitHub jest chwilowo niedostępny.');}
   return;
  }
  if(/^diff\s*:/i.test(command)){
   const patch=command.slice(command.indexOf(':')+1).trim();
   if(!window.GuardDeveloperDiff){append('Strażak','Analiza zmian jest chwilowo niedostępna.');return;}
   try{
    const report=window.GuardDeveloperDiff.reviewDiff(patch);
    const summary='Sprawdzono '+report.changedFiles+' plik(ów). Sygnały: wysokie '+report.summary.high+', średnie '+report.summary.medium+', niskie '+report.summary.low+'.';
    append('Strażak Developer 2.0',summary+(report.findings.length?'\n'+report.findings.slice(0,15).map(f=>f.file+':'+f.line+' ['+f.severity+'] '+f.rule+' — '+f.advice).join('\n'):'\nBrak sygnałów według dostępnych reguł. To nie gwarantuje bezpieczeństwa.'));
   }catch(_){append('Strażak','Nie udało się odczytać diff. Wklej tekst w formacie Git unified diff, maksymalnie 200 KB.');}
   return;
  }
  if(/^kod\s*:/i.test(command)){
   const code=command.slice(command.indexOf(':')+1).trim();
   if(!code){append('Strażak','Po „kod:” wklej fragment kodu. Dłuższy kod możesz wkleić w formularzu poniżej.');return;}
   if(!window.GuardDeveloperInspector){append('Strażak','Analizator kodu jest chwilowo niedostępny.');return;}
   try{const result=window.GuardDeveloperInspector.inspectSource({path:'fragment.js',source:code});append('Strażak Developer',result.findings.length?result.findings.map(f=>'Linia '+f.line+' ['+f.severity+']: '+f.message).join('\n'):'Nie znaleziono sygnałów objętych regułami. To nie gwarantuje bezpieczeństwa.');}
   catch(_){append('Strażak','Nie udało się przeanalizować kodu.');}
   return;
  }
  const answer=window.GuardCommands.respond(command);
  if(answer.kind==='plan'){
   const task=queue.add(command.slice(command.indexOf(':')+1).trim());
   append('Strażak','Zadanie #'+task.id+' dodane do lokalnej kolejki. Zatwierdzenie nie uruchamia zmian w GitHubie.');
   persist();renderTasks();
   if(plugins){try{const report=await plugins.execute('task-analyzer',{task:task.title},true);append('Analiza Strażaka',report.message);}catch(_){append('Strażak','Analiza jest chwilowo niedostępna.');}}
  }else append('Strażak',answer.message);
 });
 renderTasks();
})();
