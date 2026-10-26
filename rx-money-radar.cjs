'use strict';
// RX MONEY RADAR: deterministic opportunity triage; no scraping or unsolicited outreach.
function createMoneyRadar({capacity=100}={}){
 if(!Number.isSafeInteger(capacity)||capacity<1||capacity>500)throw Error('Invalid capacity');
 const leads=new Map();
 function add({source,url,title,service,estimatedRevenueCents=0,estimatedCostCents=0,permission='unknown'}){
  if(typeof source!=='string'||source.length<2||source.length>80||typeof title!=='string'||title.length<5||title.length>180||!['qa','automation','media','translation','website'].includes(service)||!['unknown','public_listing','invited'].includes(permission))throw Error('Invalid opportunity');
  if(!Number.isSafeInteger(estimatedRevenueCents)||estimatedRevenueCents<0||!Number.isSafeInteger(estimatedCostCents)||estimatedCostCents<0)throw Error('Invalid estimate');
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.hash||!parsed.hostname.includes('.'))throw Error('Invalid source URL');
  const canonical=parsed.origin+parsed.pathname+parsed.search;
  if(leads.has(canonical))return structuredClone(leads.get(canonical));
  if(leads.size>=capacity)throw Error('Radar full');
  const lead={id:'RXLEAD-'+String(leads.size+1).padStart(6,'0'),source,url:canonical,title,service,estimatedRevenueCents,estimatedCostCents,estimatedMarginCents:estimatedRevenueCents-estimatedCostCents,permission,status:'research_only'};
  leads.set(canonical,lead);return structuredClone(lead);
 }
 return Object.freeze({add,list:()=>[...leads.values()].map(item=>structuredClone(item))});
}
module.exports={createMoneyRadar};
