'use strict';
// Perceptual-ish 8x8 grayscale signature from decoded pixels; advisory dataset hygiene.
// Detects similar luminance layouts, NOT content semantics.
function signature(p){
 if(!p||!Number.isSafeInteger(p.width)||!Number.isSafeInteger(p.height)||p.width<1||p.height<1||p.width>12000||p.height>12000||![3,4].includes(p.channels)||!(p.data instanceof Uint8Array)||p.width*p.height>12000000||p.data.length!==p.width*p.height*p.channels)throw Error('Invalid image pixels');
 const values=[];
 for(let gy=0;gy<8;gy++)for(let gx=0;gx<8;gx++){
  const x=Math.min(p.width-1,Math.floor((gx+0.5)*p.width/8));
  const y=Math.min(p.height-1,Math.floor((gy+0.5)*p.height/8));
  const i=(y*p.width+x)*p.channels;
  const alpha=p.channels===4?p.data[i+3]/255:1;
  values.push(((p.data[i]+p.data[i+1]+p.data[i+2])/3)*alpha+255*(1-alpha));
 }
 const mean=values.reduce((a,b)=>a+b,0)/64;
 return values.map(v=>v>=mean?1:0);
}
function similarity(a,b){
 const x=signature(a),y=signature(b);
 if(x.every(v=>v===x[0])||y.every(v=>v===y[0]))return 0;
 let equal=0;for(let i=0;i<64;i++)if(x[i]===y[i])equal++;
 return equal/64;
}
function checkSimilarImages(training,testing,{threshold=0.95}={}){
 if(!Number.isFinite(threshold)||threshold<0||threshold>1)throw Error('Invalid similarity threshold');
 if(!Array.isArray(training)||!Array.isArray(testing))throw Error('Invalid image datasets');
 const train=training.map(x=>signature(x?.pixels));
 const test=testing.map(x=>signature(x?.pixels));
 const overlaps=[];
 for(let i=0;i<test.length;i++)for(let j=0;j<train.length;j++){
  // Uniform/low-information signatures are not evidence of similarity.
  if(test[i].every(v=>v===test[i][0])||train[j].every(v=>v===train[j][0]))continue;
  let matches=0;for(let k=0;k<64;k++)if(test[i][k]===train[j][k])matches++;
  const score=matches/64;
  if(score>=threshold)overlaps.push({trainingIndex:j,testingIndex:i,similarity:score});
 }
 return {clean:overlaps.length===0,overlaps,threshold};
}
module.exports={signature,similarity,checkSimilarImages};
