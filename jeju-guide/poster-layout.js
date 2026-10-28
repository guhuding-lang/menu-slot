window.JEJU_POSTER_VIEW=(function(){
 function money(n){return '¥'+Math.round(n).toLocaleString('zh-CN')}
 return function(day,poster,index,opts){
   const e=opts.html,ico=window.JEJU_ICON||(()=>'<span>🍊</span>');
   const wday=day.date.replace('/','月')+'日（'+day.week+'）';
   const steps=poster.stops.map((s,k)=>{
     const [time,title,description,icon,ko]=s;
     const key=index+':'+k;
     return '<article class="sketch-stop han-stop">'+
       '<span class="han-stop-index">'+String(k+1).padStart(2,'0')+'</span>'+
       '<button type="button" class="sketch-illustration" data-poster-photo="'+key+'" aria-label="查看'+e(title)+'相关图片">'+ico(icon)+'</button>'+
       '<span class="sketch-time">'+e(time)+'</span>'+
       '<h3 class="han-stop-title">'+e(title)+'</h3>'+
       '<p title="'+e(description)+'">'+e(description)+'</p>'+
       (ko?'<span class="sketch-location">'+e(ko)+'</span>':'')+
       '<button type="button" class="sketch-photo-link" data-poster-photo="'+key+'">看图片 ↗</button>'+
     '</article>';
   }).join('');
   const line=opts.priceDays[index]||{costs:[]};
   const budgetRows=line.costs.map(c=>{
     const a=money(c[1]/opts.fx),b=money(c[2]/opts.fx);
     return '<div class="sketch-budget-row"><span>'+e(c[0])+'</span><b>'+a+'–'+b+'</b></div>'
   }).join('')+(index===0?'<div class="sketch-budget-row"><span>O’REVE 温泉'+(opts.freeSpa?'（确认免费）':'（预留票费）')+'</span><b>'+(opts.freeSpa?'¥0':money(opts.spa[0]/opts.fx)+'–'+money(opts.spa[1]/opts.fx))+'</b></div>':'');
   const highlights=poster.highlights.map(line=>'<li>'+e(line)+'</li>').join('');
   const fees=opts.amounts;
   const total=money(fees[0]/opts.fx)+' – '+money(fees[1]/opts.fx);
   return '<article class="sketch-poster sketch-'+e(poster.theme)+'" aria-label="济州第'+(index+1)+'天手绘行程">'+
     '<div class="sketch-hdr">'+
       '<div class="sketch-hdr-deco sketch-hdr-left">'+ico(poster.art)+'</div>'+
       '<div class="sketch-hdr-text"><div class="sketch-dayline"><span class="sketch-daypill">DAY '+(index+1)+'</span><span class="sketch-date">'+e(wday)+'</span></div>'+
         '<h1>'+e(day.name)+'</h1><p class="sketch-motto">'+e(poster.motto)+'</p></div>'+
       '<div class="sketch-hdr-deco sketch-hdr-right">'+ico(index===6?'plane':index===2?'falls':index===4?'mountain':'sea')+'</div>'+
     '</div>'+
     '<div class="sketch-route-outer"><div class="sketch-mini-title">✎ 今日路线 / 按编号走</div><div class="sketch-stops">'+steps+'</div>'+
       '<div class="sketch-wave" aria-hidden="true"><span>✦</span><span>〰</span><span>✦</span></div>'+
     '</div>'+
     '<div class="sketch-notes">'+
       '<section class="sketch-notebox sketch-highlights"><h2><span class="sketch-label">★</span> 今日重点</h2><ul>'+highlights+'</ul><div class="sketch-smallart">'+ico('orange')+'</div></section>'+
       '<section class="sketch-notebox sketch-budget"><h2><span class="sketch-label">¥</span> 双人预算</h2><div class="sketch-budget-list">'+budgetRows+'</div><div class="sketch-total">约 '+total+'</div><p>仅含预计岛内消费；机票、酒店与购物另算。</p></section>'+
     '</div>'+
     '<section class="sketch-transport"><span class="sketch-transport-icon">'+ico(index===2||index===4?'trail':'bus')+'</span>'+
        '<div><b>'+(index===2||index===4?'🥾 徒步提醒':'🚌 交通说明')+'</b><p>'+e(poster.traffic)+'</p></div></section>'+
     '<div class="sketch-tip">💡 '+e(poster.hint)+'</div>'+
   '</article>';
 }
})();