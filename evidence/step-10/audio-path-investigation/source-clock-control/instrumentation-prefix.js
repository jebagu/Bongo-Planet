const __bpOriginalRegisterProcessor = globalThis.registerProcessor.bind(globalThis);
let __bpProductionIndex = 0;
const registerProcessor = (name, Ctor) => __bpOriginalRegisterProcessor(name, class extends Ctor {
process(...args) { globalThis.__bpProductionClock = { index: __bpProductionIndex++, currentFrame, currentTime }; return super.process(...args); }
});
