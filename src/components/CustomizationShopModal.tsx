import React, { useState } from 'react';
import {
  X,
  Palette,
  Wrench,
  Sparkles,
  Coins,
  Check,
  Lock,
  ArrowUpRight,
  Megaphone,
  Award,
  Layers,
  Volume2,
} from 'lucide-react';
import {
  UpgradesState,
  UPGRADE_CATALOG,
  CustomizationState,
  SHOP_CATALOG,
  ShopItem,
  getUpgradeCost,
  canAffordUpgrade,
  canUnlockShopItem,
  REPUTATION_TIERS,
} from '../game/rules.ts';
import { sound } from '../game/audio.ts';

interface CustomizationShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  reputationXP: number;
  currentRepLevel: number;
  upgrades: UpgradesState;
  customization: CustomizationState;
  unlockedItemIds: string[];
  onBuyEquipmentUpgrade: (category: keyof UpgradesState, nextLevel: number, cost: number) => void;
  onBuyShopItem: (item: ShopItem) => void;
  onEquipShopItem: (category: ShopItem['category'], id: string) => void;
}

export const CustomizationShopModal: React.FC<CustomizationShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  reputationXP,
  currentRepLevel,
  upgrades,
  customization,
  unlockedItemIds,
  onBuyEquipmentUpgrade,
  onBuyShopItem,
  onEquipShopItem,
}) => {
  const [activeTab, setActiveTab] = useState<'paint' | 'decal' | 'blade' | 'decor' | 'horn' | 'hardware' | 'reputation'>('paint');

  if (!isOpen) return null;

  const tabs: { key: typeof activeTab; title: string; icon: React.ReactNode }[] = [
    { key: 'paint', title: 'Paint Finishes', icon: <Palette className="w-4 h-4" /> },
    { key: 'decal', title: 'Decals & Crests', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'blade', title: 'Blade Designs', icon: <Layers className="w-4 h-4" /> },
    { key: 'decor', title: 'Festive Decor', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'horn', title: 'Musical Horns', icon: <Megaphone className="w-4 h-4" /> },
    { key: 'hardware', title: 'Hardware Tuning', icon: <Wrench className="w-4 h-4" /> },
    { key: 'reputation', title: 'Town Standing', icon: <Award className="w-4 h-4" /> },
  ];

  const currentCategoryItems = SHOP_CATALOG.filter((i) => i.category === activeTab);

  const getIsEquipped = (item: ShopItem): boolean => {
    switch (item.category) {
      case 'paint':
        return customization.paintColor === item.id;
      case 'decal':
        return customization.decal === item.id;
      case 'blade':
        return customization.bladeStyle === item.id;
      case 'decor':
        return customization.roofDecor === item.id;
      case 'horn':
        return customization.hornSound === item.id;
      default:
        return false;
    }
  };

  const previewHorn = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playHorn(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">Plow Customization Shop</h2>
              <p className="text-xs text-slate-400">Personalize your winter plow with bespoke finishes, blade trims, and festive decor</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-amber-300 font-bold text-sm shadow">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="tabular-nums">{coins}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close shop"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-800 px-4 gap-1 sm:gap-2 bg-slate-950/40 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.key
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.title}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'hardware' ? (
            /* Hardware Equipment Upgrades */
            <div className="grid grid-cols-1 gap-4">
              {(['bladeLevel', 'engineLevel', 'saltLevel', 'cabinLevel', 'boostLevel'] as (keyof UpgradesState)[]).map((key) => {
                const currentLvl = upgrades[key];
                const catalog = UPGRADE_CATALOG[key];
                const currentTier = catalog.find((t) => t.level === currentLvl) || catalog[0];
                const nextTier = catalog.find((t) => t.level === currentLvl + 1);
                const cost = nextTier ? nextTier.cost : Infinity;
                const canBuy = canAffordUpgrade(coins, key, currentLvl);

                const titles: Record<keyof UpgradesState, string> = {
                  bladeLevel: 'Plow Blade Width',
                  engineLevel: 'Diesel Horsepower',
                  saltLevel: 'Salt Spreader System',
                  cabinLevel: 'Heated Windshield & Halogens',
                  boostLevel: 'Nitro Supercharger',
                };

                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm sm:text-base">{titles[key]}</h3>
                        <span className="text-xs bg-slate-700 text-amber-300 font-semibold px-2 py-0.5 rounded-md">
                          Lvl {currentLvl} / {catalog.length}
                        </span>
                      </div>
                      <p className="text-xs text-sky-300 font-medium mt-0.5">Current: {currentTier.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{currentTier.description}</p>
                      {nextTier && (
                        <p className="text-[11px] text-emerald-400 mt-0.5">
                          Next: {nextTier.name} — {nextTier.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center self-end sm:self-center gap-2">
                      {nextTier ? (
                        <button
                          onClick={() => onBuyEquipmentUpgrade(key, nextTier.level, cost)}
                          disabled={!canBuy}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer ${
                            canBuy
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:scale-105 active:scale-95'
                              : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{cost} Coins</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                          <Check className="w-4 h-4" />
                          <span>Maxed Out</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'reputation' ? (
            /* Town Standing & Reputation Overview */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/40 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Current Town Standing</span>
                    <h3 className="text-lg font-black text-white">Level {currentRepLevel}: {REPUTATION_TIERS[currentRepLevel - 1]?.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Earn Reputation XP by plowing roads, clearing driveways for local residents, and plowing through wild snowstorms.
                  Higher ranks grant access to new town districts and unlock exclusive customization catalog items!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Town Reputation Tiers</h4>
                {REPUTATION_TIERS.map((tier) => {
                  const isAchieved = currentRepLevel >= tier.level;
                  const isCurrent = currentRepLevel === tier.level;
                  return (
                    <div
                      key={tier.level}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                        isCurrent
                          ? 'bg-emerald-950/30 border-emerald-500/60 shadow'
                          : isAchieved
                          ? 'bg-slate-800/40 border-slate-700/60 opacity-80'
                          : 'bg-slate-900/60 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: `${tier.badgeColor}25`, color: tier.badgeColor }}
                        >
                          L{tier.level}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-white">{tier.title}</h5>
                          <p className="text-xs text-slate-400">{tier.unlockNote}</p>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        {isAchieved ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Unlocked
                          </span>
                        ) : (
                          <span className="text-slate-400 tabular-nums">{tier.xpRequired} XP required</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Cosmetic Catalog Items (Paint, Decal, Blade, Decor, Horn) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentCategoryItems.map((item) => {
                const isEquipped = getIsEquipped(item);
                const isOwned = item.cost === 0 || unlockedItemIds.includes(item.id);
                const { canAfford, hasRep, canBuy } = canUnlockShopItem(item, coins, currentRepLevel);

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between p-4 rounded-2xl border transition ${
                      isEquipped
                        ? 'bg-sky-950/40 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                        : isOwned
                        ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          {item.colorHex ? (
                            <div
                              className="w-10 h-10 rounded-xl shadow border border-white/20 shrink-0"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                              {item.category === 'horn' ? '🎺' : item.category === 'decor' ? '🎀' : item.category === 'blade' ? '🚜' : '✨'}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-white text-sm">{item.name}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                          </div>
                        </div>

                        {item.category === 'horn' && (
                          <button
                            onClick={(e) => previewHorn(item.id, e)}
                            title="Preview sound"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 transition cursor-pointer shrink-0"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Reputation Gate warning */}
                      {!hasRep && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium my-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Requires Town Rep Level {item.requiredRepLevel}</span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {isOwned ? (
                        isEquipped ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                            <Check className="w-4 h-4" /> Currently Equipped
                          </span>
                        ) : (
                          <button
                            onClick={() => onEquipShopItem(item.category, item.id)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition hover:scale-102 active:scale-98 cursor-pointer"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => onBuyShopItem(item)}
                          disabled={!canBuy}
                          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                            canBuy
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:scale-102 active:scale-98 shadow'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                          }`}
                        >
                          {!hasRep ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked (Rep Lvl {item.requiredRepLevel})</span>
                            </>
                          ) : !canAfford ? (
                            <>
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                              <span>Need {item.cost} Coins</span>
                            </>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5" />
                              <span>Unlock for {item.cost} Coins</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
