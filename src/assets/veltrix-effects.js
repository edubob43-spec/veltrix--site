(()=>{'use strict';
const root=document.documentElement;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let waiting=false;
function refresh(){waiting=false;if(reduced.matches){root.style.removeProperty('--scroll-rise');root.style.removeProperty('--mascot-rise');return;}
const y=Math.max(0,window.scrollY||0);
root.style.setProperty('--scroll-rise',`-${Math.min(y*0.18,205).toFixed(1)}px`);
root.style.setProperty('--mascot-rise',`-${Math.min(y*0.09,90).toFixed(1)}px`);
}
function onScroll(){if(waiting)return;waiting=true;requestAnimationFrame(refresh);}
window.addEventListener('scroll',onScroll,{passive:true});
if(reduced.addEventListener) reduced.addEventListener('change',onScroll);
refresh();
})();
