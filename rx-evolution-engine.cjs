'use strict';
// RX EVOLUTION ENGINE: proposal scoring only; never runs or deploys proposed code.
const MAX_PROPOSALS=100;
function createEvolutionEngine(){
 const proposals=new Map();let serial=0;
 function propose({antId,area,summary,evidence=[]}){
  if(!/^RX-[0-9]{6}$/.test(antId)||!['tests','security','performance','memory','code','business'].includes(area)||typeof summary!=='string'||summary.length<8||summary.length>300||!Array.isArray(evidence)||evidence.length>5||evidence.some(x=>typeof x!=='string'||x.length>160))throw Error('Invalid proposal');
  if(proposals.size>=MAX_PROPOSALS)throw Error('Proposal queue full');
  const id='RXEVO-'+String(++serial).padStart(6,'0');
  const proposal={id,antId,area,summary,evidence:[...evidence],status:'proposed',review:null};
  proposals.set(id,proposal);return structuredClone(proposal);
 }
 function evaluate(id,{testsPassed=false,securityPassed=false,reviewedBy=null}={}){
  const p=proposals.get(id);if(!p||p.status!=='proposed')throw Error('Invalid proposal state');
  if(typeof testsPassed!=='boolean'||typeof securityPassed!=='boolean')throw Error('Invalid evaluation');
  p.status=testsPassed&&securityPassed?'ready_for_human_review':'rejected';
  p.review={testsPassed,securityPassed,reviewedBy:null};
  return structuredClone(p);
 }
 function approve(id,reviewedBy){
  const p=proposals.get(id);if(!p||p.status!=='ready_for_human_review')throw Error('Not ready for approval');
  if(typeof reviewedBy!=='string'||!reviewedBy.trim())throw Error('Human approval required');
  p.status='approved_for_manual_implementation';p.review.reviewedBy=reviewedBy;
  return structuredClone(p);
 }
 return Object.freeze({propose,evaluate,approve,list:()=>[...proposals.values()].map(item=>structuredClone(item))});
}
module.exports={createEvolutionEngine};
