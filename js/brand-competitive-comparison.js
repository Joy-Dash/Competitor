'use strict';
const base = window.PailotismMarketData;
const $ = id => document.getElementById(id);
const palette = ['#d27343','#178c8b','#9566bb','#b08b25','#487da8','#b75d89','#70944c','#bd6c65','#5d68a8','#537f72'];
const observedAt = '2026-11-24';
const analysis=window.Level2Analysis;
const topics=analysis.topics;
let input = null;
try { input = JSON.parse(localStorage.getItem('pailotism-level2-input')); } catch {}
const validInput = input && Array.isArray(input.brands) && Array.isArray(input.selectedBrandIds);
const catalog = validInput ? input.brands : base.brands;
const ownBase = validInput && input.ownBrand ? input.ownBrand : base.self;
const conditions = validInput && input.searchConditions ? input.searchConditions : base.conditions;
const chosen = new Set(validInput ? input.selectedBrandIds.filter(id => catalog.some(brand => brand.id === id)) : []);
const selectedTopics = new Set(topics.map(([id]) => id));
let state = {kind:'product',structureKind:'product',mode:'normal',topic:'position',x:'median',y:'positionScore',focused:'own',generatedAt:null,models:[],supplements:{}};
function e(tag,text,className) {
  const element=document.createElement(tag);
  if(text!==undefined&&text!==null) element.textContent=text;
  if(className) element.className=className;
  return element;
}
const money=value=>value===null?'未取得':'NT$'+Math.round(value).toLocaleString('zh-TW');
const competitors=()=>catalog.filter(brand=>chosen.has(brand.id));
const isService=()=>state.kind==='service'||(state.kind==='mixed'&&state.structureKind==='service');
const colorOf=id=>id==='own'?'#4359f3':palette[catalog.findIndex(brand=>brand.id===id)%palette.length];
if(!validInput){$('input-notice').hidden=false;$('input-notice').textContent='尚未收到第一階段選擇。可返回競品分析選品牌，或使用同一份品牌資料的示例開始。';}
function makeCheckbox(label,checked,onChange){
  const box=e('input');box.type='checkbox';box.checked=checked;box.setAttribute('aria-label',label);
  box.addEventListener('change',()=>onChange(box.checked));return box;
}
function validateSetup(){
  $('setup-count').textContent='已選 '+chosen.size+'／10 家競品';
  const error=chosen.size>10?'已選超過 10 家，請手動移除後繼續，品牌不會自動截斷。':!chosen.size?'請至少選擇一家競品。':!selectedTopics.size?'請至少選擇一個分析主題。':'';
  $('setup-error').textContent=error;$('start-analysis').disabled=!!error;
  $('start-analysis').textContent=['own-position','own-audience','own-service'].some(id=>$(id).value.trim())?'確認並開始模擬分析':'略過補充並開始模擬分析';
}
function renderOptions(){
  const query=$('setup-search').value.trim();$('brand-options').replaceChildren();
  catalog.filter(brand=>brand.name.includes(query)).forEach(brand=>{
    const label=e('label',null,'brand-option');
    const box=makeCheckbox('比較 '+brand.name,chosen.has(brand.id),checked=>{if(checked)chosen.add(brand.id);else chosen.delete(brand.id);validateSetup();});
    const text=e('span',brand.name);text.append(e('small',brand.type+' · '+brand.raw[0]));label.append(box,text);$('brand-options').append(label);
  });
  if(!$('brand-options').children.length)$('brand-options').append(e('p','找不到此品牌，請調整搜尋。','muted'));
  validateSetup();
}
topics.forEach(([id,title])=>{
  const label=e('label');label.append(makeCheckbox(title,true,checked=>{if(checked)selectedTopics.add(id);else selectedTopics.delete(id);validateSetup();}),' '+title);label.dataset.topic=id;$('topic-options').append(label);
});
$('setup-search').addEventListener('input',renderOptions);
['own-position','own-audience','own-service'].forEach(id=>$(id).addEventListener('input',validateSetup));
$('first-three').addEventListener('click',()=>{chosen.clear();catalog.slice(0,3).forEach(b=>chosen.add(b.id));renderOptions();});
$('stress-ten').addEventListener('click',()=>{chosen.clear();catalog.slice(0,10).forEach(b=>chosen.add(b.id));renderOptions();});
$('clear-brands').addEventListener('click',()=>{chosen.clear();renderOptions();});
function buildModel(brand) {
  return analysis.build(brand,{service:isService(),mode:state.mode,supplements:state.supplements,color:colorOf(brand.id)});
}
function refreshModels() {
  state.models=[buildModel({...ownBase,id:'own'}),...competitors().map(buildModel)];
  state.bands=analysis.finalize(state.models,isService());
}
const topicFields=analysis.topicFields;
function format(value,key) {
  if(value===null||value===undefined)return '未取得';
  if(['low','high','median'].includes(key))return money(value);
  if(key==='mix')return value.map(part=>part.name+' '+part.count+' 項').join('、');
  if(key==='orientation')return '功能 '+value.functional+'／設計 '+value.design+'／情感 '+value.emotional+' 筆訴求證據';
  if(key==='samples')return value.map(item=>item.label+'：'+money(item.price)).join('；');
  if(key==='rating')return value+'／5';
  return Array.isArray(value)?value.join('、'):String(value);
}
function showDetail(title,content){$('detail-title').textContent=title;$('detail-body').replaceChildren(content);$('detail-dialog').showModal();}
const statusLabels={known:'Mock 客觀欄位',inferred:'模擬 AI／規則推論',missing:'未取得',notApplicable:'不適用'};
function inspectMetric(model,key,title) {
  const m=model.m[key];if(!m)return;
  const dl=e('dl');
  [['數值',format(m.value,key)],['狀態',m.kind==='user'?'使用者補充，尚未經外部驗證':statusLabels[m.status]],
    ['資料日期',m.observedAt],['來源',m.sourceIds.join('、')+'（無真實網址）'],['口徑',m.method]
  ].forEach(([label,value])=>dl.append(e('dt',label),e('dd',value)));
  if(['low','high','median','samples','mainBand'].includes(key)) {
    dl.append(e('dt','樣本 n'),e('dd',model.m.samples.value?.length??'未取得'),
      e('dt','同類樣本'),e('dd',format(model.m.samples.value,'samples')),
      e('dt','樣本範圍'),e('dd',model.m.samples.value?.[0]?.scope||'未取得'),
      e('dt','第一階段範圍'),e('dd',format(model.m.publishedRange.value,'publishedRange')+'；是品牌整體範圍，與本次同類樣本不同'));
  }
  if(['categorySummary','categoryCount','items','mix','specialization'].includes(key))dl.append(e('dt','跨階段對照'),e('dd','第一階段：'+format(model.m.inheritedCategorySummary.value,'inheritedCategorySummary')+'；'+(isService()?'本頁切換到獨立服務示例，不改寫原商品分類。':model.categoryAlignment.detailsKnown?'同口徑明細已對齊。':'本頁保留原數量，沒有新增未確認的細項名稱。')));showDetail(model.name+' · '+title,dl);
}
function activeFieldRows(){return [...new Map([...selectedTopics].flatMap(topic=>topicFields[topic]||[]).filter(([,key])=>key!=='serviceProcess'||isService()).map(row=>[row[1],row])).values()];}
function coverage(){let filled=0,total=0;state.models.forEach(model=>activeFieldRows().forEach(([,key])=>{const m=model.m[key];if(!m||m.status==='notApplicable')return;total++;if(m.value!==null)filled++;}));return {filled,total,percent:total?Math.round(filled/total*100):0};}
function renderStrip(){
  $('brand-strip').replaceChildren();
  state.models.forEach(model=>{const chip=e('span',null,'brand-token');const dot=e('i');dot.style.background=model.color;chip.append(dot,e('span',model.name));if(model.id!=='own'){const remove=e('button','×');remove.setAttribute('aria-label','移除 '+model.name);remove.onclick=()=>{chosen.delete(model.id);renderOptions();if(chosen.size)renderAll();else adjust();};chip.append(remove);}$('brand-strip').append(chip);});
  $('third-brand').replaceChildren(new Option('全部比較品牌',''));competitors().forEach(b=>$('third-brand').add(new Option(b.name,b.id)));
}
function selectedOverlapRows(){return analysis.overlapRows.filter(([, ,topic])=>selectedTopics.has(topic));}
function peerComparisons(){
  const own=state.models[0];
  return state.models.slice(1).map(model=>({model,dimensions:selectedOverlapRows().map(([label,key])=>({label,key,...analysis.compare(own,model,key)})).filter(item=>item.value!==null)}));
}
function topicSummary(topic) {
  const models=state.models,own=models[0],peers=models.slice(1);
  const keys={position:'values',audience:'audience',product:'items',business:'operation',channels:'channels'};
  const key=keys[topic],valid=key?models.filter(model=>Array.isArray(model.m[key].value)):[];
  const common=valid.length===models.length?valid[0].m[key].value.filter(value=>valid.every(model=>model.m[key].value.includes(value))):null;
  const unique=key&&Array.isArray(own.m[key].value)&&valid.length===models.length?own.m[key].value.filter(value=>peers.every(model=>!model.m[key].value.includes(value))):[];
  const texts={
    position:{cause:'價值主張的差異可能反映品牌希望用功能、設計或情感認同建立選擇理由；目前只使用人工 Mock 標註。',impact:'共同價值較多時需要更清楚說明自家的價值落實方式；有獨有標籤不代表顧客已認同。',direction:'讓既有價值主張形成可辨識的品牌理由',verify:'以品牌文案、使用者訪談確認價值辨識度；補充文字需先確認標籤。'},
    audience:{cause:'客群與需求交集不同，可能來自品牌選擇服務的生活情境不同，並非真實顧客人口調查。',impact:'共同客群會形成選擇替代；不同需求可作為聚焦假設，需確認自家顧客是否在意。',direction:'聚焦既有客群的核心需求',verify:'以實際客戶組成、購買理由與需求訪談驗證，不能從公開標籤推定客群規模。'},
    product:{cause:'品類組成與用途差異，可能來自專精品類或一站式經營的取捨；品項數不是銷售占比。',impact:'聚焦可使經營主張清楚，多品類則可能提供跨需求選擇；仍須檢查供應與服務能力。',direction:'建立核心品類的專精經營辨識',verify:'核對完整品類清單、供應穩定性及經營成本，不深入個別新品開發。'},
    price:{cause:'同類樣本分布不同，可能與選品及定價定位有關；未核對規格品質，不能歸因為溢價能力。',impact:'價格帶交集代表顧客可能在相近預算中選擇；較低中位數不代表成本或毛利優勢。',direction:'釐清同類樣本下的價格與價值對應',verify:'確認樣本完整性、同規格可比性及毛利條件，不以公開售價推定成交價。'},
    business:{cause:'自有品牌、代理與選物的組合可能造成供給控制、營運投入與收入來源的差異。',impact:'經營模式相似時，需要依自家資源檢查差異；收入來源類型不代表實際營收比重。',direction:'建立符合自家資源的經營模式特色',verify:'確認自有品牌／代理合約、實際收費模式與成本能力，不推算營收。'},
    channels:{cause:'官網、平台與門市的布局可能反映接觸及交付模式的選擇；通路類型不等於服務品質。',impact:'同類通路有替代壓力；不同接觸點值得評估，但不應以通路數量直接判定經營優劣。',direction:'明確區隔通路接觸與交付價值',verify:'核對取貨、服務交付、售後條件與客群需要，再評估投入成本。'}
  };
  let shared=common===null?'至少一家缺少結構化標註，無法確認全體共同特性。':common.length?'所有已選品牌共同具備：'+common.join('、')+'。':'本次品牌沒有全體共有的'+topics.find(([id])=>id===topic)[1]+'標籤。';
  let differences=key?models.map(model=>model.name+'：'+format(model.m[key].value,key)).join('；'):'';
  let validCount=key&&valid.includes(own)?valid.length:0;
  if(topic==='price'){
    const available=models.filter(model=>model.m.samples.value);
    validCount=available.includes(own)?available.length:0;
    shared=available.length===models.length?'所有樣本採 '+(isService()?'同城2小時到府整理方案':'居家日用小件標準單品')+'，以相同價格帶比較。':'至少一家缺少同口徑樣本，不對缺漏品牌推定價格定位。';
    differences=models.map(model=>model.name+'：中位 '+money(model.m.median.value)+'，主要價格帶 '+format(model.m.mainBand.value,'mainBand')).join('；');
  }
  return {...texts[topic],shared,differences,unique,key,validCount,
    evidence:'資料：'+models.map(model=>model.name+' ['+model.sourceIds.join('、')+']').join('；')+'。'+(topic==='price'?'中位數與分布均由同一組獨立價格樣本計算。':'比較已知集合與描述，不使用第一階段雷達分數。')};
}
function developmentDirection(item){
  const own=state.models[0],value=key=>format(own.m[key].value,key),tag=item.unique.length?item.unique.join('、'):value(item.key||'mainBand');
  const definitions={
    position:{name:'以「'+tag+'」建立自家價值辨識',description:'保留自家「'+value('claim')+'」主張，釐清「'+value('values')+'」如何成為可辨識的品牌選擇理由。相較對手的價值組合，需證明這些價值有實際落實，而不只增加一句口號。'},
    audience:{name:'聚焦「'+value('audience')+'」的核心需求',description:'自家目前標註需求為「'+value('needs')+'」，可先確認這群人的購買動機「'+value('motives')+'」是否一致，再決定客群經營方向。與其他品牌共享客群時，應以需求差異驗證聚焦的必要性。'},
    product:{name:'以「'+value('items')+'」形成核心專精結構',description:'自家採「'+value('specialization')+'」與「'+value('combination')+'」。可檢查核心用途是否足以形成專精認知，再評估要深化既有結構或延伸品類；不是直接提出單品開發方案。'},
    price:{name:'釐清「'+value('mainBand')+'」的價值定位',description:'自家同類樣本中位 '+value('median')+'，主要價格帶為「'+value('mainBand')+'」。可確認品牌承諾是否支持此定位，並比較相近價格帶的經營主張；價格較低不直接構成優勢。'},
    business:{name:'建立「'+value('operation')+'」的經營特色',description:'自家交易模式為「'+value('model')+'」，收入來源類型是「'+value('revenue')+'」。可比較品牌對供給、選品及交付的控制方式，評估現有資源支持哪種差異，而不推算營收成果。'},
    channels:{name:'深化「'+value('channels')+'」的接觸與交付價值',description:'自家目前通路為「'+value('channels')+'」，服務地區為「'+value('regions')+'」。可先檢查這些接點對客群的便利與交付承諾，再比較是否需要對手已有的其他接點，不以增加通路數量作為目的。'}
  };
  return definitions[item.topic];
}
function synthesis(){
  const own=state.models[0],peers=peerComparisons();
  const ranked=peers.map(peer=>({...peer,high:peer.dimensions.filter(d=>d.value>=50)})).sort((a,b)=>b.high.length-a.high.length);
  const focus=ranked.find(peer=>peer.high.length>=2)||ranked.find(peer=>peer.high.length);
  const observations=[...selectedTopics].map(topic=>({topic,...topicSummary(topic)}));
  const unique=observations.filter(item=>item.unique.length);
  const valid=observations.filter(item=>item.validCount>=2);
  const pressure=focus?focus.model.name+' 在'+focus.high.map(d=>'「'+d.label+'」'+d.value+'%').join('、')+'與自家重疊，應關注共同需求下的選擇替代。'+(focus.high.length<2?'目前只有單一有效重疊線索，不能認定為主要競爭對手。':'這是多面向重疊觀察，不是競爭力排序。'):'目前沒有足夠的有效重疊資料可辨識主要競爭壓力；不能解讀成沒有競爭。';
  const summary=valid.length?valid.map(item=>topics.find(([id])=>id===item.topic)[1]+'：'+item.differences).join('；'):'目前缺乏至少兩個品牌的有效比較資料，暫不產出競爭定位判斷。';
  const direction=unique.length?unique.map(item=>developmentDirection(item).name+'（待驗證）').join('；'):valid.length?'所選主題未顯示自家獨有特徵，可先釐清 '+valid.map(item=>topics.find(([id])=>id===item.topic)[1]).join('、')+' 的可驗證差異。':'先補足所選主題的比較資料，再形成差異化方向。';
  return {observations,valid,unique,focus,pressure,summary,direction};
}
function renderOverview(){
  const data=synthesis(),own=state.models[0],content=e('div');
  $('analysis-time').textContent='模擬產出：'+new Date(state.generatedAt).toLocaleString('zh-TW');
  content.append(e('p','整體競爭觀察 · 模擬 AI','eyebrow'),e('p',data.pressure,'overview-lead'));
  const rows=state.models.slice(1).map(model=>{
    const dimensions=selectedOverlapRows().map(([label,key])=>({label,...analysis.compare(own,model,key)})).filter(item=>item.value!==null).sort((a,b)=>b.value-a.value);
    const position=selectedTopics.has('position')?format(model.m.claim.value,'claim'):'未選擇定位主題';
    return {model,dimensions,position};
  });
  const wrap=e('div',null,'table-scroll'),table=e('table'),head=e('thead'),header=e('tr');
  ['比較品牌／原分類','有效競爭面向','主要差異（所選主題）'].forEach(label=>header.append(e('th',label)));head.append(header);table.append(head);const body=e('tbody');
  rows.forEach(({model,dimensions,position})=>{const tr=e('tr'),name=e('th',model.name+' · '+model.type);name.style.color=model.color;
    const facet=dimensions.length?dimensions.slice(0,3).map(d=>d.label+' '+d.value+'%').join('、'):selectedTopics.has('business')?'經營模式比較，尚無重疊指數':'有效資料不足';
    const difference=selectedTopics.has('position')?position:[...selectedTopics].map(topic=>{const key=topicSummary(topic).key||'mainBand';return topics.find(([id])=>id===topic)[1]+'：'+format(model.m[key].value,key);}).join('；');
    tr.append(name,e('td',facet),e('td',difference));body.append(tr);});table.append(body);wrap.append(table);content.append(wrap);
  content.append(e('p','值得關注：'+(data.focus?data.focus.model.name+'；原因是 '+data.focus.high.map(d=>d.label+'重疊').join('、')+'。原有分類只是第一階段標記，本頁判斷依有效比較更新。':'目前不足以推薦主要競爭對象。'),'analysis-summary'),e('p','初步差異化：'+data.direction));
  const details=e('details',null,'overview-meta'),c=coverage();details.append(e('summary','分析條件與資料涵蓋率 · '+c.filled+'／'+c.total+'（'+c.percent+'%）'));
  details.append(e('p','自家＋'+chosen.size+'家競品 · '+{product:'商品型',service:'服務型',mixed:'混合型'}[state.kind]+' · '+topics.filter(([id])=>selectedTopics.has(id)).map(([,name])=>name).join('、')),e('p','搜尋條件：'+Object.values(conditions).map(v=>Array.isArray(v)?v.join('、'):v).join(' · ')),e('p','涵蓋率包含 Mock 客觀欄位與使用者補充；推論與資料完整度不同，詳見來源區。'));
  content.append(details);$('overview-content').replaceChildren(content);
}
const axes=analysis.axes;
const svgNS='http://www.w3.org/2000/svg';
function svg(tag,attributes,text){const node=document.createElementNS(svgNS,tag);Object.entries(attributes||{}).forEach(([k,v])=>node.setAttribute(k,v));if(text!==undefined)node.textContent=text;return node;}
function renderScenarios(){
  const host=$('matrix-scenarios');host.replaceChildren(e('span','AI 推薦比較情境 · 規則模擬','source-note'));
  analysis.scenarios.forEach(scenario=>{
    const topicsReady=[scenario.x,scenario.y].every(key=>selectedTopics.has(axes[key][1]));
    const count=state.models.filter(model=>model.m[scenario.x].value!==null&&model.m[scenario.y].value!==null).length;
    const button=e('button',scenario.name);button.disabled=!topicsReady||count<2;
    button.title=!topicsReady?'需選擇相關分析主題':count<2?'至少兩個品牌須具有完整雙軸資料':scenario.purpose+' · '+count+' 個有效品牌';
    button.setAttribute('aria-pressed',state.x===scenario.x&&state.y===scenario.y);
    button.onclick=()=>{state.x=scenario.x;state.y=scenario.y;renderMatrix();};host.append(button);
  });
  const current=analysis.scenarios.find(item=>item.x===state.x&&item.y===state.y);
  $('matrix-purpose').textContent=current?current.purpose:'自訂雙軸比較：從所選主題的有效資料檢視經營取向差異。';
  const definitions=$('matrix-definitions');definitions.replaceChildren();
  [state.x,state.y].filter(Boolean).forEach(key=>definitions.append(e('p',axes[key][0]+'：'+axes[key][4])));
  definitions.append(e('p','文字補充尚未轉成經確認的結構化標註時，不估算座標。空白區不代表市場機會。','source-note'));
}
function renderMatrix(){
  const available=Object.keys(axes).filter(key=>selectedTopics.has(axes[key][1]));
  if(!available.includes(state.x))state.x=available[0];
  if(!available.includes(state.y)||state.y===state.x)state.y=available.find(key=>key!==state.x);
  ['x','y'].forEach(direction=>{const select=$('matrix-'+direction);select.replaceChildren();available.forEach(key=>select.add(new Option(axes[key][0],key)));select.value=state[direction]||'';});
  renderScenarios();const host=$('matrix-stage');host.replaceChildren();$('matrix-missing').textContent='';$('matrix-summary').textContent='';
  if(!state.x||!state.y){host.append(e('p','所選主題目前不足以形成兩個不同商業維度；可調整主題後再比較。','empty-chart'));return;}
  const chart=svg('svg',{viewBox:'0 0 1000 450',role:'img','aria-label':'品牌市場定位矩陣'});host.append(chart);
  const valid=state.models.filter(model=>model.m[state.x].value!==null&&model.m[state.y].value!==null);
  const maximum=key=>key==='median'?Math.max(100,...valid.map(model=>model.m[key].value))*1.12:100;
  const maxX=maximum(state.x),maxY=maximum(state.y);
  for(let i=0;i<=4;i++){
    const x=100+i*200,y=350-i*70;
    chart.append(svg('path',{d:'M '+x+' 70 V 350 M 100 '+y+' H 900',stroke:'#e8edf5',fill:'none'}),svg('text',{x,y:375,'text-anchor':'middle',fill:'#8490a2','font-size':11},Math.round(maxX*i/4)),svg('text',{x:85,y:y+4,'text-anchor':'end',fill:'#8490a2','font-size':11},Math.round(maxY*i/4)));
  }
  chart.append(svg('text',{x:500,y:420,'text-anchor':'middle',fill:'#52647c','font-size':13},axes[state.x][2]+' ← '+axes[state.x][0]+' → '+axes[state.x][3]),svg('text',{x:100,y:35,fill:'#52647c','font-size':13},axes[state.y][2]+' → '+axes[state.y][3]));
  const placed=[];
  valid.forEach(model=>{
    const actualX=100+model.m[state.x].value/maxX*800,actualY=350-model.m[state.y].value/maxY*280;
    let point=null;
    // Search inside the plot before accepting a point; clamping after collision checks stacks boundary nodes.
    for(let n=0;n<2500;n++){
      const radius=n?Math.sqrt(n)*9:0,x=actualX+Math.cos(n*2.39996)*radius,y=actualY+Math.sin(n*2.39996)*radius;
      if(x<110||x>890||y<80||y>340)continue;
      if(placed.every(other=>Math.hypot(other.x-x,other.y-y)>34)){point={model,x,y,actualX,actualY};break;}
    }
    placed.push(point||{model,x:actualX,y:actualY,actualX,actualY});
  });
  const labels=[];
  const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  placed.forEach(point=>{
    const {model,x,y,actualX,actualY}=point,width=model.name.length*12+8;
    const candidates=[];
    for(let row=0;row<10;row++)for(const side of [-1,1])for(const offset of [0,-40,40,-80,80,-120,120]){
      const lx=Math.max(100+width/2,Math.min(900-width/2,x+offset)),ly=y+side*(19+row*18);
      if(ly<61||ly>351)continue;
      const box={left:lx-width/2,right:lx+width/2,top:ly-12,bottom:ly+3};
      const collisions=labels.filter(other=>intersects(box,other)).length+placed.filter(other=>intersects(box,{left:other.x-12,right:other.x+12,top:other.y-12,bottom:other.y+12})).length;
      candidates.push({lx,ly,box,score:collisions*10000+Math.hypot(lx-x,ly-y)});
    }
    candidates.sort((a,b)=>a.score-b.score);const label=candidates[0];labels.push(label.box);
    const group=svg('g',{class:'matrix-node',tabindex:0,role:'button','aria-label':model.name+' 定位分析','aria-pressed':state.focused===model.id});
    if(Math.hypot(x-actualX,y-actualY)>2)group.append(svg('line',{x1:actualX,y1:actualY,x2:x,y2:y,stroke:model.color,'stroke-opacity':.35}),svg('circle',{cx:actualX,cy:actualY,r:2,fill:model.color,'fill-opacity':.5}));
    if(Math.hypot(label.lx-x,label.ly-y)>36)group.append(svg('line',{x1:x,y1:y,x2:label.lx,y2:label.ly-5,stroke:model.color,'stroke-opacity':.3}));
    group.append(svg('circle',{cx:x,cy:y,r:model.id==='own'?10:7,fill:model.color,stroke:'white','stroke-width':3}),svg('text',{x:label.lx,y:label.ly,'text-anchor':'middle',fill:model.color,'font-size':12,'font-weight':model.id==='own'?700:500},model.name),svg('title',{},model.name+'：'+format(model.m[state.x].value,state.x)+' / '+format(model.m[state.y].value,state.y)+'。依據：'+model.m[state.x].method+'；'+model.m[state.y].method));
    const open=()=>{
      state.focused=model.id;chart.querySelectorAll('.matrix-node').forEach(node=>node.setAttribute('aria-pressed','false'));group.setAttribute('aria-pressed','true');
      const box=e('div');box.append(e('p',axes[state.x][0]+'：'+format(model.m[state.x].value,state.x)),e('p',axes[state.y][0]+'：'+format(model.m[state.y].value,state.y)),e('p','橫軸依據：'+model.m[state.x].method),e('p','縱軸依據：'+model.m[state.y].method),e('p','來源：'+[...new Set([...model.m[state.x].sourceIds,...model.m[state.y].sourceIds])].join('、')));
      if([state.x,state.y].some(key=>['positionScore','emotionScore'].includes(key)))box.append(e('p','文案標註（Mock）：'+(model.m.positionEvidence.value?.map(item=>({functional:'功能',design:'設計',emotional:'情感'}[item.type])+': '+item.text).join('；')||'未取得')));
      if([state.x,state.y].includes('audienceFocus'))box.append(e('p','客群標籤：'+format(model.m.audience.value,'audience')));
      if([state.x,state.y].includes('breadthScore'))box.append(e('p','核心品類：'+format(model.m.items.value,'items')));
      if([state.x,state.y].includes('channelScore'))box.append(e('p','實際通路：'+format(model.m.channels.value,'channels')));
      box.append(e('p','座標為經營特徵，不是市場排名；重疊點有位移時以細線連回真實值。','source-note'));showDetail(model.name+' · 定位依據',box);
    };
    group.onclick=open;group.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}};chart.append(group);
  });
  $('matrix-missing').textContent='未繪製（至少一軸未取得或補充文字尚待確認）：'+(state.models.filter(model=>!valid.includes(model)).map(model=>model.name).join('、')||'無');
  $('matrix-summary').textContent=valid.length?'本圖比較 '+valid.length+' 個品牌的 '+axes[state.x][0]+' 與 '+axes[state.y][0]+'。'+matrixObservation(valid)+' 重疊節點輕微位移並連回實際座標；位置不代表綜合優劣。':'目前沒有足夠座標資料，不能判斷品牌位置。';
}
function matrixObservation(valid){
  const own=valid.find(model=>model.id==='own'),peers=valid.filter(model=>model.id!=='own');
  if(!own||!peers.length)return '自家或競品座標不足，暫不形成相對定位觀察。';
  return [state.x,state.y].map(key=>{const greater=peers.filter(model=>model.m[key].value>own.m[key].value),equal=peers.filter(model=>model.m[key].value===own.m[key].value);return axes[key][0]+'：'+(greater.length?greater.map(model=>model.name).join('、')+'高於自家':equal.length===peers.length?'本次有效品牌與自家相同':'自家高於或等於本次有效競品')+'。';}).join(' ');
}
function tableFor(rows,cellBuilder){const wrap=e('div',null,'table-scroll'),table=e('table'),head=e('thead'),tr=e('tr');tr.append(e('th','比較項目'));state.models.forEach(model=>{const th=e('th',model.name);th.style.color=model.color;tr.append(th);});head.append(tr);table.append(head);const body=e('tbody');rows.forEach(([label,key])=>{const row=e('tr');row.append(e('th',label));state.models.forEach(model=>{const td=e('td');td.append(cellBuilder(model,key,label));row.append(td);});body.append(row);});table.append(body);wrap.append(table);return wrap;}
function renderBusiness(){
  const enabled=topics.filter(([id])=>selectedTopics.has(id));
  if(!selectedTopics.has(state.topic))state.topic=enabled[0][0];$('business-tabs').replaceChildren();
  enabled.forEach(([id,label])=>{const button=e('button',label);button.setAttribute('role','tab');button.setAttribute('aria-selected',id===state.topic);button.setAttribute('aria-controls','business-table');button.onclick=()=>{state.topic=id;renderBusiness();};$('business-tabs').append(button);});
  const rows=topicFields[state.topic].filter(([,key])=>key!=='serviceProcess'||isService());
  $('business-table').replaceChildren(tableFor(rows,(model,key,label)=>{const box=e('div'),m=model.m[key],button=e('button',m.status==='notApplicable'?'不適用':format(m.value,key),'metric-cell');button.onclick=()=>inspectMetric(model,key,label);box.append(button,e('small',m.kind==='user'?'使用者補充':statusLabels[m.status]+' · '+m.observedAt));return box;}));
  const data=topicSummary(state.topic),summary=$('business-summary');summary.replaceChildren(e('h3','AI 橫向比較摘要 · 模擬'));
  const enough=data.validCount>=2;
  [['共同特性',data.shared],['主要差異',data.differences],['可能原因',enough?data.cause:'有效資料不足，不推論差異成因。'],['對自家影響',enough?data.impact:'先補足資料；缺漏不代表劣勢。'],['依據與待確認',data.evidence+' '+data.verify]].forEach(([label,text])=>{const p=e('p');p.append(e('strong',label+'：'),document.createTextNode(text));summary.append(p);});
}
function renderStructure(){
  $('structure-kind-wrap').hidden=state.kind!=='mixed';
  $('structure-title').textContent=isService()?'服務方案與價格結構比較':'商品與價格結構比較';
  $('mix-title').textContent=isService()?'服務方案結構':'核心品類結構';
  $('structure-context').textContent='本次可比範圍：'+(isService()?'同城到府整理／2小時標準方案／不含耗材。服務為額外 Mock，不代表實際業務。':'居家日用小件／標準單品／單件／不含家具與組合。')+' 新台幣；'+observedAt+'；各品牌皆使用獨立編寫的非等距 Mock 樣本。';
  $('price-chart').replaceChildren();$('mix-chart').replaceChildren();
  if(!selectedTopics.has('price'))$('price-chart').append(e('p','本次未選擇價格結構與定價定位。','empty-chart'));
  else {
    const valid=state.models.filter(model=>model.m.samples.value),maximum=Math.max(1,...valid.map(model=>model.m.high.value));
    const chart=svg('svg',{viewBox:'0 0 600 '+(state.models.length*65+35),role:'img','aria-label':'同口徑樣本價格區間與中位數'});
    state.models.forEach((model,index)=>{
      const y=25+index*65;chart.append(svg('text',{x:0,y,fill:model.color,'font-size':12},model.name));
      const samples=model.m.samples.value,low=model.m.low.value,high=model.m.high.value,mid=model.m.median.value;
      if(!samples){chart.append(svg('text',{x:170,y,fill:'#8793a6','font-size':12},'未取得'));return;}
      const scale=value=>170+value/maximum*390;
      const group=svg('g',{tabindex:0,role:'button','aria-label':model.name+' 價格樣本 n='+samples.length});
      group.append(svg('line',{x1:scale(low),x2:scale(high),y1:y-4,y2:y-4,stroke:model.color,'stroke-width':6,'stroke-opacity':.25}));
      samples.forEach(sample=>group.append(svg('circle',{cx:scale(sample.price),cy:y-4,r:2.5,fill:model.color,'fill-opacity':.4})));
      group.append(svg('circle',{cx:scale(mid),cy:y-4,r:5,fill:model.color}),svg('text',{x:170,y:y+18,fill:'#667085','font-size':11},money(low)+' — '+money(high)+' · 中位 '+money(mid)+' · n='+samples.length),svg('title',{},'獨立樣本 '+samples.map(item=>item.price).join('、')+'；點選查看口徑'));
      const open=()=>inspectMetric(model,'median','價格樣本與中位數');group.onclick=open;group.onkeydown=event=>{if(event.key==='Enter')open();};chart.append(group);
    });$('price-chart').append(chart);
  }
  if(!selectedTopics.has('product'))$('mix-chart').append(e('p','本次未選擇商品與服務經營結構。','empty-chart'));
  else state.models.forEach(model=>{
    const row=e('div',null,'chart-row'),name=e('span',model.name);name.style.color=model.color;row.append(name);
    const mix=model.m.mix.value;
    if(!mix)row.append(e('span',model.m.categoryCount.value!==null?'沿用 '+model.m.categoryCount.value+' 類；細項與品項數未取得，暫不繪製占比':'品類數與細項未取得，暫不繪製占比'));
    else {
      const total=mix.reduce((sum,part)=>sum+part.count,0),stack=e('div',null,'stack');
      mix.forEach(part=>{const button=e('button',Math.round(part.count/total*100)+'%');button.style.width=part.count/total*100+'%';button.style.background=categoryColor(part.name);button.title=part.name+'：'+part.count+'項／'+total+'項';button.setAttribute('aria-label',model.name+' '+button.title);button.onclick=()=>inspectMetric(model,'mix','品項結構，非銷售占比');stack.append(button);});
      const box=e('div');box.append(stack,e('small',mix.map(part=>part.name+' '+part.count).join(' · '),'source-note'));row.append(box);
    }$('mix-chart').append(row);
  });
  renderPriceDistribution();
}
function categoryColor(name){return {'居家用品':'#4359f3','收納':'#178c8b','廚具':'#b08b25','生活選物':'#9566bb','家飾':'#487da8','家具':'#b75d89','到府整理':'#4359f3','線上諮詢':'#178c8b','定期維護':'#9566bb'}[name]||'#667085';}
function renderPriceDistribution(){
  const host=$('price-distribution');host.replaceChildren();
  if(!selectedTopics.has('price')){$('price-band-note').textContent='本次未選擇價格主題，不產出價格分布。';return;}
  $('price-band-note').textContent=state.bands.length?'同一輪所有品牌使用相同切點：依可比'+(isService()?'服務方案':'日用小件')+'樣本的共同四分位價格，向上取整至'+(isService()?'NT$500':'NT$100')+'。品牌調整後會重新設定；各區間左閉右開，不代表通用產業標準。':'可比樣本未取得，無法設定價格帶。';
  state.models.forEach(model=>{
    const row=e('div',null,'chart-row'),name=e('span',model.name);name.style.color=model.color;row.append(name);
    if(!model.distribution){row.append(e('span','未取得'));host.append(row);return;}
    const box=e('div'),stack=e('div',null,'stack');
    model.distribution.forEach((part,index)=>{
      if(!part.count)return;const percent=part.count/part.total*100,button=e('button',Math.round(percent)+'%');button.style.width=percent+'%';button.style.background=['#9ba8ef','#7081da','#4e60bd','#31448b'][index%4];
      button.title=part.name+'：'+part.count+'／'+part.total+'（'+percent.toFixed(1)+'%）';button.setAttribute('aria-label',model.name+' '+button.title);
      button.onclick=()=>{const content=e('div');content.append(e('p',button.title),e('p','樣本：'+model.m.samples.value.filter(item=>item.price>=part.min&&item.price<part.max).map(item=>item.label+' '+money(item.price)).join('；')),e('p','占比＝帶內樣本數／該品牌全部同口徑樣本數。中位數 '+money(model.m.median.value)+' 由同一組樣本計算。'),e('p','來源：'+model.m.samples.sourceIds.join('、')+' · '+observedAt+'；樣本占比不是銷售占比。','source-note'));showDetail(model.name+' · 價格帶依據',content);};stack.append(button);
    });
    box.append(stack,e('small',model.distribution.map(part=>part.name+'：'+part.count+'筆').join(' · '),'source-note'));row.append(box);host.append(row);
  });
  const legend=e('div',null,'stack-legend');state.bands.forEach((band,index)=>{const item=e('span'),dot=e('i');dot.style.background=['#9ba8ef','#7081da','#4e60bd','#31448b'][index%4];item.append(dot,document.createTextNode(band.name));legend.append(item);});host.append(legend);
}
const overlapRows=analysis.overlapRows;
function overlap(model,key){return analysis.compare(state.models[0],model,key).value;}
function renderHeatmap(){
  const rows=selectedOverlapRows(),values=[];
  $('heatmap').replaceChildren(tableFor(rows,(model,key,label)=>{
    const data=analysis.compare(state.models[0],model,key),value=data.value;
    if(value!==null&&model.id!=='own')values.push({name:model.name,label,value});
    const button=e('button',value===null?'未取得':model.id==='own'?'基準':value+'%','heat-cell');
    button.style.background=value===null?'#f0f2f5':'rgba(67,89,243,'+(.06+value/160)+')';button.style.color=value>75?'white':'#344054';
    button.onclick=()=>{const dl=e('dl');[['共同特性',data.common.join('、')||(value===null?'未取得':'無共同標籤／價格帶')],['自家差異',data.onlyOwn.join('、')||(value===null?'未取得':'無')],['對手差異',data.onlyPeer.join('、')||(value===null?'未取得':'無')],['重疊程度',value===null?'未取得，不視為0':value+'%（非市占或機率）'],['計算方式',data.method],['資料來源',data.sourceIds.join('、')+' · '+observedAt],['語意限制',data.semantic||'使用可結構化的資料，不以文字長度或品牌索引產生分數。']].forEach(([name,text])=>dl.append(e('dt',name),e('dd',text)));showDetail(state.models[0].name+' × '+model.name+' · '+label,dl);};return button;
  }));
  values.sort((a,b)=>b.value-a.value);
  $('heat-summary').textContent=values.length?'本次最高單項重疊為 '+values.filter(item=>item.value===values[0].value).map(item=>item.name+'「'+item.label+'」').join('、')+'（'+values[0].value+'%）。結構化 Mock 特徵經集合或分布計算，與第一階段品牌特性分數不同；重疊高不代表競爭力高。':'所選主題或資料不足以計算競爭重疊；經營模式仍可在商業特性表比較。';
}
function renderInsights(){
  const data=synthesis(),content=$('insight-content');content.replaceChildren();
  const add=(title,text,evidence,verify)=>{const article=e('article');article.append(e('h3',title),e('span','模擬分析／待驗證判斷','judgment-level'),e('p',text),e('small','比較對象與形成依據：'+evidence),e('small','成立條件：需符合自家可交付能力、相關客群需求，且比較資料口徑一致；目前未驗證商業成效。'),e('small','待驗證資訊：'+verify));content.append(article);};
  const refs=data.valid.map(item=>topics.find(([id])=>id===item.topic)[1]).join('、');
  add('自身相對競爭優勢',data.unique.length?'可作為優勢假設的自家特徵：'+data.unique.map(item=>item.unique.join('、')+'（'+topics.find(([id])=>id===item.topic)[1]+'）').join('；')+'。這些只是所選樣本中的獨有特徵，尚非顧客已認可的競爭優勢。':'目前有效比較尚不足以確認自家獨有優勢，不以單一價格或通路數量推定優勢。',data.unique.length?data.unique.map(item=>item.differences).join('；'):'僅採本次已選且取得資料的主題。','確認特徵是否符合品牌能力、顧客需求與實際選擇理由。');
  const own=state.models[0],channels=own.m.channels.value;
  const absent=selectedTopics.has('channels')&&Array.isArray(channels)?state.models.slice(1).filter(model=>Array.isArray(model.m.channels.value)).map(model=>({model,extra:model.m.channels.value.filter(value=>!channels.includes(value))})).filter(item=>item.extra.length):[];
  add('自身相對競爭不足',absent.length?absent.map(item=>item.model.name+'具有自家目前未列出的'+item.extra.join('、')+'接觸點').join('；')+'。此為已知布局差異，只有在目標客群需要此接點且成本可承擔時，才可能成為競爭不足。':'已取得的資料不足以證明經營能力缺口；未取得資訊不判定為不足。',absent.length?'實際通路集合差異；'+(selectedTopics.has('audience')?topicSummary('audience').differences:'未選客群主題，不推定需求影響。'):'依所選主題有效欄位比較，不將缺漏當0。','核對顧客接觸需求與服務交付條件，不能由通路數量推斷營收或品質。');
  add('主要競爭壓力與重疊面向',data.pressure,'已選主題的集合交集／價格分布相似度；關注線索採至少50%的面向數量整理，未使用正式權重或競爭力總分。','補足品牌樣本與語意標註；共同特徵不等於顧客實際互相替代。');
  add('自身品牌的相對市場定位',data.valid.length?data.valid.map(item=>topics.find(([id])=>id===item.topic)[1]+'：自家 '+(item.key?format(own.m[item.key].value,item.key):'樣本中位 '+money(own.m.median.value)+'／主要價格帶 '+format(own.m.mainBand.value,'mainBand'))).join('；')+'。此為本次樣本內的經營輪廓，不代表整體市場定位排名。':'有效資料不足，暫不產出自家相對定位。',refs||'沒有足夠的有效比較主題。','確認品牌完整資料與市場代表性；不得把矩陣空白區直接當商機。');
  add('值得參考的標竿品牌',data.valid.length?data.valid.map(item=>{const peers=state.models.slice(1).filter(model=>item.key?model.m[item.key].value!==null:model.m.samples.value);return topics.find(([id])=>id===item.topic)[1]+'可參考 '+peers.map(model=>model.name).join('、')+' 的'+(item.key?topicFields[item.topic].find(([,key])=>key===item.key)?.[0]||'經營特徵':'價格帶組成');}).join('；')+'。這些是參照對象，不是績效排名。':'尚無可參照的有效資料。','所選品牌的逐項差異與原有分類；原分類不直接視為績效證據。','核對實際經營資源、商業條件與資料日期，不直接複製其他品牌。');
  const directions=e('section',null,'development-directions');directions.append(e('h3','可探索的品牌差異化方向 · 模擬 AI'));
  if(!data.valid.length)directions.append(e('p','資料不足，先確認來源與缺漏後再提出發展方向。'));
  data.valid.forEach(item=>{const proposal=developmentDirection(item),detail=e('details');detail.append(e('summary',proposal.name));
    const difference=item.unique.length?'自家在所選品牌中獨有：'+item.unique.join('、'):'未辨識到自家獨有標籤；方向是深化既有經營主張，不宣稱市場空缺。';
    [['方向說明',proposal.description+' '+item.impact],['形成依據',item.differences],['與其他品牌差異',difference],['成立條件','差異需有可驗證品牌證據，符合相關客群需求，且自家資源可持續支持。'],['待驗證資訊',item.verify]].forEach(([label,text])=>{const p=e('p');p.append(e('strong',label+'：'),document.createTextNode(text));detail.append(p);});directions.append(detail);
  });
  content.append(directions);
}
function renderSources(){
  const content=e('div'),c=coverage();content.append(e('p','本次所選主題涵蓋 '+c.filled+'／'+c.total+' 個適用欄位（'+c.percent+'%）；排除不適用欄位。推論不是外部事實，缺漏不補0。'));
  const types=e('dl',null,'source-types');[['Mock 客觀資料','沿用第一階段欄位，以及第二階段獨立編寫的商業特徵／價格樣本；並非真實蒐集。'],['使用者補充','本次填寫的定位、客群及交付文字，獨立標示，不回寫 Brand Book。新增文字未經確認不轉成定位分數或重疊標籤。'],['模擬 AI 推論','由已標註集合、文案證據計數與價格分布衍生。各公式可點選查看；未呼叫 AI API。'],['待驗證機會','依所選有效主題產生差異化假設；不是市場無競爭、績效或投資回報的證明。']].forEach(([label,text])=>types.append(e('dt',label),e('dd',text)));content.append(types);
  const list=e('div',null,'sources-list');state.models.forEach(model=>{const item=e('article'),missing=activeFieldRows().filter(([,key])=>model.m[key].status==='missing').map(([label])=>label);const fields=activeFieldRows().map(([,key])=>model.m[key]).filter(m=>m.status!=='notApplicable');
    item.append(e('strong',model.name),e('p',model.sourceIds.join('、')+' · '+observedAt),e('p',model.archetype),e('p','第一階段品類：'+format(model.m.inheritedCategorySummary.value,'inheritedCategorySummary')+'；本頁：'+format(model.m.categorySummary.value,'categorySummary')),e('p','Mock 客觀 '+fields.filter(m=>m.kind==='objective'&&m.value!==null).length+'／使用者補充 '+fields.filter(m=>m.kind==='user').length+'／推論 '+fields.filter(m=>m.kind==='inference'&&m.value!==null).length+' 個欄位'),e('p','缺漏：'+(missing.join('、')||'本次適用欄位無缺漏')),e('p','可比價格樣本 n='+(model.m.samples.value?.length??'未取得')+'；'+(model.m.samples.value?.[0]?.scope||'未取得')),
      e('p','輔助市場資訊：公開評分 '+format(model.m.rating.value,'rating')+'；評論數 '+format(model.m.reviews.value,'reviews')+'。不計入競爭力、重疊或定位。'),e('p','網址：未提供（Mock 不造假連結）。'));list.append(item);});content.append(list);
  content.append(e('p','跨階段資料規則：同品牌同欄位沿用原始資料。商品類別只有數量而缺細項時，保留原數量並標示待確認，不以星鏈群聚替代；品類明細未確認不生成組成占比、品類座標或商品重疊分數。價格則分開標示品牌整體範圍與可比樣本範圍。','source-note'),e('p','關注對象規則：只在所選有效面向中整理重疊至少50%的線索；兩個以上面向才作為多面向觀察。50%為原型判讀門檻，非正式權重、總分或風險機率。','source-note'),e('p','比較口徑：同輪價格帶一致，採樣日期與幣別相同；類別結構以 Mock 全品項計數，價格樣本則僅涵蓋同類小件／同時數方案，兩者母體不同。價格分布是樣本占比，不代表銷售占比。','source-note'),e('p','限制：品牌原型不是已確認業務；同群品牌可能共用 Mock 特徵。標籤相似只涵蓋已標註內容；完整語意與權重待正式驗證。公開售價不等於成交價，未納入規格品質、營收、毛利或經營績效。','source-note'));$('sources-content').replaceChildren(content);
}
function renderAll(){refreshModels();renderStrip();renderOverview();renderMatrix();renderBusiness();renderStructure();renderHeatmap();renderInsights();renderSources();$('structure-kind').value=state.structureKind;$('demo-state').value=state.mode;}
function adjust(){$('results').hidden=true;$('setup').hidden=false;renderOptions();$('setup').scrollIntoView({behavior:'smooth'});}
async function analyze(){validateSetup();if($('start-analysis').disabled)return;state.kind=$('brand-kind').value;state.structureKind=state.kind==='service'?'service':'product';state.supplements={position:$('own-position').value.trim(),audience:$('own-audience').value.trim(),service:$('own-service').value.trim()};state.generatedAt=new Date().toISOString();$('setup').hidden=true;$('error-state').hidden=true;$('results').hidden=true;$('loading').hidden=false;await new Promise(resolve=>setTimeout(resolve,450));$('loading').hidden=true;try{if(state.mode==='error')throw new Error('示例分析暫時失敗，品牌與補充資料已保留。');renderAll();$('results').hidden=false;$('results').scrollIntoView();}catch(error){$('error-message').textContent=error.message;$('error-state').hidden=false;}}
['matrix-x','matrix-y'].forEach(id=>$(id).onchange=()=>{const dir=id.slice(-1),other=dir==='x'?'y':'x',previous=state[dir];state[dir]=$(id).value;if(state[other]===state[dir])state[other]=previous;renderMatrix();});
$('structure-kind').onchange=()=>{state.structureKind=$('structure-kind').value;renderAll();};
$('demo-state').onchange=()=>{state.mode=$('demo-state').value;if(state.mode==='error'){$('results').hidden=true;$('error-state').hidden=false;$('error-message').textContent='模擬分析失敗，選擇與資料已保留。';}else renderAll();};
$('retry-analysis').onclick=()=>{state.mode='normal';analyze();};$('start-analysis').onclick=analyze;$('adjust').onclick=adjust;$('adjust-bottom').onclick=adjust;
$('save-result').onclick=()=>{try{localStorage.setItem('pailotism-level2-result',JSON.stringify({chosen:[...chosen],topics:[...selectedTopics],state:{...state,models:[]}}));$('result-status').textContent='已將比較結果保存於此瀏覽器（非正式後端儲存）。';}catch{$('result-status').textContent='無法存取本地儲存，請檢查瀏覽器設定。';}};
$('restore-result').onclick=()=>{try{const saved=JSON.parse(localStorage.getItem('pailotism-level2-result'));if(!saved)throw new Error('尚無已保存結果。');chosen.clear();saved.chosen.filter(id=>catalog.some(b=>b.id===id)).forEach(id=>chosen.add(id));selectedTopics.clear();saved.topics.filter(id=>topics.some(([topic])=>topic===id)).forEach(id=>selectedTopics.add(id));if(!selectedTopics.size)topics.forEach(([id])=>selectedTopics.add(id));state={...state,...saved.state};if(!axes[state.x])state.x='median';if(!axes[state.y])state.y='positionScore';$('brand-kind').value=state.kind;$('own-position').value=state.supplements.position||'';$('own-audience').value=state.supplements.audience||'';$('own-service').value=state.supplements.service||'';document.querySelectorAll('[data-topic]').forEach(label=>label.querySelector('input').checked=selectedTopics.has(label.dataset.topic));renderOptions();if(chosen.size>=1&&chosen.size<=10&&selectedTopics.size){renderAll();$('setup').hidden=true;$('results').hidden=false;}}catch(error){$('setup-error').textContent=error.message;}};
function returnToFirst(event){event.preventDefault();try{const old=JSON.parse(localStorage.getItem('pailotism-level1-result'))||{};localStorage.setItem('pailotism-level1-result',JSON.stringify({...old,selected:[...chosen],conditions}));location.href='market-exploration-result.html';}catch{$('result-status').textContent='無法保存選擇，請檢查本地儲存設定。';}}
$('back-level1').onclick=returnToFirst;document.querySelector('.back-link').onclick=returnToFirst;
$('third-stage').onclick=()=>{
  const ids=$('third-brand').value?[$('third-brand').value]:[...chosen];
  const snapshot=synthesis();
  const payload={stage:3,mock:true,createdAt:new Date().toISOString(),ownBrandId:'own',ownBrandName:ownBase.name,
    selectedBrandIds:ids,searchConditions:conditions,selectedTopics:[...selectedTopics],
    comparisonContext:{brandIds:[...chosen],scope:isService()?'service-demo':'product',generatedAt:state.generatedAt},
    developmentHypotheses:snapshot.valid.map(item=>({topic:item.topic,name:developmentDirection(item).name,status:'pending-validation',basis:item.differences,conditions:'品牌證據、客群需求與資源能力需驗證',verification:item.verify})),
    brands:state.models.filter(model=>model.id==='own'||ids.includes(model.id)).map(model=>({id:model.id,name:model.name,sourceIds:model.sourceIds,sourceDate:observedAt,
      missingFields:activeFieldRows().filter(([,key])=>model.m[key].status==='missing').map(([label])=>label)}))};
  const box=e('div');box.append(e('p','第三階段入口示意：追蹤競品動態與應對。'),
    e('p','帶入品牌：'+catalog.filter(brand=>ids.includes(brand.id)).map(brand=>brand.name).join('、')),
    e('p','品牌 ID：'+ids.join('、')),e('p','搜尋條件：'+JSON.stringify(conditions)),
    e('p','比較範圍：'+(isService()?'獨立整理服務示例':'居家商品')+'；假設來自自家＋'+chosen.size+'家競品的本次比較，並非已確認策略。'),
    e('p','待驗證方向：'+(payload.developmentHypotheses.map(item=>item.name).join('；')||'資料不足，未產出')),
    e('p','來源與缺漏：'+payload.brands.map(brand=>brand.name+' ['+brand.sourceIds.join('、')+'] '+brand.sourceDate+'；未取得：'+(brand.missingFields.join('、')||'無')).join('；')));
  try{localStorage.setItem('pailotism-level3-input',JSON.stringify(payload));box.append(e('p','已在此瀏覽器保存 Mock 交接資料；未串接第三階段 API，不扣除點數。','muted'));}
  catch{box.append(e('p','瀏覽器無法保存交接資料；本次僅預覽，未送出正式分析。','muted'));}
  showDetail('第三階段 · 交接資料',box);
};
renderOptions();


