'use strict';
// VEXORIO Guard 1.3 — unified advisory report. No writes or publication decisions.
const {screenListing}=require('./engine.cjs');
const {inspectImage}=require('./images.cjs');
const {findCandidates}=require('./duplicates.cjs');
const VERSION='1.3.0';
function evaluateListing(listing,{images=[],similarListings=[]}={}){
 const text=screenListing(listing);
 const imageResults=Array.isArray(images)?images.slice(0,20).map(inspectImage):[{status:'review',signals:['invalid_image_list'],classification:'unknown'}];
 const duplicateCandidates=findCandidates(listing,similarListings,{limit:10});
 const flags=[...text.signals,...imageResults.flatMap(r=>r.signals),...(duplicateCandidates.length?['possible_duplicate']:[])];
 const requiresHumanReview=text.status!=='no_text_signals'||imageResults.length>0||duplicateCandidates.length>0;
 return {version:VERSION,mode:'advisory',decision:'none',requiresHumanReview,text,images:imageResults,duplicates:duplicateCandidates,flags:[...new Set(flags)]};
}
module.exports={VERSION,evaluateListing};
