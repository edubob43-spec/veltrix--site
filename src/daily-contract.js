// Contrato do saldo vindo exclusivamente da bridge autenticada do bot.
// O primeiro resgate ainda não tem lastClaimAt; isso não torna o saldo inválido.
export const brDayNow = (at = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(at);

const nonNegativeInteger = value => Number.isSafeInteger(value) && value >= 0;

export function parseDailyStatus(value, receivedAt = Date.now()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const required = ['wallet', 'bank', 'streak', 'nextBonusIn', 'resetAt'];
  if (required.some(field => !nonNegativeInteger(value[field]))) return null;
  if (typeof value.claimedToday !== 'boolean') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value.dayKey ?? ''))) return null;

  // Campos que podem faltar em contas novas ou em versões anteriores do bot.
  const optional = ['lastClaimAt', 'asOf', 'todayReward', 'todayBonus'];
  if (optional.some(field => value[field] != null && !nonNegativeInteger(value[field]))) return null;

  return {
    wallet: value.wallet, bank: value.bank, streak: value.streak,
    nextBonusIn: value.nextBonusIn, resetAt: value.resetAt,
    lastClaimAt: value.lastClaimAt ?? 0,
    asOf: value.asOf ?? receivedAt,
    todayReward: value.todayReward ?? 0,
    todayBonus: value.todayBonus ?? 0,
    claimedToday: value.claimedToday,
    dayKey: value.dayKey,
    receivedAt
  };
}
