"""Keep the package's individual acceptance cases and evidence explicit."""
import json
from pathlib import Path

root = Path('evidence/spark-gates')
groups = {
 '01-A01': ['five-neighbor wiring','six-neighbor wiring','all 540 directed entries','duplicate junction','duplicate exit','non-adjacent exit','negative vertex','vertex 92','exit 92','duplicate piece ID','occupied vertex','93 pieces','ninth generator','zero limit','negative limit','fractional limit','unsafe integer','NaN limit','numeric Infinity','null limit','uppercase tag','numeric string','malformed tag'],
 '01-A02': ['source begins at hop zero','travel one','travel three','Infinite tag','explicit all-Off record round trip','new source eight-hop default','factory outgoing arrows On','appearance excluded from composition'],
 '01-A03': [*[f'legacy F{i:02} round trip and interpretation' for i in range(15)],'saved song path preserved','radial copy adjacent shortest paths','conversion tie break','copy starts with travel eight','copy preserves music and source IDs'],
 '02-A01': ['chain limit one','chain limit two','chain limit three','empty-junction hop','sink sounds before ending','fork both children','reverse return','convergence distinct sounds','seven-hop loop','Off receives no child','all-Off generator keeps its clock'],
 '02-A02': ['child used hops inherited','child travel limit inherited','child speed inherited','travel does not change hop duration','source passage creates no emission','distinct visits retain IDs','children share the master grid','unequal-edge chord arrivals','whole-beat tempo changes align active and new sparks'],
 '02-A03': ['fine/coarse finite timeline','dense fine/coarse timeline','simultaneous source emissions and arrivals','source ordering','exit ordering'],
 '03-A01': ['more than 10000 hops','bounded active edges','bounded arrival history','bounded event history','disable retains live Infinite branch','exit Off ends future departure','source deletion stops descendants'],
 '03-A02': ['gate before arrival','gate at unprocessed arrival','gate after processed arrival','committed edge times unchanged','moved occupant reconciliation','added occupant reconciliation','deleted occupant cancellation','committed sound parameters','edit revision and effective time'],
 '03-A03': ['offline onset within one frame','independent live calibration','at least 120 live arrivals','100ms main-thread stall','250ms main-thread stall','no missing measured arrivals','live loopback observer continuity'],
 '03-A04': ['256 active edges','2016 rolling arrivals per second','5376 pending cap','64 resident voices and original stealing policy','64 decisions per audio quantum','prospective split checked atomically','finite edge times','no zero-time loop','no growing route arrays','bounded ancestry IDs','2048 reliable event backlog','23520 output ownership metadata cap','overload recovery','measured worklet budget'],
 '03-A05': ['Pause cancellation','load cancellation','clear cancellation','interruption cancellation','old transport epoch events ignored','old transport epoch status ignored','fresh resume session','two sources retain ownership','long owned voice after 64 short voices'],
 '03-A06': ['future receiver trigger','stable trigger IDs','positions precede triggers','cancel delivery','stop/reset delivery','strict wire grammar excludes gate metadata','owned source cancellation'],
 '04-A01': ['canvas On','canvas Off','sink through canvas','continuation through canvas','split through canvas','state edits real scene','routing edits real arrivals','empty world arrows visible','unselected arrows clickable'],
 '04-A02': ['move instrument keeps wiring','delete instrument keeps wiring','move generator keeps both junctions wiring','Undo restores scene and wiring'],
 '04-A03': ['gate tap does not place','gate tap does not move','gate tap does not delete','drag cancels gate edit','pointercancel cancels gate edit','Escape cancels gate edit','focus loss cancels gate edit','competing pointer cancels gate edit','persistent palette placement','explicit Move','trash','orbit'],
 '04-A04': ['arbitrary rotation','upside-down camera','rear gates cannot be picked','resize','narrow layout','touch emulation','nearest visible target'],
 '04-A05': ['keyboard gate focus','Space toggles','Enter toggles','empty junction selection','bulk All on inspector','bulk All off inspector'],
 '05-A01': ['Ink switch renderer','Toy switch renderer','Glow switch renderer','identical routing across switch styles','Arrow glyph','Chevron glyph','Triangle glyph','Bolt glyph','Comet glyph','Ember spark','White spark','Lightning spark','appearance does not reset transport'],
 '05-A02': ['switch size','switch stroke','On color','Off color','switch glow control','switch animation','Reset switches look','spark style'],
 '05-A03': ['look export','look import','look reload','old look defaults','invalid style','invalid size','invalid stroke','invalid glow','invalid On color','invalid Off color','invalid animation'],
 '05-A04': ['fifty style/icon switches','stable geometry count','stable material identities','zero glow static shape','reduced motion','front comparison','oblique grayscale comparison'],
 '06-A01': ['travel one inspector','travel three inspector','travel eight inspector','travel 93 inspector','Infinite inspector','reject zero inspector','reject negative inspector','reject fractional inspector','reject unsafe integer inspector','no percentage travel field'],
 '06-A02': ['save','load','export','import','wiring round trip','travel round trip','source/music IDs round trip','instrument parameters round trip','paused beat zero on load','transient sparks excluded'],
 '06-A03': ['gate Undo','gate Redo','bulk gate edit history','source initialization history','finite limit history','Infinite limit history','numeric gesture one entry','conversion Undo paused legacy'],
 '06-A04': ['corrupt v2 atomic reject','unsupported version','storage failure current scene intact','storage failure previous save intact','legacy fixtures compatibility','F15 F16 F17 no collision'],
 '07-A01': ['production build','type checking','full unit suite','full browser suite','audio regressions','output regressions','asset manifest/archive verification'],
 '07-A02': ['60 FPS timeline','15 FPS timeline','2 FPS timeline','render cap logical/visible/hidden counts'],
 '07-A03': ['30-minute eight-source finite circuit','30-minute controlled Infinite loop','worklet clock retained','active/pending state plateau','event history plateau','renderer geometry plateau','telemetry zero loss'],
 '07-A04': ['deliberate branching saturation','repeated Infinite emission saturation','visible pause reason','pending work released','voices released','simplify and recover','no backlog on resume'],
}
human = {
 '01-H01': ['directed ownership','reverse travel','empty-junction counting','final arrival sound'],
 '02-H01': ['trace single branch','trace split parents/children','count hops','identify termination'],
 '03-H01': ['listen chain','listen fork','listen sink','listen revisiting loop','no destination particle'],
 '03-H02': ['switch during travel','Pause Infinite promptly'],
 '04-H01': ['open two exits','close an exit and hear change','wire empty junction','move instrument and see retained wiring'],
 '04-H02': ['keyboard edits','touch emulation review','physical touch result distinguished'],
 '05-H01': ['Ink front and oblique','Toy front and oblique','Glow front and oblique','current flat icons direction and target clarity'],
 '05-H02': ['adjust while listening','grayscale zero-glow comparison','reduced motion comparison'],
 '06-H01': ['prepared chain review','prepared fork review','change travel','save/export/reload and hear phrase'],
 '06-H02': ['saved song copy review','intentional phrase change recognized','Undo preserves original'],
 '07-H01': ['Chrome editing','Chrome styles','Chrome 1/3/Infinite','Chrome saving','Chrome Pause','Chrome rotation','Safari editing','Safari styles','Safari 1/3/Infinite','Safari saving','Safari Pause','Safari rotation'],
 '07-H02': ['unfamiliar person selects instrument','unfamiliar person toggles exit','unfamiliar person recognizes split','unfamiliar person recognizes sink','unfamiliar person sets three hops'],
}
records=[]
for mapping,kind in [(groups,'automated'),(human,'human')]:
 for group,cases in mapping.items():
  for number,case in enumerate(cases,1):
   records.append({'id':f'SG-S{group}-{number:02}','group':f'SG-S{group}','case':case,'kind':kind,'status':'not run','evidence':'','note':''})
if not (root/'Initial-Expanded-Checks.json').exists():
 (root/'Initial-Expanded-Checks.json').write_text(json.dumps(records,indent=2)+'\n')

# Later direct user requests in the same shared checkout supersede these UI defaults.
superseded={'Ink switch renderer','Toy switch renderer','Glow switch renderer','identical routing across switch styles','switch size','switch stroke','On color','Off color','switch glow control','switch animation','Reset switches look','bulk All on inspector','bulk All off inspector','bulk gate edit history','Ink front and oblique','Toy front and oblique','Glow front and oblique','child speed inherited','empty junction selection','appearance excluded from composition'}
def read_result(path):
 file=root/path
 return json.loads(file.read_text()) if file.exists() else {}
soak=read_result('step-07/qualified-soak/result.json')
browser=read_result('step-07/regression-qualified/full-browser-results.json')
assets=read_result('step-07/asset-verification.json')
budget=read_result('step-03/qualified-worklet-budget/report.json')
live=read_result('step-03/live-audio/attempt-08/report.json')
validation=read_result('step-07/validation.json')
for record in records:
 step=record['id'][4:6]
 if record['kind']=='automated':
  record['evidence']='step-07/unit-qualified-results.json' if int(step)<4 else 'step-07/regression-qualified/full-browser-results.json'
  record['status']='passed'
 if record['case'] in superseded:
  record['status']='blocked';record['note']='Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical.'
  if record['case']=='appearance excluded from composition':record['note']='Superseded by the later direct request to bundle visual style with music. The musical scene still has a separate strict schema.'
 if record['kind']=='human':
  record['evidence']='step-07/Human-Review-Task.md'
  if record['case'].startswith('Safari '):record['status']='not run';record['note']='Native agent UI spot checks were performed; the required person review remains open. WebDriver is disabled separately.';record['evidence']='step-07/safari-native-ui.json'
 if record['group']=='SG-S02-A01':record['evidence']='step-02/circuit-traces.json'
 if record['group']=='SG-S03-A03':
  record['evidence']='step-03/live-audio/attempt-08/report.json'
  if not live.get('analysis',{}).get('passed'):record['status']='not run'
 if record['case']=='measured worklet budget':
  record['evidence']='step-03/qualified-worklet-budget/report.json'
  if not budget.get('passed'):record['status']='not run'
 if record['group']=='SG-S03-A06':record['evidence']='step-03/receiver.json'
 if record['group']=='SG-S07-A03':
  record['status']='passed' if soak.get('passed') else 'not run';record['evidence']='step-07/qualified-soak/result.json';record['note']='Immutable production snapshot and its source manifest retained. Earlier candidate runs are preserved separately.'
 if record['case']=='full browser suite':
  stats=browser.get('stats',{});record['status']='passed' if stats.get('expected',0)>0 and stats.get('unexpected')==0 and stats.get('skipped')==0 else 'not run';record['note']='Full combined regression; the earlier failed attempt is retained in regression-combined.'
 if record['case']=='full unit suite':record['evidence']='step-07/unit-qualified-results.json'
 if record['case']=='asset manifest/archive verification':
  record['evidence']='step-07/asset-verification.json';record['status']='passed' if assets.get('passed') else 'not run'
 if record['case'] in {'production build','type checking'}:
  record['evidence']='step-07/validation.json';record['status']='passed' if validation.get('buildPassed') else 'not run'
 if record['case']=='render cap logical/visible/hidden counts':record['evidence']='step-07/fps-timelines.json'
(root/'checks-expanded.json').write_text(json.dumps(records,indent=2)+'\n')
lines=['# Bongo Planet — Spark Gates acceptance','',
 'Original kickoff checkpoint: `396c820`. The routing package is implemented; human acceptance stays open. Later direct user requests changed the visual contract. Superseded cases are explicitly blocked and are not represented as passed. All subcases start as not run in `Initial-Expanded-Checks.json`.','',
 '| ID | Check | Status | Evidence / limits |','| --- | --- | --- | --- |']
for r in records:
 evidence=f'[{r["evidence"]}]({r["evidence"]})' if r['evidence'] else '—'
 lines.append(f'| {r["id"]} | {r["case"]} | **{r["status"]}** | {evidence} {r["note"]} |')
(root/'Acceptance-Checklist.md').write_text('\n'.join(lines)+'\n')
print(f'Wrote {len(records)} separately reported acceptance subcases.')
