'use strict';
// RX ENERGY LAB: engineering estimates, not generated electricity or a solar installation.
const fs=require('node:fs');
const path=require('node:path');
function estimateSolar({computerWatts=500,hoursPerDay=24,peakSunHours=4,panelWatts=450,systemEfficiency=0.8,batteryAutonomyHours=12}={}){
 const v=[computerWatts,hoursPerDay,peakSunHours,panelWatts,systemEfficiency,batteryAutonomyHours];
 if(!v.every(Number.isFinite)||computerWatts<=0||computerWatts>1e9||hoursPerDay<=0||hoursPerDay>24||peakSunHours<=0||peakSunHours>24||panelWatts<=0||panelWatts>1e6||systemEfficiency<=0||systemEfficiency>1||batteryAutonomyHours<0||batteryAutonomyHours>240)throw Error('Invalid solar parameters');
 const dailyKWh=computerWatts*hoursPerDay/1000;
 const panels=Math.ceil(computerWatts*hoursPerDay/(peakSunHours*panelWatts*systemEfficiency));
 const nominalPanelKW=panels*panelWatts/1000;
 const usableBatteryKWh=computerWatts*batteryAutonomyHours/1000;
 return {schema:1,kind:'rx-energy-lab-estimate',inputs:{computerWatts,hoursPerDay,peakSunHours,panelWatts,systemEfficiency,batteryAutonomyHours},dailyKWh,panels,nominalPanelKW,usableBatteryKWh,energyProduced:false,hardwareInstalled:false,note:'Illustrative energy budget; ignores weather variability, inverter losses beyond efficiency, thermal load, site constraints and battery usable-capacity margin.'};
}
if(require.main===module){
 const report=estimateSolar();
 const file=path.join('rx-bibi-reports','rx-energy-lab.json');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 console.log('RX ENERGY LAB:',report.dailyKWh,'kWh/day;',report.panels,'illustrative panels');
}
module.exports={estimateSolar};
