'use strict';
// RX PATCH DRAFTER 1.3: produces a bounded, review-only patch plan.
// No filesystem writes, git pushes, or arbitrary execution.
const SAFE_TARGET=/^(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*\.(?:js|cjs|mjs)$/i;
const BLOCKED=/(?:^|\/)(?:\.github|node_modules|secrets?|\.env)(?:\/|$)/i;
function draftPatch({target,oldText,newText,reason}={}){
 if(typeof target!=='string'||target.length>160||!SAFE_TARGET.test(target)||BLOCKED.test(target)||target.includes('..'))throw Error('Invalid patch target');
 if(typeof oldText!=='string'||!oldText||oldText.length>2000||typeof newText!=='string'||newText.length>2000||oldText===newText)throw Error('Invalid patch contents');
 if(typeof reason!=='string'||reason.length<3||reason.length>200)throw Error('Invalid patch reason');
 return Object.freeze({schema:1,kind:'rx-patch-draft',target,operation:'replace-exact-once',oldText,newText,reason,requiresApproval:true,applied:false,status:'awaiting-review'});
}
function previewPatch(draft,source){
 if(!draft||draft.kind!=='rx-patch-draft'||draft.applied!==false||typeof source!=='string'||source.length>500000)throw Error('Invalid patch preview');
 const first=source.indexOf(draft.oldText);
 if(first<0||source.indexOf(draft.oldText,first+draft.oldText.length)>=0)throw Error('Patch anchor missing or ambiguous');
 return {target:draft.target,preview:source.slice(0,first)+draft.newText+source.slice(first+draft.oldText.length),applied:false,requiresApproval:true};
}
module.exports={draftPatch,previewPatch};
