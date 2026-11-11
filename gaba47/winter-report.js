/* GABA47 · 冬日运动周报/月报 —— 使用手绘背景素材，数据层独立可更新。 */
export const WINTER_REPORT_WIDTH = 1080;
export const WINTER_REPORT_HEIGHT = 2340;
export const MONTHLY_MEMBERS_PER_PAGE = 15;
const INK = "#203b59";
const BLUE = "#447eb6";
const LIME = "#c5ee5d";
const MUTED = "#5d7485";

export function winterReportPageCount(report) {
  if (report?.reportType !== "month") return 1;
  const total = (report.ranking || []).filter(member => Number(member.minutes) > 0).length;
  return Math.max(1, Math.ceil(total / MONTHLY_MEMBERS_PER_PAGE));
}

function write(ctx, drawText, value, x, y, maxWidth, size, color=INK, opts={}) {
  drawText(ctx, String(value ?? "—"), x, y, maxWidth, {
    weight: opts.weight ?? 900,
    size,
    minSize: opts.minSize ?? Math.max(13, Math.round(size * 0.65)),
    color,
    align: opts.align ?? "left",
  });
}
function rounded(ctx,x,y,w,h,r=16) {
  const radius=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+radius,y);ctx.lineTo(x+w-radius,y);ctx.quadraticCurveTo(x+w,y,x+w,y+radius);
  ctx.lineTo(x+w,y+h-radius);ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);
  ctx.lineTo(x+radius,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-radius);
  ctx.lineTo(x,y+radius);ctx.quadraticCurveTo(x,y,x+radius,y);ctx.closePath();
}
function number(value) { return Math.max(0, Math.round(Number(value)||0)); }

function paintBackground(ctx, image) {
  ctx.fillStyle="#e4eff8";
  ctx.fillRect(0,0,WINTER_REPORT_WIDTH,WINTER_REPORT_HEIGHT);
  if (image?.complete !== false && image?.naturalWidth > 0) {
    ctx.drawImage(image,0,0,WINTER_REPORT_WIDTH,WINTER_REPORT_HEIGHT);
    return;
  }
  // 不阻塞首帧：素材到达后由主程序自动重绘。
  ctx.fillStyle="#fffdfa";
  for (const [x,y,w,h] of [[90,190,900,290],[55,600,970,305],[35,950,1010,710],[35,1710,1010,500]]) {
    rounded(ctx,x,y,w,h,42);ctx.fill();
  }
}
function topHeader(ctx,report,drawCat,drawText){
  // Use different baselines because the two illustrated banners have different heights.
  const monthly=report.reportType==="month";
  const period=report.periodLabel || "";
  if(monthly){
    write(ctx,drawText,"嘎巴47  ·  冬日运动",155,232,660,27,MUTED,{weight:750});
    write(ctx,drawText,"训练月报",152,299,730,72,INK,{minSize:60});
    write(ctx,drawText,period,157,360,560,29,INK,{weight:800});
  }else{
    write(ctx,drawText,"嘎巴47  ·  冬日运动",176,268,620,29,MUTED,{weight:800});
    write(ctx,drawText,"上周训练周报",171,348,685,73,INK,{minSize:60});
    write(ctx,drawText,period,177,423,600,32,INK,{weight:850});
  }
}
function metric(ctx,drawText,x,y,w,label,value,unit){
  const cx=x+w/2;
  // Each statistic stays inside its own illustrated column; never manually offset its unit.
  write(ctx,drawText,label,cx,y,w-18,30,MUTED,{weight:850,align:"center",minSize:25});
  write(ctx,drawText,value,cx,y+76,w-18,69,INK,{minSize:43,align:"center"});
  write(ctx,drawText,unit,cx,y+132,w-18,28,MUTED,{weight:800,align:"center",minSize:22});
}
function weeklyMetrics(ctx,report,drawText){
  const v=[
    ["训练时长",number(report.totalMinutes),"分钟"],
    ["打卡次数",number(report.checkinCount),"次"],
    ["活跃成员",number(report.activeCount),"人"],
    ["最长连续",number(report.maxStreak),"天"],
  ];
  const centers=[168,417,666,913];
  v.forEach(([label,value,unit],i)=>metric(ctx,drawText,centers[i]-110,655,220,label,value,unit));
  ctx.save();ctx.strokeStyle="#bdd2e1";ctx.lineWidth=2;
  [292,540,788].forEach(x=>{ctx.beginPath();ctx.moveTo(x,654);ctx.lineTo(x,838);ctx.stroke();});
  ctx.restore();
}
function weeklyActivity(ctx,report,drawText){
  write(ctx,drawText,"七日训练记录",106,1041,560,43,INK);
  write(ctx,drawText,"单位：分钟",965,1044,260,24,MUTED,{align:"right",weight:750});
  const daily=(report.daily||[]).slice(0,7);
  const peak=Math.max(1,...daily.map(row=>number(row.minutes)));
  const labels=["周一","周二","周三","周四","周五","周六","周日"];
  const base=1484;
  ctx.save();
  ctx.strokeStyle="#bccddd";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(108,base);ctx.lineTo(970,base);ctx.stroke();
  for(let i=0;i<7;i++){
    const row=daily[i]||{minutes:0};
    const min=number(row.minutes),w=80,cx=159+i*125;
    const height=min?Math.max(22,Math.round(min/peak*296)):7;
    rounded(ctx,cx-w/2,base-height,w,height,12);
    ctx.fillStyle=min?(i%2===0?BLUE:LIME):"#cbdce5";ctx.fill();
    if(min){ctx.lineWidth=2;ctx.strokeStyle="#315470";ctx.stroke();}
    // Fix: values are anchored to their own bars, not to the background artwork.
    write(ctx,drawText,min||"—",cx,Math.max(1127,base-height-25),102,26,INK,{align:"center",minSize:22});
    write(ctx,drawText,labels[i],cx,1543,110,28,INK,{align:"center",weight:850,minSize:23});
  }
  ctx.restore();
  const active=daily.filter(d=>number(d.minutes)>0).length;
  write(ctx,drawText,"有训练 " + active + " / 7 天",114,1619,380,27,MUTED,{weight:800});
  write(ctx,drawText,"单日最高 " + Math.max(0,...daily.map(d=>number(d.minutes))) + " 分钟",968,1619,420,27,MUTED,{align:"right",weight:800});
}
function weeklyRanking(ctx,report,drawCat,drawText){
  const leaders=report.top3||[];
  write(ctx,drawText,"训练时长 TOP 3",104,1784,640,43,INK);
  // Foreground figures keep their full round silhouettes and sit above the podium.
  const slots=[
    {member:leaders[1],center:225,x:141,y:1880,w:175,h:177,label:2104},
    {member:leaders[0],center:540,x:444,y:1833,w:192,h:190,label:2088},
    {member:leaders[2],center:853,x:769,y:1880,w:175,h:177,label:2104},
  ];
  slots.forEach(slot=>{
    if(slot.member)drawCat(ctx,slot.member,{x:slot.x,y:slot.y,width:slot.w,height:slot.h},1.03);
    const raw=String(slot.member?.name||"暂无记录");
    const name=[...raw].length>7?[...raw].slice(0,6).join("")+"…":raw;
    write(ctx,drawText,name,slot.center,slot.label,238,30,INK,{align:"center",minSize:23});
    write(ctx,drawText,slot.member?number(slot.member.minutes)+" 分钟":"—",slot.center,slot.label+45,230,28,INK,{align:"center",weight:900,minSize:24});
  });
  const rest=Math.max(0,(report.ranking||[]).length-3);
  if(rest)write(ctx,drawText,"另有 "+rest+" 位成员参与训练",540,2260,790,27,MUTED,{weight:750,align:"center"});
}
function monthlyMetrics(ctx,report,drawText){
  const days=(report.daily||[]).filter(d=>number(d.minutes)>0).length;
  const metrics=[
    ["训练时长",number(report.totalMinutes),"分钟"],
    ["打卡次数",number(report.checkinCount),"次"],
    ["参与人数",number(report.activeCount),"人"],
    ["运动天数",days,"天"],
  ];
  const centers=[152,409,669,924];
  metrics.forEach(([label,v,unit],i)=>metric(ctx,drawText,centers[i]-102,585,204,label,v,unit));
}
function monthlyCalendar(ctx,report,drawText){
  const days=report.daily||[];
  write(ctx,drawText,"本月运动日历",103,882,530,41,INK);
  const active=days.filter(d=>number(d.minutes)>0).length;
  write(ctx,drawText,active+" / "+days.length+" 天训练",955,882,400,26,MUTED,{align:"right",weight:800});
  const date=new Date(report.periodStart);
  const offset=(date.getDay()+6)%7;
  const week=["一","二","三","四","五","六","日"];
  const baseX=155,stepX=127,rowStart=1019,rowStep=45;
  week.forEach((day,i)=>write(ctx,drawText,day,baseX+i*stepX,968,76,25,MUTED,{align:"center",weight:800}));
  // Support all 31-day calendars, including those occupying six visual rows.
  days.forEach((day,index)=>{
    const place=offset+index,col=place%7,row=Math.floor(place/7);
    const x=baseX+col*stepX,y=rowStart+row*rowStep;
    const yes=number(day.minutes)>0;
    rounded(ctx,x-45,y-20,90,40,11);
    ctx.fillStyle=yes?LIME:"#eef4f8";ctx.fill();
    ctx.lineWidth=yes?2.2:1.3;ctx.strokeStyle=yes?INK:"#bbcede";ctx.stroke();
    write(ctx,drawText,day.day,x,y,73,24,INK,{align:"center",weight:yes?900:750,minSize:20});
  });
  write(ctx,drawText,"绿色日期表示当天有运动记录",107,1314,590,24,MUTED,{weight:750});
}
function monthlyMembers(ctx,report,drawCat,drawText,page,pages){
  const all=(report.ranking||[]).filter(member=>number(member.minutes)>0);
  const shown=all.slice(page*MONTHLY_MEMBERS_PER_PAGE,(page+1)*MONTHLY_MEMBERS_PER_PAGE);
  write(ctx,drawText,"训练成员  ·  "+all.length+" 人",100,1404,610,36,INK);
  if(pages>1)write(ctx,drawText,"第 "+(page+1)+" / "+pages+" 页",952,1404,300,26,MUTED,{weight:750,align:"right"});
  if(!shown.length){
    write(ctx,drawText,"本月暂无训练记录",540,1840,780,36,MUTED,{align:"center"});
    return;
  }
  // 3x5 members exactly follow the 15 pre-drawn blank slots in the monthly background.
  const left=[68,401,735],top=[1484,1616,1747,1879,2011];
  shown.forEach((member,index)=>{
    const col=index%3,row=Math.floor(index/3),x=left[col],y=top[row];
    drawCat(ctx,member,{x:x+8,y:y+10,width:90,height:92},1.06);
    const raw=String(member.name||"群友");
    const name=[...raw].length>6?[...raw].slice(0,5).join("")+"…":raw;
    write(ctx,drawText,name,x+107,y+41,155,26,INK,{minSize:21});
    write(ctx,drawText,number(member.minutes)+"分 · "+number(member.checkins)+"次",x+107,y+78,180,22,MUTED,{weight:800,minSize:18});
    if(page===0&&index<3){
      rounded(ctx,x+265,y+7,29,29,9);ctx.fillStyle=LIME;ctx.fill();ctx.lineWidth=1;ctx.strokeStyle=INK;ctx.stroke();
      write(ctx,drawText,index+1,x+279.5,y+21.5,25,18,INK,{align:"center"});
    }
  });
}
export function drawWinterReportPoster(canvas,report,drawCat,drawText,page=0,backgroundImage=null){
  if(!canvas||!report)return;
  const totalPages=winterReportPageCount(report);
  const p=Math.max(0,Math.min(totalPages-1,Math.floor(Number(page)||0)));
  const thumb=typeof canvas.hasAttribute==="function"&&canvas.hasAttribute("data-report-canvas");
  const scale=thumb?.5:1;
  canvas.width=WINTER_REPORT_WIDTH*scale;canvas.height=WINTER_REPORT_HEIGHT*scale;
  const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)return;
  ctx.setTransform(scale,0,0,scale,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  ctx.textBaseline="middle";
  paintBackground(ctx,backgroundImage);
  topHeader(ctx,report,drawCat,drawText);
  if(report.reportType==="month"){
    monthlyMetrics(ctx,report,drawText);
    monthlyCalendar(ctx,report,drawText);
    monthlyMembers(ctx,report,drawCat,drawText,p,totalPages);
  }else{
    weeklyMetrics(ctx,report,drawText);
    weeklyActivity(ctx,report,drawText);
    weeklyRanking(ctx,report,drawCat,drawText);
  }
}