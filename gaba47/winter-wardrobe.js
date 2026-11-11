// GABA47 冬季造型层：仅覆盖服装，原来的 14 张运动猫原图与角色 ID 保持不变。
// 透明 SVG 与 760x760 原图同坐标；网页和报表画布共用。
const line = "#242628";
const c = { cranberry:"#b95a62", blue:"#87bbd6", navy:"#3e617a", green:"#91aa71", blush:"#e5a1a3", cream:"#f7e8d7", tan:"#cfad89", purple:"#b6a0c9", ice:"#cce7f3", orange:"#de996c" };
function shape(path, fill, width=9) { return '<path d="'+path+'" fill="'+fill+'" stroke="'+line+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round"/>'; }
function ellipse(x,y,rx,ry,fill) {return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" stroke="'+line+'" stroke-width="8"/>';}
function hat(x,y,w,h,fill) {
  return shape('M'+x+' '+(y+h*.71)+' Q'+(x+w*.05)+' '+(y+h*.08)+' '+(x+w*.51)+' '+y+' Q'+(x+w*.92)+' '+(y+h*.09)+' '+(x+w)+' '+(y+h*.71)+' Z',fill)
   +shape('M'+(x-6)+' '+(y+h*.71)+' Q'+(x+w*.5)+' '+(y+h*.55)+' '+(x+w+6)+' '+(y+h*.71)+' L'+(x+w+4)+' '+(y+h*.91)+' Q'+(x+w*.5)+' '+(y+h*.78)+' '+(x-7)+' '+(y+h*.91)+' Z',c.cream)
   +ellipse(x+w*.5,y-5,22,21,c.cream)
   +'<path d="M'+(x+w*.34)+' '+(y+h*.36)+'l18 0m10 -7l15 13" stroke="'+line+'" opacity=".3" stroke-width="4" fill="none"/>';
}
function headband(x,y,w,h,fill) {
  return shape('M'+x+' '+(y+h*.2)+' Q'+(x+w*.48)+' '+(y-h*.28)+' '+(x+w)+' '+(y+h*.2)+' L'+(x+w-6)+' '+(y+h)+' Q'+(x+w*.47)+' '+(y+h*.58)+' '+(x+3)+' '+(y+h)+' Z',fill)
   +'<path d="M'+(x+19)+' '+(y+h*.27)+'Q'+(x+w*.5)+' '+(y+h*.08)+' '+(x+w-21)+' '+(y+h*.31)+'" fill="none" stroke="#ffffff" stroke-width="7" opacity=".78"/>';
}
function scarf(x,y,w,h,fill,tail="left") {
 let t=tail==="left"
   ?shape('M'+(x+16)+' '+(y+15)+' Q'+(x-33)+' '+(y-5)+' '+(x-95)+' '+(y+21)+' L'+(x-158)+' '+(y+6)+' Q'+(x-135)+' '+(y+68)+' '+(x-80)+' '+(y+57)+' L'+(x+20)+' '+(y+48)+' Z',fill)
   :shape('M'+(x+w-22)+' '+(y+12)+'Q'+(x+w+52)+' '+(y-7)+' '+(x+w+101)+' '+(y+28)+'L'+(x+w+143)+' '+(y+43)+'Q'+(x+w+65)+' '+(y+81)+' '+(x+w-14)+' '+(y+48)+'Z',fill);
 return t+shape('M'+(x+16)+' '+y+' Q'+(x+w*.5)+' '+(y-18)+' '+(x+w-8)+' '+(y+8)+' L'+(x+w)+' '+(y+h*.72)+' Q'+(x+w*.48)+' '+(y+h+12)+' '+(x+8)+' '+(y+h*.72)+' Z',fill)
  +'<path d="M'+(x+28)+' '+(y+h*.64)+'Q'+(x+w*.5)+' '+(y+h*.8)+' '+(x+w-22)+' '+(y+h*.61)+'" fill="none" stroke="#fce9de" stroke-width="7" opacity=".7"/>';
}
function vest(x,y,w,h,fill) {
  return shape('M'+(x+22)+' '+y+' Q'+(x+w*.35)+' '+(y-13)+' '+(x+w*.48)+' '+(y+17)+' Q'+(x+w*.68)+' '+(y-17)+' '+(x+w-23)+' '+y+'L'+(x+w+4)+' '+(y+h*.42)+'L'+(x+w-24)+' '+(y+h*.53)+'L'+(x+w-16)+' '+(y+h)+'Q'+(x+w*.5)+' '+(y+h+12)+' '+(x+14)+' '+(y+h)+'L'+(x+21)+' '+(y+h*.5)+'L'+(x-8)+' '+(y+h*.41)+'Z',fill)
    +'<path d="M'+(x+w*.49)+' '+(y+20)+'L'+(x+w*.5)+' '+(y+h-9)+'" stroke="'+line+'" stroke-width="7" stroke-linecap="round"/>'
    +'<path d="M'+(x+24)+' '+(y+h*.42)+'l42 8M'+(x+w-72)+' '+(y+h*.42)+'l45 -9" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".7"/>';
}
function warm(x,y,w,h,fill){
 return shape('M'+x+' '+y+'Q'+(x+w*.5)+' '+(y-8)+' '+(x+w)+' '+y+'L'+(x+w-6)+' '+(y+h)+'Q'+(x+w*.5)+' '+(y+h+8)+' '+(x+6)+' '+(y+h)+'Z',fill)
  +'<path d="M'+(x+9)+' '+(y+h*.32)+'h'+(w-18)+'M'+(x+10)+' '+(y+h*.58)+'h'+(w-20)+'" fill="none" stroke="#ffffff" stroke-width="4" opacity=".55"/>';
}
function jacket(x,y,w,h,fill){return vest(x,y,w,h,fill);}
const layers={
 hiking:()=>hat(228,20,276,120,c.green)+scarf(245,324,230,65,c.orange)+warm(193,544,87,71,c.green)+warm(485,578,66,62,c.green),
 bench:()=>headband(282,201,210,55,c.blue)+vest(251,343,290,192,c.blue)+warm(214,124,53,70,c.navy)+warm(471,121,53,70,c.navy),
 skating:()=>hat(279,48,245,135,c.ice)+scarf(298,324,225,76,c.purple,"right"),
 basketball:()=>jacket(277,347,296,245,c.navy)+headband(245,123,284,47,c.blue)+warm(113,425,68,58,c.ice),
 running:()=>scarf(347,328,255,65,c.cranberry)+vest(265,384,285,160,c.cream)+headband(340,157,300,39,c.cranberry),
 flexing:()=>headband(258,101,242,51,c.blue)+vest(250,336,281,237,c.navy)+warm(122,595,87,55,c.ice)+warm(505,598,86,56,c.ice),
 stairs:()=>hat(253,55,265,114,c.cream)+jacket(262,342,272,212,c.green),
 yoga:()=>headband(243,206,249,47,c.cream)+scarf(275,416,220,55,c.purple)+warm(143,624,102,42,c.purple),
 meal:()=>scarf(260,370,247,64,c.cranberry)+warm(142,414,71,64,c.cream)+warm(534,418,77,57,c.cream),
 core:()=>headband(325,138,275,54,c.navy)+warm(103,580,101,63,c.navy)+warm(344,603,92,50,c.navy),
 sleeping:()=>hat(184,144,200,104,c.ice)+shape('M310 332Q466 272 642 307Q711 360 671 477Q591 523 430 488Q363 462 309 414Z',c.ice)
    +'<path d="M350 357l26 24m10 -14l26 24m10 -14l26 24m10 -14l26 24" fill="none" stroke="#f9ffff" opacity=".7" stroke-width="5"/>',
 snack:()=>scarf(242,353,248,58,c.cranberry)+warm(183,480,55,93,c.green)+warm(542,473,58,92,c.green),
 working:()=>hat(269,90,248,115,c.tan)+scarf(358,358,206,55,c.cream),
 aerobics:()=>vest(196,378,332,173,c.purple)+warm(209,572,98,67,c.blush)+warm(475,570,84,73,c.blush)
};
const overlayCache=new Map();
export function winterOverlaySvg(id){
  const clean=String(id||"");
  const build=layers[clean];
  if(!build)return "";
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 760" width="760" height="760">'+build()+'</svg>';
}
export function winterOverlayDataUrl(id){
  if(!layers[id])return "";
  if(!overlayCache.has(id))overlayCache.set(id,"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(winterOverlaySvg(id)));
  return overlayCache.get(id);
}
