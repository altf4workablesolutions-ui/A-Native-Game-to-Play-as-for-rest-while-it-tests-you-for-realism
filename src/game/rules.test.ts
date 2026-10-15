import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateComboMultiplier,
  calculatePlowReward,
  getUpgradeCost,
  canAffordUpgrade,
  getDistrictPlowPercentage,
  isDistrictCompleted,
  getReputationInfo,
  canUnlockShopItem,
  SHOP_CATALOG,
} from './rules.ts';

test('combo multiplier scales correctly across tiers', () => {
  const c0 = calculateComboMultiplier(5);
  assert.equal(c0.multiplier, 1.0);
  assert.equal(c0.tier, 'Fresh Flurry');

  const c1 = calculateComboMultiplier(15);
  assert.equal(c1.multiplier, 1.5);
  assert.equal(c1.tier, 'Snow Cruiser');

  const c2 = calculateComboMultiplier(30);
  assert.equal(c2.multiplier, 2.0);
  assert.equal(c2.tier, 'Frost Runner');

  const c3 = calculateComboMultiplier(60);
  assert.equal(c3.multiplier, 3.0);
  assert.equal(c3.tier, 'Blizzard Drifter');

  const c4 = calculateComboMultiplier(120);
  assert.equal(c4.multiplier, 5.0);
  assert.equal(c4.tier, 'Avalanche Master!');
});

test('plowing rewards factor in combo and blade tier and storm event', () => {
  const normalReward = calculatePlowReward(10, 1.0, 1, false);
  assert.equal(normalReward.score, 100);
  assert.equal(normalReward.coins, 4);
  assert.equal(normalReward.repXP, 3);

  // Snowstorm 2x multiplier
  const stormReward = calculatePlowReward(10, 1.0, 1, true);
  assert.equal(stormReward.score, 200);
  assert.equal(stormReward.coins, 8);
  assert.equal(stormReward.repXP, 6);
});

test('reputation system tracks tiers and unlocks', () => {
  const start = getReputationInfo(0);
  assert.equal(start.currentTier.level, 1);
  assert.equal(start.currentTier.title, 'New Neighbor');
  assert.equal(start.nextTier?.level, 2);

  const local = getReputationInfo(250);
  assert.equal(local.currentTier.level, 2);
  assert.equal(local.currentTier.title, 'Helpful Local');

  const legend = getReputationInfo(1000);
  assert.equal(legend.currentTier.level, 4);
  assert.equal(legend.currentTier.title, 'Winter Legend');
});

test('customization shop item unlock requirements check both coins and rep', () => {
  const auroraPaint = SHOP_CATALOG.find((i) => i.id === 'aurora-purple')!;
  assert.ok(auroraPaint);

  // Not enough rep
  const attempt1 = canUnlockShopItem(auroraPaint, 500, 2);
  assert.equal(attempt1.canAfford, true);
  assert.equal(attempt1.hasRep, false);
  assert.equal(attempt1.canBuy, false);

  // Enough rep and coins
  const attempt2 = canUnlockShopItem(auroraPaint, 500, 4);
  assert.equal(attempt2.canAfford, true);
  assert.equal(attempt2.hasRep, true);
  assert.equal(attempt2.canBuy, true);
});

test('upgrade affordability and costs work properly', () => {
  const blade2Cost = getUpgradeCost('bladeLevel', 1);
  assert.equal(blade2Cost, 120);

  assert.equal(canAffordUpgrade(100, 'bladeLevel', 1), false);
  assert.equal(canAffordUpgrade(150, 'bladeLevel', 1), true);

  const maxBladeCost = getUpgradeCost('bladeLevel', 4);
  assert.equal(maxBladeCost, Infinity);
  assert.equal(canAffordUpgrade(99999, 'bladeLevel', 4), false);
});

test('district completion percentage and win threshold', () => {
  assert.equal(getDistrictPlowPercentage(0, 500), 0);
  assert.equal(getDistrictPlowPercentage(425, 500), 85);
  assert.equal(isDistrictCompleted(84), false);
  assert.equal(isDistrictCompleted(85), true);
  assert.equal(isDistrictCompleted(100), true);
});
