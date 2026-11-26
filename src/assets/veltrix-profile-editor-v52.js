(()=>{
  const form=document.querySelector('#pc-editor');
  const card=document.querySelector('#pc-card');
  const banner=document.querySelector('#pc-banner');
  const tray=document.querySelector('#pc-badge-tray');
  const bio=document.querySelector('#pc-bio');
  const bioPreview=document.querySelector('#pc-bio-preview');
  const count=document.querySelector('#pc-count');
  if(!form||!card||!banner||!tray||!bio||!bioPreview)return;
  const themes=new Set(['cyber','neon','ambar','glacial','noir']);
  const banners=new Set(['cyber','todas','anjo','minecraft','santuario','tropa','regua']);
  const empty=()=>{const el=document.createElement('span');el.className='pc-empty-badges';el.textContent='Sem insígnias selecionadas';return el;};
  const refresh=()=>{
    const theme=form.querySelector('input[name="theme"]:checked')?.value;
    const bannerValue=form.querySelector('input[name="banner"]:checked')?.value;
    if(themes.has(theme)) card.className=`pc-card pc-theme-${theme}`;
    if(banners.has(bannerValue))banner.className=`pc-card-banner pr-banner-${bannerValue}`;
    const badges=[...form.querySelectorAll('input[name="badge"]:checked')];
    while(badges.length>5){badges.pop().checked=false;}
    tray.replaceChildren();
    const selected=[...form.querySelectorAll('input[name="badge"]:checked')];
    if(!selected.length){tray.appendChild(empty());} else for(const input of selected){
      const item=document.createElement('span');item.className='pc-badge-emblem';
      item.title=input.parentElement?.textContent.trim()||'Insígnia';
      const glyph=input.parentElement?.querySelector('img.pc-house-badge, svg');
      if(glyph)item.appendChild(glyph.cloneNode(true));
      tray.appendChild(item);
    }
    const clean=Array.from(bio.value).slice(0,160).join('');
    if(bio.value!==clean)bio.value=clean;
    bioPreview.textContent=clean.trim()||'Sua descrição vai aparecer aqui…';
    if(count)count.textContent=`${Array.from(clean).length}/160`;
  };
  form.addEventListener('change',refresh);
  bio.addEventListener('input',refresh);
  refresh();
})();
