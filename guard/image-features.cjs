'use strict';
// Original dependency-free PNG/JPEG/WebP header inspection.
// This is NOT a content-safety classifier; no image data is retained.
const {inspectImage,MAX_BYTES}=require('./images.cjs');
function inspectImageBytes(bytes,mime){
 if(!(bytes instanceof Uint8Array)||bytes.length<1||bytes.length>MAX_BYTES)
  return {status:'review',classification:'unknown',signals:['invalid_image_bytes']};
 let width,height,detected;
 const u16=(i)=>(bytes[i]<<8)|bytes[i+1];
 const u32=(i)=>((bytes[i]*16777216)+(bytes[i+1]<<16)+(bytes[i+2]<<8)+bytes[i+3]);
 if(bytes.length>=24&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10){
  detected='image/png';width=u32(16);height=u32(20);
 }else if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'){
  detected='image/webp';
  if(bytes.length>=30&&String.fromCharCode(...bytes.slice(12,16))==='VP8X'){
   width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);
   height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);
  }
 }else if(bytes.length>=4&&bytes[0]===255&&bytes[1]===216){
  detected='image/jpeg';
  for(let i=2;i+9<bytes.length;){
   if(bytes[i]!==255){i++;continue}
   let marker=bytes[i+1];if(marker===255){i++;continue}
   if(marker===0||marker===216||marker===217||marker===1){i+=2;continue}
   if(i+4>bytes.length)break;
   const len=u16(i+2);if(len<2||i+2+len>bytes.length)break;
   if([192,193,194,195,198,199,201,202,203,205,206,207].includes(marker)&&len>=7){
    height=u16(i+5);width=u16(i+7);break;
   }
   i+=2+len;
  }
 }
 if(!detected)return {status:'review',classification:'unknown',signals:['unrecognized_image_signature']};
 if(detected!==mime)return {status:'review',classification:'unknown',signals:['mime_signature_mismatch']};
 return {...inspectImage({mime:detected,size:bytes.length,width,height}),metadata:{mime:detected,size:bytes.length,width:width??null,height:height??null}};
}
module.exports={inspectImageBytes};
