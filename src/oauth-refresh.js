// Suporte OAuth2 da Veltrix: renovação automática de token de usuário do Discord.
// Não registra access_token, refresh_token ou Client Secret em logs.
export function tokenNeedsRefresh(oauth, now = Date.now(), marginMs = 90_000) {
  return !oauth?.accessToken || !Number.isFinite(oauth.expiresAt) || oauth.expiresAt <= now + marginMs;
}

export async function refreshDiscordOAuth(oauth, {clientId, clientSecret, fetchFn = fetch, now = Date.now()} = {}) {
  if (!oauth?.refreshToken) throw new Error('OAUTH_NO_REFRESH_TOKEN');
  if (!clientId || !clientSecret) throw new Error('OAUTH_MISSING_CLIENT_CONFIG');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetchFn('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: oauth.refreshToken
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      const error = new Error(`OAUTH_REFRESH_HTTP_${response.status}`);
      error.status = response.status;
      throw error;
    }
    const updated = await response.json();
    if (typeof updated.access_token !== 'string' || !updated.access_token ||
        typeof updated.refresh_token !== 'string' || !updated.refresh_token ||
        !Number.isFinite(Number(updated.expires_in)) || Number(updated.expires_in) <= 0) {
      throw new Error('OAUTH_REFRESH_RESPONSE_INVALID');
    }
    return {
      accessToken: updated.access_token,
      refreshToken: updated.refresh_token,
      expiresAt: now + Number(updated.expires_in) * 1000
    };
  } finally {
    clearTimeout(timer);
  }
}
