/*
 * GABA47 winter report artwork
 * Both exported canvases use a 9:19.5 phone portrait (1080 x 2340).
 * Monthly participation pages are paginated, not clipped or reduced to unreadable microtype.
 */
export const WINTER_REPORT_WIDTH = 1080;
export const WINTER_REPORT_HEIGHT = 2340;
export const MONTHLY_MEMBERS_PER_PAGE = 12;

export function winterReportPageCount(report) {
  if (report?.reportType !== "month") return 1;
  const count = (report.ranking || []).filter((item) => Number(item.minutes) > 0).length;
  return Math.max(1, Math.ceil(count / MONTHLY_MEMBERS_PER_PAGE));
}

function pathRound(ctx, x, y, width, height, radius = 22) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function panel(ctx, x, y, w, h, radius, fill, stroke, lineWidth = 1) {
  pathRound(ctx, x, y, w, h, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function winterText(drawText, ctx, value, x, y, width, size, color, options = {}) {
  drawText(ctx, String(value), x, y, width, {
    weight: options.weight || 900, size, minSize: options.minSize || Math.max(12, Math.round(size * .62)),
    align: options.align || "left", color,
  });
}

function seeded(number) {
  const n = Math.sin(number * 133.721 + 27.14) * 43758.5453;
  return n - Math.floor(n);
}

function drawSnowflake(ctx, x, y, size, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "rgba(230,248,255," + alpha + ")";
  ctx.lineWidth = Math.max(1.8, size / 7);
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0); ctx.stroke();
  }
  ctx.restore();
}

function drawWinterBackground(ctx, report) {
  const W = WINTER_REPORT_WIDTH, H = WINTER_REPORT_HEIGHT;
  const back = ctx.createLinearGradient(0, 0, 420, H);
  back.addColorStop(0, "#09182a");
  back.addColorStop(.47, "#153651");
  back.addColorStop(1, "#0c2439");
  ctx.fillStyle = back; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(840, 320, 40, 840, 320, 480);
  glow.addColorStop(0, "rgba(116,203,214,.47)");
  glow.addColorStop(.65, "rgba(99,173,196,.17)");
  glow.addColorStop(1, "rgba(99,173,196,0)");
  ctx.fillStyle = glow; ctx.fillRect(360, 0, 720, 700);
  // Snowfall: deterministic positions so previews do not flicker on redraw.
  for (let i = 0; i < 145; i++) {
    const x = 24 + seeded(i * 4 + 1) * 1035;
    const y = 26 + seeded(i * 4 + 2) * 2280;
    const radius = 1.1 + seeded(i * 4 + 3) * 2.7;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(211,238,247," + (.12 + seeded(i * 4 + 4) * .48) + ")";
    ctx.fill();
  }
  [[590,155,10,.68],[1000,130,11,.48],[510,540,8,.42],[1005,594,9,.52],[57,1092,8,.4]].forEach((flake) => {
    drawSnowflake(ctx, flake[0], flake[1], flake[2], flake[3]);
  });
  // Mountain ridge and a winter running track behind the report card.
  ctx.fillStyle = "rgba(139,187,196,.21)";
  ctx.beginPath();
  ctx.moveTo(0, 640); ctx.lineTo(210, 488); ctx.lineTo(320, 562);
  ctx.lineTo(508, 412); ctx.lineTo(652, 578); ctx.lineTo(850, 432);
  ctx.lineTo(1080, 610); ctx.lineTo(1080, 710); ctx.lineTo(0, 710); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(207,240,246,.29)";
  ctx.lineWidth = 4; ctx.beginPath();
  ctx.moveTo(0, 640); ctx.lineTo(210, 488); ctx.lineTo(320, 562);
  ctx.lineTo(508, 412); ctx.lineTo(652, 578); ctx.lineTo(850, 432); ctx.lineTo(1080, 610);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(560 + i * 20, 505 + i * 24);
    ctx.bezierCurveTo(720 + i * 24, 475 + i * 24, 916 + i * 15, 510 + i * 29, 1110, 466 + i * 29);
    ctx.strokeStyle = "rgba(224,249,251," + (.2 - i * .045) + ")";
    ctx.lineWidth = 4; ctx.stroke();
  }
  // Thin print border creates a finished poster instead of a screenshot.
  ctx.strokeStyle = "rgba(229,245,247,.20)";
  ctx.lineWidth = 2;
  pathRound(ctx, 22, 22, W - 44, H - 44, 32);
  ctx.stroke();
}

function drawHeader(ctx, report, drawCat, drawText, page, pages) {
  const ice = "#e7f6f6", lime = "#d9ff64", muted = "#a8cfdf";
  const month = report.reportType === "month";
  const year = new Date(report.periodStart).getFullYear();
  panel(ctx, 65, 66, 75, 67, 19, lime);
  winterText(drawText, ctx, "47", 102.5, 100, 58, 44, "#10293d", {align:"center"});
  winterText(drawText, ctx, "GABA", 160, 103, 280, 36, ice);
  winterText(drawText, ctx, "WINTER  /  " + year, 1006, 101, 330, 23, muted, {align:"right",weight:800});
  ctx.beginPath(); ctx.moveTo(65, 155); ctx.lineTo(1015, 155);
  ctx.lineWidth = 2; ctx.strokeStyle = "rgba(231,246,246,.24)"; ctx.stroke();

  winterText(drawText, ctx, "冬日训练", 66, 245, 630, 111, ice);
  winterText(drawText, ctx, month ? "月报" : "周报", 66, 353, 470, 112, lime);
  winterText(drawText, ctx, month ? "MONTHLY TRAINING REPORT" : "WEEKLY TRAINING REPORT",
    70, 429, 560, 25, muted, {weight:750});
  panel(ctx, 70, 474, month ? 365 : 321, 66, 33, "rgba(13,42,62,.86)", "rgba(202,237,244,.52)", 2);
  winterText(drawText, ctx, report.periodLabel, 95, 506, month ? 316 : 273, 29, ice, {weight:850});
  if (pages > 1) winterText(drawText, ctx, String(page + 1).padStart(2,"0") + " / " + String(pages).padStart(2,"0"),
    1002, 519, 190, 23, lime, {align:"right"});

  // Frosted circle preserves each member's original selected cat.
  const halo = ctx.createRadialGradient(835, 314, 50, 835, 314, 250);
  halo.addColorStop(0, "rgba(215,255,205,.35)");
  halo.addColorStop(.65, "rgba(197,244,244,.16)");
  halo.addColorStop(1, "rgba(197,244,244,0)");
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(835, 314, 250, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "rgba(224,244,244,.38)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(835, 314, 211, Math.PI*.1, Math.PI*1.56); ctx.stroke();
  const topMember = (report.ranking || []).find((m) => Number(m.minutes) > 0);
  drawCat(ctx, topMember, {x:663,y:135,width:354,height:398}, 1.02);
  // Chilled air streaks around the runner.
  ctx.strokeStyle = "rgba(224,248,251,.55)";
  ctx.lineWidth = 3; ctx.lineCap = "round";
  [[622,280,645,274],[640,314,658,311],[967,440,1008,431]].forEach((p) => {
    ctx.beginPath(); ctx.moveTo(p[0],p[1]);ctx.lineTo(p[2],p[3]);ctx.stroke();
  });
}

function drawOverview(ctx, report, drawText) {
  const dark = "#102d40", pale = "#eef7f4", green = "#cbf777";
  const month = report.reportType === "month";
  const totalMinutes = Math.round(Number(report.totalMinutes) || 0);
  const avg = report.activeCount ? Math.round(totalMinutes / report.activeCount) : 0;
  const activeDays = (report.daily || []).filter((d) => Number(d.minutes) > 0).length;
  const stats = month
    ? [[report.activeCount || 0,"参与人数","人"],[report.checkinCount || 0,"打卡次数","次"],[activeDays,"运动天数","天"],[avg,"人均训练","分钟"]]
    : [[report.activeCount || 0,"活跃人数","人"],[report.checkinCount || 0,"打卡次数","次"],[report.maxStreak || 0,"最长连续","天"],[avg,"人均训练","分钟"]];
  ctx.save();
  ctx.shadowColor = "rgba(0,14,25,.26)"; ctx.shadowBlur = 34; ctx.shadowOffsetY = 16;
  panel(ctx, 42, 620, 996, 468, 45, pale);
  ctx.restore();
  panel(ctx, 71, 658, 312, 53, 26, dark);
  winterText(drawText, ctx, "本期累计训练", 100, 684, 250, 26, "#eef9f6");
  winterText(drawText, ctx, totalMinutes, 85, 845, 375, 140, dark, {minSize:80});
  winterText(drawText, ctx, "分钟", 88, 931, 180, 34, "#477083");
  ctx.beginPath(); ctx.moveTo(493, 671); ctx.lineTo(493, 1040);
  ctx.lineWidth = 2; ctx.strokeStyle = "#d0e1df"; ctx.stroke();
  winterText(drawText, ctx, "GABA 47", 87, 1031, 250, 27, "#5a8087",{weight:850});
  stats.forEach((stat, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 522 + col * 243, y = 668 + row * 186;
    panel(ctx, x, y, 223, 165, 25, i === 0 ? green : (i === 3 ? "#e3eef0" : "#ffffff"));
    winterText(drawText, ctx, stat[1], x + 18, y + 32, 192, 23, "#52707b",{weight:800});
    winterText(drawText, ctx, stat[0], x + 18, y + 100, 147, 72, dark,{minSize:46});
    winterText(drawText, ctx, stat[2], x + 176, y + 115, 73, 20, "#4a6875",{weight:750,align:"center"});
  });
}

function drawWeeklyActivity(ctx, report, drawText) {
  const navy = "#153347", ink = "#0e3044", bright = "#b9e95d";
  panel(ctx, 42, 1115, 996, 417, 42, "#e5eff0");
  winterText(drawText, ctx, "七日训练节奏", 78, 1183, 500, 43, ink);
  winterText(drawText, ctx, "按每日训练分钟统计", 999, 1186, 355, 22, "#65818c",{align:"right",weight:750});
  const days = (report.daily || []).slice(0,7);
  const peak = Math.max(1,...days.map((d)=>Number(d.minutes)||0));
  const names = ["一","二","三","四","五","六","日"];
  days.forEach((day,i)=>{
    const x = 89 + i*135;
    const minutes = Math.max(0,Number(day.minutes)||0);
    const height = minutes ? 26 + Math.round(154 * minutes / peak) : 13;
    panel(ctx,x,1257,97,192,25,"#d1e1e3");
    panel(ctx,x,1449-height,97,height,Math.min(23,height/2),minutes ? (i%2 ? "#bde76d" : "#9dd8cf") : "#b7c9cf");
    winterText(drawText,ctx,minutes ? minutes : "—",x+48.5,1427-height,88,23,ink,{align:"center",weight:850});
    winterText(drawText,ctx,"周"+names[i],x+48.5,1481,84,21,navy,{align:"center"});
  });
  if (!days.length) winterText(drawText,ctx,"暂无每日记录",540,1370,600,28,ink,{align:"center"});
}

function drawMonthlyActivity(ctx, report, drawText) {
  const ink = "#0e3044";
  panel(ctx,42,1115,996,417,42,"#e5eff0");
  const days = report.daily || [];
  const activity = days.filter((day) => Number(day.minutes)>0).length;
  winterText(drawText,ctx,"月度训练日历",78,1183,530,43,ink);
  winterText(drawText,ctx,activity+" / "+days.length+" 天有训练",999,1185,385,23,"#577585",{align:"right",weight:800});
  const left = 79, width = 125, gap = 10;
  const weekdays = ["一","二","三","四","五","六","日"];
  weekdays.forEach((label,i)=>winterText(drawText,ctx,label,left+i*(width+gap)+width/2,1250,60,20,"#597784",{align:"center"}));
  const start = new Date(report.periodStart);
  const offset = (start.getDay()+6)%7;
  days.forEach((day,index)=>{
    const indexInGrid=offset+index, col=indexInGrid%7, row=Math.floor(indexInGrid/7);
    const x=left+col*(width+gap),y=1283+row*37;
    const isActive=Number(day.minutes)>0;
    panel(ctx,x,y,width,32,9,isActive?"#a7d968":"#d3e2e4");
    winterText(drawText,ctx,day.day,x+16,y+16,31,17,ink,{weight:850});
    if(isActive){
      ctx.fillStyle="#245a47";
      ctx.beginPath();ctx.arc(x+width-18,y+16,5,0,Math.PI*2);ctx.fill();
    }
  });
  winterText(drawText,ctx,"绿色表示当天有训练记录",78,1503,470,19,"#587782",{weight:700});
}

function drawWeeklyRanking(ctx, report, drawCat, drawText) {
  const white="#e9f6f6", green="#d8ff79", muted="#a7c3d0";
  winterText(drawText,ctx,"训练时长 TOP 3",60,1610,590,45,white);
  winterText(drawText,ctx,"按累计训练分钟排序",1021,1611,320,22,muted,{align:"right",weight:750});
  const members = report.top3 || [];
  const colors=["#d6f777","#c9e4f0","#f8b897"];
  for(let i=0;i<3;i++){
    const m=members[i]||null,x=48+i*334,y=1665,w=316,h=424;
    panel(ctx,x,y,w,h,33,"rgba(229,245,249,.11)","rgba(211,238,245,.32)",2);
    panel(ctx,x+18,y+20,67,52,17,colors[i]);
    winterText(drawText,ctx,String(i+1).padStart(2,"0"),x+51.5,y+47,57,27,"#0f3041",{align:"center"});
    drawCat(ctx,m,{x:x+55,y:y+45,width:206,height:222},1.0);
    winterText(drawText,ctx,m?.name||"暂无记录",x+w/2,y+284,w-28,31,white,{align:"center",minSize:18});
    winterText(drawText,ctx,m?Math.round(m.minutes)+" 分钟":"—",x+w/2,y+348,w-28,40,green,{align:"center",minSize:23});
    winterText(drawText,ctx,m?m.checkins+" 次打卡":"",x+w/2,y+389,w-28,21,muted,{align:"center",weight:750});
  }
  const others = (report.ranking||[]).slice(3);
  ctx.beginPath();ctx.moveTo(61,2130);ctx.lineTo(1018,2130);
  ctx.lineWidth=2;ctx.strokeStyle="rgba(217,239,244,.23)";ctx.stroke();
  winterText(drawText,ctx,"其他成员",65,2175,174,29,white);
  const names=others.slice(0,6).map((m)=>m.name).join("  /  ");
  winterText(drawText,ctx,names || "暂无其他成员",248,2175,768,24,muted,{weight:750});
  if(others.length>6) winterText(drawText,ctx,"另有 "+(others.length-6)+" 人",1018,2225,320,19,muted,{align:"right",weight:700});
}

function drawMonthlyMembers(ctx, report, drawCat, drawText, page, pages) {
  const white="#edf8fa", lime="#d6ff76", muted="#9bbdcc";
  const members=(report.ranking||[]).filter((m)=>Number(m.minutes)>0);
  winterText(drawText,ctx,"全员训练记录",60,1607,540,45,white);
  winterText(drawText,ctx,members.length+" 位成员 · 第 "+(page+1)+"/"+pages+" 页",1021,1610,420,23,muted,{align:"right",weight:750});
  const start=page*MONTHLY_MEMBERS_PER_PAGE;
  const shown=members.slice(start,start+MONTHLY_MEMBERS_PER_PAGE);
  if(!shown.length) {
    panel(ctx,59,1660,960,480,28,"rgba(213,241,243,.09)","rgba(216,241,247,.25)");
    winterText(drawText,ctx,"本月暂无训练记录",540,1880,700,37,white,{align:"center"});
    return;
  }
  const cardWidth=234,cardHeight=177,stepX=252,stepY=189;
  shown.forEach((member,index)=>{
    const col=index%4,row=Math.floor(index/4);
    const x=42+col*stepX,y=1660+row*stepY;
    panel(ctx,x,y,cardWidth,cardHeight,25,"rgba(224,245,247,.13)","rgba(223,246,251,.25)",2);
    if(start+index<3){
      panel(ctx,x+12,y+11,39,31,9,lime);
      winterText(drawText,ctx,start+index+1,x+31.5,y+26.5,34,18,"#193649",{align:"center"});
    }
    drawCat(ctx,member,{x:x+64,y:y+3,width:108,height:104},.98);
    const displayName=[...String(member.name||"群友")].length>9
      ? [...String(member.name)].slice(0,8).join("")+"…" : member.name;
    winterText(drawText,ctx,displayName,x+cardWidth/2,y+124,cardWidth-18,24,white,{align:"center",minSize:14});
    winterText(drawText,ctx,Math.round(member.minutes)+"分 · "+member.checkins+"次",x+cardWidth/2,y+155,cardWidth-18,20,muted,{align:"center",weight:750,minSize:12});
  });
}

function drawFooter(ctx,report,drawText,page,pages){
  ctx.beginPath();ctx.moveTo(65,2265);ctx.lineTo(1015,2265);
  ctx.lineWidth=2;ctx.strokeStyle="rgba(207,231,238,.27)";ctx.stroke();
  winterText(drawText,ctx,"GABA 47",65,2300,250,23,"#d4eef0");
  winterText(drawText,ctx,report.reportType==="week"?"WEEKLY  /  WINTER":"MONTHLY  /  WINTER",1009,2300,380,20,"#a3c3cf",{align:"right",weight:750});
}

export function drawWinterReportPoster(canvas,report,drawCat,drawText,page=0){
  if(!canvas || !report) return;
  const totalPages=winterReportPageCount(report);
  const safePage=Math.max(0,Math.min(totalPages-1,Math.floor(Number(page)||0)));
  // Feed thumbnails render at half resolution. The modal and saved image stay 1080x2340.
  const thumb = typeof canvas.hasAttribute === "function" && canvas.hasAttribute("data-report-canvas");
  const scale = thumb ? .5 : 1;
  canvas.width = WINTER_REPORT_WIDTH * scale;
  canvas.height = WINTER_REPORT_HEIGHT * scale;
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx) return;
  ctx.setTransform(scale,0,0,scale,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.textBaseline="middle";
  drawWinterBackground(ctx,report);
  drawHeader(ctx,report,drawCat,drawText,safePage,totalPages);
  drawOverview(ctx,report,drawText);
  if(report.reportType==="month"){
    drawMonthlyActivity(ctx,report,drawText);
    drawMonthlyMembers(ctx,report,drawCat,drawText,safePage,totalPages);
  } else {
    drawWeeklyActivity(ctx,report,drawText);
    drawWeeklyRanking(ctx,report,drawCat,drawText);
  }
  drawFooter(ctx,report,drawText,safePage,totalPages);
}
