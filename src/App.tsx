/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut, testConnection } from './firebase/config.ts';
import {
  getUserProfile,
  saveInitialProfile,
  updateUserProgress,
  UserProfileData,
} from './firebase/userStore.ts';
import { GameEngine, GameHUDState } from './game/engine.ts';
import {
  INITIAL_UPGRADES,
  INITIAL_CUSTOMIZATION,
  UpgradesState,
  CustomizationState,
  ShopItem,
  getReputationInfo,
} from './game/rules.ts';
import { sound } from './game/audio.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { CustomizationShopModal } from './components/CustomizationShopModal.tsx';
import { LeaderboardModal } from './components/LeaderboardModal.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game Screen State
  const [screen, setScreen] = useState<'title' | 'playing'>('title');
  const [isPaused, setIsPaused] = useState(false);
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Player Progression & Equipment State
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [coins, setCoins] = useState(120);
  const [reputationXP, setReputationXP] = useState(0);
  const [upgrades, setUpgrades] = useState<UpgradesState>({ ...INITIAL_UPGRADES });
  const [customization, setCustomization] = useState<CustomizationState>({ ...INITIAL_CUSTOMIZATION });
  const [unlockedItemIds, setUnlockedItemIds] = useState<string[]>([
    'classic-yellow',
    'none',
    'standard',
    'classic',
  ]);

  // Live HUD Data
  const [hudState, setHudState] = useState<GameHUDState>({
    speed: 0,
    maxSpeed: 32,
    score: 0,
    coins: 120,
    streakCount: 0,
    comboMultiplier: 1.0,
    comboTier: 'Fresh Flurry',
    comboTierIndex: 0,
    comboTimerProgress: 0,
    clearedCount: 0,
    totalPlowable: 400,
    percentCleared: 0,
    districtIndex: 0,
    districtName: 'Pine Hollow Village',
    boostGauge: 1.0,
    isBoosting: false,
    isPaused: false,
    isVictory: false,
    reputationXP: 0,
    currentRepTier: getReputationInfo(0).currentTier,
    nextRepTier: getReputationInfo(0).nextTier,
    repProgressPercent: 0,
    isStormActive: false,
    stormTimerRemaining: 0,
    stormTotalDuration: 38,
  });

  // Gemini Town Radio Dispatch
  const [radioBroadcast, setRadioBroadcast] = useState<string>(
    '"Welcome to Pine Hollow, friends! DJ Frosty Flake here on 98.5 Frostbite FM! Roads are frosted over with fresh powder. Keep that plow humming!"'
  );
  const [isRadioLoading, setIsRadioLoading] = useState(false);

  // Test connection & auth listener on boot
  useEffect(() => {
    testConnection().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          let profile = await getUserProfile(currentUser.uid);
          if (!profile) {
            profile = await saveInitialProfile(currentUser.uid, currentUser.displayName || 'Plow Driver', currentUser.photoURL || undefined);
          }
          if (profile) {
            setUserProfile(profile);
            setCoins((prev) => Math.max(prev, profile.coins));
            setUpgrades(profile.upgrades || { ...INITIAL_UPGRADES });
            if (profile.selectedColor) {
              setCustomization((c) => ({ ...c, paintColor: profile.selectedColor }));
            }
          }
        } catch (err) {
          console.warn('Profile sync note:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize Three.js Game Engine once inside isolated ref
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(
      mountRef.current,
      upgrades,
      customization,
      coins,
      reputationXP
    );
    engineRef.current = engine;

    engine.setHUDCallback((state) => {
      setHudState(state);
      setCoins(state.coins);
      setReputationXP(state.reputationXP);

      if (state.isVictory && !isVictoryOpen) {
        setIsVictoryOpen(true);
      }
    });

    engine.setStormNotificationCallback((type) => {
      if (type === 'start') {
        fetchTownRadio('Pine Hollow', hudState.percentCleared, 2.0);
      }
    });

    // Check ?autostart=1 query param (mandated by ultra-mode skill)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      setScreen('playing');
      engine.start();
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sync upgrades and customization to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.upgrades = { ...upgrades };
      engineRef.current.customization = { ...customization };
      engineRef.current.spawnPlow();
    }
  }, [upgrades, customization]);

  // Request Gemini 3.1 Flash-Lite live town radio announcement
  const fetchTownRadio = async (district = 'Pine Hollow', clearedPercentage = 0, combo = 1.0) => {
    setIsRadioLoading(true);
    sound.playRadioChime();
    try {
      const res = await fetch('/api/radio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district,
          clearedPercentage,
          comboMultiplier: combo,
          driverName: user?.displayName || 'Plow Chief',
        }),
      });
      const data = await res.json();
      if (data.broadcast) {
        setRadioBroadcast(`"${data.broadcast}"`);
      }
    } catch {
      setRadioBroadcast(
        '"Frostbite FM 98.5: Gentle flurries continuing across Snowflake Valley. Cozy up and drive safe out there!"'
      );
    } finally {
      setIsRadioLoading(false);
    }
  };

  const handleStartGame = () => {
    setScreen('playing');
    if (engineRef.current) {
      engineRef.current.start();
    }
    sound.ensureRunning();
    fetchTownRadio('Pine Hollow', 0, 1.0);
  };

  const handlePause = () => {
    setIsPaused(true);
    if (engineRef.current) {
      engineRef.current.setPaused(true);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.setPaused(false);
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleHonk = () => {
    if (engineRef.current) {
      engineRef.current.honk();
    }
  };

  const handleResetPosition = () => {
    if (engineRef.current) {
      engineRef.current.resetPlowPosition();
    }
  };

  const handleRestartDistrict = () => {
    if (engineRef.current) {
      engineRef.current.snowGrid.resetPlow();
      engineRef.current.resetPlowPosition();
      engineRef.current.score = 0;
      engineRef.current.streakCount = 0;
    }
    setIsVictoryOpen(false);
    setIsPaused(false);
  };

  // Equipment hardware upgrade
  const handleBuyEquipmentUpgrade = (category: keyof UpgradesState, nextLevel: number, cost: number) => {
    if (coins < cost) return;
    const newCoins = coins - cost;
    setCoins(newCoins);
    const newUpgrades = { ...upgrades, [category]: nextLevel };
    setUpgrades(newUpgrades);

    if (engineRef.current) {
      engineRef.current.coins = newCoins;
      engineRef.current.applyUpgrade(category, nextLevel);
    }

    if (user) {
      updateUserProgress(user.uid, { coins: newCoins, upgrades: newUpgrades }).catch(() => {});
    }
  };

  // Cosmetic Customization purchase
  const handleBuyShopItem = (item: ShopItem) => {
    if (coins < item.cost) return;
    const newCoins = coins - item.cost;
    setCoins(newCoins);
    sound.playUpgradeDing();

    setUnlockedItemIds((prev) => [...prev, item.id]);
    handleEquipShopItem(item.category, item.id);

    if (engineRef.current) {
      engineRef.current.coins = newCoins;
    }

    if (user) {
      updateUserProgress(user.uid, {
        coins: newCoins,
        selectedColor: item.category === 'paint' ? item.id : customization.paintColor,
      }).catch(() => {});
    }
  };

  // Cosmetic equip
  const handleEquipShopItem = (category: ShopItem['category'], id: string) => {
    const updated = { ...customization };
    switch (category) {
      case 'paint':
        updated.paintColor = id;
        break;
      case 'decal':
        updated.decal = id;
        break;
      case 'blade':
        updated.bladeStyle = id;
        break;
      case 'decor':
        updated.roofDecor = id;
        break;
      case 'horn':
        updated.hornSound = id;
        break;
    }
    setCustomization(updated);
    if (engineRef.current) {
      engineRef.current.setCustomization(updated);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Isolated WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Screen: Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenGarage={() => setIsGarageOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          user={user}
          onSignIn={signInWithGoogle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Screen: Active Game HUD (Perimeter Clusters) */}
      {screen === 'playing' && (
        <GameHUD
          state={hudState}
          radioBroadcast={radioBroadcast}
          isRadioLoading={isRadioLoading}
          onRequestRadio={() => fetchTownRadio('Pine Hollow', hudState.percentCleared, hudState.comboMultiplier)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onOpenGarage={() => setIsGarageOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onResetPosition={handleResetPosition}
          onHonk={handleHonk}
          onTriggerStorm={() => engineRef.current?.triggerSnowstormEvent()}
        />
      )}

      {/* Customization Shop & Equipment Garage Modal */}
      <CustomizationShopModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        coins={coins}
        reputationXP={reputationXP}
        currentRepLevel={hudState.currentRepTier.level}
        upgrades={upgrades}
        customization={customization}
        unlockedItemIds={unlockedItemIds}
        onBuyEquipmentUpgrade={handleBuyEquipmentUpgrade}
        onBuyShopItem={handleBuyShopItem}
        onEquipShopItem={handleEquipShopItem}
      />

      {/* Town Honor Roll Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentScore={hudState.score}
        clearedCount={hudState.clearedCount}
        bestCombo={hudState.comboMultiplier}
        district={hudState.districtName}
        user={user}
        onSignIn={signInWithGoogle}
      />

      {/* District Cleared Victory Modal */}
      <VictoryModal
        isOpen={isVictoryOpen}
        onContinue={() => setIsVictoryOpen(false)}
        onOpenGarage={() => {
          setIsVictoryOpen(false);
          setIsGarageOpen(true);
        }}
        onOpenLeaderboard={() => {
          setIsVictoryOpen(false);
          setIsLeaderboardOpen(true);
        }}
        score={hudState.score}
        coins={hudState.coins}
        clearedCount={hudState.clearedCount}
        bestCombo={hudState.comboMultiplier}
        districtName={hudState.districtName}
      />

      {/* Game Paused Modal */}
      <PauseModal
        isOpen={isPaused}
        onResume={handleResume}
        onRestart={handleRestartDistrict}
        onOpenGarage={() => {
          setIsPaused(false);
          setIsGarageOpen(true);
        }}
        onOpenLeaderboard={() => {
          setIsPaused(false);
          setIsLeaderboardOpen(true);
        }}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    </div>
  );
}
