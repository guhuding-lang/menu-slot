(function boot(){
 const db=window.JEJU_V5;
 if(!db||!Array.isArray(db.days)){document.getElementById("app").textContent="行程数据读取失败，请刷新页面。";return}
 const d=db.days, food=db.food, check=db.check, places=db.places, urls=db.urls;
 const state={tab:"home",index:0,checks:[],query:"",filter:"all",expanded:{}};
 const app=document.getElementById("app");
 const html=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
 const mapUrl=s=>"https://map.naver.com/p/search/"+encodeURIComponent(s);
 function section(title,sub=""){return `<div class="sec"><h2>${html(title)}</h2><small>${html(sub)}</small></div>`}
 function toast(msg){let el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(window.toastDelay);window.toastDelay=setTimeout(()=>el.classList.remove("show"),2000)}
 async function copy(s){try{await navigator.clipboard.writeText(s);toast("已复制")}catch(err){const ta=document.createElement("textarea");ta.value=s;document.body.append(ta);ta.select();try{document.execCommand("copy");toast("已复制")}catch(e){toast("无法复制，请手动选择")}ta.remove()}}
 function setTab(tab,i){if(Number.isInteger(i))state.index=i;state.tab=tab;state.expanded={};if(tab==="day"){history.replaceState(null,"","#day-"+(state.index+1))}else{history.replaceState(null,"",location.pathname+location.search)}render();window.scrollTo(0,0)}
 function navbar(){document.querySelectorAll("[data-nav]").forEach(el=>el.classList.toggle("active",el.dataset.nav===state.tab))}
 function home(){
  const boxes=[
   ["✈️","固定航班","11/03 广州T3 07:45（北京时间）→ 济州11:30（韩国时间）；11/09 济州11:10（韩国时间）→ 广州T3 14:00（北京时间）"],
   ["🏨","全程住 Hotel Bridge","호텔 브릿지 서귀포｜제주 서귀포시 태평로 436｜11/03入住，11/09退房，共6晚"],
   ["🚌","交通原则","公交优先、少换乘；机场往返600；11/07华顺换乘，11/08主选295直达涉地可支"]
  ];
  return `<div class="hero hasimage"><div class="stamp">2026.10.28 · V5 最终核对</div><div class="eyebrow">JEJU ISLAND / 7 DAYS 6 NIGHTS</div><h1>去济州，<br>慢慢走七天。</h1><p>11月3日—9日 · 两个人 · 住西归浦 · 公交优先</p><div class="statbar"><span>🗓️ 七天六晚</span><span>👫 双人旅行</span><span>🚶 6号线＋10号线精华</span><span>🕒 韩国比中国快1小时</span></div></div>
  ${section("七天行程一眼看懂","点击日期进入时间轴")}
  <div class="days">${d.map((x,i)=>`<button class="day-card" data-day="${i}"><small>D${i+1} · ${html(x.week)}</small><b>${html(x.date)}</b><em>${html(x.name)}</em><i>查看详情 ↗</i></button>`).join("")}</div>
  ${section("航班、酒店、交通","出发前最先确认")}
  <div class="grid3">${boxes.map(x=>`<div class="white"><div class="kicker">${x[0]} &nbsp; 已确认</div><h3>${x[1]}</h3><p>${x[2]}</p></div>`).join("")}</div>
  ${section("本次旅行的四大重点","只展示需要关注的事")}
  <div class="duo"><div class="white">
  ${[["♨️","11/03 纪念日","O'REVE温泉16:00–19:00完整3小时，20:00左右忘忧药房传统酒晚餐（未订座）。"],["🌅","11/04 看日落","郭支→韩潭海岸步道，Lazy Pump / Haejigae当天二选一，日落约17:39。"],["🦀","11/06 东门酱蟹","上午睡懒觉，中午北海岸Citywalk，17:00固定晚餐。"],["🥾","11/07 长徒步","松岳山完整开放海岸环线＋10号线反穿精华至华顺，约11–12公里（估算），17:00高恩水。"]].map(x=>`<div class="feature"><span class="ico">${x[0]}</span><div><b>${x[1]}</b><p>${x[2]}</p></div></div>`).join("")}
  </div><div style="display:grid;gap:12px;align-content:start"><div class="callout"><b>⚠️ 返程巴士要重点复核</b><p>11/09 06:25是600路从KAL酒店的始发时刻，并非徐福展示馆站上车时刻。11/08晚上确认具体到站分钟。</p></div><div class="callout blue"><b>🚏 班距不是候车时长</b><p>本页全部公交间隔只作整线参考。特别注意202区间车、752-2乡村巴士和295稀疏班次。当天以Naver Map和官方站牌为准。</p></div><div class="white"><div class="kicker">旅行中的快捷操作</div><h3>不用再翻长文找韩文地名</h3><p>在口袋工具里一键复制韩文、打开Naver、查看餐厅备选和行前清单。</p><div class="btnrow" style="margin-top:14px"><button class="btn primary" data-goto="pocket">🎒 打开随身口袋</button><button class="btn" data-day="0">D1 开始阅读 →</button></div></div></div></div>`;
 }
 function scrollDays(){return `<div class="scroll-days">${d.map((x,i)=>`<button class="${state.index===i?"active":""}" data-day="${i}">D${i+1} · ${html(x.date)} ${html(x.week)}</button>`).join("")}</div>`}
 function side(){return `<aside class="side"><div class="sideheader">🗓️ 逐日时间轴 / 7 DAYS</div>${d.map((x,i)=>`<button data-day="${i}" class="${state.index===i?"active":""}"><span>D${i+1}</span><div><b>${html(x.name)}</b><small>${html(x.date)} · ${html(x.area)}</small></div></button>`).join("")}<div style="padding:14px"><button class="btn soft" style="width:100%" data-goto="pocket">🎒 随身口袋</button></div></aside>`}
 function dayView(){
  const x=d[state.index];const img=x.photo?`photo" style="--day-image:url('./images/${html(x.photo)}')"`:`"`;
  const rows=x.rows.map((r,i)=>`<div class="step"><div class="time">${html(r[0])}</div><div class="track"><span class="dot"></span></div><div class="entry"><b>${html(r[1])}</b><p>${html(r[2])}</p><div class="buttons"><button data-expand="${i}">${state.expanded[i]?"收起说明 −":"查看说明 ＋"}</button>${r[3]?`<button data-copy="${html(r[3])}">复制韩文</button><button data-map="${html(r[3])}">Naver ↗</button>`:""}</div>${state.expanded[i]?`<div class="detail">${r[3]?`韩文搜索：${html(r[3])}<br>`:""}${html(r[2])}<br>时间及交通按V5行程参考；出发当天再查实时信息。</div>`:""}</div></div>`).join("");
  return `<div class="layout">${side()}<div>${scrollDays()}<div class="day-hero ${img}><small>D${state.index+1} · 2026年${html(x.date)} ${html(x.week)} · ${html(x.area)}</small><h1>${html(x.name)}</h1><p>${html(x.lead)}</p><div class="chips"><span>${html(x.date)} ${html(x.week)}</span><span>${state.index===4?"🚶 重点徒步":state.index===6?"✈️ 国际航班":"🌊 慢行济州"}</span></div></div>
  <div class="twokeys"><div class="key"><small>⭐ 今日不能错过</small><b>${html(x.star)}</b></div><div class="key second"><small>🍽️ 今日餐饮</small><b>${html(x.food)}</b></div></div>
  <div class="callout" style="margin-top:12px"><b>⚠️ 今天要注意</b><p>${html(x.alert)}</p></div>
  ${section("行程时间轴",`${x.rows.length}个环节 · 逐条展开`)}
  <div class="btnrow" style="margin-bottom:12px"><button class="btn primary" data-copyday="${state.index}">📋 复制当天完整行程</button><button class="btn" data-map="${html(x.rows.find(r=>r[3])?.[3]||"제주국제공항")}">🧭 打开Naver地图</button></div>
  <div class="timeline">${rows}</div>
  ${section("交通主选与备选","线路间隔仅供参考")}
  <div class="buslist">${x.bus.map(b=>`<div class="buscard"><b>${html(b[0])}</b><p>${html(b[1])}</p></div>`).join("")}</div>
  <div class="callout blue" style="margin-top:12px"><b>当天执行规则</b><p>若官方路标、餐厅营业、天气或实时到站与计划不一致，以现场实际为准；不要为赶时间进入关闭步道或勉强等稀疏班次。</p></div>
  <div class="btnrow" style="margin-top:20px;justify-content:space-between"><button class="btn" ${state.index?"data-day='"+(state.index-1)+"'":"disabled"}>← 前一天</button><button class="btn primary" ${state.index<6?"data-day='"+(state.index+1)+"'":"disabled"}>后一天 →</button></div>
  </div></div>`;
 }
 function placeCards(){
  const q=state.query.toLowerCase().trim();
  const arr=places.filter(p=>(state.filter==="all"||p[2]===state.filter||p[2].includes(state.filter))&&p.join(" ").toLowerCase().includes(q));
  return `<div class="places">${arr.length?arr.map(p=>`<div class="place"><small>${html(p[2])}</small><b>${html(p[0])}</b><div class="ko">${html(p[1])}</div><div class="btnrow" style="margin-top:9px"><button class="btn soft" data-copy="${html(p[1])}">复制韩文</button><button class="btn" data-map="${html(p[1])}">Naver ↗</button></div></div>`).join(""):'<div class="muted">没有找到匹配的地点。</div>'}</div>`;
 }
 function pocket(){
  let done=check.filter((_,i)=>state.checks[i]).length;
  return `<div class="pocketgrid"><div class="pocket-hero"><div class="eyebrow">JEJU POCKET / 随身手册</div><h1>要用的信息，<br>一键就能找到。</h1><p>韩文地名 · Naver搜索 · 待办打勾 · 自由美食备选</p><div class="btnrow" style="margin-top:20px"><button class="btn" data-map="호텔 브릿지 서귀포">🏨 酒店</button><button class="btn" data-map="서복전시관">🚌 600路站</button><button class="btn" data-copyday="${state.index}">📋 当天行程</button></div></div><div class="white"><div class="kicker">⚠️ 三个关键提醒</div><div class="feature"><span class="ico">🕒</span><div><b>韩国快1小时</b><p>航班时间标注北京 / 韩国时区。</p></div></div><div class="feature"><span class="ico">🚏</span><div><b>11/09清晨600路</b><p>06:25是KAL始发，非徐福站到站。</p></div></div><div class="feature"><span class="ico">🌬️</span><div><b>徒步安全</b><p>11月海风大、日落早，关闭步道不进入。</p></div></div></div></div>
  ${section("行前清单",`${done}/${check.length}已完成 · 自动保存在本设备`)}
  <div class="white"><div class="progress"><span style="width:${Math.round(done/check.length*100)}%"></span></div>${check.map((t,i)=>`<label class="check ${state.checks[i]?"done":""}"><input type="checkbox" data-check="${i}" ${state.checks[i]?"checked":""}><span>${html(t)}</span></label>`).join("")}</div>
  ${section("韩文地点速查","复制名称或直接打开Naver")}
  <div class="white"><input class="search" id="place-query" value="${html(state.query)}" placeholder="搜索中文 / 韩文，如：松岳山、酱蟹" aria-label="搜索地点"><div class="filter-pills" role="group" aria-label="按日期筛选地点">${["all","全程","D1","D2","D3","D4","D5","D6","D7","自由"].map(t=>`<button data-filter="${t}" class="${state.filter===t?"active":""}">${t==="all"?"全部":t}</button>`).join("")}</div><div id="results">${placeCards()}</div></div>
  ${section("晚间美食与购物池","日期待定，不擅自塞进固定行程")}
  <div class="foodgrid">${food.map(f=>`<div class="food"><small>${html(f[2])}</small><b>${html(f[0])}</b><p>${html(f[3])}</p><div class="btnrow"><button class="btn soft" data-map="${html(f[1])}">Naver找店 ↗</button><button class="btn" data-copy="${html(f[1])}">复制韩文</button></div></div>`).join("")}</div>
  ${section("官方查车与路线","点击前往参考入口")}
  <div class="refs">${urls.map(u=>`<a href="${html(u[1])}" target="_blank" rel="noopener noreferrer">${html(u[0])} ↗</a>`).join("")}</div>
  <div class="callout blue" style="margin-top:13px"><b>🚌 公交参考班距 ≠ 实时候车时间</b><p>具体日期、上下行、支线、周末改线和候车站牌，出发当天在Naver Map＋济州公交官网确认。</p></div><p style="font-size:11px;color:#96a9b8;margin-top:16px"><a href="./legacy-v4.html" target="_blank">旧版存档（未按V5更新，仅供对照）↗</a></p>`;
 }
 function render(){app.innerHTML=state.tab==="home"?home():state.tab==="day"?dayView():pocket();navbar()}
 function restore(){try{let v=JSON.parse(localStorage.getItem("jeju-v5-checks")||"[]");if(Array.isArray(v))state.checks=v}catch(e){}let m=location.hash.match(/^#day-([1-7])$/);if(m){state.tab="day";state.index=Number(m[1])-1}}
 document.addEventListener("click",e=>{
   const el=e.target.closest("[data-day],[data-nav],[data-goto],[data-copy],[data-map],[data-copyday],[data-expand],[data-filter]");if(!el)return;
   if(el.hasAttribute("data-day")){setTab("day",Number(el.dataset.day));return}
   if(el.hasAttribute("data-nav")){setTab(el.dataset.nav);return}
   if(el.hasAttribute("data-goto")){setTab(el.dataset.goto);return}
   if(el.hasAttribute("data-copy")){copy(el.dataset.copy);return}
   if(el.hasAttribute("data-map")){window.open(mapUrl(el.dataset.map),"_blank","noopener,noreferrer");return}
   if(el.hasAttribute("data-copyday")){const x=d[Number(el.dataset.copyday)];let s=`2026年${x.date} ${x.week}｜${x.name}\n${x.lead}\n\n${x.rows.map(r=>r[0]+"｜"+r[1]+"："+r[2]+(r[3]?"（"+r[3]+"）":"")).join("\n")}\n\n交通备选：\n${x.bus.map(b=>b[0]+"｜"+b[1]).join("\n")}\n注意：${x.alert}`;copy(s);return}
   if(el.hasAttribute("data-expand")){let i=Number(el.dataset.expand);state.expanded[i]=!state.expanded[i];render();return}
   if(el.hasAttribute("data-filter")){state.filter=el.dataset.filter;render();return}
 });
 document.addEventListener("input",e=>{
   if(e.target.id==="place-query"){const pos=e.target.selectionStart;state.query=e.target.value;document.getElementById("results").innerHTML=placeCards();e.target.setSelectionRange(pos,pos)}
 });
 document.addEventListener("change",e=>{
   if(e.target.matches("[data-check]")){let i=Number(e.target.dataset.check);state.checks[i]=e.target.checked;try{localStorage.setItem("jeju-v5-checks",JSON.stringify(state.checks))}catch(e2){}render()}
 });
 window.addEventListener("hashchange",()=>{let m=location.hash.match(/^#day-([1-7])$/);if(m){state.tab="day";state.index=Number(m[1])-1;render()}});
 restore();render();
})();