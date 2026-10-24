'use strict';
// Spatial 3x3 luminance grid from already-decoded RGB/RGBA pixels.
// Experimental feature extraction only; not a content safety classifier.
function extractSpatialFeatures({width,height,data,channels=4}={}){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>12000||height>12000)throw Error('Invalid image dimensions');
 if(channels!==3&&channels!==4)throw Error('Invalid pixel channels');
 if(width*height>12_000_000)throw Error('Pixel limit exceeded');
 if(!(data instanceof Uint8Array)||data.length!==width*height*channels)throw Error('Invalid pixel buffer');
 const sums=Array(9).fill(0),counts=Array(9).fill(0);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const cell=Math.min(2,Math.floor(y*3/height))*3+Math.min(2,Math.floor(x*3/width));
  const i=(y*width+x)*channels;
  const alpha=channels===4?data[i+3]/255:1;
  // Composite transparent pixels on white to avoid arbitrary hidden RGB values.
  const lum=((data[i]+data[i+1]+data[i+2])/3)*alpha+255*(1-alpha);
  sums[cell]+=lum/255;counts[cell]++;
 }
 return Object.freeze({version:'0.1.0',grid: Object.freeze(sums.map((sum,i)=>counts[i]?sum/counts[i]:null)),classification:'unknown',requiresHumanReview:true});
}
module.exports={extractSpatialFeatures};
