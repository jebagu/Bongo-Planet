class MixtureCapture extends AudioWorkletProcessor {
constructor(){super();this.index=0;this.sequence=0;this.blocks=[];this.source=[];this.input=[];}
process(inputs,outputs){for(const c of outputs[0]||[])c.fill(0);
const source=inputs[0]?.[0]||new Float32Array(0),input=inputs[1]?.[0]||new Float32Array(0);
this.blocks.push({index:this.index++,currentFrame,currentTime,quantum:outputs[0]?.[0]?.length||0,sourceLength:source.length,inputLength:input.length,sourceChannels:inputs[0]?.length||0,inputChannels:inputs[1]?.length||0});
this.source.push(new Float32Array(source));this.input.push(new Float32Array(input));
if(this.blocks.length===32){const join=arrays=>{const d=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let o=0;for(const a of arrays){d.set(a,o);o+=a.length;}return d;};const source=join(this.source),input=join(this.input);this.port.postMessage({sequence:this.sequence++,blocks:this.blocks,source,input},[source.buffer,input.buffer]);this.blocks=[];this.source=[];this.input=[];}return true;}}
registerProcessor('mixture-capture',MixtureCapture);