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
  const monthly=report.reportType==="month";
  const period=report.periodLabel || "";
  write(ctx,drawText,"嘎巴47 / 冬日运动",166,224,610,28,MUTED,{weight:850});
  write(ctx,drawText,monthly?"训练月报":"上周训练周报",163,320,monthly?730:695,69,INK,{minSize:55});
  write(ctx,drawText,period,170,399,600,32,INK,{weight:800});
  // 周报封面展示本期榜首的原始角色冬装版；月报不突出任何成员。
  if (!monthly && report.top3?.[0]) {
    drawCat(ctx,report.top3[0],{x:798,y:216,width:145,height:177},1);
  }
}
function metric(ctx,drawText,x,y,w,label,value,unit,large=false){
  const cx=x+w/2;
  write(ctx,drawText,label,cx,y,w-20,25,MUTED,{weight:800,align:"center"});
  write(ctx,drawText,value,cx,y+78,w-20,large?63:58,INK,{minSize:34,align:"center"});
  write(ctx,drawText,unit,cx,y+128,w-20,23,MUTED,{weight:750,align:"center"});
}
function weeklyMetrics(ctx,report,drawText){
  const v=[
    ["训练时长",number(report.totalMinutes),"分钟"],
    ["打卡次数",number(report.checkinCount),"次"],
    ["活跃成员",number(report.activeCount),"人"],
    ["最长连续",number(report.maxStreak),"天"],
  ];
  const centers=[168,417,666,913];
  v.forEach(([label,value,unit],i)=>metric(ctx,drawText,centers[i]-110,655,220,label,value,unit,i===0));
  ctx.save();ctx.strokeStyle="#aec5d7";ctx.lineWidth=2;
  [292,540,788].forEach(x=>{ctx.beginPath();ctx.moveTo(x,644);ctx.lineTo(x,843);ctx.stroke();});
  ctx.restore();
}
function weeklyActivity(ctx,report,drawText){
  write(ctx,drawText,"七日训练记录",103,1040,510,42,INK);
  write(ctx,drawText,"每日训练分钟",960,1044,310,23,MUTED,{align:"right",weight:750});
  const daily=(report.daily||[]).slice(0,7);
  const peak=Math.max(1,...daily.map(row=>number(row.minutes)));
  const labels=["周一","周二","周三","周四","周五","周六","周日"];
  const base=1462;
  ctx.save();ctx.strokeStyle="#b4cadb";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(108,base);ctx.lineTo(963,base);ctx.stroke();
  daily.forEach((row,i)=>{
    const min=number(row.minutes),w=79,cx=159+i*125;
    const height=min?Math.max(24,Math.round(min/peak*300)):7;
    rounded(ctx,cx-w/2,base-height,w,height,15);
    ctx.fillStyle=min?(i%2===0?BLUE:LIME):"#cbdce5";ctx.fill();
    if(min){ctx.lineWidth=2;ctx.strokeStyle=INK;ctx.stroke();}
    write(ctx,drawText,min?min:"—",cx,base-height-28,104,22,INK,{align:"center",minSize:17});
    write(ctx,drawText,labels[i],cx,1511,111,25,INK,{align:"center",weight:850});
  });
  ctx.restore();
  const active=daily.filter(d=>number(d.minutes)>0).length;
  write(ctx,drawText,"有训练："+active+" / 7 天",113,1591,400,25,MUTED,{weight:800});
  write(ctx,drawText,"单日最高："+Math.max(0,...daily.map(d=>number(d.minutes)))+" 分钟",969,1591,470,25,MUTED,{align:"right",weight:800});
}
function weeklyRanking(ctx,report,drawCat,drawText){
  const leaders=report.top3||[];
  write(ctx,drawText,"训练时长 TOP 3",104,1771,630,40,INK);
  const slots=[
    {rank:2,member:leaders[1],center:228,x:162,y:1887,w:132,h:146,label:2100},
    {rank:1,member:leaders[0],center:537,x:454,y:1834,w:166,h:174,label:2095},
    {rank:3,member:leaders[2],center:856,x:790,y:1887,w:132,h:146,label:2100},
  ];
  slots.forEach(slot=>{
    if (slot.member) drawCat(ctx,slot.member,{x:slot.x,y:slot.y,width:slot.w,height:slot.h},1);
    write(ctx,drawText,slot.member?.name||"暂无记录",slot.center,slot.label,220,27,INK,{align:"center",minSize:18});
    write(ctx,drawText,slot.member?number(slot.member.minutes)+" 分钟":"—",slot.center,slot.label+41,220,25,INK,{align:"center",weight:850});
  });
  const rest=Math.max(0,(report.ranking||[]).length-3);
  if (rest) write(ctx,drawText,"另外 " + rest + " 位成员参与了本周训练",540,2250,790,24,MUTED,{weight:800,align:"center"});
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
  metrics.forEach(([label,v,unit],i)=>metric(ctx,drawText,centers[i]-102,575,204,label,v,unit,i===0));
}
function monthlyCalendar(ctx,report,drawText){
  const days=report.daily||[];
  write(ctx,drawText,"本月运动日历",103,895,520,41,INK);
  const active=days.filter(d=>number(d.minutes)>0).length;
  write(ctx,drawText,active+" / "+days.length+" 天有训练",961,895,385,24,MUTED,{align:"right",weight:800});
  const date=new Date(report.periodStart);
  const offset=(date.getDay()+6)%7;
  const week=["一","二","三","四","五","六","日"];
  const baseX=154, step=128;
  week.forEach((day,i)=>write(ctx,drawText,day,baseX+i*step,955,75,22,MUTED,{align:"center",weight:800}));
  days.forEach((day,index)=>{
    const place=offset+index, col=place%7,row=Math.floor(place/7);
    const x=baseX+col*step,y=1018+row*61;
    const yes=number(day.minutes)>0;
    rounded(ctx,x-47,y-24,94,48,14);
    ctx.fillStyle=yes?LIME:"#e5eff7";ctx.fill();
    ctx.lineWidth=yes?2.6:1.6;ctx.strokeStyle=yes?INK:"#afc5d5";ctx.stroke();
    write(ctx,drawText,day.day,x,y,73,23,INK,{align:"center",weight:yes?900:750});
  });
  write(ctx,drawText,"绿色日期表示当天有运动记录",107,1302,595,21,MUTED,{weight:700});
}
function monthlyMembers(ctx,report,drawCat,drawText,page,pages){
  const all=(report.ranking||[]).filter(member=>number(member.minutes)>0);
  const shown=all.slice(page*MONTHLY_MEMBERS_PER_PAGE,(page+1)*MONTHLY_MEMBERS_PER_PAGE);
  write(ctx,drawText,"训练成员 · "+all.length+" 人",100,1411,620,35,INK);
  if(pages>1)write(ctx,drawText,"第 "+(page+1)+" / "+pages+" 页",955,1414,290,22,MUTED,{weight:750,align:"right"});
  if(!shown.length){
    write(ctx,drawText,"本月没有训练记录",540,1825,720,35,MUTED,{align:"center"});
    return;
  }
  // 背景素材原生 3列×5行成员框：昵称和训练数据横排，不缩小文字。
  const left=[68,401,735], top=[1484,1616,1747,1879,2011];
  shown.forEach((member,index)=>{
    const col=index%3,row=Math.floor(index/3),x=left[col],y=top[row];
    drawCat(ctx,member,{x:x+5,y:y+7,width:88,height:89},1);
    const fullName=String(member.name||"群友");
    const trimmed=[...fullName].length>9?[...fullName].slice(0,8).join("")+"…":fullName;
    write(ctx,drawText,trimmed,x+100,y+37,190,24,INK,{minSize:17});
    write(ctx,drawText,number(member.minutes)+"分  ·  "+number(member.checkins)+"次",x+100,y+75,192,20,MUTED,{weight:800,minSize:14});
    if(page===0&&index<3){
      rounded(ctx,x+270,y+9,30,28,9);ctx.fillStyle=LIME;ctx.fill();ctx.lineWidth=1;ctx.strokeStyle=INK;ctx.stroke();
      write(ctx,drawText,index+1,x+285,y+23,25,18,INK,{align:"center"});
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