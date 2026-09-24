function initActivity(root,explore=false){
const prefix=explore?'explore-':'';
const $ = id => document.getElementById(prefix+id);
const defaults = explore?[]:[
  {name:'Iced coffee',x:-3,y:3,color:'#6d7e98'},
  {name:'Hot coffee',x:3,y:3,color:'#cc9460'},
  {name:'Iced tea',x:-3,y:0,color:'#6f9678'},
  {name:'Hot tea',x:3,y:0,color:'#9a7794'},
  {name:'Iced milk',x:-3,y:-3,color:'#d2ad43'},
  {name:'Hot milk',x:3,y:-3,color:'#b78282'}
];
const axisIds=explore?['xMin','xMax','yMin','yMax','zMin','zMax']:['xMin','xMax','yMin','yMax'];
const storageKey=explore?'concept-space-explore-v1':'concept-space-guided-v2';
let animals=structuredClone(defaults), selected=0, solved=false;
let saved;
try { saved=JSON.parse(localStorage.getItem(storageKey)); } catch {}
let threeD=explore && saved?.threeD===true;
let viewAngle=35;
const zValue=a=>Number.isFinite(a?.z)&&Math.abs(a.z)<=5?a.z:0;
const coords=a=>[a.x,a.y,...(threeD?[zValue(a)]:[])].map(fmt).join(', ');
const customColors=['#528b89','#9470a5','#b5774f','#7e8d40'];
const validPosition=a=>a && Number.isFinite(a.x) && Number.isFinite(a.y) && Math.abs(a.x)<=5 && Math.abs(a.y)<=5;
if(Array.isArray(saved?.animals)){
  animals=defaults.map((a,i)=>saved.animals[i]?.name===a.name && validPosition(saved.animals[i])?{...a,x:saved.animals[i].x,y:saved.animals[i].y}:{...a});
  for(const a of saved.animals.slice(defaults.length)){
    if(!validPosition(a)||typeof a.name!=='string')continue;
    const name=a.name.trim();
    if(!name||name.length>32||animals.some(v=>v.name.toLowerCase()===name.toLowerCase()))continue;
    animals.push({name,x:a.x,y:a.y,z:zValue(a),color:customColors[(animals.length-defaults.length)%customColors.length]});
  }
}
let arrows=Array.isArray(saved?.arrows)?saved.arrows.filter(a=>validPosition(a?.from)&&validPosition(a?.to)&&Math.hypot(a.to.x-a.from.x,a.to.y-a.from.y,zValue(a.to)-zValue(a.from))>0).map(a=>({from:{x:a.from.x,y:a.from.y,z:zValue(a.from)},to:{x:a.to.x,y:a.to.y,z:zValue(a.to)}})):[];
let drawing=true, arrowStart=null;
const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Use the activity labels even when loading an older saved map.
Object.entries({xMin:'Cold',xMax:'Hot',yMin:'No caffeine',yMax:'More caffeine'}).forEach(([id,value])=>{$(id).value=explore?(typeof saved?.axes?.[id]==='string'?saved.axes[id].slice(0,32):''):value;});
if(explore)for(const id of ['zMin','zMax'])$(id).value=typeof saved?.axes?.[id]==='string'?saved.axes[id].slice(0,32):'';
let stage=Number.isInteger(saved?.stage) && saved.stage>=0 && saved.stage<=4 ? saved.stage : 0;
$('prediction').innerHTML += animals.map(a=>`<option>${escapeHTML(a.name)}</option>`).join('');
$('prediction').value=animals.some(a=>a.name===saved?.prediction)?saved.prediction:'';
$('reason').value=typeof saved?.reason==='string'?saved.reason:'';
if(explore)stage=4;else if(stage>2 && !$('prediction').value)stage=2;

const fmt=n=>(Math.abs(n)<0.05?0:n).toFixed(1);
const px=x=>80+(x+5)*48, py=y=>560-(y+5)*48;
function snapshot(){return {threeD,arrows,stage,prediction:$('prediction').value,reason:$('reason').value,animals,axes:Object.fromEntries(axisIds.map(id=>[id,$(id).value])),...(typeof saved?.reflection==='string'?{reflection:saved.reflection}:{})};}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(snapshot()));}catch{/* The activity also works without browser storage. */}}
function analogy(){const a=animals[0],b=animals[1],d=animals[3];return {a,b,d,x:d.x-b.x+a.x,y:d.y-b.y+a.y};}
function line(x1,y1,x2,y2,attributes=''){return `<line x1="${px(x1)}" y1="${py(y1)}" x2="${px(x2)}" y2="${py(y2)}" ${attributes}/>`;}
// Orthographic projection; keep Y vertical and rotate the X/Z plane.
// Label anchors extend beyond ±5, so projection must not apply saved-coordinate bounds.
function project(a){const t=viewAngle*Math.PI/180,z=a.z??0;return {x:320+30*(a.x*Math.cos(t)-z*Math.sin(t)),y:320-30*(a.y+0.45*(a.x*Math.sin(t)+z*Math.cos(t)))};}
function unproject(p,z=0){const t=viewAngle*Math.PI/180;const x=((p.x-320)/30+z*Math.sin(t))/Math.cos(t);return {x,y:(320-p.y)/30-0.45*(x*Math.sin(t)+z*Math.cos(t)),z};}
function segment(a,b,attrs=''){const p=project(a),q=project(b);return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" ${attrs}/>`;}
function draw3D(){
 let html=`<defs><marker id="${prefix}custom-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#256b52"/></marker></defs>`;
 for(let n=-5;n<=5;n++){
  html+=segment({x:n,y:-5,z:-5},{x:n,y:-5,z:5},'stroke="#e2e8dc"')+segment({x:-5,y:-5,z:n},{x:5,y:-5,z:n},'stroke="#e2e8dc"');
 }
 for(const axis of ['x','y','z']){
  const others=['x','y','z'].filter(v=>v!==axis);
  for(const u of [-5,5])for(const v of [-5,5])html+=segment({[axis]:-5,[others[0]]:u,[others[1]]:v},{[axis]:5,[others[0]]:u,[others[1]]:v},'stroke="#cbd5c5"');
  const a={x:0,y:0,z:0},b={...a};a[axis]=-5;b[axis]=5;
  html+=segment(a,b,'stroke="#71836b" stroke-width="1.8"');
  for(const value of [-5,-3,-1,1,3,5]){const tick={x:0,y:0,z:0};tick[axis]=value;const p=project(tick);html+=`<circle cx="${p.x}" cy="${p.y}" r="2" fill="#71836b"/><text x="${p.x+5}" y="${p.y+12}" font-size="9">${value}</text>`;}

  for(const sign of [-1,1]){const end={x:0,y:0,z:0};end[axis]=sign*6;const p=project(end);html+=`<text x="${p.x}" y="${p.y}" text-anchor="middle" font-size="12" font-weight="600">${axis.toUpperCase()} ${sign<0?'−':'+'}: ${escapeHTML($(axis+(sign<0?'Min':'Max')).value||String(sign*5))}</text>`;}
 }
 arrows.forEach((a,i)=>{const p=project({x:(a.from.x+a.to.x)/2,y:(a.from.y+a.to.y)/2,z:(zValue(a.from)+zValue(a.to))/2});html+=segment(a.from,a.to,`stroke="#256b52" stroke-width="3" marker-end="url(#${prefix}custom-arrow)"`)+`<text x="${p.x+8}" y="${p.y-8}">${i+1}</text>`;});
 if(arrowStart){const p=project(arrowStart);html+=`<circle cx="${p.x}" cy="${p.y}" r="11" fill="none" stroke="#256b52"/><line id="${prefix}arrow-preview" x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${p.y}" stroke="#256b52" stroke-dasharray="5 4"/>`;}
 animals.map((a,i)=>({a,i})).sort((u,v)=>(u.a.x-v.a.x)*Math.sin(viewAngle*Math.PI/180)+(zValue(u.a)-zValue(v.a))*Math.cos(viewAngle*Math.PI/180)).forEach(({a,i})=>{
  const p=project(a);html+=segment({...a,y:-5},a,'stroke="#b9c7b2" stroke-dasharray="3 4" pointer-events="none"');
  html+=`<g class="point" data-index="${i}" tabindex="0" role="button" aria-label="${escapeHTML(a.name)}, X ${fmt(a.x)}, Y ${fmt(a.y)}, Z ${fmt(zValue(a))}. Arrow keys move X/Y; Page Up/Down moves Z." aria-pressed="${selected===i}"><circle cx="${p.x}" cy="${p.y}" r="22" fill="transparent"/><circle class="point-ring" cx="${p.x}" cy="${p.y}" r="15" fill="none" stroke="${selected===i?a.color:'none'}"/><circle cx="${p.x}" cy="${p.y}" r="7" fill="${a.color}" stroke="white" stroke-width="2"/><text x="${p.x+13}" y="${p.y-12}">${escapeHTML(a.name)}</text></g>`;
 });
 const focused=$('map').querySelector(':focus')?.dataset.index;
 $('map').innerHTML=html;
 if(focused!==undefined)$('map').querySelector(`[data-index="${focused}"]`)?.focus({preventScroll:true});
 updateEditor();
}
function draw(){
 if(threeD){draw3D();return;}
 let html='<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ca713d"/></marker><marker id="custom-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#256b52"/></marker><clipPath id="plot-clip"><rect x="80" y="80" width="480" height="480"/></clipPath></defs><rect x="80" y="80" width="480" height="480" rx="2" fill="#f6f8f2"/>';
 for(let n=-5;n<=5;n++){html+=line(n,-5,n,5,`stroke="${n===0?'#aab7a5':'#e2e8dc'}" stroke-width="${n===0?1.5:1}"`)+line(-5,n,5,n,`stroke="${n===0?'#aab7a5':'#e2e8dc'}" stroke-width="${n===0?1.5:1}"`);if(n!==0)html+=`<text x="${px(n)}" y="${py(0)+17}" text-anchor="middle" font-size="9">${n}</text><text x="${px(0)-10}" y="${py(n)+3}" text-anchor="end" font-size="9">${n}</text>`;}
 html+=`<text x="320" y="43" text-anchor="middle" font-size="13" font-weight="600">${escapeHTML($('yMax').value || '+Y')}</text><text x="320" y="606" text-anchor="middle" font-size="13" font-weight="600">${escapeHTML($('yMin').value || '−Y')}</text><text transform="translate(28 320) rotate(-90)" text-anchor="middle" font-size="13" font-weight="600">${escapeHTML($('xMin').value || '−X')}</text><text transform="translate(612 320) rotate(90)" text-anchor="middle" font-size="13" font-weight="600">${escapeHTML($('xMax').value || '+X')}</text>`;
 if(solved){const {a,b,d,x,y}=analogy();$('guide-status').textContent=`Predicted X = (${fmt(x)}, ${fmt(y)})${Math.abs(x)>5||Math.abs(y)>5?' · outside the visible grid':''}.`;html+='<g clip-path="url(#plot-clip)">'+line(a.x,a.y,b.x,b.y,'stroke="#ca713d" stroke-width="2.5" marker-end="url(#arrow)"')+line(x,y,d.x,d.y,'stroke="#ca713d" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#arrow)"')+'</g>';if(Math.abs(x)<=5&&Math.abs(y)<=5)html+=`<circle cx="${px(x)}" cy="${py(y)}" r="17" fill="#fbf1e4" stroke="#ca713d" stroke-dasharray="4 3"/><text x="${px(x)}" y="${py(y)+5}" text-anchor="middle" font-size="14" style="fill:#a35428">X</text>`;}
 if(stage===4){
  html+='<g pointer-events="none">';
  arrows.forEach((a,i)=>{html+=line(a.from.x,a.from.y,a.to.x,a.to.y,'stroke="#256b52" stroke-width="3" marker-end="url(#custom-arrow)"');html+=`<text x="${px((a.from.x+a.to.x)/2)+8}" y="${py((a.from.y+a.to.y)/2)-8}" font-size="13" style="fill:#256b52;paint-order:stroke;stroke:white;stroke-width:4px">${i+1}</text>`;});
  if(arrowStart)html+=`<circle cx="${px(arrowStart.x)}" cy="${py(arrowStart.y)}" r="11" fill="none" stroke="#256b52" stroke-width="3"/><line id="arrow-preview" x1="${px(arrowStart.x)}" y1="${py(arrowStart.y)}" x2="${px(arrowStart.x)}" y2="${py(arrowStart.y)}" stroke="#256b52" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#custom-arrow)"/>`;
  html+='</g>';
 }
 animals.forEach((a,i)=>{html+=`<g class="point" data-index="${i}" tabindex="0" role="button" aria-label="${escapeHTML(a.name)}, X ${fmt(a.x)}, Y ${fmt(a.y)}. Use arrow keys to move." aria-pressed="${selected===i}"><circle cx="${px(a.x)}" cy="${py(a.y)}" r="22" fill="transparent"/><circle class="point-ring" cx="${px(a.x)}" cy="${py(a.y)}" r="15" fill="${selected===i?a.color+'20':'none'}" stroke="${selected===i?a.color:'none'}"/><circle cx="${px(a.x)}" cy="${py(a.y)}" r="7" fill="${a.color}" stroke="#fff" stroke-width="2"/><text x="${px(a.x)+(a.x>3?-17:17)}" y="${py(a.y)-13}" text-anchor="${a.x>3?'end':'start'}">${escapeHTML(a.name)}</text></g>`;});
 const focused=root.contains(document.activeElement)?document.activeElement?.closest?.('.point')?.dataset.index:undefined;
 $('map').innerHTML=prefix?html.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}${id})`):html;
 if(focused!==undefined)$('map').querySelector(`[data-index="${focused}"]`)?.focus({preventScroll:true});
 updateEditor();
}
function updateEditor(){const a=animals[selected];root.querySelector('.coordinate-editor').hidden=!a;if(!a)return;$('remove-drink').hidden=selected<defaults.length;for(const axis of ['x','y'])$(axis+'-coordinate').disabled=stage===0&&selected<defaults.length;$('selected-name').textContent=a.name;$('coordinates').textContent=`(${coords(a)})`;$('x-coordinate').value=a.x;$('y-coordinate').value=a.y;if(explore)$('z-coordinate').value=zValue(a);root.querySelectorAll('.animal-chip').forEach((b,i)=>b.setAttribute('aria-pressed',i===selected));}
function refreshDrinkChoices(){
 for(const id of ['arrow-from','arrow-to']){const old=$(id).value;$(id).innerHTML=animals.map((a,i)=>`<option value="${i}">${escapeHTML(a.name)}</option>`).join('');$(id).value=animals[+old]?old:(id==='arrow-from'?'0':'1');if(!$(id).value)$(id).value=id==='arrow-from'?'0':'1';}
 const prediction=$('prediction').value;
 $('prediction').innerHTML='<option value="">Choose a drink</option>'+animals.map(a=>`<option>${escapeHTML(a.name)}</option>`).join('');
 $('prediction').value=animals.some(a=>a.name===prediction)?prediction:'';
 $('add-arrow').querySelector('button').disabled=animals.length<2;
 $('animal-list').innerHTML=animals.length?animals.map((a,i)=>`<button class="animal-chip" data-index="${i}" aria-pressed="${i===selected}"><i style="background:${a.color}"></i>${escapeHTML(a.name)}</button>`).join(''):'<p class="control-hint">Your map is empty. Add your first concept below.</p>';
}
refreshDrinkChoices();
$('add-drink').addEventListener('submit',e=>{
 e.preventDefault();
 const name=$('drink-name').value.trim();
 if(!name||name.length>32){$('drink-status').textContent='Enter a name (1–32 characters).';$('drink-name').focus();return;}
 if(animals.some(a=>a.name.toLowerCase()===name.toLowerCase())){$('drink-status').textContent='That name is already on the map. Choose a different name.';$('drink-name').focus();return;}
 animals.push({name,x:0,y:0,z:0,color:customColors[(animals.length-defaults.length)%customColors.length]});
 selected=animals.length-1;
 refreshDrinkChoices();draw();save();
 $('drink-name').value='';$('drink-status').textContent=`${name} added at (${threeD?'0, 0, 0':'0, 0'}). Use the sliders to position it.`;
 $('x-coordinate').focus();
});
$('remove-drink').addEventListener('click',()=>{
 if(selected<defaults.length)return;
 const [removed]=animals.splice(selected,1);selected=0;
 refreshDrinkChoices();
 if(!explore&&stage>2&&!$('prediction').value)stage=2;
 renderStage();save();$('drink-status').textContent=`${removed.name} removed.`;$('drink-name').focus();
});
 $('animal-list').addEventListener('click',e=>{const b=e.target.closest('button');if(b){selected=+b.dataset.index;draw();}});
 for(const axis of (explore?['x','y','z']:['x','y']))$(axis+'-coordinate').addEventListener('input',e=>{if(stage<1&&selected<defaults.length)return;animals[selected][axis]=+e.target.value;draw();save();});
 axisIds.forEach(id=>$(id).addEventListener('input',()=>{draw();save();}));
 let dragging=null;
 $('map').addEventListener('pointerdown',e=>{if(stage===4&&drawing){if(e.button!==0)return;const pos=mapPosition(e);if(!pos)return;e.preventDefault();$('map').focus();if(!arrowStart){arrowStart=pos;$('arrow-status').textContent='Start selected. Click the end point (Esc to cancel).';}else{addArrow(arrowStart,pos);}updateArrowTools();draw();return;}const point=e.target.closest('.point');if(!point)return;selected=+point.dataset.index;if(stage<1&&selected<defaults.length){draw();return;}dragging={index:selected,id:e.pointerId};$('map').setPointerCapture(e.pointerId);draw();e.preventDefault();});
 $('map').addEventListener('pointermove',e=>{if(stage===4&&drawing&&arrowStart){const pos=mapPosition(e),preview=$('arrow-preview');if(pos&&preview){preview.setAttribute('x2',threeD?project(pos).x:px(pos.x));preview.setAttribute('y2',threeD?project(pos).y:py(pos.y));}return;}if(!dragging||dragging.id!==e.pointerId)return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform($('map').getScreenCTM().inverse());if(threeD){const pos=unproject(point,zValue(animals[dragging.index]));for(const axis of ['x','y'])animals[dragging.index][axis]=Math.round(Math.max(-5,Math.min(5,pos[axis]))*10)/10;draw();return;}animals[dragging.index].x=Math.round(Math.max(-5,Math.min(5,(point.x-80)/48-5))*10)/10;animals[dragging.index].y=Math.round(Math.max(-5,Math.min(5,(560-point.y)/48-5))*10)/10;draw();});
 function endDrag(){if(dragging){dragging=null;save();}}
 $('map').addEventListener('pointerup',endDrag);$('map').addEventListener('pointercancel',endDrag);$('map').addEventListener('lostpointercapture',endDrag);
 $('map').addEventListener('keydown',e=>{if(e.key==='Escape'){arrowStart=null;updateArrowTools();draw();return;}if(stage===4&&drawing&&(e.key==='Enter'||e.key===' ')){const target=e.target.closest('.point');if(target){e.preventDefault();const a=animals[+target.dataset.index];if(arrowStart)addArrow(arrowStart,a);else arrowStart={x:a.x,y:a.y,z:zValue(a)};updateArrowTools();draw();return;}}const point=e.target.closest('.point');if(!point)return;selected=+point.dataset.index;if(e.key==='Enter'||e.key===' '){e.preventDefault();draw();return;}const moves={ArrowLeft:['x',-0.1],ArrowRight:['x',0.1],ArrowDown:['y',-0.1],ArrowUp:['y',0.1]};if(threeD){moves.PageUp=['z',0.1];moves.PageDown=['z',-0.1];}if(moves[e.key]){e.preventDefault();if(stage<1&&selected<defaults.length)return;const [axis,delta]=moves[e.key];animals[selected][axis]=Math.round(Math.max(-5,Math.min(5,(animals[selected][axis]||0)+delta))*10)/10;draw();save();}});
 $('reset').addEventListener('click',()=>{animals=[...structuredClone(defaults),...animals.slice(defaults.length)];selected=0;solved=false;Object.entries({xMin:'Cold',xMax:'Hot',yMin:'No caffeine',yMax:'More caffeine'}).forEach(([id,value])=>$(id).value=value);renderStage();save();});
 if(explore){
  drawing=false;
  function syncDimensions(){
   $('third-axis').checked=threeD;
   for(const id of ['z-axis-fields','z-coordinate-label','view-controls'])$(id).hidden=!threeD;
   root.querySelector('.map-heading h2').textContent=threeD?'Your three-dimensional map':'Your two-dimensional map';
   $('drink-help').textContent=threeD?'Starts at (0, 0, 0). Drag in X/Y; use the Z slider for depth.':'Starts at (0, 0). Drag or use the sliders to place it.';
   $('map').setAttribute('aria-label',threeD?'Three-dimensional concept map. Arrow keys move X/Y; Page Up/Down moves Z.':'Open concept map. Arrow keys move concepts.');
  }
  $('third-axis').addEventListener('change',()=>{threeD=$('third-axis').checked;arrowStart=null;dragging=null;syncDimensions();$('arrow-status').textContent=threeD?'Draw on the Z = 0 plane, or choose concepts for 3-D endpoints.':'Switch to Draw arrows, then click a start and end point.';updateArrowTools();draw();save();});
  $('view-angle').addEventListener('input',()=>{viewAngle=+$('view-angle').value;draw();});

  root.querySelector('h1').textContent='Your concept space';
  root.querySelector('.lede').textContent='Choose two or three dimensions. Add concepts. Explore their relationships.';
  for(const id of ['step-nav','step-count','guide-title','guide-instruction','guide-task','guide-explanation','prediction-panel','research-connection'])$(id).hidden=true;
  root.querySelector('.guide-actions').hidden=true;root.querySelector('.guide').removeAttribute('aria-labelledby');root.querySelector('.guide').setAttribute('aria-label','Open exploration controls');
  $('axis-editor').hidden=false;
  axisIds.forEach(id=>{$('open-'+id).value=$(id).value;$('open-'+id).addEventListener('input',()=>{$(id).value=$('open-'+id).value;draw();save();});});
  root.querySelector('.controls h2').textContent='Your concepts';
  root.querySelector('.control-hint').textContent='Add a concept, then drag it or use the sliders.';
  root.querySelector('.add-drink > label').textContent='Add a concept';
  $('drink-name').placeholder='e.g. Bicycle';
  $('remove-drink').textContent='Remove this concept';
  root.querySelector('.map-heading h2').textContent='Your two-dimensional map';
  $('reset').hidden=true;
  root.querySelector('.map-footer > span').innerHTML='<i class="legend-dot"></i> Concept';
  root.querySelector('.arrow-pair summary').textContent='Or choose two concepts';
  root.querySelector('.arrow-note').textContent='Arrows keep their coordinates when concepts move.';
  $('map').setAttribute('aria-label','Open concept map. Select a concept and use arrow keys to move it.');
  $('x-coordinate').setAttribute('aria-label','Selected concept X coordinate');
  $('y-coordinate').setAttribute('aria-label','Selected concept Y coordinate');
  $('arrow-status').textContent='Switch to Draw arrows, then click a start and end point.';
  syncDimensions();
 }
 renderStage();save();

function renderStage(focus=false){
 arrowStart=null;
 if(explore){solved=false;stage=4;$('arrow-panel').hidden=false;updateArrowTools();draw();return;}
 const steps=[
  ['Read the map','Each drink is a vector: [temperature, caffeine]. Right means hotter; up means more caffeine. Assume equal servings and the same recipe within each hot/iced pair.','Select iced coffee and hot coffee. Compare their coordinates: what changes, and what stays the same? These numbers are illustrative scores, not measurements.'],
  ['Place and compare','Select iced tea, then hot tea. Compare their coordinates with the coffee pair. Drag a point or use the sliders to try a different placement.','Keep milk low in caffeine, tea in the middle, and coffee higher for this example. Real caffeine varies by preparation. Try adding cold brew, or restore the original positions.'],
  ['Make a prediction','Complete the analogy before seeing the calculation: iced coffee is to hot coffee as X is to hot tea.','What changes from iced coffee to hot coffee? What stays the same? Choose the drink that could undergo that same change to become hot tea.'],
  ['Reveal, then experiment','The solid arrow shows the change from iced coffee to hot coffee. The dashed arrow repeats that change, ending at hot tea. Its starting point is the predicted X.','Now move hot tea upward by 1 unit, leaving iced tea in place. Watch X move. Does the analogy still land on iced tea?'],
  ['Draw your own arrows','Click a start point, then an end point on the map. Points near a drink snap to its position. Switch to Move drinks to reposition concepts.','Draw a cold-to-hot change for two different drinks. Compare ΔX and ΔY: do the arrows express the same relationship? You can also choose a pair of drinks below.'],
 ];
 const [title,instruction,task]=steps[stage];
 $('step-count').textContent=`STEP ${stage+1} OF 5`;
 $('guide-title').textContent=title;$('guide-instruction').textContent=instruction;$('guide-task').textContent=task;
 $('step-nav').innerHTML=steps.map((s,i)=>`<span ${i===stage?'aria-current="step"':''} class="${i<stage?'completed':''}">${i+1}. ${['Read','Place','Predict','Test','Draw'][i]}</span>`).join('');
 $('guide-explanation').hidden=stage!==3;$('prediction-panel').hidden=stage!==2;$('research-connection').hidden=stage<3;
 solved=stage===3;
 $('previous').disabled=stage===0;$('next').hidden=stage===4;
 $('next').disabled=stage===2&&!$('prediction').value;
 $('next').textContent=stage===2?'Reveal the vectors →':'Next step →';
 $('guide-status').textContent=stage===2&&!$('prediction').value?'Choose a prediction to continue.':stage===4?'Final step · compare the arrows you create.':'';
 axisIds.forEach(id=>$(id).disabled=true);
 for(const axis of ['x','y'])$(axis+'-coordinate').disabled=stage===0;
 $('map').classList.toggle('read-only',stage===0);
 $('arrow-panel').hidden=stage!==4;updateArrowTools();
 draw();if(focus)$('guide-title').focus();
}
$('next').addEventListener('click',()=>{if(stage===2&&!$('prediction').value)return;stage=Math.min(4,stage+1);renderStage(true);save();});
$('previous').addEventListener('click',()=>{stage=Math.max(0,stage-1);renderStage(true);save();});
$('prediction').addEventListener('change',()=>{renderStage();save();});
$('reason').addEventListener('input',save);

function mapPosition(e){
 const p=new DOMPoint(e.clientX,e.clientY).matrixTransform($('map').getScreenCTM().inverse());
 if(threeD){
  const target=e.target.closest?.('.point');
  if(target){const a=animals[+target.dataset.index];return {x:a.x,y:a.y,z:zValue(a)};}
  const hits=animals.map(a=>({a,p:project(a)})).filter(v=>Math.hypot(v.p.x-p.x,v.p.y-p.y)<18);
  if(hits.length){const a=hits[hits.length-1].a;return {x:a.x,y:a.y,z:zValue(a)};}
  const pos=unproject(p);if(Math.abs(pos.x)>5||Math.abs(pos.y)>5)return null;
  return {x:Math.round(pos.x*10)/10,y:Math.round(pos.y*10)/10,z:0};
 }
 if(p.x<80||p.x>560||p.y<80||p.y>560)return null;
 let pos={x:Math.round(((p.x-80)/48-5)*10)/10,y:Math.round(((560-p.y)/48-5)*10)/10};
 const closest=animals.map(a=>({a,d:Math.hypot(a.x-pos.x,a.y-pos.y)})).sort((a,b)=>a.d-b.d)[0];
 if(closest&&closest.d<0.4)pos={x:closest.a.x,y:closest.a.y};
 return pos;
}
function addArrow(from,to){
 if(!from||!to){$('arrow-status').textContent='Add two concepts first, or draw directly on the map.';return;}
 if(Math.hypot(to.x-from.x,to.y-from.y,threeD?zValue(to)-zValue(from):0)<0.05){$('arrow-status').textContent='Choose a different end point to give the arrow a direction.';return;}
 arrows.push({from:{x:from.x,y:from.y,z:threeD?zValue(from):0},to:{x:to.x,y:to.y,z:threeD?zValue(to):0}});arrowStart=null;
 $('arrow-status').textContent=`Arrow ${arrows.length} added: ΔX ${fmt(to.x-from.x)}, ΔY ${fmt(to.y-from.y)}${threeD?`, ΔZ ${fmt(zValue(to)-zValue(from))}`:''}.`;
 updateArrowTools();draw();save();
}
function updateArrowTools(){
 $('draw-mode').setAttribute('aria-pressed',drawing);
 $('draw-mode').textContent=drawing?'Draw arrows ✓':`Move ${explore?'concepts':'drinks'} ✓`;
 $('draw-mode').setAttribute('aria-label',drawing?'Draw arrows active. Switch to move concepts.':'Move concepts active. Switch to draw arrows.');
 $('map').classList.toggle('drawing',stage===4&&drawing);
 $('cancel-arrow').hidden=!arrowStart;$('clear-arrows').disabled=!arrows.length;
 $('arrow-list').innerHTML=arrows.map((a,i)=>`<li><span><b>${i+1}.</b> ΔX ${fmt(a.to.x-a.from.x)} · ΔY ${fmt(a.to.y-a.from.y)}${threeD?` · ΔZ ${fmt(zValue(a.to)-zValue(a.from))}`:''}<small>(${coords(a.from)}) → (${coords(a.to)})</small></span><button class="quiet" data-remove="${i}" aria-label="Remove arrow ${i+1}">Remove</button></li>`).join('');
}
$('draw-mode').addEventListener('click',()=>{drawing=!drawing;arrowStart=null;$('arrow-status').textContent=drawing?'Click a start point, then an end point on the map.':'Drag points to move them. Switch back to draw more arrows.';updateArrowTools();draw();});
$('cancel-arrow').addEventListener('click',()=>{arrowStart=null;$('arrow-status').textContent='Start canceled. Click a new start point.';updateArrowTools();draw();});
$('clear-arrows').addEventListener('click',()=>{arrows=[];arrowStart=null;$('arrow-status').textContent='Arrows cleared.';updateArrowTools();draw();save();});
$('arrow-list').addEventListener('click',e=>{const button=e.target.closest('[data-remove]');if(!button)return;arrows.splice(+button.dataset.remove,1);$('arrow-status').textContent='Arrow removed.';updateArrowTools();draw();save();$('clear-arrows').focus();});
$('add-arrow').addEventListener('submit',e=>{e.preventDefault();addArrow(animals[+$('arrow-from').value],animals[+$('arrow-to').value]);});

return {cancelInteraction(){arrowStart=null;dragging=null;updateArrowTools();draw();}};
}

// Clone the unchanged guided layout before initializing either independent activity.
const guidedPanel=document.getElementById('guided-panel');
const explorePanel=guidedPanel.cloneNode(true);
explorePanel.id='explore-panel';explorePanel.hidden=true;explorePanel.setAttribute('aria-labelledby','explore-tab');
explorePanel.querySelectorAll('[id]').forEach(el=>{el.id='explore-'+el.id;});
explorePanel.querySelectorAll('[for],[aria-describedby],[aria-labelledby]').forEach(el=>{
 for(const attr of ['for','aria-describedby','aria-labelledby'])if(el.hasAttribute(attr))el.setAttribute(attr,el.getAttribute(attr).split(' ').map(id=>'explore-'+id).join(' '));
});
guidedPanel.after(explorePanel);
const guidedActivity=initActivity(guidedPanel),exploreActivity=initActivity(explorePanel,true);
const tabs=[document.getElementById('guided-tab'),document.getElementById('explore-tab')];
function activateTab(index){
 guidedActivity.cancelInteraction();exploreActivity.cancelInteraction();
 guidedPanel.hidden=index!==0;explorePanel.hidden=index!==1;
 tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',i===index);tab.tabIndex=i===index?0:-1;});
}
tabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>activateTab(index));
 tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:1-index;activateTab(next);tabs[next].focus();});
});
