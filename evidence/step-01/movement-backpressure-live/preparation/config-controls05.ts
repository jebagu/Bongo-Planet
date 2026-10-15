import assert from 'node:assert/strict';

const original=process.env.BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT;
let controls=0;
try{
  for(const [i,value] of [undefined,'','relative-artifacts','/exclusive-owner/bongo-artifacts'].entries()){
    if(value===undefined)delete process.env.BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT;
    else process.env.BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT=value;
    const load=()=>import('./playwright.config.ts?control='+i);
    if(i<3){await assert.rejects(load,/Require absolute BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT/);controls++;}
    else{
      const config=(await load()).default;
      assert.equal(config.outputDir,value);assert.equal(config.workers,1);assert.equal(config.retries,0);
      assert.equal(config.timeout,90000);assert.equal(config.globalTimeout,100000);
      assert.equal(config.testMatch,'movement-backpressure-live.spec.ts');controls++;
    }
  }
}finally{
  if(original===undefined)delete process.env.BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT;
  else process.env.BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT=original;
}
console.log(JSON.stringify({status:'passed-config-source-controls',controls,browserLaunch:false,artifactDirectoryCreated:false}));
