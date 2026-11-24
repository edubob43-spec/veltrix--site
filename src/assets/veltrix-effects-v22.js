(()=>{'use strict';
const field=document.querySelector('.sparkfield');
if(!field)return;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let enabled=!reduced.matches, scheduled=false;
let button=null;
function refresh(){scheduled=false;
  if(!enabled){field.style.transform='none';document.documentElement.style.setProperty('--mascot-rise','0px');return;}
  const y=Math.max(0, window.scrollY||0);
  field.style.transform=`translate3d(0,${(-Math.min(y*.46,360)).toFixed(1)}px,0)`;
  document.documentElement.style.setProperty('--mascot-rise',`${(-Math.min(y*.07,65)).toFixed(1)}px`);
}
function onScroll(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
function setEnabled(value){enabled=Boolean(value);document.body.dataset.velMotion=enabled?'on':'off';if(button){button.textContent=enabled?'✦ Efeitos: ligados':'✦ Efeitos: ativar';button.setAttribute('aria-pressed',String(enabled));}refresh();}
if(document.body.classList.contains('landing-page')){
 button=document.createElement('button');button.type='button';button.className='vel-motion-toggle';button.setAttribute('aria-label','Ativar ou pausar animações de fundo');
 button.addEventListener('click',()=>setEnabled(!enabled));document.body.append(button);
}
window.addEventListener('scroll',onScroll,{passive:true});
if(reduced.addEventListener)reduced.addEventListener('change',()=>setEnabled(!reduced.matches));
setEnabled(enabled);
})();
