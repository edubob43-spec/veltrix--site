(()=>{
  const form=document.getElementById('pr-editor');if(!form)return;
  
  const card=document.getElementById('pr-card');
  const banner=document.getElementById('pr-banner');
  const badges=document.getElementById('pr-flag-row');
  function refresh(){
    const theme=form.querySelector('input[name="theme"]:checked')?.value||'neon';
    const id=form.querySelector('input[name="banner"]:checked')?.value||'todas';
    if(/^(neon|ambar|glacial|noir)$/.test(theme))card.className=`pr-card pr-theme-${theme}`;
    if(/^(todas|anjo|minecraft|santuario|tropa|regua)$/.test(id))banner.className=`pr-banner pr-banner-${id}`;
    const checks=[...form.querySelectorAll('input[name="badge"]')];
    const selected=checks.filter(x=>x.checked);
    if(selected.length>5){selected[selected.length-1].checked=false;return;}
    badges.replaceChildren();
    for(const b of selected){const label=b.parentElement;const mini=label?.querySelector('span');const x=document.createElement('span');x.className='pr-flag';x.textContent=mini?.textContent||b.value;x.title=label?.textContent?.trim()||'';badges.appendChild(x);}
  }
  form.addEventListener('change',refresh);refresh();
})();
