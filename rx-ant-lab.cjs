'use strict';
// RX ANT LAB: scheduled, bounded, reproducible experiment; does not train an AI model.
const fs=require('node:fs');
const path=require('node:path');
const {analyzeLightCurve}=require('./rx-stellar-signal.cjs');
const {createDNALineage}=require('./rx-dna-lineage.cjs');
function runExperiment(){
 const base=[10,10.1,9.9,10.2,9.8,10.1,10,15].map((brightness,i)=>({id:'o'+i,observedAt:new Date(Date.UTC(2026,0,i+1)).toISOString(),brightness}));
 const thresholds=[3,4,5];
 const results=thresholds.map(threshold=>({threshold,...analyzeLightCurve(base,{threshold})}));
 const passing=results.filter(x=>x.flags.length===1&&x.flags[0].id==='o7');
 const dna=createDNALineage();
 dna.register({id:'RXDNA-stellar-baseline',approved:false,testsPassed:passing.length===thresholds.length,notes:'Synthetic stellar anomaly benchmark; not a trained model'});
 return {schema:1,kind:'rx-ant-lab-experiment',dataset:'synthetic-v1',testedVariants:results.length,passingVariants:passing.length,results,dna:dna.snapshot(),note:'No model weights trained; requires real dataset and independently verified CI evidence'};
}
if(require.main===module){
 const report=runExperiment();
 const out=path.join('rx-bibi-reports','rx-ant-lab.json');
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log('RX ANT LAB:',report.passingVariants,'/',report.testedVariants,'synthetic candidates passed');
 if(report.passingVariants!==report.testedVariants)process.exitCode=1;
}
module.exports={runExperiment};
