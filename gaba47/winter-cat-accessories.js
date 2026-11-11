/* Winter accessories are drawn OVER the original unmodified 760×760 sports-cat sprite.
   This avoids slimming the character or changing the saved furType. */
const WEAR = {
  hiking:     {hat:[354,133,188,-5,"#68805a"], scarf:[357,314,160,"#b8654f"]},
  bench:      {hat:[396,197,156,-3,"#758ca0"]},
  skating:    {hat:[439,145,203,6,"#9277a5"], scarf:[446,335,150,"#9875ad"]},
  basketball: {hat:[355,148,192,-3,"#547da7"], scarf:[336,365,151,"#547da7"]},
  running:    {hat:[507,151,191,8,"#b35e69"], scarf:[508,387,166,"#b35e69"]},
  flexing:    {hat:[377,142,200,0,"#6a85a5"]},
  stairs:     {hat:[395,146,175,-11,"#718663"], scarf:[403,355,132,"#8f6261"]},
  yoga:       {hat:[367,167,174,9,"#9c8cb0"]},
  meal:       {hat:[377,165,182,-2,"#b76a66"]},
  core:       {hat:[440,187,197,6,"#637eac"]},
  sleeping:   {hat:[321,290,171,-14,"#6982b0"]},
  snack:      {hat:[369,175,194,0,"#9a654c"]},
  working:    {hat:[418,188,180,1,"#6988a0"]},
  aerobics:   {scarf:[395,354,164,"#c5759c"]},
};
const SVG_HEAD = '<svg class="winter-cat-overlay" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 760" aria-hidden="true" focusable="false">';
const OUTLINE = "#25252a";
function hatGeometry(cx,cy,w,angle,color){
  const h=Math.round(w*.45);
  const b=Math.round(w*.52);
  return '<g transform="translate('+cx+' '+cy+') rotate('+angle+')">'+
    '<path d="M '+(-b)+' 0 Q '+(-b+4)+' '+(-h*.88)+' 0 '+(-h)+' Q '+(b-4)+' '+(-h*.85)+' '+b+' 0 Z" fill="'+color+'" stroke="'+OUTLINE+'" stroke-width="6" stroke-linejoin="round"/>'+
    '<path d="M '+(-b-5)+' -16 Q 0 -29 '+(b+5)+' -16 L '+(b+5)+' 13 Q 0 28 '+(-b-5)+' 13 Z" fill="#f2e9dc" stroke="'+OUTLINE+'" stroke-width="6"/>'+
    '<path d="M -48 -35 Q -24 -51 0 -35 M 10 -35 Q 34 -51 55 -35" stroke="#fcf8ef" stroke-width="5" opacity=".44" fill="none"/>'+
    '<circle cx="0" cy="'+(-h-6)+'" r="26" fill="#f6f0e4" stroke="'+OUTLINE+'" stroke-width="6"/>'+
    '</g>';
}
function scarfGeometry(cx,cy,w,color){
  const half=Math.round(w/2);
  return '<g transform="translate('+cx+' '+cy+')">'+
    '<path d="M '+(-half*.48)+' 5 Q '+(-half*.60)+' 58 '+(-half*.26)+' 104 L '+(-half*.02)+' 99 Q '+(half*.04)+' 47 '+(-half*.02)+' 18 Z" fill="'+color+'" stroke="'+OUTLINE+'" stroke-width="5" stroke-linejoin="round"/>'+
    '<path d="M '+(-half)+' -16 Q 0 -40 '+half+' -16 Q '+(half+13)+' 21 0 26 Q '+(-half-15)+' 20 '+(-half)+' -16 Z" fill="'+color+'" stroke="'+OUTLINE+'" stroke-width="6"/>'+
    '<path d="M '+(-half*.20)+' 31 L '+(-half*.20)+' 104 M '+(-half*.10)+' 31 L '+(-half*.10)+' 104" stroke="#f3d4c9" stroke-width="4" opacity=".6" />'+
    '</g>';
}
export function winterAccessoryMarkup(type){
  const outfit=WEAR[type];
  if(!outfit)return "";
  return SVG_HEAD+(outfit.scarf?scarfGeometry(...outfit.scarf):"")+(outfit.hat?hatGeometry(...outfit.hat):"")+'</svg>';
}
function round(ctx,x,y,w,h,r){
  const q=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+q,y);
  ctx.lineTo(x+w-q,y);ctx.quadraticCurveTo(x+w,y,x+w,y+q);
  ctx.lineTo(x+w,y+h-q);ctx.quadraticCurveTo(x+w,y+h,x+w-q,y+h);
  ctx.lineTo(x+q,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-q);
  ctx.lineTo(x,y+q);ctx.quadraticCurveTo(x,y,x+q,y);ctx.closePath();
}
function drawHat(ctx,cx,cy,w,angle,color){
  const h=w*.45,b=w*.52;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(angle*Math.PI/180);
  ctx.lineWidth=6;ctx.strokeStyle=OUTLINE;ctx.lineJoin="round";
  ctx.beginPath();ctx.moveTo(-b,0);ctx.quadraticCurveTo(-b+4,-h*.88,0,-h);
  ctx.quadraticCurveTo(b-4,-h*.85,b,0);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-b-5,-16);ctx.quadraticCurveTo(0,-29,b+5,-16);
  ctx.lineTo(b+5,13);ctx.quadraticCurveTo(0,28,-b-5,13);ctx.closePath();
  ctx.fillStyle="#f2e9dc";ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(0,-h-6,26,0,Math.PI*2);ctx.fillStyle="#f6f0e4";ctx.fill();ctx.stroke();
  ctx.restore();
}
function drawScarf(ctx,cx,cy,w,color){
  const half=w/2;
  ctx.save();ctx.translate(cx,cy);
  ctx.strokeStyle=OUTLINE;ctx.lineWidth=5;ctx.lineJoin="round";
  ctx.beginPath();ctx.moveTo(-half*.48,5);ctx.quadraticCurveTo(-half*.6,58,-half*.26,104);
  ctx.lineTo(-half*.02,99);ctx.quadraticCurveTo(half*.04,47,-half*.02,18);ctx.closePath();
  ctx.fillStyle=color;ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-half,-16);ctx.quadraticCurveTo(0,-40,half,-16);
  ctx.quadraticCurveTo(half+13,21,0,26);ctx.quadraticCurveTo(-half-15,20,-half,-16);ctx.closePath();
  ctx.lineWidth=6;ctx.fill();ctx.stroke();ctx.restore();
}
export function paintWinterAccessory(ctx,type,x,y,width,height){
  const outfit=WEAR[type];if(!outfit)return;
  ctx.save();ctx.translate(x,y);ctx.scale(width/760,height/760);
  if(outfit.scarf)drawScarf(ctx,...outfit.scarf);
  if(outfit.hat)drawHat(ctx,...outfit.hat);
  ctx.restore();
}
