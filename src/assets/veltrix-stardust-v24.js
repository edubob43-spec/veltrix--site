(()=>{
  'use strict';
  const field=document.querySelector('.sparkfield');
  const canvas=field?.querySelector('.vel-star-canvas');
  if(!field||!canvas||!canvas.getContext)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  const mascot=document.querySelector('.vel-mascot[data-animated]');
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const palette=[
    [218,102,255], [241,85,243], [183,119,255],
    [170,85,255], [254,133,220], [118,112,255],
    [235,184,255], [114,208,255], [255,213,141]
  ];
  const rand=(a,b)=>a+Math.random()*(b-a);
  const spriteCache=new Map();
  let width=0,height=0,dpr=1,stars=[],last=0,raf=0;
  // Start with the correct image before loading any animation, so the mascot
  // never plays a few GIF frames and then abruptly switches to a still.
  // An explicit choice overrides the OS reduced-motion preference.
  function savedChoice(){
    try{return localStorage.getItem('veltrix-animation-setting');}catch{return null;}
  }
  const explicitChoice=savedChoice();
  let enabled=explicitChoice==='on'?true:explicitChoice==='off'?false:!mq.matches;
  let scrollImpulse=0;
  let lastScroll=window.scrollY||0;
  let resizeRequested=false;
  // Sprite glows are cached; each particle is moved independently per frame.
  function makeSprite(color,starShape){
    const key=color.join(',')+(starShape?'s':'d');
    if(spriteCache.has(key))return spriteCache.get(key);
    const el=document.createElement('canvas');el.width=el.height=96;
    const g=el.getContext('2d');const mid=48;
    const gradient=g.createRadialGradient(mid,mid,0,mid,mid,46);
    const rgb=color.join(',');
    gradient.addColorStop(0,`rgba(255,255,255,1)`);
    gradient.addColorStop(.09,`rgba(${rgb},1)`);
    gradient.addColorStop(.20,`rgba(${rgb},.68)`);
    gradient.addColorStop(.43,`rgba(${rgb},.22)`);
    gradient.addColorStop(1,`rgba(${rgb},0)`);
    g.fillStyle=gradient;g.fillRect(0,0,96,96);
    if(starShape){
      g.translate(mid,mid);g.fillStyle='rgba(255,249,255,.96)';
      g.beginPath();
      g.moveTo(0,-30);g.quadraticCurveTo(3,-3,9,-2);
      g.quadraticCurveTo(18,0,30,0);g.quadraticCurveTo(5,3,7,7);
      g.quadraticCurveTo(3,15,0,30);g.quadraticCurveTo(-3,6,-8,5);
      g.quadraticCurveTo(-15,2,-30,0);g.quadraticCurveTo(-7,-3,-7,-8);
      g.quadraticCurveTo(-2,-17,0,-30);g.fill();
      g.beginPath();g.arc(0,0,3.2,0,2*Math.PI);g.fill();
    }
    spriteCache.set(key,el);return el;
  }
  function createStar(randomStart=true){
    const big=Math.random()<.18;
    const color=palette[Math.floor(Math.random()*palette.length)];
    return {x:rand(0,width),y:randomStart?rand(-10,height+10):height+rand(28,120),
      radius:big?rand(19,36):rand(8,19),speed:rand(6,22)*(big?.84:1),
      dx:rand(-3.5,3.5),depth:rand(.1,.32),phase:rand(0,Math.PI*2),twinkle:rand(.5,1.65),
      brightness:rand(.45,.9),sprite:makeSprite(color,big),hasFlare:big};
  }
  function resize(){
    const oldWidth=width,oldHeight=height;
    width=Math.max(1,window.innerWidth);height=Math.max(1,window.innerHeight);
    dpr=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const limit=Math.max(52,Math.min(185,Math.round((width*height)/9200)));
    if(!stars.length)stars=Array.from({length:limit},()=>createStar());
    else{
      for(const p of stars){p.x=(p.x/Math.max(1,oldWidth))*width;p.y=(p.y/Math.max(1,oldHeight))*height;}
      if(stars.length>limit)stars.length=limit;
      while(stars.length<limit)stars.push(createStar());
    }
    if(!enabled)paint(0,0);
  }
  function paint(dt,time){
    ctx.clearRect(0,0,width,height);
    ctx.globalCompositeOperation='screen';
    // Never reset the entire field: each individual star recycles behind the bottom fade.
    scrollImpulse*=Math.exp(-dt*2.6);
    for(let i=0;i<stars.length;i++){
      let p=stars[i];
      if(enabled){p.y-=(p.speed+Math.max(0,scrollImpulse)*p.depth)*dt;
        p.x+=p.dx*dt;
        if(p.y< -p.radius*1.9){stars[i]=p=createStar(false);}
        if(p.x<-35)p.x=width+35;
        if(p.x>width+35)p.x=-35;
      }
      const boundary=Math.min(1,(p.y+20)/82,(height+30-p.y)/92);
      if(boundary<=0)continue;
      const flicker=.70+.30*Math.sin(time*.001*p.twinkle+p.phase);
      const alpha=Math.max(0,Math.min(1,boundary))*p.brightness*flicker;
      const r=p.radius*(.88+.13*Math.sin(time*.0007*p.twinkle+p.phase));
      ctx.globalAlpha=alpha;
      ctx.drawImage(p.sprite,p.x-r,p.y-r,r*2,r*2);
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  function tick(now){
    if(!enabled)return;
    const dt=Math.min(.05,Math.max(0,(now-last)/1000||.016));last=now;
    paint(dt,now);raf=window.requestAnimationFrame(tick);
  }
  const button=document.createElement('button');
  button.className='vel-motion-toggle';button.type='button';
  button.setAttribute('aria-label','Ativar ou pausar animações de fundo e da mascote');
  function setEnabled(on,remember=false){
    enabled=Boolean(on);document.body.dataset.velMotion=enabled?'on':'off';
    button.textContent=enabled?'✦ Animação: ligada':(mq.matches?'✦ Ativar animação (movimento reduzido)':'✦ Ativar animação');
    button.setAttribute('aria-pressed',String(enabled));
    if(remember){try{localStorage.setItem('veltrix-animation-setting',enabled?'on':'off');}catch{}}
    if(mascot){
      const next=enabled?mascot.dataset.animated:mascot.dataset.still;
      // Only replace src when needed: changing it repeatedly restarts the GIF.
      const activePath=new URL(mascot.src,location.href).pathname;
      if(next && activePath!==next)mascot.src=next;
    }
    if(raf)cancelAnimationFrame(raf);raf=0;
    last=performance.now();paint(0,last);
    if(enabled && !document.hidden)raf=requestAnimationFrame(tick);
  }
  button.addEventListener('click',()=>setEnabled(!enabled,true));
  if(document.body.classList.contains('landing-page'))document.body.append(button);
  function onScroll(){
    const y=window.scrollY||0;
    const delta=Math.max(-220,Math.min(220,y-lastScroll));
    lastScroll=y;
    scrollImpulse=Math.max(0,Math.min(200,scrollImpulse+delta*3));
    document.documentElement.style.setProperty('--mascot-rise',(-Math.min(y*.05,55)).toFixed(1)+'px');
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',()=>{
    if(resizeRequested)return;resizeRequested=true;
    requestAnimationFrame(()=>{resizeRequested=false;resize();});
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}
    else if(enabled){last=performance.now();raf=requestAnimationFrame(tick);}
  });
  if(mq.addEventListener)mq.addEventListener('change',e=>{if(savedChoice()===null)setEnabled(!e.matches);});
  resize();onScroll();setEnabled(enabled);
})();
