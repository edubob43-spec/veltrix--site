(()=>{'use strict';
const root=document.documentElement;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let raf=0;
function refresh(){raf=0;
 if(reduced.matches){root.style.removeProperty('--scroll-rise');root.style.removeProperty('--mascot-rise');return;}
 const y=Math.max(0,window.scrollY||0);
 // On scroll, the fixed starfield seems to rise behind the page content.
 root.style.setProperty('--scroll-rise',`${-Math.min(y*0.29,250).toFixed(1)}px`);
 root.style.setProperty('--mascot-rise',`${-Math.min(y*0.065,75).toFixed(1)}px`);
}
function onScroll(){if(!raf)raf=requestAnimationFrame(refresh)}
window.addEventListener('scroll',onScroll,{passive:true});
if(reduced.addEventListener)reduced.addEventListener('change',onScroll);
refresh();
})();
