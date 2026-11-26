(()=>{
const get=id=>document.getElementById(id);
const fields=['brand','kind','industry','audience','position','region','channel','focus','origin'];
const key='pailotism-exploration-draft';
const checks=['region-on','channel-on'];
function draft(){const value={};fields.forEach(id=>value[id]=get('setup-'+id).value.trim());checks.forEach(id=>value[id]=get('setup-'+id).checked);value.directions=[...document.querySelectorAll('[name=direction]:checked')].map(el=>el.value);return value;}
function restore(value){fields.forEach(id=>{if(typeof value[id]==='string')get('setup-'+id).value=value[id];});if(typeof value.extra==='string'&&value.extra.trim()){get('setup-focus').value=[value.focus,value.extra].filter(Boolean).join('\n');}checks.forEach(id=>{if(typeof value[id]==='boolean')get('setup-'+id).checked=value[id];});if(value.directions)document.querySelectorAll('[name=direction]').forEach(el=>el.checked=value.directions.includes(el.value));toggle();}
function toggle(){get('setup-region').disabled=!get('setup-region-on').checked;get('setup-channel').disabled=!get('setup-channel-on').checked;}
['industry','audience','position'].forEach(id=>get('setup-'+id).addEventListener('input',toggle));
checks.forEach(id=>get('setup-'+id).addEventListener('change',toggle));
window.openExplorationSetup=()=>{get('exploration-setup').scrollIntoView({behavior:'smooth'});get('setup-focus').focus({preventScroll:true});};
function apply(value){
conditions.industry=value.industry;conditions.region=value['region-on']?value.region:'不限';conditions.channels=value['channel-on']?[value.channel]:['官網','公開通路'];
conditions.explorationContext={...value,scope:{region:value['region-on']?value.region:null,channel:value['channel-on']?value.channel:null},similarity:{position:value.position,audience:value.audience},additionalFocus:value.focus,mockSearch:true};
get('exploration-summary').textContent='本次探索：'+conditions.region+' · '+value.directions.join('、')+(value['channel-on']?' · '+value.channel:'');
get('exploration-setup').hidden=false;get('exploration-results').hidden=false;
window.dispatchEvent(new Event('resize'));
}
get('exploration-form').addEventListener('submit',event=>{event.preventDefault();const value=draft();if(!value.directions.length){get('setup-error').textContent='請至少選擇一個探索方向。';return;}if(value['region-on']&&!value.region){get('setup-error').textContent='請填寫限定地區，或取消地區限制。';return;}get('setup-error').textContent='';apply(value);try{localStorage.setItem(key,JSON.stringify({...value,generated:true}));}catch{}get('network-section').scrollIntoView({behavior:'smooth'});});
try{const value=JSON.parse(localStorage.getItem(key));if(value)restore(value);}catch{}
apply(draft());
toggle();
})();
