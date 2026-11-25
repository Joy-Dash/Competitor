window.PailotismMarketData=(()=>{
const conditions={industry:'居家用品',region:'台灣',channels:['官網','公開通路']};
const self={name:'SHCJ 生活采家',raw:['NT$300–1,500','居家用品、收納（2 類）','官網（1 種）','台灣（1 個地區）',null,'生活選物'],scores:[60,40,33,50,null]};
const brands=[
{id:'a',name:'家序選物',type:'直接競爭',intro:'以居家用品與廚具為主的虛構品牌。',why:'商品用途與台灣市場重疊，可先看規格及價格帶。',matched:['居家用品','台灣','官網'],raw:['NT$200–1,200','居家用品、廚具（2 類）','官網、電商（2 種）','台灣（1 個地區）','4.2／5','多元品項'],scores:[48,40,67,50,84]},
{id:'b',name:'日常構想',type:'相似定位',intro:'重視設計與生活情境的虛構選物品牌。',why:'同樣以生活選物定位，可研究呈現方式和門市服務。',matched:['生活選物','台灣','官網'],raw:['NT$500–2,000','生活選物（1 類）','官網、門市（2 種）','台灣（1 個地區）','4.5／5','設計選物'],scores:[80,20,67,50,90]},
{id:'c',name:'居合生活',type:'標竿品牌',intro:'跨地區、多通路的虛構居家品牌。',why:'商品與通路範圍較廣，可作為擴充方向的參考。',matched:['居家用品','台灣','多通路'],raw:['NT$400–2,500','多元居家用品（5 類）','官網、電商、門市（3 種）','台灣、日本（2 個地區）','4.3／5','多通路服務'],scores:[100,100,100,100,86]}
];
const clusters=['居家收納','廚房用品','生活選物','家具家飾','綜合零售'];
const relationTypes=['直接競爭','間接競爭','相似定位','標竿品牌','潛在競爭'];
const colors={'自家品牌':'#4359f3','直接競爭':'#dc7058','間接競爭':'#c48b27','相似定位':'#298e8b','標竿品牌':'#8a62c4','潛在競爭':'#5e83bd'};
const mockNames=['收納有序','角落工房','疊好生活','留白收納','整室日常','盒間','有格生活','木序收納','歸位選物','鍋邊日子','一匙家居','料理之間','台面工坊','煮好生活','廚間選物','食器日記','鍋物研究室','好廚日常','備料小屋','暖食器','暮光選物','慢日工房','質感日常','日用散步','一物之間','樸室選品','週末生活','拾光日用','日常提案','木里家飾','柔室家具','光木工坊','小宅設計','家景選物','線條家具','暖居家飾','坐好生活','木作時光','舒室','萬物家居','日用集合','家選百貨','好物全室','居家補給','一站日用','生活補給所','家物總匯'];
for(let index=3;index<50;index++){
const cluster=clusters[Math.floor(index/10)],price=800+(index%9)*180,categoryCount=1+index%5,channelCount=1+index%3,regions=index%7===0?2:1;
const rating=index%8===0?null:(4+index%8/10).toFixed(1);
brands.push({id:'mock-'+index,name:mockNames[index-3],type:relationTypes[index%5],intro:cluster+'領域的虛構居家品牌。',why:'符合台灣市場與'+cluster+'的模擬商品條件，可研究商品及通路差異。',matched:[cluster,'台灣','官網'],raw:['NT$'+(150+index*10)+'–'+price,cluster+'（'+categoryCount+' 類）', ['官網（1 種）','官網、電商（2 種）','官網、電商、門市（3 種）'][channelCount-1],regions===2?'台灣、日本（2 個地區）':'台灣（1 個地區）',rating===null?null:rating+'／5',cluster+'選物'],scores:[Math.min(100,price/25),categoryCount*20,Math.round(channelCount/3*100),regions*50,rating===null?null:Number(rating)*20]});
}
brands.forEach((brand,index)=>{
brand.cluster=index===1?'生活選物':index===2?'綜合零售':clusters[Math.floor(index/10)];
brand.types=[brand.type];if(index%6===0&&brand.type!=='相似定位')brand.types.push('相似定位');
brand.relevance=index===49?null:98-((index*17)%48);
brand.sources=['Mock 品牌資料 '+brand.id.toUpperCase()];
});

return {conditions,self,brands,clusters,relationTypes,colors};})();
