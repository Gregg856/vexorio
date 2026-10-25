'use strict';
// Strażak capabilities registry: declarations, not claims of live AI services.
const CAPABILITIES=Object.freeze([
 {id:'guardian',label:'Ochrona VEXORIO',state:'prototype',requires:'review-integration'},
 {id:'developer',label:'Pomoc przy kodzie',state:'planned',requires:'sandbox-and-repository-auth'},
 {id:'studio-images',label:'Grafiki i okładki',state:'planned',requires:'image-model-runtime'},
 {id:'studio-video',label:'Generowanie filmów',state:'planned',requires:'video-model-runtime'},
 {id:'memory',label:'Pamięć projektów',state:'planned',requires:'secure-user-storage'}
]);
function listCapabilities(){return CAPABILITIES.map(x=>({...x}));}
function getCapability(id){return listCapabilities().find(x=>x.id===id)||null;}
if(typeof module!=='undefined')module.exports={listCapabilities,getCapability};
if(typeof window!=='undefined')window.GuardCapabilities={listCapabilities,getCapability};
