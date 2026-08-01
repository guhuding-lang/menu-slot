(()=>{"use strict";
  const meals=[
    ["肯德基","连锁快餐"],["麦当劳","连锁快餐"],["披萨","连锁快餐"],["汉堡王","连锁快餐"],["塔斯汀","连锁快餐"],
    ["黄焖鸡米饭","米饭套餐"],["隆江猪脚饭","米饭套餐"],["烧鸭饭","烧腊饭"],["叉烧饭","烧腊饭"],["烧腊双拼饭","烧腊饭"],
    ["煲仔饭","米饭套餐"],["卤肉饭","米饭套餐"],["咖喱鸡饭","米饭套餐"],["海南鸡饭","米饭套餐"],["酸菜鱼饭","米饭套餐"],
    ["烤肉饭","米饭套餐"],["牛肉饭","米饭套餐"],["鸡腿饭","米饭套餐"],["排骨饭","米饭套餐"],["自选快餐","米饭套餐"],
    ["木桶饭","米饭套餐"],["盖浇饭","米饭套餐"],["炒粉","粉面"],["炒饭","米饭套餐"],["炒河粉","粉面"],
    ["肠粉","粉面"],["兰州牛肉面","粉面"],["重庆小面","粉面"],["云吞面","粉面"],["桂林米粉","粉面"],
    ["米线","粉面"],["麻辣烫","热辣外卖"],["螺蛳粉","粉面"],["沙县拌面","粉面"],["饺子","面点"],
    ["馄饨","面点"],["小笼包","面点"],["包子配粥","面点"],["生滚粥","粥粉面"],["鸡公煲","热辣外卖"],
    ["韩式炸鸡","连锁快餐"],["石锅拌饭","米饭套餐"],["寿司","便捷外卖"],["便利店便当","便捷外卖"],["轻食沙拉","便捷外卖"],
    ["麻辣香锅","热辣外卖"],["沙县小吃","便捷外卖"],["烤鸭饭","米饭套餐"]
  ].map(([name,type])=>({name,type}));
  const track=document.getElementById("viewsTrack"),listenerPage=document.querySelector(".listener-page"),foodPage=document.getElementById("foodPage"),toFood=document.getElementById("toFood"),toListener=document.getElementById("toListener"),foodMachine=document.getElementById("foodMachine"),foodSpin=document.getElementById("foodSpin"),foodCrank=document.getElementById("foodCrank"),foodStatus=document.getElementById("foodStatus"),foodOverlay=document.getElementById("foodOverlay"),foodClose=document.getElementById("foodClose"),foodAgain=document.getElementById("foodAgain"),foodName=document.getElementById("foodName"),foodType=document.getElementById("foodType");
  if(!track||!foodPage)return;
  let screen=0,rolling=false,last=-1,touchStart=null,timer=null,audio=null;
  function setScreen(next,focus=false){screen=next?1:0;track.classList.toggle("show-food",screen===1);listenerPage?.setAttribute("aria-hidden",String(screen===1));listenerPage?.toggleAttribute("inert",screen===1);foodPage.setAttribute("aria-hidden",String(screen===0));foodPage.toggleAttribute("inert",screen===0);document.title=screen?"今天吃什么扭蛋机":"不开玩笑随机收听机";if(focus)(screen?foodSpin:toFood)?.focus({preventScroll:true})}
  function closeFood(){foodOverlay.classList.remove("open");foodOverlay.setAttribute("aria-hidden","true")}
  function ping(strong=false){try{audio||=new(window.AudioContext||window.webkitAudioContext);const o=audio.createOscillator(),g=audio.createGain();o.type="triangle";o.frequency.value=strong?188:124;g.gain.setValueAtTime(strong?.035:.018,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+(strong?.12:.05));o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+(strong?.12:.05))}catch(_){}}
  function chooseMeal(){let index;do index=Math.floor(Math.random()*meals.length);while(meals.length>1&&index===last);last=index;return meals[index]}
  function rollFood(){if(rolling)return;closeFood();rolling=true;const picked=chooseMeal();foodMachine.classList.add("food-spinning");foodSpin.disabled=foodCrank.disabled=true;foodSpin.textContent="正在转动…";foodStatus.textContent="扭蛋正在沿着轨道掉下来";ping(true);navigator.vibrate?.(30);timer=setTimeout(()=>{foodMachine.classList.remove("food-spinning");foodSpin.disabled=foodCrank.disabled=false;foodSpin.textContent="转一下，吃这个";foodStatus.textContent=`这顿就吃：${picked.name}`;foodName.textContent=picked.name;foodType.textContent=`${picked.type} · 附近通常都能找到`;foodOverlay.classList.add("open");foodOverlay.setAttribute("aria-hidden","false");foodClose.focus({preventScroll:true});ping(true);navigator.vibrate?.([35,30,55]);rolling=false},1350)}
  toFood?.addEventListener("click",()=>setScreen(1,true));toListener?.addEventListener("click",()=>setScreen(0,true));foodSpin.addEventListener("click",rollFood);foodCrank.addEventListener("click",rollFood);foodClose.addEventListener("click",closeFood);foodAgain.addEventListener("click",()=>{closeFood();timer=setTimeout(rollFood,120)});foodOverlay.addEventListener("click",e=>{if(e.target===foodOverlay)closeFood()});
  track.addEventListener("touchstart",e=>{if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});track.addEventListener("touchend",e=>{if(!touchStart||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>52&&Math.abs(dx)>Math.abs(dy)*1.25){if(dx<0&&screen===0)setScreen(1);if(dx>0&&screen===1)setScreen(0)}},{passive:true});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeFood();if(!document.querySelector(".overlay.open")){if(e.key==="ArrowLeft"&&screen===0)setScreen(1,true);if(e.key==="ArrowRight"&&screen===1)setScreen(0,true)}});window.addEventListener("beforeunload",()=>clearTimeout(timer));setScreen(0);
})();
