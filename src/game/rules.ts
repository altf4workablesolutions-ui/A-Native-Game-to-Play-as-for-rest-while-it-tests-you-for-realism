/**
 * Pure game rules, scoring, combo multipliers, upgrades, customization shop,
 * snowstorm events, and town reputation progression math.
 */

export interface UpgradeTier {
  level: number;
  name: string;
  cost: number;
  value: number;
  description: string;
}

export interface UpgradesState {
  bladeLevel: number;
  engineLevel: number;
  saltLevel: number;
  cabinLevel: number;
  boostLevel: number;
}

export interface CustomizationState {
  paintColor: string;
  decal: string;
  bladeStyle: string;
  roofDecor: string;
  hornSound: string;
}

export const INITIAL_CUSTOMIZATION: CustomizationState = {
  paintColor: 'classic-yellow',
  decal: 'none',
  bladeStyle: 'standard',
  roofDecor: 'none',
  hornSound: 'classic',
};

// --- TOWN REPUTATION SYSTEM ---
export interface ReputationTier {
  level: number;
  title: string;
  xpRequired: number;
  unlockNote: string;
  badgeColor: string;
}

export const REPUTATION_TIERS: ReputationTier[] = [
  { level: 1, title: 'New Neighbor', xpRequired: 0, unlockNote: 'Pine Hollow Open', badgeColor: '#94a3b8' },
  { level: 2, title: 'Helpful Local', xpRequired: 150, unlockNote: 'Unlocks Chrome Blade & Mill Road', badgeColor: '#38bdf8' },
  { level: 3, title: 'Snow Warden', xpRequired: 450, unlockNote: 'Unlocks Festive Lights & School Contracts', badgeColor: '#34d399' },
  { level: 4, title: 'Winter Legend', xpRequired: 950, unlockNote: 'Unlocks Aurora Paint & Mountain Pass', badgeColor: '#a855f7' },
  { level: 5, title: "Mayor's Champion", xpRequired: 1600, unlockNote: 'Unlocks Golden Crown Decal & Max Honor', badgeColor: '#f59e0b' },
];

export function getReputationInfo(currentXP: number): {
  currentTier: ReputationTier;
  nextTier: ReputationTier | null;
  progressPercent: number;
  xpInTier: number;
  xpForNextTier: number;
} {
  let currentTierIndex = 0;
  for (let i = 0; i < REPUTATION_TIERS.length; i++) {
    if (currentXP >= REPUTATION_TIERS[i].xpRequired) {
      currentTierIndex = i;
    } else {
      break;
    }
  }

  const currentTier = REPUTATION_TIERS[currentTierIndex];
  const nextTier = currentTierIndex < REPUTATION_TIERS.length - 1 ? REPUTATION_TIERS[currentTierIndex + 1] : null;

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      xpInTier: currentXP - currentTier.xpRequired,
      xpForNextTier: 0,
    };
  }

  const range = nextTier.xpRequired - currentTier.xpRequired;
  const gained = Math.max(0, currentXP - currentTier.xpRequired);
  const progressPercent = Math.min(100, Math.round((gained / range) * 100));

  return {
    currentTier,
    nextTier,
    progressPercent,
    xpInTier: gained,
    xpForNextTier: range,
  };
}

// --- PLOW CUSTOMIZATION SHOP CATALOG ---
export interface ShopItem {
  id: string;
  category: 'paint' | 'decal' | 'blade' | 'decor' | 'horn';
  name: string;
  cost: number;
  requiredRepLevel: number;
  description: string;
  colorHex?: string;
  previewIcon?: string;
}

export const SHOP_CATALOG: ShopItem[] = [
  // Paint finishes
  { id: 'classic-yellow', category: 'paint', name: 'Highland Gold', cost: 0, requiredRepLevel: 1, description: 'Traditional winter highway safety yellow.', colorHex: '#f59e0b' },
  { id: 'blizzard-cyan', category: 'paint', name: 'Glacier Blue', cost: 80, requiredRepLevel: 1, description: 'Chilly polar ice enamel with metallic flakes.', colorHex: '#06b6d4' },
  { id: 'cherry-red', category: 'paint', name: 'Alpine Red', cost: 120, requiredRepLevel: 1, description: 'Vibrant rescue vehicle gloss red.', colorHex: '#ef4444' },
  { id: 'pine-green', category: 'paint', name: 'Nordic Pine', cost: 150, requiredRepLevel: 2, description: 'Deep mountain evergreen satin coat.', colorHex: '#10b981' },
  { id: 'midnight-black', category: 'paint', name: 'Night Sweeper', cost: 220, requiredRepLevel: 2, description: 'Stealth matte obsidian with amber highlights.', colorHex: '#27272a' },
  { id: 'aurora-purple', category: 'paint', name: 'Borealis Violet', cost: 400, requiredRepLevel: 4, description: 'Glimmering iridescent northern lights sheen.', colorHex: '#8b5cf6' },

  // Decals
  { id: 'none', category: 'decal', name: 'Clean Finish', cost: 0, requiredRepLevel: 1, description: 'No door or hood decals.' },
  { id: 'snowflake', category: 'decal', name: 'Snowflake Crest', cost: 60, requiredRepLevel: 1, description: 'Embossed silver snowflake emblem on doors.' },
  { id: 'racing-stripes', category: 'decal', name: 'Blizzard Stripes', cost: 110, requiredRepLevel: 2, description: 'Dual bold white racing stripes along the hood.' },
  { id: 'flame-frost', category: 'decal', name: 'Frost Flames', cost: 190, requiredRepLevel: 3, description: 'Stylized cyan icy flame licks on front fenders.' },
  { id: 'crown-gold', category: 'decal', name: "Mayor's Laurel", cost: 350, requiredRepLevel: 5, description: 'Golden town council honor laurel.' },

  // Blade Designs
  { id: 'standard', category: 'blade', name: 'Forged Steel Blade', cost: 0, requiredRepLevel: 1, description: 'Sturdy carbon steel plow blade.' },
  { id: 'chrome', category: 'blade', name: 'Mirror Chrome Blade', cost: 140, requiredRepLevel: 2, description: 'Ultra-reflective polished chrome finish.' },
  { id: 'ice-cutter', category: 'blade', name: 'Jagged Ice-Ripper', cost: 260, requiredRepLevel: 3, description: 'Serrated tungsten bottom edge for packed snow.' },
  { id: 'v-plow', category: 'blade', name: 'Nordic Wedge V-Plow', cost: 380, requiredRepLevel: 4, description: 'Aggressive twin-wing snow throwing profile.' },

  // Roof & Body Decor
  { id: 'none', category: 'decor', name: 'Factory Trim', cost: 0, requiredRepLevel: 1, description: 'Standard amber beacon only.' },
  { id: 'fairy-lights', category: 'decor', name: 'Festive Fairy Lights', cost: 95, requiredRepLevel: 2, description: 'Warm twinkling holiday lights framing the cabin.' },
  { id: 'holiday-wreath', category: 'decor', name: 'Pine Wreath & Bow', cost: 160, requiredRepLevel: 3, description: 'Fresh pine wreath with red ribbon on the grille.' },
  { id: 'antlers', category: 'decor', name: 'Reindeer Antlers', cost: 240, requiredRepLevel: 3, description: 'Cozy holiday antlers mounted above the cabin.' },

  // Musical Horns
  { id: 'classic', category: 'horn', name: 'Standard Beep', cost: 0, requiredRepLevel: 1, description: 'Classic cheerful plow toot (Press H).' },
  { id: 'steam-whistle', category: 'horn', name: 'Alpine Steam Whistle', cost: 75, requiredRepLevel: 2, description: 'Deep cozy mountain locomotive whistle.' },
  { id: 'chimes', category: 'horn', name: 'Holiday Jingle Chimes', cost: 130, requiredRepLevel: 3, description: 'Sparkling pentatonic holiday bell melody.' },
  { id: 'foghorn', category: 'horn', name: 'Blizzard Deep Foghorn', cost: 210, requiredRepLevel: 4, description: 'Massive resonant sub-bass horn.' },
];

export function canUnlockShopItem(item: ShopItem, currentCoins: number, repLevel: number): {
  canAfford: boolean;
  hasRep: boolean;
  canBuy: boolean;
} {
  const canAfford = currentCoins >= item.cost;
  const hasRep = repLevel >= item.requiredRepLevel;
  return {
    canAfford,
    hasRep,
    canBuy: canAfford && hasRep,
  };
}

// --- EQUIPMENT UPGRADES (Hardware) ---
export const UPGRADE_CATALOG: Record<keyof UpgradesState, UpgradeTier[]> = {
  bladeLevel: [
    { level: 1, name: 'Standard Steel', cost: 0, value: 1.4, description: 'Basic 1.4m plow blade.' },
    { level: 2, name: 'Wide Wing Blade', cost: 120, value: 2.0, description: 'Clears a 2.0m swath of snow.' },
    { level: 3, name: 'Heavy V-Plow', cost: 350, value: 2.8, description: 'Sweeps a 2.8m path with banked ridges.' },
    { level: 4, name: 'Mammoth Snow-Master', cost: 800, value: 3.6, description: 'Massive 3.6m clearing radius.' },
  ],
  engineLevel: [
    { level: 1, name: 'Cozy Diesel', cost: 0, value: 9.0, description: 'Top speed 9.0 m/s with steady torque.' },
    { level: 2, name: 'Turbo High-Torque', cost: 150, value: 11.5, description: 'Top speed 11.5 m/s, faster acceleration.' },
    { level: 3, name: 'Nordic 4x4 Power', cost: 400, value: 14.0, description: 'Top speed 14.0 m/s with deep-snow grip.' },
    { level: 4, name: 'Blizzard Beast V8', cost: 950, value: 17.0, description: 'Rocketing 17.0 m/s max velocity.' },
  ],
  saltLevel: [
    { level: 0, name: 'No Salt Hopper', cost: 0, value: 0, description: 'No rear salting.' },
    { level: 1, name: 'Rock Salt Hopper', cost: 100, value: 1, description: 'Melts a 1m radius around cleared path.' },
    { level: 2, name: 'Brine Jet Sprayer', cost: 280, value: 2, description: 'Melts a 2m radius and prevents refreeze.' },
    { level: 3, name: 'Thermal Eco-Salt', cost: 600, value: 3, description: 'Instant melt radius of 3m on all sides.' },
  ],
  cabinLevel: [
    { level: 1, name: 'Standard Heater', cost: 0, value: 1, description: 'Clear windshield, standard headlights.' },
    { level: 2, name: 'Warm Amber Halogens', cost: 80, value: 2, description: 'Extended warm headlight range in fog.' },
    { level: 3, name: 'Cozy Woodstove Cabin', cost: 220, value: 3, description: 'Cozy cabin warmth + high beam LEDs.' },
  ],
  boostLevel: [
    { level: 1, name: 'Standard Nitro', cost: 0, value: 2.5, description: '2.5s supercharged snow-thrower boost.' },
    { level: 2, name: 'Double Supercharger', cost: 180, value: 4.0, description: '4.0s boost with faster recharge.' },
    { level: 3, name: 'Hyper-Blizzard Jet', cost: 500, value: 6.0, description: '6.0s ultra burst with rainbow snow spray.' },
  ],
};

export const INITIAL_UPGRADES: UpgradesState = {
  bladeLevel: 1,
  engineLevel: 1,
  saltLevel: 0,
  cabinLevel: 1,
  boostLevel: 1,
};

// --- COMBO & SCORING ---
export interface ComboResult {
  multiplier: number;
  tier: string;
  tierIndex: number;
  nextTierProgress: number; // 0 to 1
}

export function calculateComboMultiplier(streakCount: number): ComboResult {
  if (streakCount < 10) {
    return {
      multiplier: 1.0,
      tier: 'Fresh Flurry',
      tierIndex: 0,
      nextTierProgress: Math.min(1, streakCount / 10),
    };
  } else if (streakCount < 25) {
    return {
      multiplier: 1.5,
      tier: 'Snow Cruiser',
      tierIndex: 1,
      nextTierProgress: (streakCount - 10) / 15,
    };
  } else if (streakCount < 50) {
    return {
      multiplier: 2.0,
      tier: 'Frost Runner',
      tierIndex: 2,
      nextTierProgress: (streakCount - 25) / 25,
    };
  } else if (streakCount < 90) {
    return {
      multiplier: 3.0,
      tier: 'Blizzard Drifter',
      tierIndex: 3,
      nextTierProgress: (streakCount - 50) / 40,
    };
  } else {
    return {
      multiplier: 5.0,
      tier: 'Avalanche Master!',
      tierIndex: 4,
      nextTierProgress: 1.0,
    };
  }
}

export function calculatePlowReward(
  tilesCleared: number,
  comboMultiplier: number,
  bladeLevel: number,
  isStormActive = false
): { score: number; coins: number; repXP: number } {
  if (tilesCleared <= 0) return { score: 0, coins: 0, repXP: 0 };
  const baseScorePerTile = 10;
  const baseCoinsPerTile = 0.4;
  const bladeBonus = 1 + (bladeLevel - 1) * 0.15;
  const stormMultiplier = isStormActive ? 2.0 : 1.0;

  const score = Math.round(tilesCleared * baseScorePerTile * comboMultiplier * bladeBonus * stormMultiplier);
  const coins = Math.max(1, Math.round(tilesCleared * baseCoinsPerTile * comboMultiplier * stormMultiplier));
  const repXP = Math.max(1, Math.round(tilesCleared * 0.3 * stormMultiplier));

  return { score, coins, repXP };
}

export function getUpgradeCost(category: keyof UpgradesState, currentLevel: number): number {
  const catalog = UPGRADE_CATALOG[category];
  const nextTier = catalog.find((item) => item.level === currentLevel + 1);
  return nextTier ? nextTier.cost : Infinity;
}

export function canAffordUpgrade(
  currentCoins: number,
  category: keyof UpgradesState,
  currentLevel: number
): boolean {
  const cost = getUpgradeCost(category, currentLevel);
  return currentCoins >= cost && cost !== Infinity;
}

export function getDistrictPlowPercentage(clearedTiles: number, totalTiles: number): number {
  if (totalTiles <= 0) return 0;
  return Math.min(100, Math.round((clearedTiles / totalTiles) * 100));
}

export function isDistrictCompleted(percentage: number): boolean {
  return percentage >= 85;
}

export const TOWN_DISTRICTS = [
  { id: 'pine_hollow', name: 'Pine Hollow Village', targetTiles: 380, description: 'Cozy residential chalets & winding pine drives', requiredRepLevel: 1 },
  { id: 'main_street', name: 'Main Street & Bakery', targetTiles: 520, description: 'Downtown shops, general store & town clock', requiredRepLevel: 2 },
  { id: 'mill_square', name: 'Old Watermill & Lake', targetTiles: 640, description: 'Historic wooden bridge, mill wheel & frozen pond', requiredRepLevel: 3 },
] as const;
