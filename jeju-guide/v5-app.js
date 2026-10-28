(function boot(){
 const db=window.JEJU_V5;
 if(!db||!Array.isArray(db.days)){document.getElementById("app").textContent="行程数据读取失败，请刷新页面。";return}
 const d=db.days, food=db.food, check=db.check, places=db.places, urls=db.urls;
 const media=window.JEJU_MEDIA||{places:{},aliases:{}};
 const prices=window.JEJU_COSTS||{days:[],rate:200,spaNonFree:[63000,200000],sources:[]};
 const state={tab:"home",index:0,checks:[],query:"",filter:"all",expanded:{},budget:{flight:"",hotel:"",parking:"",shopping:"",fx:200,freeSpa:false},detailsOpen:false};
 const app=document.getElementById("app");
 const draw=(type)=>window.JEJU_ICON?window.JEJU_ICON(type):'<span aria-hidden="true">🍊</span>';
 const placeArt=(name,ko)=>{
   const v=(String(name||"")+" "+String(ko||"")).toLowerCase();
   if(/石头爷爷|돌하르방|harubang/.test(v))return "harubang";
   if(/海女|해녀/.test(v))return "haenyeo";
   if(/涉地可支|섭지코지/.test(v))return "lighthouse";
   if(/鳗鱼|장어/.test(v))return "eel-rice";
   if(/紫菜包饭|김밥/.test(v))return "gimbap";
   if(/机场|공항|airport|cju/.test(v))return "airport";
   if(/站|巴士|公交|정류장|버스/.test(v))return "bus";
   if(/酒店|bridge|호텔/.test(v))return "hotel";
   if(/温泉|스파|핫스프링/.test(v))return "spa";
   if(/忘忧|药房|망우|酒馆/.test(v))return "bar";
   if(/蟹|게장|동문간장/.test(v))return "crab";
   if(/瀑布|폭포/.test(v))return "falls";
   if(/面包|bakery|베이커리|咖啡|해지개|lazy pump/.test(v))return "bakery";
   if(/海滩|해수욕장|海岸|해안|해변|涯月|韩潭|한담|涉地可支|섭지코지|河口|쇠소깍/.test(v))return "beach";
   if(/汉拿山|한라산/.test(v))return "hallasan";
   if(/山房|松岳|송악|산방/.test(v))return "mountain";
   if(/偶来|올레|步道|길/.test(v))return "trail";
   if(/港|포구/.test(v))return "port";
   if(/市场|시장/.test(v))return "market";
   if(/购物|olive young|올리브영/.test(v))return "shop";
   if(/龙头岩|용두암|岩石/.test(v))return "rock";
   if(/云桥|구름다리/.test(v))return "bridge";
   if(/烤肉|黑猪|章鱼|갈치|식당|음식/.test(v))return "food";
   return "orange";
 };
 const html=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

 let currentGallery=[],photoCursor=0,photoFallback="";
 const imageFallback=i=>"./images/"+(d[i]?.photo||"soesokkak.webp");
 function selectMedia(name,ko,dayIndex){
   const candidates=[String(ko||""),String(name||"")].filter(Boolean);
   let found=null;
   for(const k of candidates){if(media.places?.[k]?.length){found=media.places[k];break}}
   if(!found){
     const alias=Object.entries(media.aliases||{}).find(([keyword,target])=>candidates.some(s=>s.includes(keyword))&&media.places?.[target]?.length);
     if(alias)found=media.places[alias[1]];
   }
   return found?.length?found:[{src:imageFallback(dayIndex),caption:"当天行程氛围照片（不代表该地点实景）",exact:false}];
 }
 function cover(mediaList,dayIndex){
   const p=mediaList[0],f=imageFallback(dayIndex);
   const src=html(p?.src||f),back=html(f);
   return '<div class="place-cover" style="background-image:linear-gradient(0deg,rgba(7,37,61,.62),rgba(13,67,102,.07)),url(&quot;'+src+'&quot;),url(&quot;'+back+'&quot;)"><span>'+(p.exact?'📸 地点实景':'🖼️ 当日氛围图')+'</span></div>';
 }
 function galleryPaint(){
   const p=currentGallery[photoCursor];
   if(!p)return;
   const img=document.getElementById("photo-image");
   img.onerror=null;
   img.dataset.triedFallback="0";
   img.src=p.src;
   img.alt=p.caption||"地点图片";
   document.getElementById("photo-caption").textContent=p.caption||"相关地点图片";
   document.getElementById("photo-credit").textContent=p.credit?"图片来源："+p.credit:(!p.exact?"场景参考图，请勿视为该店或该景点的实拍":"");
   document.getElementById("photo-count").textContent=(photoCursor+1)+" / "+currentGallery.length;
   document.getElementById("photo-prev").disabled=photoCursor===0;
   document.getElementById("photo-next").disabled=photoCursor===currentGallery.length-1;
 }
 function openGallery(title,photos,dayIndex){
   currentGallery=Array.isArray(photos)&&photos.length?photos:[{src:imageFallback(dayIndex),caption:"当天行程氛围图",exact:false}];
   photoCursor=0;photoFallback=imageFallback(dayIndex);
   document.getElementById("photo-title").textContent=title;
   galleryPaint();
   const dlg=document.getElementById("photo-dialog");
   if(!dlg.open)dlg.showModal();
 }
 function closeGallery(){const dlg=document.getElementById("photo-dialog");if(dlg.open)dlg.close()}
 function won(n){return "₩"+Math.round(n).toLocaleString("en-US")}
 function yuan(n){return "¥"+Math.round(n).toLocaleString("zh-CN")}
 function bfx(){return Math.max(1,Number(state.budget.fx)||200)}
 function dailyAmounts(i){
   let item=prices.days[i];if(!item)return [0,0];
   const sum=item.costs.reduce((a,c)=>[a[0]+c[1],a[1]+c[2]],[0,0]);
   if(i===0&&!state.budget.freeSpa){sum[0]+=prices.spaNonFree[0];sum[1]+=prices.spaNonFree[1]}
   return sum;
 }
 function tripAmounts(){return d.reduce((a,x,i)=>{const v=dailyAmounts(i);return [a[0]+v[0],a[1]+v[1]]},[0,0])}
 function lodgingKnown(){return state.budget.flight!==""&&state.budget.hotel!==""&&Number.isFinite(Number(state.budget.flight))&&Number.isFinite(Number(state.budget.hotel))}
 function extras(){return ["flight","hotel","parking","shopping"].reduce((a,k)=>a+Math.max(0,Number(state.budget[k])||0),0)}
 function overallSummary(){
   const v=tripAmounts(),fx=bfx(),low=v[0]/fx,high=v[1]/fx,has=lodgingKnown(),paid=extras();
   return '<div class="cost-summary"><small>两人 · 七天六晚 · 基础岛内支出</small><strong>'+yuan(low)+' – '+yuan(high)+'</strong><p>'+won(v[0])+' – '+won(v[1])+'｜按 ¥1≈₩'+fx.toLocaleString("zh-CN")+' 估算</p><div class="cost-totalline">'+(has?'<b>含机票酒店及已填其他费用：'+yuan(low+paid)+' – '+yuan(high+paid)+'</b>':'<b>机票和酒店金额尚未录入，暂不显示完整旅行总额</b>')+'</div></div>';
 }
 function dayCosts(i,brief=false){
   const p=prices.days[i],v=dailyAmounts(i);if(!p)return "";
   let lines=p.costs.map(c=>'<div class="cost-line"><span>'+html(c[0])+'</span><b>'+won(c[1])+' – '+won(c[2])+'</b></div>').join("");
   if(i===0)lines+='<div class="cost-line"><span>O’REVE 温泉'+(state.budget.freeSpa?'（按免费体验计）':'（购票预留）')+'</span><b>'+(state.budget.freeSpa?'₩0':won(prices.spaNonFree[0])+' – '+won(prices.spaNonFree[1]))+'</b></div>';
   return '<div class="day-cost-card"><div class="day-cost-head"><span>💰 两人当日费用预估</span><strong>'+yuan(v[0]/bfx())+' – '+yuan(v[1]/bfx())+'</strong></div><div class="day-cost-sub">'+won(v[0])+' – '+won(v[1])+' · 含交通、餐饮及当日项目</div>'+(brief?"":'<div class="cost-lines">'+lines+'</div><p class="cost-note">'+html(p.note)+'</p>')+'</div>';
 }
 function budgetPage(){
   const opts=[["flight","往返机票（两人总价）"],["hotel","Hotel Bridge 六晚总房费"],["parking","广州机场停车及自驾相关费用"],["shopping","购物与伴手礼预算"]];
   const fmt=(k,label)=>'<label class="cost-input-label"><span>'+label+'</span><div class="cost-input-wrap"><span>¥</span><input data-budget-field="'+k+'" type="number" inputmode="decimal" min="0" step="1" placeholder="尚未录入" value="'+html(state.budget[k])+'"></div></label>';
   return '<div class="budget-hero"><div class="budget-hero-doodle">'+draw('wallet')+draw('tangerine')+'</div><small>2026年11月3日—9日 · 双人预算</small><h1>七天花多少钱？</h1><p>每天看明细，整趟看总额；机票和酒店可按实际订单填写。</p></div>'+section("七天费用总览","按两个人估算，不是实际已付金额")+overallSummary()+
   '<div class="cost-day-list">'+d.map((x,i)=>'<button class="cost-day-row" data-day="'+i+'"><span class="cost-day-mini">'+draw(['spa','sunset','trail','crab','mountain','lighthouse','plane'][i])+'</span><span>D'+(i+1)+' · '+html(x.date)+' · '+html(x.name)+'</span><b>'+yuan(dailyAmounts(i)[0]/bfx())+' – '+yuan(dailyAmounts(i)[1]/bfx())+'</b></button>').join("")+'</div>'+
   section("把实际机票与酒店补进预算","金额均为人民币 · 自动保存在当前设备")+
   '<div class="white cost-form">'+opts.map(x=>fmt(x[0],x[1])).join("")+
   '<label class="cost-check"><input type="checkbox" data-budget-spa '+(state.budget.freeSpa?'checked':'')+'><span>O’REVE 按免费体验计费（仅在确认资格后勾选）</span></label>'+
   '<label class="cost-input-label"><span>计划换算汇率：¥1 ≈ ₩</span><div class="cost-input-wrap"><input type="number" min="1" step="1" inputmode="decimal" data-budget-field="fx" value="'+html(state.budget.fx)+'"></div></label>'+
   '<div class="cost-note">当前默认规划汇率 ₩200/¥1，不是实时结算牌价；实际刷卡、换汇有差异。没有机票酒店实际金额时，页面只显示可核算的岛内费用。</div></div>'+
   section("按天查看费用项目","仅估算 · 可在对应日期看详情")+
   '<div class="cost-breakdowns">'+d.map((x,i)=>'<div><h3>D'+(i+1)+' · '+html(x.date)+' '+html(x.name)+'</h3>'+dayCosts(i)+'</div>').join("")+'</div>'+
   section("估算口径与资料","透明说明")+"<div class='white'><p class='cost-note'>本预算按2人合计，餐饮与打车采用规划区间，未把任何尚未确认的餐厅菜单价格冒充实价。O’REVE 普通及优惠票种不同；如确实享有免费体验可切换为零。景区大多为开放海岸；自选付费项目、纪念品及额外出租车可能增加支出。</p><div class='refs'>"+prices.sources.map(s=>'<a target="_blank" rel="noopener noreferrer" href="'+html(s[1])+'">'+html(s[0])+' ↗</a>').join("")+"</div></div>";
 }

 let modalDay=0;
 const routeSrc=i=>"./route-maps/day-"+(i+1)+".svg?v=20261028route";
 function openRoute(index){
   modalDay=Math.max(0,Math.min(d.length-1,Number(index)||0));
   const dlg=document.getElementById("route-dialog");
   const title=document.getElementById("route-title");
   const img=document.getElementById("route-image");
   const dayCount=document.getElementById("route-count");
   const prev=document.getElementById("route-prev");
   const next=document.getElementById("route-next");
   title.textContent="D"+(modalDay+1)+"｜"+d[modalDay].name;
   dayCount.textContent=(modalDay+1)+" / "+d.length;
   img.src=routeSrc(modalDay);
   img.alt="11月"+d[modalDay].date.slice(3)+"日 "+d[modalDay].name+"路线示意图，按编号查看地点顺序";
   prev.disabled=modalDay===0;
   next.disabled=modalDay===d.length-1;
   dlg.querySelector(".route-scroll").scrollTop=0;
   if(!dlg.open)dlg.showModal();
 }
 function closeRoute(){const dlg=document.getElementById("route-dialog");if(dlg.open)dlg.close()}
 function section(title,sub=""){return `<div class="sec"><h2>${html(title)}</h2><small>${html(sub)}</small></div>`}
 function toast(msg){let el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(window.toastDelay);window.toastDelay=setTimeout(()=>el.classList.remove("show"),2000)}
 async function copy(s){try{await navigator.clipboard.writeText(s);toast("已复制")}catch(err){const ta=document.createElement("textarea");ta.value=s;document.body.append(ta);ta.select();try{document.execCommand("copy");toast("已复制")}catch(e){toast("无法复制，请手动选择")}ta.remove()}}
 function setTab(tab,i){if(Number.isInteger(i))state.index=i;state.tab=tab;state.expanded={};state.detailsOpen=false;if(tab==="day"){history.replaceState(null,"","#day-"+(state.index+1))}else{history.replaceState(null,"",location.pathname+location.search)}render();window.scrollTo(0,0)}
 function navbar(){document.querySelectorAll("[data-nav]").forEach(el=>el.classList.toggle("active",el.dataset.nav===state.tab))}
 function home(){
  const boxes=[
   ["plane","固定航班","11/03 广州T3 07:45（北京时间）→ 济州11:30（韩国时间）；11/09 济州11:10（韩国时间）→ 广州T3 14:00（北京时间）"],
   ["hotel","全程住 Hotel Bridge","호텔 브릿지 서귀포｜제주 서귀포시 태평로 436｜11/03入住，11/09退房，共6晚"],
   ["bus","交通原则","公交优先、少换乘；机场往返600；11/07华顺换乘，11/08主选295直达涉地可支"]
  ];
  return `<div class="hero doodle-home-hero"><div class="home-hero-stickers"><div class="home-sticker citrus">${draw("tangerine")}</div><div class="home-sticker peak">${draw("hallasan")}</div><div class="home-sticker splash">${draw("sea")}</div></div><div class="stamp">2026.11.03—11.09</div><div class="eyebrow">JEJU ISLAND / 7 DAYS 6 NIGHTS</div><h1>去济州，<br>慢慢走七天。</h1><p>11月3日—9日 · 两个人 · 住西归浦 · 公交优先</p><div class="statbar"><span>🗓️ 七天六晚</span><span>👫 双人旅行</span><span>🚶 6号线＋10号线精华</span><span>🕒 韩国比中国快1小时</span></div></div>
  ${section("七天行程一眼看懂","点击日期查看手绘行程")}
  <div class="days">${d.map((x,i)=>`<button class="day-card" data-day="${i}"><span class="day-mini-illustration">${draw(["spa","sunset","trail","sea","mountain","lighthouse","plane"][i])}</span><small>D${i+1} · ${html(x.week)}</small><b>${html(x.date)}</b><em>${html(x.name)}</em><i>查看详情 ↗</i></button>`).join("")}</div>
  ${section("行程费用先看一眼","两人花费 · 机票酒店另录入")}
  ${overallSummary()}<div class="btnrow" style="margin:11px 0 18px"><button class="btn primary" data-goto="budget">💰 查看七天费用明细 →</button></div>
  ${section("航班、酒店、交通","出发前最先确认")}
  <div class="grid3">${boxes.map(x=>`<div class="white info-doodle-card"><div class="info-doodle-icon">${draw(x[0])}</div><div class="kicker">行前必知 · 已确认</div><h3>${x[1]}</h3><p>${x[2]}</p></div>`).join("")}</div>
  ${section("本次旅行的四大重点","只展示需要关注的事")}
  <div class="duo"><div class="white">
  ${[["spa","11/03 纪念日","O'REVE温泉16:00–19:00完整3小时，20:00左右忘忧药房传统酒晚餐（未订座）。"],["sunset","11/04 看日落","郭支→韩潭海岸步道，Lazy Pump / Haejigae当天二选一，日落约17:39。"],["crab","11/06 东门酱蟹","上午睡懒觉，中午北海岸Citywalk，17:00固定晚餐。"],["trail","11/07 长徒步","松岳山完整开放海岸环线＋10号线反穿精华至华顺，约11–12公里（估算），17:00高恩水。"]].map(x=>`<div class="feature"><span class="ico">${draw(x[0])}</span><div><b>${x[1]}</b><p>${x[2]}</p></div></div>`).join("")}
  </div><div style="display:grid;gap:12px;align-content:start"><div class="callout"><b>⚠️ 返程巴士要重点复核</b><p>11/09 06:25是600路从KAL酒店的始发时刻，并非徐福展示馆站上车时刻。11/08晚上确认具体到站分钟。</p></div><div class="callout blue"><b>🚏 班距不是候车时长</b><p>本页全部公交间隔只作整线参考。特别注意202区间车、752-2乡村巴士和295稀疏班次。当天以Naver Map和官方站牌为准。</p></div><div class="white"><div class="kicker">旅行中的快捷操作</div><h3>不用再翻长文找韩文地名</h3><p>在口袋工具里查看每日路线简图、复制韩文地名、查看美食备选和准备清单。</p><div class="btnrow" style="margin-top:14px"><button class="btn primary" data-goto="pocket">🎒 打开随身口袋</button><button class="btn" data-day="0">D1 开始阅读 →</button></div></div></div></div>`;
 }
 function scrollDays(){return `<div class="scroll-days">${d.map((x,i)=>`<button class="${state.index===i?"active":""}" data-day="${i}">D${i+1} · ${html(x.date)} ${html(x.week)}</button>`).join("")}</div>`}
 function side(){return `<aside class="side"><div class="sideheader">🗓️ 每日手绘行程 / 7 DAYS</div>${d.map((x,i)=>`<button data-day="${i}" class="${state.index===i?"active":""}"><span>D${i+1}</span><div><b>${html(x.name)}</b><small>${html(x.date)} · ${html(x.area)}</small></div></button>`).join("")}<div style="padding:14px"><button class="btn soft" style="width:100%" data-goto="pocket">🎒 随身口袋</button></div></aside>`}
 function dayView(){
  const x=d[state.index];
  const poster=(window.JEJU_POSTERS||[])[state.index];
  const rows=x.rows.map((r,i)=>{const gallery=selectMedia(r[1],r[3],state.index);return '<div class="step"><div class="time">'+html(r[0])+'</div><div class="track"><span class="dot"></span></div><div class="entry">'+cover(gallery,state.index)+'<div class="step-content"><b>'+html(r[1])+'</b><p>'+html(r[2])+'</p><div class="buttons"><button data-gallery-step="'+state.index+':'+i+'">📷 相关图片'+(gallery.length>1?' · '+gallery.length+'张':'')+'</button><button data-expand="'+i+'">'+(state.expanded[i]?'收起说明 −':'查看说明 ＋')+'</button>'+(r[3]?'<button data-copy="'+html(r[3])+'">复制韩文</button>':'')+'</div>'+(state.expanded[i]?'<div class="detail">'+(r[3]?'韩文搜索：'+html(r[3])+'<br>':'')+html(r[2])+'<br>公交实际到站、步道开放情况及餐厅营业时间，请出发当天核对。</div>':'')+'</div></div></div>'}).join('');
  const painted=poster&&window.JEJU_POSTER_VIEW?window.JEJU_POSTER_VIEW(x,poster,state.index,{
     html,priceDays:prices.days,amounts:dailyAmounts(state.index),fx:bfx(),freeSpa:state.budget.freeSpa,spa:prices.spaNonFree
  }):'<div class="callout"><b>'+html(x.name)+'</b><p>'+html(x.lead)+'</p></div>';
  return '<div class="layout">'+side()+'<div>'+scrollDays()+
    painted+
    '<div class="sketch-extras"><div class="sketch-brief-actions">'+
    '<button class="btn primary" data-copyday="'+state.index+'">📋 复制完整行程</button>'+
    '<button class="btn soft" data-route="'+state.index+'">🗺️ 查看路线方位简图</button>'+
    '<button class="btn" data-goto="budget">💰 全程费用预算</button>'+
    '</div>'+
    '<details class="sketch-detail-disclosure" '+(state.detailsOpen?'open':'')+'>'+
       '<summary>📖 展开完整时间表、实景照片和交通备选</summary>'+
       '<div class="sketch-detail-inner">'+
         '<div class="callout"><b>⚠️ 当日执行提醒</b><p>'+html(x.alert)+'</p></div>'+
         section('详细时间轴',x.rows.length+'个步骤 · 可查看地点照片')+
         '<div class="timeline">'+rows+'</div>'+
         section('交通主选与备选','线路间隔仅供参考')+
         '<div class="buslist">'+x.bus.map(b=>'<div class="buscard"><b>'+html(b[0])+'</b><p>'+html(b[1])+'</p></div>').join('')+'</div>'+
         '<div class="callout blue" style="margin-top:12px"><b>现场情况优先</b><p>公交班次、开放步道、营业时间以当天为准；不要为赶行程进入封闭路段。</p></div>'+
       '</div>'+
    '</details>'+
    '<div class="btnrow" style="margin-top:22px;justify-content:space-between"><button class="btn" '+(state.index?'data-day="'+(state.index-1)+'"':'disabled')+'>← 前一天</button><button class="btn primary" '+(state.index<6?'data-day="'+(state.index+1)+'"':'disabled')+'>后一天 →</button></div>'+
  '</div></div>';
 }
 function placeCards(){
  const q=state.query.toLowerCase().trim();
  const arr=places.filter(p=>(state.filter==="all"||p[2]===state.filter||p[2].includes(state.filter))&&p.join(" ").toLowerCase().includes(q));
  return `<div class="places">${arr.length?arr.map(p=>{const g=selectMedia(p[0],p[1],state.index);return `<div class="place">${cover(g,state.index)}<div class="place-inner"><small>${html(p[2])}</small><div class="place-name-row"><span class="place-mini-icon">${draw(placeArt(p[0],p[1]))}</span><b>${html(p[0])}</b></div><div class="ko">${html(p[1])}</div><div class="btnrow" style="margin-top:9px"><button class="btn soft" data-gallery-place="${html(p[1])}">📷 相关图片</button><button class="btn" data-copy="${html(p[1])}">复制韩文</button></div></div></div>`}).join(""):'<div class="muted">没有找到匹配的地点。</div>'}</div>`;
 }
 function pocket(){
  let done=check.filter((_,i)=>state.checks[i]).length;
  return `<div class="pocketgrid"><div class="pocket-hero"><div class="pocket-hero-doodle">${draw("luggage")}${draw("tangerine")}</div><div class="eyebrow">JEJU POCKET / 随身手册</div><h1>要用的信息，<br>一键就能找到。</h1><p>每日路线简图 · 韩文地名 · 待办清单 · 自由美食备选</p><div class="btnrow" style="margin-top:20px"><button class="btn" data-route="${state.index}">🗺️ 查看今日行程简图</button><button class="btn" data-copyday="${state.index}">📋 当天行程</button></div></div><div class="white"><div class="kicker">⚠️ 三个关键提醒</div><div class="feature"><span class="ico">${draw("calendar")}</span><div><b>韩国快1小时</b><p>航班时间标注北京 / 韩国时区。</p></div></div><div class="feature"><span class="ico">${draw("bus")}</span><div><b>11/09清晨600路</b><p>06:25是KAL始发，非徐福站到站。</p></div></div><div class="feature"><span class="ico">${draw("trail")}</span><div><b>徒步安全</b><p>11月海风大、日落早，关闭步道不进入。</p></div></div></div></div>
  ${section("行前清单",`${done}/${check.length}已完成 · 自动保存在本设备`)}
  <div class="white"><div class="progress"><span style="width:${Math.round(done/check.length*100)}%"></span></div>${check.map((t,i)=>`<label class="check ${state.checks[i]?"done":""}"><input type="checkbox" data-check="${i}" ${state.checks[i]?"checked":""}><span>${html(t)}</span></label>`).join("")}</div>
  ${section("韩文地点速查","按日期查找，点击复制韩文名称")}
  <div class="white"><input class="search" id="place-query" value="${html(state.query)}" placeholder="搜索中文 / 韩文，如：松岳山、酱蟹" aria-label="搜索地点"><div class="filter-pills" role="group" aria-label="按日期筛选地点">${["all","全程","D1","D2","D3","D4","D5","D6","D7","自由"].map(t=>`<button data-filter="${t}" class="${state.filter===t?"active":""}">${t==="all"?"全部":t}</button>`).join("")}</div><div id="results">${placeCards()}</div></div>
  ${section("晚间美食与购物池","日期待定，不擅自塞进固定行程")}
  <div class="foodgrid">${food.map(f=>{const g=selectMedia(f[0],f[1],state.index);return `<div class="food">${cover(g,state.index)}<div class="food-inner"><small>${html(f[2])}</small><div class="place-name-row"><span class="place-mini-icon">${draw(placeArt(f[0],f[1]))}</span><b>${html(f[0])}</b></div><p>${html(f[3])}</p><div class="btnrow"><button class="btn soft" data-gallery-place="${html(f[1])}">📷 相关图片</button><button class="btn" data-copy="${html(f[1])}">复制韩文</button></div></div></div>`}).join("")}</div>
  ${section("官方查车与路线","点击前往参考入口")}
  <div class="refs">${urls.map(u=>`<a href="${html(u[1])}" target="_blank" rel="noopener noreferrer">${html(u[0])} ↗</a>`).join("")}</div>
  <div class="callout blue" style="margin-top:13px"><b>🚌 公交参考班距 ≠ 实时候车时间</b><p>具体日期、上下行、支线、周末改线和候车站牌，出发当天在Naver Map＋济州公交官网确认。</p></div>`;
 }
 function render(){app.innerHTML=state.tab==="home"?home():state.tab==="day"?dayView():state.tab==="budget"?budgetPage():pocket();navbar()}
 function restore(){try{let b=JSON.parse(localStorage.getItem("jeju-travel-budget")||"{}");if(b&&typeof b==="object")state.budget={...state.budget,...b}}catch(e){}try{let v=JSON.parse(localStorage.getItem("jeju-v5-checks")||"[]");if(Array.isArray(v))state.checks=v}catch(e){}let m=location.hash.match(/^#day-([1-7])$/);if(m){state.tab="day";state.index=Number(m[1])-1}}
 document.addEventListener("click",e=>{
   const action=e.target.closest("[data-route],[data-route-prev],[data-route-next],[data-close-route]");
   if(action){
     if(action.hasAttribute("data-route"))openRoute(action.dataset.route);
     else if(action.hasAttribute("data-route-prev"))openRoute(modalDay-1);
     else if(action.hasAttribute("data-route-next"))openRoute(modalDay+1);
     else closeRoute();
     return;
   }
   const posterPhoto=e.target.closest("[data-poster-photo]");
   if(posterPhoto){
     const [di,si]=posterPhoto.dataset.posterPhoto.split(":").map(Number);
     const s=(window.JEJU_POSTERS||[])[di]?.stops?.[si];
     if(s)openGallery(s[1],selectMedia(s[1],s[4],di),di);
     return;
   }
   const g=e.target.closest("[data-gallery-step],[data-gallery-place],[data-photo-prev],[data-photo-next],[data-close-photo]");
   if(g){
     if(g.hasAttribute("data-gallery-step")){const [di,ri]=g.dataset.galleryStep.split(":").map(Number);const r=d[di].rows[ri];openGallery(r[1],selectMedia(r[1],r[3],di),di)}
     else if(g.hasAttribute("data-gallery-place")){const key=g.dataset.galleryPlace;const p=places.find(x=>x[1]===key)||food.find(x=>x[1]===key);openGallery(p?.[0]||key,selectMedia(p?.[0]||key,key,state.index),state.index)}
     else if(g.hasAttribute("data-photo-prev")){photoCursor=Math.max(0,photoCursor-1);galleryPaint()}
     else if(g.hasAttribute("data-photo-next")){photoCursor=Math.min(currentGallery.length-1,photoCursor+1);galleryPaint()}
     else closeGallery();
     return;
   }
   const el=e.target.closest("[data-day],[data-nav],[data-goto],[data-copy],[data-copyday],[data-expand],[data-filter]");if(!el)return;
   if(el.hasAttribute("data-day")){setTab("day",Number(el.dataset.day));return}
   if(el.hasAttribute("data-nav")){setTab(el.dataset.nav);return}
   if(el.hasAttribute("data-goto")){setTab(el.dataset.goto);return}
   if(el.hasAttribute("data-copy")){copy(el.dataset.copy);return}

   if(el.hasAttribute("data-copyday")){const x=d[Number(el.dataset.copyday)];let s=`2026年${x.date} ${x.week}｜${x.name}\n${x.lead}\n\n${x.rows.map(r=>r[0]+"｜"+r[1]+"："+r[2]+(r[3]?"（"+r[3]+"）":"")).join("\n")}\n\n交通备选：\n${x.bus.map(b=>b[0]+"｜"+b[1]).join("\n")}\n注意：${x.alert}`;copy(s);return}
   if(el.hasAttribute("data-expand")){let i=Number(el.dataset.expand);state.expanded[i]=!state.expanded[i];state.detailsOpen=true;render();return}
   if(el.hasAttribute("data-filter")){state.filter=el.dataset.filter;render();return}
 });
 document.addEventListener("input",e=>{
   if(e.target.id==="place-query"){const pos=e.target.selectionStart;state.query=e.target.value;document.getElementById("results").innerHTML=placeCards();e.target.setSelectionRange(pos,pos)}
 });
 document.addEventListener("change",e=>{
   if(e.target.matches("[data-budget-spa]")){state.budget.freeSpa=e.target.checked;try{localStorage.setItem("jeju-travel-budget",JSON.stringify(state.budget))}catch(err){}render();return}
   if(e.target.matches("[data-budget-field]")){const k=e.target.dataset.budgetField;if(["flight","hotel","parking","shopping","fx"].includes(k)){state.budget[k]=k==="fx"?Math.max(1,Number(e.target.value)||200):e.target.value;try{localStorage.setItem("jeju-travel-budget",JSON.stringify(state.budget))}catch(err){}render()}return}
   if(e.target.matches("[data-check]")){let i=Number(e.target.dataset.check);state.checks[i]=e.target.checked;try{localStorage.setItem("jeju-v5-checks",JSON.stringify(state.checks))}catch(e2){}render()}
 });
 window.addEventListener("hashchange",()=>{let m=location.hash.match(/^#day-([1-7])$/);if(m){state.tab="day";state.index=Number(m[1])-1;render()}});
 document.getElementById("photo-dialog").addEventListener("click",e=>{if(e.target.id==="photo-dialog")closeGallery()});
 document.getElementById("photo-image").addEventListener("error",e=>{
   if(e.target.dataset.triedFallback==="1")return;
   e.target.dataset.triedFallback="1";e.target.src=photoFallback;
   document.getElementById("photo-credit").textContent="原图暂不可用，现显示当天行程背景图。";
 });
 document.getElementById("route-dialog").addEventListener("click",e=>{
   if(e.target.id==="route-dialog")closeRoute();
 });
 restore();render();
})();