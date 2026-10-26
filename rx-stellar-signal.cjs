'use strict';
// RX STELLAR SIGNAL: robust, deterministic anomaly flags on normalized relative brightness.
// A flag is a candidate for review, not evidence of an astronomical discovery.
function analyzeLightCurve(observations,{minPoints=5,threshold=4}={}){
 if(!Array.isArray(observations)||observations.length>10000||!Number.isSafeInteger(minPoints)||minPoints<3||minPoints>10000||!Number.isFinite(threshold)||threshold<2||threshold>20)throw Error('Invalid analysis settings');
 const seen=new Set();
 const data=observations.map(o=>{
  if(!o||typeof o.id!=='string'||seen.has(o.id)||typeof o.observedAt!=='string'||!Number.isFinite(Date.parse(o.observedAt))||!Number.isFinite(o.brightness)||o.brightness<0||o.brightness>1e12)throw Error('Invalid observation');
  seen.add(o.id);return {id:o.id,time:Date.parse(o.observedAt),brightness:o.brightness};
 }).sort((a,b)=>a.time-b.time);
 if(data.length<minPoints)return {status:'insufficient_data',count:data.length,flags:[]};
 const sorted=data.map(o=>o.brightness).sort((a,b)=>a-b);
 const median=a=>a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;
 const center=median(sorted);
 const mad=median(sorted.map(v=>Math.abs(v-center)).sort((a,b)=>a-b));
 if(mad===0)return {status:'flat_baseline',count:data.length,median:center,flags:[]};
 const scale=1.4826*mad;
 return {status:'analyzed',count:data.length,median:center,flags:data.filter(o=>Math.abs(o.brightness-center)/scale>=threshold).map(o=>({id:o.id,observedAt:new Date(o.time).toISOString(),deviationSigma:Math.round(Math.abs(o.brightness-center)/scale*100)/100}))};
}
module.exports={analyzeLightCurve};
