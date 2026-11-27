import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDailyStatus, brDayNow } from '../src/daily-contract.js';

const base = {
  wallet: 1500, bank: 3200, streak: 0, nextBonusIn: 7,
  resetAt: 1795748400000, claimedToday: false, dayKey: '2026-11-26'
};

test('aceita conta sem resgate anterior e campos opcionais ausentes', () => {
  const status = parseDailyStatus({ ...base, lastClaimAt: null }, 1700000000000);
  assert.equal(status.lastClaimAt, 0);
  assert.equal(status.asOf, 1700000000000);
  assert.equal(status.todayReward, 0);
  assert.equal(status.todayBonus, 0);
  assert.equal(status.wallet, 1500);
});

test('preserva o prêmio confirmado pelo bot', () => {
  const status = parseDailyStatus({
    ...base, claimedToday: true, lastClaimAt: 1795700000000,
    asOf: 1795700001000, todayReward: 7789, todayBonus: 100000
  });
  assert.equal(status.todayReward, 7789);
  assert.equal(status.todayBonus, 100000);
});

test('rejeita valores manipulados e datas inválidas', () => {
  assert.equal(parseDailyStatus({ ...base, wallet: -1 }), null);
  assert.equal(parseDailyStatus({ ...base, bank: '9999' }), null);
  assert.equal(parseDailyStatus({ ...base, dayKey: 'hoje' }), null);
  assert.equal(parseDailyStatus({ ...base, claimedToday: 'true' }), null);
});

test('a data do daily segue o horário de Brasília', () => {
  assert.equal(brDayNow(Date.parse('2026-11-27T02:59:59Z')), '2026-11-26');
  assert.equal(brDayNow(Date.parse('2026-11-27T03:00:00Z')), '2026-11-27');
});
