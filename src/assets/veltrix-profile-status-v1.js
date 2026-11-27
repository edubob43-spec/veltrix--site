// Poll the profile save queue until the KataBump bot confirms or rejects it.
(() => {
  const status = document.getElementById('pc-profile-status');
  if (!status || status.dataset.profilePending !== 'true') return;

  let attempts = 0;
  let stopped = false;
  const initialText = status.textContent;
  async function check() {
    if (stopped) return;
    try {
      const response = await fetch('/api/me/perfil/status', {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('status unavailable');
      const data = await response.json();
      if (data.status === 'success') {
        status.textContent = 'Personalização aplicada e confirmada pelo bot! Já pode usar .perfil no Discord.';
        status.dataset.profilePending = 'false';
        stopped = true;
        return;
      }
      if (data.status === 'failure' || data.status === 'expired') {
        status.textContent = data.error
          ? 'O bot não conseguiu aplicar a personalização: ' + data.error
          : 'O bot não confirmou a personalização. Confira se a Veltrix está online e tente novamente.';
        status.dataset.profilePending = 'false';
        stopped = true;
        return;
      }
      if (data.status === 'idle') {
        status.textContent = 'Não há confirmação registrada. Atualize a página para conferir seu perfil.';
        status.dataset.profilePending = 'false';
        stopped = true;
        return;
      }
      attempts += 1;
      if (attempts >= 36) {
        status.textContent = 'Ainda aguardando o bot confirmar. Se continuar assim, verifique se a Veltrix está online no KataBump e atualize a página.';
        status.dataset.profilePending = 'false';
        stopped = true;
        return;
      }
      status.textContent = attempts >= 6
        ? 'O bot ainda está processando sua personalização…'
        : initialText;
    } catch {
      attempts += 1;
      if (attempts >= 36) {
        status.textContent = 'Não conseguimos consultar a confirmação agora. Verifique se a Veltrix está online e atualize a página.';
        status.dataset.profilePending = 'false';
        stopped = true;
        return;
      }
    }
    if (!stopped) setTimeout(check, 5000);
  }
  setTimeout(check, 2000);
})();
