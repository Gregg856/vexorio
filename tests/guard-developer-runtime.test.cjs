'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const inspector=fs.readFileSync('guard/developer-inspector.cjs','utf8');
const ui=fs.readFileSync('guard-code-ui.js','utf8');
const chat=fs.readFileSync('guard-chat.js','utf8');
function node(value=''){
 const listeners={};
 return {value,textContent:'',children:[],scrollHeight:0,scrollTop:0,addEventListener:(name,fn)=>{listeners[name]=fn;},fire:async(name)=>listeners[name]?.({preventDefault(){}}),append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},className:'',type:''};
}
const codeForm=node(),path=node('fragment.js'),source=node('console.log(token)'),out=node();
const chatForm=node(),input=node('kod: console.log(token)'),messages=node(),tasks=node();
const elements={guardCodeForm:codeForm,guardCodePath:path,guardCodeSource:source,guardCodeResult:out,guardChatForm:chatForm,guardChatInput:input,guardChatMessages:messages,guardTasks:tasks};
const document={getElementById:id=>elements[id],createElement:()=>node(),createTextNode:text=>({textContent:text})};
const storage=new Map();
const window={GuardCommands:{respond:()=>({kind:'unknown',message:'UNKNOWN'})},GuardTaskQueue:{createTaskQueue:()=>({list:()=>[]})}};
const ctx=vm.createContext({window,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},module:{exports:{}},console});
vm.runInContext(inspector,ctx,{filename:'developer-inspector.cjs'});
assert.equal(typeof window.GuardDeveloperInspector.inspectSource,'function');
vm.runInContext(ui,ctx,{filename:'guard-code-ui.js'});
vm.runInContext(chat,ctx,{filename:'guard-chat.js'});
(async()=>{
 await codeForm.fire('submit');
 assert.match(out.textContent,/Linia 1 \[low\]/);
 assert.match(out.textContent,/Sprawdź, czy logi/);
 await chatForm.fire('submit');
 const text=messages.children.map(p=>p.children.map(c=>c.textContent||'').join('')).join('\n');
 assert.match(text,/Strażak Developer/);
 assert.match(text,/Sprawdź, czy logi/);
 assert.doesNotMatch(text,/UNKNOWN/);
 source.value='const safe = 1;';
 await codeForm.fire('submit');
 assert.match(out.textContent,/Nie znaleziono sygnałów/);
 path.value='../secret.js';
 await codeForm.fire('submit');
 assert.match(out.textContent,/Nieprawidłowa nazwa/);
 console.log('PASS: Strażak Developer real UI events, chat command, report and validation');
})().catch(e=>{console.error(e);process.exitCode=1;});
