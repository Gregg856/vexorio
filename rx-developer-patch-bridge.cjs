'use strict';
// Unified RX Developer / Queen / BIBI diagnostic bridge. Review-only.
const {analyzeJavaScript}=require('./guard/rx-developer-core.cjs');
const {suggestPatch}=require('./rx-patch-drafter.cjs');
function inspectAndPropose({target,source}={}){
 if(typeof target!=='string'||typeof source!=='string'||source.length>500000)throw Error('Invalid RX input');
 const analysis=analyzeJavaScript(source);
 const suggestions=[];
 for(const rule of ['remove-debugger','remove-console-debug']){
  try{
   const suggestion=suggestPatch({target,source,rule});
   suggestions.push({rule,status:'review_only',...suggestion});
  }catch(error){
   if(!/Rule match missing or ambiguous|Invalid patch target/.test(error.message))throw error;
  }
 }
 return {schema:1,kind:'rx-unified-code-review',engine:'RX Developer + RX Patch Drafter',target,analysis,suggestions,requiresApproval:true,productionModified:false,automaticDeployment:false};
}
module.exports={inspectAndPropose};
