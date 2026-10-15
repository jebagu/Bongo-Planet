import { afterEach, expect, it, vi } from 'vitest';
import { AudioAdapter } from '../src/audio/AudioAdapter';
import { emptyScene, newPiece } from '../src/core/contracts';
import type { AudioCommand } from '../src/audio/protocol';

afterEach(() => vi.unstubAllGlobals());

function audioEnvironment() {
  let resolveModule!: () => void;
  const moduleReady = new Promise<void>(resolve => { resolveModule = resolve; });
  const commands: AudioCommand[] = [];
  class Context {
    state = 'suspended';
    currentTime = 0;
    destination = {};
    onstatechange: (() => void) | null = null;
    denyActivation = false;
    audioWorklet = { addModule: vi.fn(() => moduleReady) };
    resume = vi.fn(async () => {
      if (this.denyActivation) throw new DOMException('Activation denied', 'NotAllowedError');
      this.state = 'running';
    });
    close = vi.fn(async () => { this.state = 'closed'; });
  }
  const context = new Context();
  const nodes: Node[] = [];
  class Node {
    port = { postMessage: (command: AudioCommand) => commands.push(command), onmessage: null as ((event: {data: unknown})=>void)|null };
    connect = vi.fn();
    disconnect = vi.fn();
    onprocessorerror: (() => void) | null = null;
    constructor() { nodes.push(this); }
  }
  vi.stubGlobal('AudioContext', class { constructor() { return context; } });
  vi.stubGlobal('AudioWorkletNode', Node);
  return { context, commands, nodes, resolveModule };
}

it('reports refused activation, emits no Play, and permits a later deliberate retry', async () => {
  const environment = audioEnvironment(), adapter = new AudioAdapter();
  const states: { state: string; detail?: string }[] = [];
  adapter.onState = (state, detail) => states.push({ state, detail });
  environment.context.denyActivation = true;
  const activation = adapter.enable();
  environment.resolveModule();
  await expect(activation).rejects.toThrow('Activation denied');
  expect(adapter.state).toBe('error');
  expect(states.at(-1)?.detail).toBe('Activation denied');
  expect(environment.commands.filter(command => command.type === 'play')).toHaveLength(0);
  environment.context.denyActivation = false;
  await adapter.enable();
  expect(adapter.state).toBe('ready');
  expect(environment.nodes).toHaveLength(1);
  expect(environment.context.audioWorklet.addModule).toHaveBeenCalledTimes(1);
  await adapter.dispose();
});

it('load during module setup cancels an earlier Play request and installs the newest paused scene', async () => {
  const environment = audioEnvironment(), adapter = new AudioAdapter();
  adapter.play();
  const activation = adapter.enable();
  const scene = emptyScene();
  scene.pieces = [newPiece('note', 3, 'latest-note')];
  adapter.setScene(scene, 'load');
  environment.resolveModule();
  await activation;
  expect(environment.commands).toEqual([{ type: 'scene', scene, mode: 'load' }]);
  expect(adapter.state).toBe('ready');
  expect(environment.commands.filter(command => command.type === 'play')).toHaveLength(0);
  await adapter.dispose();
});

for(const nativeError of [false,true])it(`keeps a fatal ${nativeError?'native':'reported'} processor failure visible until reload`,async()=>{
 const environment=audioEnvironment(),adapter=new AudioAdapter();
 const details:string[]=[];adapter.onState=(_state,detail)=>details.push(detail??'');adapter.onEvents=vi.fn();
 const activation=adapter.enable();environment.resolveModule();await activation;
 if(nativeError)environment.nodes[0].onprocessorerror!();
 else environment.nodes[0].port.onmessage!({data:{type:'error',message:'Clock moved backwards. Reload to recover.'}});
 expect(adapter.state).toBe('error');
 const resumeCount=environment.context.resume.mock.calls.length,commandCount=environment.commands.length;
 adapter.pause();adapter.setScene(emptyScene(),'load');adapter.play();
 expect(adapter.state).toBe('error');
 expect(environment.commands).toHaveLength(commandCount);
 await expect(adapter.enable()).rejects.toThrow('Reload to recover');
 expect(environment.context.resume).toHaveBeenCalledTimes(resumeCount);
 expect(adapter.state).toBe('error');
 const failure=details.at(-1);
 environment.nodes[0].port.onmessage!({data:{type:'events',events:[{type:'reset',session:'s',reason:'interrupted clock'},{type:'reset',session:'s',reason:'pending limit exceeded'}]}});
 expect(adapter.state).toBe('error');expect(details.at(-1)).toBe(failure);
 expect(adapter.onEvents).toHaveBeenCalledTimes(1);
 expect(environment.commands.at(-1)).toEqual({type:'ackEvents'});
 await adapter.dispose();
});
