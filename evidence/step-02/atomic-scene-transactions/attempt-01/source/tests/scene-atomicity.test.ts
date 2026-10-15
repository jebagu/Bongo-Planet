import {describe,expect,it} from 'vitest';
import {changeScene,emptyScene,newPiece,type Scene} from '../src/core/contracts';

function original():Scene {
  const scene=emptyScene();
  scene.pieces=[newPiece('generator',0,'pulse'),newPiece('note',1,'melody'),newPiece('beat',2,'drum')];
  return scene;
}
function expectUnchanged(scene:Scene,before:string):void {
  expect(JSON.stringify(scene)).toBe(before);
}

describe('scene add/delete transaction boundary',()=>{
  it.each(['generator','note','beat'] as const)('adds one %s while preserving the complete previous scene',kind=>{
    const scene=original(),before=JSON.stringify(scene);
    const result=changeScene(scene,draft=>draft.pieces.push(newPiece(kind,3,'added')));
    expect(result.pieces.map(p=>[p.id,p.vertex,p.kind])).toEqual([
      ['pulse',0,'generator'],['melody',1,'note'],['drum',2,'beat'],['added',3,kind]
    ]);
    expect(result.settings).toEqual(scene.settings);
    expectUnchanged(scene,before);
    result.settings.bpm=90;result.pieces[0].vertex=7;
    expectUnchanged(scene,before);
  });
  it('rejects occupied, duplicate-ID and out-of-range additions without leaking earlier draft edits',()=>{
    for(const [vertex,id]of [[1,'added'],[3,'melody'],[92,'added']] as const){
      const scene=original(),before=JSON.stringify(scene);
      expect(()=>changeScene(scene,draft=>{
        draft.settings.bpm=90;draft.pieces[0].vertex=7;
        draft.pieces.push(newPiece('note',vertex,id));
      })).toThrow();
      expectUnchanged(scene,before);
    }
  });
  it('rejects a ninth generator without committing any draft changes',()=>{
    const scene=emptyScene();scene.pieces=Array.from({length:8},(_,i)=>newPiece('generator',i,`pulse-${i}`));
    const before=JSON.stringify(scene);
    expect(()=>changeScene(scene,draft=>{draft.settings.key=7;draft.pieces.push(newPiece('generator',8,'ninth'));})).toThrow();
    expectUnchanged(scene,before);
  });
  it.each(['pulse','melody','drum'])('deletes only %s with independent old/new ownership',id=>{
    const scene=original(),before=JSON.stringify(scene);
    const result=changeScene(scene,draft=>{draft.pieces=draft.pieces.filter(p=>p.id!==id);});
    const declared:Record<string,string[]>= {pulse:['melody','drum'],melody:['pulse','drum'],drum:['pulse','melody']};
    expect(result.pieces.map(p=>p.id)).toEqual(declared[id]);
    expect(result.settings).toEqual(scene.settings);
    expectUnchanged(scene,before);
    result.pieces[0].vertex=8;
    expectUnchanged(scene,before);
  });
  it('does not commit a deletion when callback execution or final validation fails',()=>{
    for(const failure of ['callback','validation']){
      const scene=original(),before=JSON.stringify(scene);
      expect(()=>changeScene(scene,draft=>{
        draft.pieces=draft.pieces.filter(p=>p.id!=='melody');
        draft.settings.bpm=90;
        if(failure==='callback')throw Error('declared callback failure');
        draft.settings.bpm=181;
      })).toThrow();
      expectUnchanged(scene,before);
    }
  });
});
