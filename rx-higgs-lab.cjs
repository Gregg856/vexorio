'use strict';
// RX HIGGS LAB: deterministic educational invariant-mass reconstruction.
// Synthetic examples are not CERN data or evidence of particle discovery.
const fs=require('node:fs');
const path=require('node:path');
function analyzeEvents(events,{binWidth=2,minMass=110,maxMass=140}={}){
 if(!Array.isArray(events)||events.length>100000||!Number.isFinite(binWidth)||binWidth<=0||binWidth>10||!Number.isFinite(minMass)||!Number.isFinite(maxMass)||minMass>=maxMass||maxMass-minMass>1000)throw Error('Invalid experiment configuration');
 const bins=Array.from({length:Math.ceil((maxMass-minMass)/binWidth)},(_,i)=>({low:minMass+i*binWidth,high:Math.min(maxMass,minMass+(i+1)*binWidth),count:0}));
 let accepted=0;
 for(const event of events){
  if(!event||typeof event!=='object'||Array.isArray(event)||typeof event.massGeV!=='number'||!Number.isFinite(event.massGeV)||event.massGeV<0)throw Error('Invalid event');
  const m=event.massGeV;
  if(m>=minMass&&m<maxMass){bins[Math.floor((m-minMass)/binWidth)].count++;accepted++;}
 }
 const peak=bins.reduce((best,b)=>b.count>best.count?b:best,bins[0]);
 return {schema:1,kind:'rx-higgs-mass-histogram',unit:'GeV',events:events.length,accepted,range:[minMass,maxMass],binWidth,bins,peak:peak?{low:peak.low,high:peak.high,count:peak.count}:null,discoveryClaim:false,significanceCalculated:false,note:'Histogram only: no background model, uncertainty, statistical significance or Higgs discovery claim.'};
}
function syntheticDemo(){
 const masses=[111,114,116,118,120,121,123,124.3,124.8,125,125.1,125.4,126,127,129,132,136,139];
 return {...analyzeEvents(masses.map(massGeV=>({massGeV}))),dataset:'synthetic-demo-v1',realCERNData:false};
}
if(require.main===module){
 const report=syntheticDemo();
 const file=path.join('rx-bibi-reports','rx-higgs-lab.json');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 console.log('RX HIGGS LAB: synthetic histogram saved,',report.events,'events; discovery claim:',report.discoveryClaim);
}
module.exports={analyzeEvents,syntheticDemo};
