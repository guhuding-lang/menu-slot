window.JEJU_ICON=(function(){
 const stroke='stroke="#25383C" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
 const sea='#64C6E0',sea2='#A9E7EC',orange='#FFAB50',green='#91D5A0',mint='#D9EFBC',cream='#FFF5CF',stone='#BBC9CF',brown='#E6AF80';
 const p=(d,fill='none')=>'<path d="'+d+'" fill="'+fill+'" '+stroke+'/>';
 const r=(x,y,w,h,fill,rx=5)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+fill+'" '+stroke+'/>';
 const c=(x,y,r,fill)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" '+stroke+'/>';
 const ell=(x,y,rx,ry,fill)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" '+stroke+'/>';
 const ln=(x,y,X,Y)=>p('M'+x+' '+y+' L'+X+' '+Y);
 const water=p('M6 76 Q17 70 28 76 T50 76 T72 76 T94 76','none').replace('stroke="#25383C"','stroke="'+sea+'"');
 const ground=p('M8 69 Q40 76 92 68');
 const cloud=p('M7 22 Q12 10 23 17 Q29 3 40 14 Q54 11 55 25 Q48 31 32 28 L14 29 Z','#fff');
 const sun=c(77,17,11,orange);
 const trees=p('M15 67 L17 41 M17 43 Q5 37 6 27 Q18 29 19 40 Q28 28 37 34 Q29 42 19 44','none');
 const obj={
 car:()=>r(14,43,72,22,orange,6)+p('M24 44 L33 30 L61 30 L76 44',orange)+c(30,67,8,'#374D59')+c(73,67,8,'#374D59')+r(37,35,17,10,sea,2),
 plane:()=>p('M7 45 L42 37 L64 11 L76 10 L65 37 L88 48 L90 60 L57 51 L36 68 L26 68 L36 47 L10 53 Z','#fff')+p('M64 11 L76 10 L65 37',orange)+p('M41 37 L7 45',sea),
 airport:()=>r(8,35,84,40,'#EAF4F8',4)+r(17,49,14,14,sea,2)+r(35,49,14,14,sea,2)+r(53,49,14,14,sea,2)+r(71,49,14,14,sea,2)+r(66,7,14,28,'#EAF4F8',1)+r(61,15,24,7,sea,1)+p('M14 34 Q48 14 86 34',cream),
 bus:()=>r(8,26,85,43,orange,8)+r(17,32,19,16,sea,2)+r(40,32,20,16,sea,2)+r(64,32,18,16,sea,2)+c(29,69,7,'#25383C')+c(74,69,7,'#25383C')+p('M12 53 L89 53'),
 hotel:()=>r(21,17,61,54,cream,3)+r(36,52,17,19,brown,1)+r(31,27,9,11,sea,1)+r(47,27,9,11,sea,1)+r(63,27,9,11,sea,1)+r(63,46,9,11,sea,1)+p('M17 71 L88 71')+trees,
 spa:()=>p('M11 51 Q13 34 25 38 Q32 25 44 37 Q62 27 69 41 Q81 34 90 51 L90 65 Q45 77 11 64 Z',sea2)+p('M25 48 Q39 59 59 45 T82 48','none')+p('M37 32 Q26 18 36 11 M49 31 Q59 17 48 8 M62 32 Q51 16 61 8','none')+ell(20,63,12,8,stone)+ell(82,65,14,7,stone),
 bar:()=>r(14,36,73,39,brown,3)+p('M11 37 L21 20 L84 20 L92 37 Z',orange)+r(28,51,14,24,cream,2)+r(57,53,19,12,sea,2)+r(84,32,9,23,cream,2)+r(7,38,9,18,cream,2)+p('M15 77 L87 77')+c(49,67,4,orange),
 moon:()=>p('M52 11 Q31 23 40 44 Q49 61 68 51 Q56 72 37 60 Q15 45 30 24 Q38 14 52 11 Z',orange)+c(70,22,2,cream)+c(81,40,2,cream)+p('M17 73 L86 73'),
 beach:()=>p('M8 61 Q24 53 40 61 T73 61 T95 61 L94 77 L6 77 Z',sea2)+p('M7 57 Q48 44 94 57',cream)+p('M49 52 L49 20 M30 32 Q49 10 68 32 Z',orange)+c(78,21,8,orange),
 coast:()=>p('M8 37 L18 24 L34 30 L42 16 L58 29 L68 22 L84 41 L95 43 L95 62 Q59 54 27 66 L7 62 Z',stone)+p('M7 73 Q19 64 30 72 T52 72 T77 72 T96 72',sea)+sun,
 food:()=>ell(51,56,37,19,brown)+ell(51,51,34,18,cream)+p('M28 47 Q40 32 50 44 Q59 33 74 47 M24 53 Q45 67 78 53',orange)+p('M41 40 L44 54 L50 45',green)+ln(17,23,22,41)+ln(24,21,30,37),
 trail:()=>p('M7 68 Q32 42 53 49 T92 25','none')+p('M9 70 L43 71 L91 69',green)+p('M16 32 L19 53 M20 53 L13 65 M19 53 L27 65')+c(16,25,8,orange)+p('M36 30 L43 25 L48 32 L39 38 Z',cream)+sun,
 sunset:()=>p('M6 63 L94 63 M6 75 Q18 68 30 75 T52 75 T77 75 T95 75',sea)+p('M25 62 A25 25 0 0 1 75 62 Z',orange)+p('M9 37 L27 37 M74 37 L90 37')+cloud,
 bag:()=>r(24,26,50,48,orange,7)+p('M39 27 Q38 10 50 10 Q64 10 61 27',cream)+r(31,39,35,20,cream,3)+p('M44 44 L58 44 M51 44 L51 54'),
 river:()=>p('M2 53 Q25 35 47 48 T97 39 L95 75 Q60 60 42 75 T4 72 Z',sea2)+p('M9 27 L24 10 L40 24 L50 14 L69 34',mint)+p('M55 60 Q67 55 76 63 M24 62 Q31 52 40 59',sea)+trees,
 port:()=>p('M6 71 Q22 62 38 70 T69 68 T95 72',sea)+p('M15 43 L84 43 L76 58 L24 58 Z',cream)+p('M48 43 L48 18 M48 20 L66 42 L48 42 Z',orange)+p('M13 60 L20 73 M78 60 L84 73')+c(86,20,8,orange),
 falls:()=>p('M11 21 L24 18 L29 36 L46 36 L54 15 L81 15 L91 53 L88 69 L15 71 Z',stone)+p('M35 36 L35 70 Q45 82 53 70 L53 38',sea)+p('M59 25 L59 71 M66 29 L65 73',sea2)+p('M14 76 Q28 67 43 76 T71 76 T92 76',sea),
 shop:()=>r(13,35,75,40,cream,2)+p('M9 36 L20 20 L81 20 L93 36 Z',orange)+r(24,45,21,30,sea2,2)+r(56,44,21,12,sea,2)+p('M11 36 L89 36 M20 35 L20 42 M40 35 L40 42 M60 35 L60 42 M80 35 L80 42'),
 market:()=>r(10,31,82,42,cream,2)+p('M8 36 L17 19 L85 19 L94 36 L88 41 L77 35 L66 41 L55 35 L44 41 L33 35 L22 41 Z',orange)+p('M24 73 L24 51 L76 51 L76 73')+c(37,64,7,green)+c(54,62,7,orange)+c(70,63,7,sea),
 rock:()=>p('M9 69 L21 43 L33 46 L43 27 L51 14 L61 28 L68 21 L80 44 L91 66 L91 74 L8 74 Z',stone)+p('M42 37 L53 45 L47 53 L59 58 M25 58 L35 62',cream)+water,
 bridge:()=>p('M8 50 Q50 10 92 50 M8 50 L8 68 M92 50 L92 68 M8 54 L92 54 M17 47 L17 67 M33 37 L33 67 M50 31 L50 67 M67 37 L67 67 M83 47 L83 67',cream)+water,
 sea:()=>p('M4 55 Q19 44 33 55 T60 55 T89 55 L96 78 L5 78 Z',sea2)+p('M5 67 Q18 58 31 67 T57 67 T83 67',sea)+c(77,19,12,orange)+cloud,
 bakery:()=>r(9,33,82,42,cream,3)+p('M7 35 L20 17 L81 17 L94 35 Z',orange)+r(18,49,26,26,sea,2)+r(55,49,25,12,sea,2)+ell(62,72,16,8,brown)+p('M51 70 L74 70 M57 66 L60 74'),
 crab:()=>ell(51,51,23,17,orange)+c(36,45,3,'#25383C')+c(62,45,3,'#25383C')+p('M29 44 L15 29 L10 35 L19 44 L8 49 L20 54 M73 44 L86 29 L92 35 L81 44 L93 49 L82 54 M32 60 L19 72 M44 65 L36 78 M65 60 L79 72 M56 65 L63 78',orange)+p('M37 52 Q52 60 64 52'),
 mountain:()=>p('M7 73 L35 28 L48 42 L64 16 L95 73 Z',green)+p('M50 35 L64 16 L78 42 L65 37 L59 46 Z',cream)+p('M7 74 L95 74')+sun,
 lighthouse:()=>r(40,27,26,47,cream,2)+p('M37 28 L44 18 L62 18 L69 28 Z',orange)+r(44,8,18,10,sea,2)+r(45,41,15,10,sea2,1)+p('M32 74 L77 74')+water,
 passport:()=>r(25,13,50,62,orange,4)+r(36,25,27,36,cream,3)+c(49,38,10,sea)+p('M40 38 L58 38 M49 29 L49 47')+p('M37 54 L61 54'),
 orange:()=>c(48,47,24,orange)+p('M50 22 L52 12 M52 19 Q67 5 73 20 Q61 26 52 20',green)+c(42,47,2,cream)+c(57,52,2,cream),
 };
 return function(type){
   const body=(obj[type]||obj.orange)();
   return '<svg class="sketch-svg" aria-hidden="true" viewBox="0 0 100 84" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>';
 };
})();