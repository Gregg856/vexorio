'use strict';
// Two-chat handoff protocol: review -> explicit approval -> allowlisted execution plan.
// No chat access, shell, deployment, or automatic code modifications.
const {createRXCloudComputer}=require('./rx-cloud-computer.cjs');
const KINDS=Object.freeze(['check_syntax','run_unit_tests','run_browser_tests','inspect_ci']);
function prepareHandoff({id,kind,target,reviewedBy,approved=false}={}){
 if(typeof reviewedBy!=='string'||!/^[-A-Za-z0-9_]{2,60}$/.test(reviewedBy))throw Error('Reviewer required');
 const planner=createRXCloudComputer({maxTasks:1});
 const task=planner.enqueue({id,kind,target});
 if(!KINDS.includes(task.kind))throw Error('Unsupported task');
 return Object.freeze({schema:1,kind:'rx-two-chat-handoff',task,reviewedBy,approved:approved===true,state:approved===true?'approved_for_allowlisted_runner':'awaiting_owner_approval',executed:false,productionModified:false,note:'Copy this handoff into executor chat or CI. This module never runs commands.'});
}
module.exports={prepareHandoff};
