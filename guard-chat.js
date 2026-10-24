'use strict';
(()=>{
 const form=document.getElementById('guardChatForm'),input=document.getElementById('guardChatInput'),messages=document.getElementById('guardChatMessages');
 if(!form||!input||!messages||!window.GuardCommands)return;
 function append(role,message){
  const p=document.createElement('p');p.className='guard-chat-message';
  const strong=document.createElement('strong');strong.textContent=role+': ';
  p.append(strong,document.createTextNode(message));messages.append(p);messages.scrollTop=messages.scrollHeight;
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();const command=input.value.trim();if(!command)return;
  append('Ty',command);input.value='';
  const answer=window.GuardCommands.respond(command);
  append('Strażak',answer.message);
 });
})();
