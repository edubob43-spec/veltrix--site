// Atualiza a lista de servidores automaticamente quando a bridge fica disponível.
// Executado apenas na tela de seleção quando o bot ainda não sincronizou.
(() => {
  if (!location.pathname.startsWith('/dashboard')) return;
  let done=false;
  const probe=async () => {
    if (done) return;
    try {
      const r=await fetch('/api/status',{cache:'no-store',credentials:'same-origin'});
      if (r.ok) {
        const data=await r.json();
        if (data.online) { done=true; location.reload(); return; }
      }
    } catch (_e) { /* rede momentaneamente indisponível */ }
    setTimeout(probe,3500);
  };
  setTimeout(probe,1000);
})();
