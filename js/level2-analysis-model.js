/* Second-stage extension only. Never mutate PailotismMarketData or handoff input. */
window.Level2Analysis = (() => {
  'use strict';
  const date = '2026-11-24';
  const topics = [
    ['position','品牌定位與價值主張'], ['audience','目標客群與消費需求'],
    ['product','商品與服務經營結構'], ['price','價格結構與定價定位'],
    ['business','商業模式與經營特性'], ['channels','銷售與服務通路結構']
  ];
  const profiles = {
    own: {
      claim:'為家庭提供可信賴的居家選物', values:['實用','安心','便利'],
      audience:['家庭使用者','小宅家庭'], needs:['空間整理','日常便利'], occasions:['日常自用','換季整理'], motives:['用途明確','省時便利'],
      categories:['居家用品','收納'], uses:['家務改善','空間整理'],
      direction:'以居家與收納為核心，按使用情境搭配', model:['B2C','D2C'], operation:['選物零售'], revenue:['單品銷售','組合銷售'],
      prices:[320,390,480,590,680,790,980,1290,1490],
      featureCounts:{functional:4,design:1,emotional:1}, audienceTags:['家庭使用者','小宅家庭'],
      serviceLevels:['標準方案','需求訪談'], servicePrices:[900,1200,1500,1800,2200,2800], delivery:null
    },
    a: {
      claim:'用完整的家庭用品與廚具滿足日常需求', values:['實用','便利','選擇完整'],
      audience:['家庭使用者','料理族'], needs:['料理效率','日常便利'], occasions:['日常自用','家庭備餐'], motives:['用途明確','價格可負擔'],
      categories:['居家用品','廚具'], uses:['家務改善','家庭料理'], direction:'按家庭使用功能組織居家與廚具選品',
      model:['B2C'], operation:['選物零售','品牌代理'], revenue:['單品銷售','組合銷售'],
      prices:[220,290,350,450,520,650,790,990,1190],
      featureCounts:{functional:5,design:1,emotional:0}, audienceTags:['家庭使用者','料理族','一般消費者'],
      serviceLevels:['標準方案'], servicePrices:[700,900,1100,1400,1800,2100], delivery:'宅配；依電商通路規則交付'
    },
    b: {
      claim:'透過設計選物與生活情境呈現個人風格', values:['設計','生活風格','情感認同'],
      audience:['設計愛好者','小宅家庭'], needs:['風格表達','空間整理'], occasions:['日常自用','入厝贈禮'], motives:['設計美感','生活認同'],
      categories:['生活選物'], uses:['生活美感','空間整理'], direction:'聚焦設計生活選物，以風格情境組織內容',
      model:['B2C','D2C'], operation:['選物零售','自有品牌'], revenue:['單品銷售','設計服務'],
      prices:[520,690,890,1090,1290,1390,1690,1990],
      featureCounts:{functional:1,design:5,emotional:4}, audienceTags:['設計愛好者'],
      serviceLevels:['需求訪談','模組選配','逐案調整'], servicePrices:[1400,1900,2400,2900,3500,4200], delivery:'宅配／門市取貨'
    },
    c: {
      claim:'用跨地區多通路服務提供完整居家選擇', values:['便利','選擇完整','風格多元'],
      audience:['家庭使用者','小宅家庭','一般消費者'], needs:['日常便利','空間整理','料理效率'], occasions:['日常自用','搬家佈置'], motives:['選擇完整','省時便利'],
      categories:['居家用品','收納','廚具','家飾','家具'], uses:['家務改善','空間整理','家庭料理','生活美感'],
      direction:'跨品類與跨通路提供一站式居家選擇', model:['B2C','D2C'], operation:['自有品牌','品牌代理','選物零售'], revenue:['單品銷售','組合銷售','設計服務'],
      prices:[420,490,650,790,990,1190,1490,1890,2290,2490],
      featureCounts:{functional:3,design:3,emotional:2}, audienceTags:['家庭使用者','小宅家庭','一般消費者'],
      serviceLevels:['標準方案','需求訪談','模組選配'], servicePrices:[1000,1300,1700,2300,3100,3900], delivery:'宅配／門市取貨；跨地區條件另議'
    }
  };
  const clusterProfiles = {
    '居家收納': {categories:['收納'], uses:['空間整理'], audience:['小宅家庭'], needs:['空間整理'], occasions:['換季整理','搬家佈置'], motives:['空間效率'], values:['實用','秩序'], featureCounts:{functional:5,design:2,emotional:0}, audienceTags:['小宅家庭'], direction:'以空間整理需求聚焦收納選品'},
    '廚房用品': {categories:['廚具'], uses:['家庭料理'], audience:['料理族','家庭使用者'], needs:['料理效率'], occasions:['家庭備餐'], motives:['用途明確'], values:['實用','便利'], featureCounts:{functional:5,design:1,emotional:0}, audienceTags:['料理族','家庭使用者'], direction:'以備餐流程聚焦廚房用品'},
    '生活選物': {categories:['生活選物'], uses:['生活美感'], audience:['設計愛好者'], needs:['風格表達'], occasions:['日常自用','入厝贈禮'], motives:['設計美感'], values:['設計','生活風格'], featureCounts:{functional:1,design:4,emotional:3}, audienceTags:['設計愛好者'], direction:'以生活風格選擇日用小件'},
    '家具家飾': {categories:['家具','家飾'], uses:['空間整理','生活美感'], audience:['小宅家庭','設計愛好者'], needs:['風格表達','空間整理'], occasions:['搬家佈置'], motives:['設計美感','空間效率'], values:['設計','實用'], featureCounts:{functional:3,design:4,emotional:1}, audienceTags:['小宅家庭','設計愛好者'], direction:'以居家佈置連結家飾與家具'},
    '綜合零售': {categories:['居家用品','收納','廚具','家飾','家具'], uses:['家務改善','家庭料理','生活美感'], audience:['一般消費者','家庭使用者'], needs:['日常便利','料理效率'], occasions:['日常自用','家庭備餐'], motives:['選擇完整'], values:['便利','選擇完整'], featureCounts:{functional:4,design:2,emotional:1}, audienceTags:['一般消費者','家庭使用者'], direction:'以日常補給經營多品類零售'}
  };
  const topicFields = {
    position:[['核心主張','claim'],['品牌價值','values'],['品牌形象','image'],['價值取向','orientation'],['差異化來源','difference']],
    audience:[['主要客群','audience'],['消費需求','needs'],['購買動機','motives'],['消費情境','occasion'],['客群經營方向','audienceDirection']],
    product:[['品類來源與範圍','categorySummary'],['本範圍品類數','categoryCount'],['已確認品類／服務明細','items'],['商品／服務組成','mix'],['專精程度','specialization'],['組合方式','combination'],['服務模式','serviceProcess'],['經營方向','selection']],
    price:[['樣本入門價格','low'],['主要價格帶','mainBand'],['樣本高階價格','high'],['樣本中位數','median'],['定價方式','pricing']],
    business:[['交易模式','model'],['經營型態','operation'],['收費方式','charging'],['營收來源類型','revenue'],['商業特性','businessFeature']],
    channels:[['主要通路','channels'],['服務地區','regions'],['通路布局','layout'],['服務交付','delivery'],['通路差異','channelDifference']]
  };
  const axisDefinitions = {
    median:['樣本價格中位數','price','入門價位','高價位','同口徑獨立商品／服務樣本的中位數（NT$）；不以品牌全體商品最低、最高價插值。'],
    positionScore:['實用／設計導向','position','實用導向','設計導向','設計訴求證據數 ÷（功能＋設計訴求證據數）×100；證據為第二階段人工標註 Mock 文案，並非第一階段分數。'],
    breadthScore:['品類廣度','product','專精品類','多元品類','已確認明細且分類口徑一致的核心品類數 ÷ 本情境分類表類別總數 ×100（商品6類／服務3類）。只有原始數量、未確認細項的品牌不落點，不把群聚當成品類。'],
    channelScore:['通路廣度','channels','集中通路','多元通路','已取得的實際通路類型數 ÷ 情境分類表3類（官網、電商、門市）×100。'],
    personalization:['服務客製程度','product','標準服務','逐案客製','以方案承諾標註：僅標準0、需求訪談33、模組選配67、逐案調整100。商品型未取得服務承諾時不落點。'],
    audienceFocus:['客群聚焦程度','audience','大眾客群','聚焦客群','目標客群標籤：含一般消費者為0；1個明確客群100、2個67、3個33。缺少標註不估分。'],
    emotionScore:['功能／情感導向','position','功能導向','情感導向','情感訴求證據數 ÷（功能＋情感訴求證據數）×100；使用標註 Mock 文案。']
  };
  const scenarios = [
    {id:'value',name:'商品價值與價格定位',x:'median',y:'positionScore',purpose:'判斷價格差異是否伴隨實用或設計價值差異。'},
    {id:'audience',name:'商品與客群經營方向',x:'breadthScore',y:'audienceFocus',purpose:'比較多品類經營與特定客群聚焦的不同路徑。'},
    {id:'service',name:'通路與服務經營模式',x:'channelScore',y:'personalization',purpose:'比較通路布局及服務是否採標準或客製交付。'},
    {id:'brand',name:'品牌價值定位',x:'emotionScore',y:'audienceFocus',purpose:'辨識功能／情感訴求與大眾／聚焦客群之間的定位差異。'}
  ];
  const cleanList = raw => raw ? raw.split('（')[0].split('、').filter(Boolean) : null;
  const brandEvidence = {
    own:{functional:['以實用用途選品','以家庭需求組織分類','收納改善使用空間','日常用品降低家務負擔'],design:['居家情境搭配'],emotional:['可信賴的選品承諾']},
    a:{functional:['依家庭功能選品','廚具滿足料理需求','用途說明優先','重視日常便利','完整家庭用品選擇'],design:['用品外觀搭配'],emotional:[]},
    b:{functional:['滿足小宅使用需求'],design:['設計選物為主張','按風格分類','以視覺情境呈現','重視家居美感','聚焦設計愛好者'],emotional:['表達個人風格','認同生活品味','入厝禮傳達心意','選物連結生活認同']},
    c:{functional:['多通路接觸便利','一站式居家選擇','跨地區提供服務'],design:['風格多元','家飾與居家搭配','多種空間風格'],emotional:['居家風格認同','家庭生活想像']}
  };
  const clusterEvidence = {
    '居家收納':{functional:['收納分類','空間整理用途','小宅空間效率','換季物品整理','聚焦整理需求'],design:['收納外觀搭配','空間視覺整齊'],emotional:[]},
    '廚房用品':{functional:['備餐流程分類','廚具用途','料理效率','家庭備餐需求','重視使用功能'],design:['廚具外觀搭配'],emotional:[]},
    '生活選物':{functional:['日用小件用途'],design:['生活風格分類','設計選物主張','視覺情境','美感搭配'],emotional:['風格表達','生活品味','贈禮情感']},
    '家具家飾':{functional:['空間配置用途','小宅需求','家具使用功能'],design:['家飾搭配','設計選擇','居家佈置','風格分類'],emotional:['理想生活想像']},
    '綜合零售':{functional:['日常補給','跨品類用途','家庭料理需求','一站選擇'],design:['家居搭配','多元選品'],emotional:['家庭生活想像']}
  };
  const median = values => {const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;};
  const sum = values => values.reduce((a,b)=>a+b,0);
  const ratio = (a,b) => a+b ? Math.round(a/(a+b)*100) : null;
  function metric(value,source,method,kind='objective',status) {
    return {value,unit:null,status:status||(value===null?'missing':'known'),kind,sourceIds:[source],observedAt:date,method};
  }
  function profileFor(brand) {
    if(profiles[brand.id]) return profiles[brand.id];
    const cluster = clusterProfiles[brand.cluster] || clusterProfiles['居家收納'];
    // Shared archetypes are explicit mock assumptions, not claims inferred from a name or index.
    return {...profiles.own,...cluster,claim:cluster.direction,model:['B2C'],operation:['選物零售'],revenue:['單品銷售'],
      serviceLevels:null,servicePrices:[850,1100,1400,1900,2600,3400],delivery:null,
      prices:[190,260,350,490,650,790,990,1190,1490,1790,2190]};
  }
  function build(brand,options) {
    const profile=profileFor(brand),own=brand.id==='own',service=options.service;
    const evidence=brandEvidence[brand.id]||clusterEvidence[brand.cluster]||clusterEvidence['居家收納'];
    const featureCounts=Object.fromEntries(Object.entries(evidence).map(([key,items])=>[key,items.length]));
    const rawSource='level1-'+brand.id,extensionSource='level2-'+brand.id,sourceId=extensionSource;
    const m={},put=(key,value,method='第二階段獨立人工編寫的 Mock 商業特徵',kind='objective',status)=>m[key]=metric(value,sourceId,method,kind,status);
    const inherited=(key,value,method)=>m[key]=metric(value,rawSource,method,'objective');
    let samples;
    if(service) samples=profile.servicePrices.map((price,i)=>({id:brand.id+'-service-'+i,label:'標準2小時到府整理方案 '+(i+1),price,currency:'TWD',scope:'同城到府／2小時／不含耗材',category:'整理服務',date}));
    else {
      const range=brand.raw[0].replaceAll(',','').match(/\d+/g).map(Number);
      // Keep curated observations within the inherited published range. No interpolation.
      samples=profile.prices.filter(price=>price>=range[0]&&price<=range[1]).map((price,i)=>({id:brand.id+'-product-'+i,label:'日用小件標準單品 '+(i+1),price,currency:'TWD',scope:'居家日用小件／單件／非家具／非組合價',category:'居家日用小件',date}));
    }
    const inheritedCategoryCount=Number(brand.raw[1]?.match(/（(\d+)\s*類）/)?.[1])||null;
    // Four explicit profiles have itemized mock categories that match Level 1.
    // Other brands only have a count. A graph cluster is not an itemized taxonomy.
    const categoryDetailsKnown=!!profiles[brand.id]&&profile.categories.length===inheritedCategoryCount;
    const mix=service?[{name:'到府整理',count:3},{name:'線上諮詢',count:2},{name:'定期維護',count:1}]:categoryDetailsKnown?profile.categories.map(name=>({name,count:{'居家用品':12,'收納':18,'廚具':14,'生活選物':22,'家飾':8,'家具':6}[name]})):null;
    inherited('inheritedCategorySummary',brand.raw[1],'第一階段原始品類描述，保留原分類口徑');
    inherited('inheritedCategoryCount',inheritedCategoryCount,'只讀取第一階段明列的品類數，不從星鏈群聚推定');
    if(service){
      put('categorySummary','整理服務示例（3類）；第一階段商品：'+brand.raw[1]+'。兩者為不同範圍，不覆蓋原商品品類');
      put('categoryCount',3,'第二階段額外服務示例，與原商品數分開');
    } else {
      inherited('categorySummary',brand.raw[1]+(categoryDetailsKnown?'；明細已於本次 Mock 對齊':'；細項待確認，尚未建立跨品牌分類對應'),'原樣延續第一階段，不替未知細項命名');
      inherited('categoryCount',inheritedCategoryCount,'沿用第一階段同品牌同口徑品類數');
    }
    inherited('publishedRange',brand.raw[0],'第一階段全品牌公開價格範圍；與本頁同類小件樣本範圍不同');
    inherited('channels',cleanList(brand.raw[2]),'第一階段通路文字拆成類型集合，未使用雷達分數');
    inherited('regions',cleanList(brand.raw[3]),'第一階段服務地區文字拆成地區集合');
    inherited('image',brand.raw[5],'第一階段品牌描述');
    inherited('rating',brand.raw[4]===null?null:parseFloat(brand.raw[4]),'第一階段 Mock 公開評分，僅為輔助資料，不計競爭力');
    put('reviews',null,'未取得評論數，不以評分推算評論量');
    put('claim',profile.claim);put('values',profile.values);put('orientation',featureCounts,'由人工標註 Mock 文案證據清單逐筆計數，非真實文案調查','inference','inferred');
    put('positionEvidence',Object.entries(evidence).flatMap(([type,items])=>items.map(text=>({type,text}))),'人工編寫並分類的 Mock 品牌訴求證據，不代表真實文案','inference','inferred');
    put('difference',profile.direction);put('audience',profile.audience);put('needs',profile.needs);put('motives',profile.motives);put('occasion',profile.occasions);
    put('audienceDirection','以'+profile.audience.join('、')+'的'+profile.needs.join('、')+'需求組織經營');
    put('items',mix?mix.map(part=>part.name):null,mix?'明細與第一階段品類數相符；服務為獨立示例':'只有第一階段品類數，明細未取得，不以群聚替代');
    put('mix',mix,mix?'明細已對齊的品項組成 Mock，品項數非銷售占比':'未取得細項與品項數，不能生成組成圖');
    put('uses',service?['家務改善','空間整理']:categoryDetailsKnown?profile.uses:null);
    put('specialization',mix?(mix.length===1?'單一核心品類（專精能力待驗證）':mix.length<=2?'少數核心品類（經營聚焦待驗證）':'多核心品類（經營能力待驗證）'):null,'組成只描述範圍，不以品類少推定專精能力；細項缺漏不推論');
    put('combination',service?'標準時數方案搭配需求訪談':profile.revenue.includes('組合銷售')?'單品＋使用情境組合':'以單品為主');
    put('selection',service?'以整理需求配置服務方案（額外模擬）':profile.direction);
    put('serviceProcess',service?'需求確認 → 方案報價 → 到府執行 → 回饋':null,service?'服務型流程 Mock':'商品型未取得服務承諾', 'objective',service?'known':'notApplicable');
    put('samples',samples.length?samples:null,'獨立編寫的同口徑價格樣本；非區間插值');
    const prices=samples.map(item=>item.price);
    put('low',prices.length?Math.min(...prices):null,'同口徑樣本最小值');put('high',prices.length?Math.max(...prices):null,'同口徑樣本最大值');
    put('median',prices.length?median(prices):null,'同口徑獨立樣本排序後中位數');
    ['low','high','median'].forEach(key=>m[key].unit='TWD');
    put('mainBand',null,'由本次共同價格帶與同一組樣本計算');
    put('pricing',service?'同城2小時標準方案定價；不含耗材':'單品定價；組合不列入本次可比樣本');
    put('model',profile.model);put('operation',profile.operation);put('charging',service?'依方案／時數收費':'單次購買付費');put('revenue',profile.revenue);
    put('businessFeature',profile.operation.join('＋')+'；'+profile.revenue.join('、'));
    put('layout',cleanList(brand.raw[2])?.includes('門市')?'線上與實體並行':'線上為主要接觸點');
    put('delivery',profile.delivery);put('channelDifference',profile.delivery?'比較線上購買與交付的服務接點':'交付條件未取得，不能推定服務能力');
    put('positionScore',ratio(featureCounts.design,featureCounts.functional),axisDefinitions.positionScore[4],'inference','inferred');
    put('emotionScore',ratio(featureCounts.emotional,featureCounts.functional),axisDefinitions.emotionScore[4],'inference','inferred');
    put('breadthScore',mix?Math.round(mix.length/(service?3:6)*100):null,axisDefinitions.breadthScore[4],'inference',mix?'inferred':'missing');
    put('channelScore',m.channels.value?Math.round(m.channels.value.length/3*100):null,axisDefinitions.channelScore[4],'inference','inferred');
    const focus=profile.audienceTags.includes('一般消費者')?0:({1:100,2:67,3:33}[profile.audienceTags.length]??null);
    put('audienceFocus',focus,axisDefinitions.audienceFocus[4],'inference','inferred');
    const serviceValues={'標準方案':0,'需求訪談':33,'模組選配':67,'逐案調整':100};
    put('personalization',service&&profile.serviceLevels?Math.max(...profile.serviceLevels.map(label=>serviceValues[label])):null,axisDefinitions.personalization[4],'inference',service&&profile.serviceLevels?'inferred':'missing');
    put('valueTags',profile.values,'人工標註價值主張標籤；未執行 AI 語意辨識','inference','inferred');
    if(own) {
      const supplements=options.supplements||{};
      [['position','claim'],['audience','audience'],['service','delivery']].forEach(([field,key])=>{
        if(!supplements[field])return;
        m[key]=metric(supplements[field], 'user-supplement','使用者本次補充，未寫回 Brand Book','user');
        // Free text needs confirmation; do not silently retain old tags/scores as its interpretation.
        const affected=field==='position'?['positionScore','emotionScore','valueTags','values','orientation','positionEvidence','difference']:field==='audience'?['audienceFocus','needs','motives','occasion','audienceDirection']:[];
        affected.forEach(name=>m[name]=metric(null,'user-supplement','補充文字尚未轉成經使用者確認的結構化特徵','inference'));
      });
    }
    if(options.mode==='partial'&&(own||brand.id==='b'||!profiles[brand.id])) {
      ['samples','low','high','median','mainBand','positionScore','emotionScore','valueTags','orientation','delivery','rating','personalization'].forEach(key=>m[key]=metric(null,extensionSource,'缺值測試情境，資料未取得'));
    }
    if(options.mode==='empty') Object.keys(m).forEach(key=>{if(m[key].status!=='notApplicable')m[key]=metric(null,extensionSource,'空資料測試情境');});
    return {id:brand.id,name:brand.name,type:brand.type||'自家品牌',color:options.color,m,
      semanticAnalysis:{status:'pending',method:null,model:null,evidenceIds:[],note:'未串接 AI 語意分析；目前只比較已標註的結構化集合'},
      source:{id:extensionSource,name:brand.name+' 第二階段 Mock',observedAt:date,url:null,type:'獨立人工設定的 Mock 商業特徵'},
      sourceIds:[rawSource,extensionSource],categoryAlignment:{scope:service?'service-demo':'inherited-product',inheritedCount:inheritedCategoryCount,detailsKnown:service||categoryDetailsKnown},archetype:profiles[brand.id]?'品牌專屬 Mock':'沿用「'+brand.cluster+'」商業原型；品類數繼承第一階段，細項未確認，不以群聚替代'};
  }
  function bandsFor(models,service) {
    const values=models.flatMap(model=>(model.m.samples.value||[]).map(item=>item.price)).sort((a,b)=>a-b);
    if(!values.length)return [];
    const step=service?500:100;
    const cuts=[.25,.5,.75].map(q=>Math.ceil(values[Math.floor((values.length-1)*q)]/step)*step).filter((v,i,arr)=>v>values[0]&&v<values.at(-1)&&(i===0||v!==arr[i-1]));
    return [0,...cuts].map((min,index,arr)=>({min,max:index===arr.length-1?Infinity:arr[index+1],name:index===arr.length-1?'NT$'+min+' 以上':min===0?'低於 NT$'+arr[index+1]:'NT$'+min+'–'+(arr[index+1]-1)}));
  }
  function distribution(model,bands) {
    const samples=model.m.samples.value;
    return !samples||!bands.length?null:bands.map(band=>({...band,count:samples.filter(item=>item.price>=band.min&&item.price<band.max).length,total:samples.length}));
  }
  function finalize(models,service) {
    const bands=bandsFor(models,service);
    models.forEach(model=>{model.distribution=distribution(model,bands);if(model.distribution){const top=[...model.distribution].sort((a,b)=>b.count-a.count);model.m.mainBand.value=top.filter(part=>part.count===top[0].count).map(part=>part.name).join('／');model.m.mainBand.status='known';}});
    return bands;
  }
  function jaccard(a,b) {
    if(!Array.isArray(a)||!Array.isArray(b)||!a.length||!b.length)return {value:null,common:[],onlyOwn:[],onlyPeer:[],method:'Jaccard：交集項目數 ÷ 聯集項目數 ×100；未標註不視為空集合。'};
    const common=[...new Set(a)].filter(v=>b.includes(v)),union=[...new Set([...a,...b])];
    return {value:Math.round(common.length/union.length*100),common,onlyOwn:a.filter(v=>!b.includes(v)),onlyPeer:b.filter(v=>!a.includes(v)),method:`Jaccard：${common.length} 個交集 ÷ ${union.length} 個聯集 ×100`};
  }
  const overlapRows=[['商品／服務','items','product'],['目標客群','audience','audience'],['價格結構','price','price'],['品牌定位','valueTags','position'],['銷售通路','channels','channels'],['服務地區','regions','channels'],['消費需求','needs','audience']];
  function compare(own,peer,key) {
    let result;
    if(key==='price') {
      const a=own.distribution,b=peer.distribution;
      if(!a||!b)result={value:null,common:[],onlyOwn:[],onlyPeer:[],method:'兩方都須有同口徑價格樣本，缺漏不補0。'};
      else {
        const common=a.filter((p,i)=>p.count&&b[i].count).map(p=>p.name);
        const similarity=sum(a.map((p,i)=>Math.min(p.count/p.total,b[i].count/b[i].total)));
        result={value:Math.round(similarity*100),common,onlyOwn:a.filter((p,i)=>p.count&&!b[i].count).map(p=>p.name),onlyPeer:b.filter((p,i)=>p.count&&!a[i].count).map(p=>p.name),method:'分布交集 Σ min(自家價格帶占比, 對手價格帶占比) ×100；價格帶由本次同類樣本共同四分位切點取整設定。'};
      }
    } else if(key==='items') {
      const categories=jaccard(own.m.items.value,peer.m.items.value),uses=jaccard(own.m.uses.value,peer.m.uses.value);
      result={...categories,value:categories.value===null||uses.value===null?null:Math.round((categories.value+uses.value)/2),method:'品類 Jaccard 與用途／服務內容 Jaccard 的等權平均。'+categories.method+'；用途：'+uses.method,common:[...categories.common,...uses.common.map(v=>'用途：'+v)],onlyOwn:[...categories.onlyOwn,...uses.onlyOwn.map(v=>'用途：'+v)],onlyPeer:[...categories.onlyPeer,...uses.onlyPeer.map(v=>'用途：'+v)]};
    } else if(key==='audience') {
      const audience=jaccard(own.m.audience.value,peer.m.audience.value),needs=jaccard(own.m.needs.value,peer.m.needs.value);
      result={...audience,value:audience.value===null||needs.value===null?null:Math.round((audience.value+needs.value)/2),method:'客群特性與消費需求 Jaccard 的等權平均。'+audience.method+'；需求：'+needs.method,common:[...audience.common,...needs.common.map(v=>'需求：'+v)],onlyOwn:[...audience.onlyOwn,...needs.onlyOwn],onlyPeer:[...audience.onlyPeer,...needs.onlyPeer]};
    } else if(key==='needs') {
      const needs=jaccard(own.m.needs.value,peer.m.needs.value),occasions=jaccard(own.m.occasion.value,peer.m.occasion.value);
      result={...needs,value:needs.value===null||occasions.value===null?null:Math.round((needs.value+occasions.value)/2),method:'需求與消費情境 Jaccard 的等權平均。'+needs.method+'；情境：'+occasions.method,common:[...needs.common,...occasions.common],onlyOwn:[...needs.onlyOwn,...occasions.onlyOwn],onlyPeer:[...needs.onlyPeer,...occasions.onlyPeer]};
    } else result=jaccard(own.m[key]?.value,peer.m[key]?.value);
    return {...result,sourceIds:[...new Set([...own.sourceIds,...peer.sourceIds])],semantic:key==='valueTags'?'人工標註的價值主張標籤相似度；並非完整語意相似度，正式 AI 分析待擴充。':null};
  }
  return {topics,topicFields,axes:axisDefinitions,scenarios,build,finalize,distribution,compare,overlapRows,jaccard,median,date};
})();
