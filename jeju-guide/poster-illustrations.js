window.JEJU_ICON=(function(){
 const aliases={tangerine:"orange",wave:"sea",flowers:"flower",hibiscus:"flower",boots:"trail",airplane:"plane"};
 const known=new Set(["orange","car","plane","airport","bus","hotel","spa","bar","moon","beach","coast","food","trail","sunset","bag","river","port","falls","shop","market","rock","bridge","sea","bakery","crab","mountain","lighthouse","passport","calendar","wallet","checklist","camera","coffee","flower","ferry","hiking","hotpot","restaurant","pin","route","sunrise"]);
 return function(type,cls=""){
   const mapped=aliases[type]||type;
   const id=known.has(mapped)?mapped:"orange";
   return '<svg class="sketch-svg jeju-doodle '+cls+'" aria-hidden="true" viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg"><use href="./jeju-doodle-icons.svg#'+id+'"></use></svg>';
 };
})();