import React, { useState } from 'react';
import { X, Wrench, Palette, Coins, Check, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { UpgradesState, UPGRADE_CATALOG, getUpgradeCost, canAffordUpgrade } from '../game/rules.ts';
import { VEHICLE_COLORS } from '../game/townBuilder.ts';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  upgrades: UpgradesState;
  selectedColor: string;
  onBuyUpgrade: (category: keyof UpgradesState, nextLevel: number, cost: number) => void;
  onSelectColor: (colorKey: string) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  coins,
  upgrades,
  selectedColor,
  onBuyUpgrade,
  onSelectColor,
}) => {
  const [activeTab, setActiveTab] = useState<'upgrades' | 'paint'>('upgrades');

  if (!isOpen) return null;

  const categories: { key: keyof UpgradesState; title: string; icon: string }[] = [
    { key: 'bladeLevel', title: 'Plow Blade Width', icon: '🚜' },
    { key: 'engineLevel', title: 'Diesel Engine Power', icon: '⚡' },
    { key: 'saltLevel', title: 'Rear Salt Spreader', icon: '🧂' },
    { key: 'cabinLevel', title: 'Heated Cabin & Lights', icon: '🔥' },
    { key: 'boostLevel', title: 'Nitro Snow-Blower', icon: '🚀' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Plow Workshop & Garage</h2>
              <p className="text-xs text-slate-400">Upgrade your rig to plow faster swaths and earn higher combos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-amber-300 font-bold text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="tabular-nums">{coins}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close garage"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 px-6 gap-2 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'upgrades'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Equipment Upgrades</span>
          </button>

          <button
            onClick={() => setActiveTab('paint')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'paint'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Paint Shop</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'upgrades' ? (
            <div className="grid grid-cols-1 gap-4">
              {categories.map((cat) => {
                const currentLvl = upgrades[cat.key];
                const catalog = UPGRADE_CATALOG[cat.key];
                const currentTier = catalog.find((t) => t.level === currentLvl) || catalog[0];
                const nextTier = catalog.find((t) => t.level === currentLvl + 1);
                const cost = nextTier ? nextTier.cost : Infinity;
                const canBuy = canAffordUpgrade(coins, cat.key, currentLvl);

                return (
                  <div
                    key={cat.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm sm:text-base">{cat.title}</h3>
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
                    </div>

                    <div className="flex items-center self-end sm:self-center gap-2">
                      {nextTier ? (
                        <button
                          onClick={() => onBuyUpgrade(cat.key, nextTier.level, cost)}
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(VEHICLE_COLORS).map(([key, config]) => {
                const isSelected = selectedColor === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSelectColor(key)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl shadow border border-white/20"
                        style={{ backgroundColor: `#${config.body.toString(16).padStart(6, '0')}` }}
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{config.name}</h4>
                        <p className="text-xs text-slate-400">Custom Powder-Coat</p>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 hover:text-white">Equip</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
