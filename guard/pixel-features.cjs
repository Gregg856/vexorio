'use strict';
// Dependency-free feature extraction from ALREADY DECODED RGB/RGBA pixels.
// Decoding JPEG/PNG/WebP is intentionally outside this module.
// Not a content-safety classifier. No retention or external calls.
function extractPixelFeatures({width,height,data,channels=4}={}){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>12000||height>12000)throw Error('Invalid image dimensions');
 if(channels!==3&&channels!==4)throw Error('Invalid pixel channels');
 if(width*height>12_000_000)throw Error('Pixel limit exceeded');
 if(!(data instanceof Uint8Array)||data.length!==width*height*channels)throw Error('Invalid pixel buffer');
 const count=width*height, sums=[0,0,0], histogram=new Array(16).fill(0);
 let dark=0,bright=0,edgeSum=0,edges=0;
 const intensity=i=>(data[i]+data[i+1]+data[i+2])/3;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const idx=(y*width+x)*channels;
  for(let c=0;c<3;c++)sums[c]+=data[idx+c];
  const v=intensity(idx);
  histogram[Math.min(15,Math.floor(v/16))]++;
  if(v<64)dark++;
  if(v>=192)bright++;
  if(x+1<width){edgeSum+=Math.abs(v-intensity(idx+channels));edges++}
  if(y+1<height){edgeSum+=Math.abs(v-intensity(idx+width*channels));edges++}
 }
 return Object.freeze({version:'0.1.0',pixels:count,meanRGB:sums.map(s=>s/(count*255)),luminanceHistogram:histogram.map(n=>n/count),darkFraction:dark/count,brightFraction:bright/count,edgeContrast:edges?edgeSum/(edges*255):0,classification:'unknown',requiresHumanReview:true});
}
module.exports={extractPixelFeatures};
