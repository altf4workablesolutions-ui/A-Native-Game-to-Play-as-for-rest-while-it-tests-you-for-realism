import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SnowGrid } from './snowGrid.ts';
import { TownBuilder } from './townBuilder.ts';
import { ParticleSystem } from './particles.ts';
import {
  UpgradesState,
  UPGRADE_CATALOG,
  CustomizationState,
  INITIAL_CUSTOMIZATION,
  calculateComboMultiplier,
  calculatePlowReward,
  getReputationInfo,
  ReputationTier,
  TOWN_DISTRICTS,
} from './rules.ts';
import { sound } from './audio.ts';

export interface GameHUDState {
  speed: number;
  maxSpeed: number;
  score: number;
  coins: number;
  streakCount: number;
  comboMultiplier: number;
  comboTier: string;
  comboTierIndex: number;
  comboTimerProgress: number;
  clearedCount: number;
  totalPlowable: number;
  percentCleared: number;
  districtIndex: number;
  districtName: string;
  boostGauge: number;
  isBoosting: boolean;
  isPaused: boolean;
  isVictory: boolean;

  // Reputation System
  reputationXP: number;
  currentRepTier: ReputationTier;
  nextRepTier: ReputationTier | null;
  repProgressPercent: number;

  // Snowstorm Event
  isStormActive: boolean;
  stormTimerRemaining: number;
  stormTotalDuration: number;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;

  // Systems
  public snowGrid: SnowGrid;
  public townBuilder: TownBuilder;
  public particles: ParticleSystem;

  // Lights
  private sunLight!: THREE.DirectionalLight;
  private fogRef!: THREE.FogExp2;

  // Vehicle Entity
  private plowGroup!: THREE.Group;
  private wheels: THREE.Mesh[] = [];
  private bladeMeshGroup!: THREE.Group;
  private beaconMesh!: THREE.Mesh;
  private spreaderMesh!: THREE.Group;
  private headlights: THREE.SpotLight[] = [];

  // Physics & Kinematics
  private posX = 0;
  private posZ = 16;
  private velocity = 0;
  private heading = Math.PI;
  private steerAngle = 0;
  private maxSteer = Math.PI / 6;
  private cameraOffset = new THREE.Vector3(20, 24, 20);
  private cameraShake = 0;

  // Gameplay Run State
  public upgrades: UpgradesState;
  public customization: CustomizationState;
  public score = 0;
  public coins = 0;
  public reputationXP = 0;
  public streakCount = 0;
  public comboTimer = 0;
  private readonly comboMaxTime = 2.4;
  private lastComboTierIndex = 0;

  public boostGauge = 1.0;
  public isBoosting = false;
  private isPaused = false;
  private isVictory = false;

  // Snowstorm Event System
  public isStormActive = false;
  public stormTimer = 0;
  public readonly stormDuration = 38.0;
  private timeUntilNextStorm = 45.0; // Automatically triggers periodic snowstorms

  // Colliders
  private obstacleColliders: { x: number; z: number; radius: number }[] = [];

  // Inputs
  private keysHeld = {
    forward: false,
    reverse: false,
    left: false,
    right: false,
    boost: false,
  };

  private onHUDUpdate: ((state: GameHUDState) => void) | null = null;
  private onStormNotification: ((type: 'start' | 'end') => void) | null = null;
  private hudThrottleTimer = 0;

  constructor(
    container: HTMLElement,
    initialUpgrades: UpgradesState,
    initialCustom: CustomizationState = INITIAL_CUSTOMIZATION,
    initialCoins = 0,
    initialRepXP = 0
  ) {
    this.container = container;
    this.upgrades = { ...initialUpgrades };
    this.customization = { ...initialCustom };
    this.coins = initialCoins;
    this.reputationXP = initialRepXP;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb8d0e8);
    this.fogRef = new THREE.FogExp2(0xb8d0e8, 0.012);
    this.scene.fog = this.fogRef;

    this.clock = new THREE.Clock();

    const aspect = container.clientWidth / container.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.5, 300);
    this.camera.position.set(22, 26, 22);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({ antialias: !isHeadless, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.snowGrid = new SnowGrid();
    this.scene.add(this.snowGrid.createMesh());

    this.townBuilder = new TownBuilder();
    this.particles = new ParticleSystem(this.scene);

    this.setupLighting();
    this.buildVillageWorld();
    this.spawnPlow();
    this.bindInputs();

    window.addEventListener('resize', this.onResize);
  }

  private setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x64748b, 0.9);
    hemiLight.position.set(0, 40, 0);
    this.scene.add(hemiLight);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.sunLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    this.sunLight.position.set(35, 45, 25);
    this.sunLight.castShadow = !isHeadless;
    if (this.sunLight.castShadow) {
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 1;
      this.sunLight.shadow.camera.far = 120;
      const d = 42;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.0004;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    const groundGeo = new THREE.PlaneGeometry(240, 240);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private buildVillageWorld() {
    this.obstacleColliders = [];

    const townCenter = this.townBuilder.buildTownSquareCenter();
    townCenter.position.set(0, 0, 0);
    this.scene.add(townCenter);
    this.obstacleColliders.push({ x: 0, z: 0, radius: 4.5 });

    const houseConfigs = [
      { x: -10, z: 12, rot: Math.PI / 2 },
      { x: 10, z: 12, rot: -Math.PI / 2 },
      { x: -10, z: -12, rot: Math.PI / 2 },
      { x: 10, z: -12, rot: -Math.PI / 2 },
      { x: -24, z: 8, rot: 0 },
      { x: -24, z: -8, rot: Math.PI },
      { x: 24, z: 8, rot: 0 },
      { x: 24, z: -8, rot: Math.PI },
      { x: 18, z: 22, rot: -Math.PI / 4 },
      { x: -18, z: 22, rot: Math.PI / 4 },
      { x: -18, z: -22, rot: (3 * Math.PI) / 4 },
    ];

    houseConfigs.forEach((cfg) => {
      const house = this.townBuilder.buildCozyHouse(5.2, 5.8, 3.2);
      house.position.set(cfg.x, 0, cfg.z);
      house.rotation.y = cfg.rot;
      this.scene.add(house);
      this.obstacleColliders.push({ x: cfg.x, z: cfg.z, radius: 3.4 });
    });

    const treePositions = [
      { x: -14, z: 16 }, { x: -16, z: 14 }, { x: -15, z: 18 },
      { x: 14, z: 16 }, { x: 16, z: 14 },
      { x: -14, z: -16 }, { x: -16, z: -14 },
      { x: 14, z: -16 }, { x: 16, z: -14 },
      { x: -35, z: 0 }, { x: -35, z: 10 }, { x: -35, z: -10 },
      { x: 35, z: 0 }, { x: 35, z: 10 }, { x: 35, z: -10 },
      { x: 0, z: 35 }, { x: 12, z: 35 }, { x: -12, z: 35 },
      { x: 0, z: -35 }, { x: 12, z: -35 }, { x: -12, z: -35 },
    ];

    treePositions.forEach((pos, idx) => {
      const scale = 0.85 + ((idx % 4) * 0.15);
      const tree = this.townBuilder.buildPineTree(scale);
      tree.position.set(pos.x, 0, pos.z);
      this.scene.add(tree);
      this.obstacleColliders.push({ x: pos.x, z: pos.z, radius: 1.2 * scale });
    });

    const snowmanPositions = [
      { x: -7, z: 9 },
      { x: 7, z: 9 },
      { x: -21, z: 6 },
      { x: 5, z: -6 },
    ];
    snowmanPositions.forEach((pos) => {
      const snowman = this.townBuilder.buildSnowman();
      snowman.position.set(pos.x, 0, pos.z);
      this.scene.add(snowman);
    });

    const lampPositions = [
      { x: -5, z: 8 }, { x: 5, z: 8 },
      { x: -5, z: -8 }, { x: 5, z: -8 },
      { x: -16, z: 4.8 }, { x: 16, z: 4.8 },
      { x: -16, z: -4.8 }, { x: 16, z: -4.8 },
    ];
    lampPositions.forEach((pos) => {
      const lp = this.townBuilder.buildLamppost();
      lp.group.position.set(pos.x, 0, pos.z);
      this.scene.add(lp.group);
      this.obstacleColliders.push({ x: pos.x, z: pos.z, radius: 0.5 });
    });
  }

  public spawnPlow() {
    if (this.plowGroup) {
      this.scene.remove(this.plowGroup);
    }

    const { group, wheels, bladeMesh, beaconMesh, headlights, spreaderMesh } = this.townBuilder.buildPlowVehicle(
      this.upgrades,
      this.customization
    );
    this.plowGroup = group;
    this.wheels = wheels;
    this.bladeMeshGroup = bladeMesh;
    this.beaconMesh = beaconMesh;
    this.headlights = headlights;
    this.spreaderMesh = spreaderMesh;

    this.plowGroup.position.set(this.posX, 0, this.posZ);
    this.plowGroup.rotation.y = this.heading;
    this.scene.add(this.plowGroup);
  }

  public setCustomization(newCustom: Partial<CustomizationState>) {
    this.customization = { ...this.customization, ...newCustom };
    this.spawnPlow();
  }

  public applyUpgrade(category: keyof UpgradesState, newLevel: number) {
    this.upgrades[category] = newLevel;
    this.spawnPlow();
    sound.playUpgradeDing();
  }

  public honk() {
    sound.playHorn(this.customization.hornSound);
  }

  /**
   * Snowstorm Event: Trigger a sudden whiteout blizzard
   */
  public triggerSnowstormEvent() {
    if (this.isStormActive) return;
    this.isStormActive = true;
    this.stormTimer = this.stormDuration;
    sound.playBlizzardWarning();
    sound.setBlizzardWind(true);
    if (this.onStormNotification) this.onStormNotification('start');
  }

  public endSnowstormEvent() {
    if (!this.isStormActive) return;
    this.isStormActive = false;
    sound.setBlizzardWind(false);
    sound.playVictoryFanfare();
    if (this.onStormNotification) this.onStormNotification('end');
  }

  public setHUDCallback(cb: (state: GameHUDState) => void) {
    this.onHUDUpdate = cb;
  }

  public setStormNotificationCallback(cb: (type: 'start' | 'end') => void) {
    this.onStormNotification = cb;
  }

  private bindInputs() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    sound.ensureRunning();
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keysHeld.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keysHeld.reverse = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keysHeld.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keysHeld.right = true;
        break;
      case 'Space':
        if (!this.keysHeld.boost && this.boostGauge > 0.15) {
          this.keysHeld.boost = true;
          this.isBoosting = true;
          sound.playBoost();
        }
        e.preventDefault();
        break;
      case 'KeyH':
        this.honk();
        break;
      case 'KeyR':
        this.resetPlowPosition();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keysHeld.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keysHeld.reverse = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keysHeld.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keysHeld.right = false;
        break;
      case 'Space':
        this.keysHeld.boost = false;
        this.isBoosting = false;
        break;
    }
  };

  private onBlur = () => {
    this.keysHeld.forward = false;
    this.keysHeld.reverse = false;
    this.keysHeld.left = false;
    this.keysHeld.right = false;
    this.keysHeld.boost = false;
    this.isBoosting = false;
  };

  public resetPlowPosition() {
    this.posX = 0;
    this.posZ = 16;
    this.heading = Math.PI;
    this.velocity = 0;
    this.steerAngle = 0;
    this.plowGroup.position.set(this.posX, 0, this.posZ);
    this.plowGroup.rotation.y = this.heading;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      sound.stopEngine();
    } else {
      sound.startEngine();
    }
  }

  public start() {
    this.isPaused = false;
    this.clock.start();
    sound.startEngine();
    this.tick();
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sound.stopEngine();
  }

  public dispose() {
    this.stop();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private tick = () => {
    this.animFrameId = requestAnimationFrame(this.tick);

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    if (this.isPaused) return;

    this.updateStormState(dt);
    this.updatePhysics(dt);
    this.updateSnowInteraction(dt);
    this.updateParticlesAndVisuals(dt);
    this.updateCamera(dt);
    this.updateHUDThrottle(dt);

    this.renderer.render(this.scene, this.camera);
  };

  private updateStormState(dt: number) {
    if (this.isStormActive) {
      this.stormTimer -= dt;
      // Increased atmospheric fog density (whiteout conditions)
      this.fogRef.density = THREE.MathUtils.damp(this.fogRef.density, 0.038, 2.0, dt);
      this.sunLight.intensity = THREE.MathUtils.damp(this.sunLight.intensity, 0.7, 2.0, dt);

      if (this.stormTimer <= 0) {
        this.endSnowstormEvent();
      }
    } else {
      // Normal clear conditions
      this.fogRef.density = THREE.MathUtils.damp(this.fogRef.density, 0.012, 1.5, dt);
      this.sunLight.intensity = THREE.MathUtils.damp(this.sunLight.intensity, 1.8, 1.5, dt);

      this.timeUntilNextStorm -= dt;
      if (this.timeUntilNextStorm <= 0) {
        this.timeUntilNextStorm = 75.0; // Next storm in 75 seconds
        this.triggerSnowstormEvent();
      }
    }
  }

  private updatePhysics(dt: number) {
    const engineTier = UPGRADE_CATALOG.engineLevel.find((t) => t.level === this.upgrades.engineLevel) || UPGRADE_CATALOG.engineLevel[0];
    let maxForwardSpeed = engineTier.value;
    const maxReverseSpeed = -4.0;
    const accel = 9.0;
    const friction = 5.0;

    if (this.isBoosting && this.boostGauge > 0) {
      maxForwardSpeed *= 1.45;
      this.boostGauge = Math.max(0, this.boostGauge - dt * 0.35);
      if (this.boostGauge <= 0) {
        this.isBoosting = false;
      }
    } else {
      this.boostGauge = Math.min(1.0, this.boostGauge + dt * 0.12);
    }

    if (this.keysHeld.forward) {
      this.velocity = Math.min(maxForwardSpeed, this.velocity + accel * dt * (this.isBoosting ? 1.6 : 1.0));
    } else if (this.keysHeld.reverse) {
      this.velocity = Math.max(maxReverseSpeed, this.velocity - accel * 0.8 * dt);
    } else {
      if (this.velocity > 0) {
        this.velocity = Math.max(0, this.velocity - friction * dt);
      } else if (this.velocity < 0) {
        this.velocity = Math.min(0, this.velocity + friction * dt);
      }
    }

    const steerSpeed = 3.5;
    if (this.keysHeld.left) {
      this.steerAngle = Math.min(this.maxSteer, this.steerAngle + steerSpeed * dt);
    } else if (this.keysHeld.right) {
      this.steerAngle = Math.max(-this.maxSteer, this.steerAngle - steerSpeed * dt);
    } else {
      this.steerAngle = THREE.MathUtils.damp(this.steerAngle, 0, 8.0, dt);
    }

    if (this.wheels.length >= 2) {
      this.wheels[0].rotation.y = this.steerAngle;
      this.wheels[1].rotation.y = this.steerAngle;
    }
    const wheelRotDelta = (this.velocity / 0.42) * dt;
    this.wheels.forEach((w) => {
      w.rotation.x += wheelRotDelta;
    });

    if (Math.abs(this.velocity) > 0.1) {
      const turnRate = (this.velocity / 2.8) * Math.sin(this.steerAngle);
      this.heading += turnRate * dt;
    }

    const nextX = this.posX + Math.sin(this.heading) * this.velocity * dt;
    const nextZ = this.posZ + Math.cos(this.heading) * this.velocity * dt;

    let collided = false;
    const plowRadius = 1.35;
    for (const obs of this.obstacleColliders) {
      const dist = Math.hypot(nextX - obs.x, nextZ - obs.z);
      if (dist < plowRadius + obs.radius) {
        collided = true;
        break;
      }
    }

    const mapLimit = 37.0;
    if (Math.abs(nextX) > mapLimit || Math.abs(nextZ) > mapLimit) {
      collided = true;
    }

    if (!collided) {
      this.posX = nextX;
      this.posZ = nextZ;
    } else {
      if (Math.abs(this.velocity) > 2.0) {
        sound.playThud();
        this.cameraShake = Math.min(0.6, Math.abs(this.velocity) * 0.08);
      }
      this.velocity = -this.velocity * 0.35;
    }

    this.plowGroup.position.set(this.posX, 0, this.posZ);
    this.plowGroup.rotation.y = this.heading;

    if (this.beaconMesh) {
      const flash = Math.sin(this.clock.getElapsedTime() * 12) > 0;
      (this.beaconMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = flash ? 2.5 : 0.4;
    }

    if (this.spreaderMesh && this.upgrades.saltLevel > 0) {
      this.spreaderMesh.children[1].rotation.y += dt * 10;
    }

    const speedRatio = Math.abs(this.velocity) / maxForwardSpeed;
    const comboTier = calculateComboMultiplier(this.streakCount).tierIndex;
    sound.updateEngine(speedRatio, Math.abs(this.velocity) > 0.5, comboTier);
  }

  private updateSnowInteraction(dt: number) {
    if (this.velocity <= 0.2) {
      if (this.streakCount > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.streakCount = 0;
          this.lastComboTierIndex = 0;
        }
      }
      return;
    }

    const bladeOffset = 1.8;
    const bladeX = this.posX + Math.sin(this.heading) * bladeOffset;
    const bladeZ = this.posZ + Math.cos(this.heading) * bladeOffset;

    const bladeTier = UPGRADE_CATALOG.bladeLevel.find((t) => t.level === this.upgrades.bladeLevel) || UPGRADE_CATALOG.bladeLevel[0];
    const bladeWidth = bladeTier.value;

    const saltTier = UPGRADE_CATALOG.saltLevel.find((t) => t.level === this.upgrades.saltLevel) || UPGRADE_CATALOG.saltLevel[0];
    const saltRadius = saltTier.value;

    const { newlyCleared, snowParticlesOrigin } = this.snowGrid.plowAt(
      bladeX,
      bladeZ,
      this.heading,
      bladeWidth,
      saltRadius
    );

    if (newlyCleared > 0) {
      this.streakCount += newlyCleared;
      this.comboTimer = this.comboMaxTime;

      const combo = calculateComboMultiplier(this.streakCount);

      if (combo.tierIndex > this.lastComboTierIndex) {
        sound.playComboChime(combo.tierIndex);
        this.lastComboTierIndex = combo.tierIndex;
      }

      // 2x rewards during active snowstorm!
      const reward = calculatePlowReward(
        newlyCleared,
        combo.multiplier,
        this.upgrades.bladeLevel,
        this.isStormActive
      );
      this.score += reward.score;
      this.coins += reward.coins;
      this.reputationXP += reward.repXP;

      snowParticlesOrigin.forEach((origin) => {
        this.particles.emitPlowSpray(
          origin.x,
          0.3,
          origin.z,
          this.heading,
          this.velocity,
          3,
          this.isBoosting
        );
      });

      const percent = this.snowGrid.getDistrictPlowedPercent(0);
      if (percent >= 85 && !this.isVictory) {
        this.isVictory = true;
        sound.playVictoryFanfare();
      }
    } else {
      if (this.streakCount > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.streakCount = 0;
          this.lastComboTierIndex = 0;
        }
      }
    }
  }

  private updateParticlesAndVisuals(dt: number) {
    this.particles.update(dt, this.plowGroup.position, this.isStormActive);
  }

  private updateCamera(dt: number) {
    const lookAheadDist = 2.5;
    const targetX = this.posX + Math.sin(this.heading) * lookAheadDist;
    const targetZ = this.posZ + Math.cos(this.heading) * lookAheadDist;

    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShake > 0.01) {
      shakeX = (Math.random() - 0.5) * this.cameraShake;
      shakeY = (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 10.0, dt);
    }

    const desiredCamX = targetX + this.cameraOffset.x + shakeX;
    const desiredCamY = this.cameraOffset.y + shakeY;
    const desiredCamZ = targetZ + this.cameraOffset.z;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, desiredCamX, 4.0, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, desiredCamY, 4.0, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, desiredCamZ, 4.0, dt);

    this.camera.lookAt(targetX, 0.5, targetZ);
  }

  private updateHUDThrottle(dt: number) {
    this.hudThrottleTimer += dt;
    if (this.hudThrottleTimer >= 0.06 && this.onHUDUpdate) {
      this.hudThrottleTimer = 0;
      const combo = calculateComboMultiplier(this.streakCount);
      const engineTier = UPGRADE_CATALOG.engineLevel.find((t) => t.level === this.upgrades.engineLevel) || UPGRADE_CATALOG.engineLevel[0];
      const percent = this.snowGrid.getDistrictPlowedPercent(0);
      const rep = getReputationInfo(this.reputationXP);

      this.onHUDUpdate({
        speed: Math.round(Math.abs(this.velocity) * 3.6),
        maxSpeed: Math.round(engineTier.value * 3.6),
        score: this.score,
        coins: this.coins,
        streakCount: this.streakCount,
        comboMultiplier: combo.multiplier,
        comboTier: combo.tier,
        comboTierIndex: combo.tierIndex,
        comboTimerProgress: this.streakCount > 0 ? Math.max(0, this.comboTimer / this.comboMaxTime) : 0,
        clearedCount: this.snowGrid.clearedCount,
        totalPlowable: this.snowGrid.totalPlowableTiles,
        percentCleared: percent,
        districtIndex: 0,
        districtName: TOWN_DISTRICTS[0].name,
        boostGauge: this.boostGauge,
        isBoosting: this.isBoosting,
        isPaused: this.isPaused,
        isVictory: this.isVictory,

        reputationXP: this.reputationXP,
        currentRepTier: rep.currentTier,
        nextRepTier: rep.nextTier,
        repProgressPercent: rep.progressPercent,

        isStormActive: this.isStormActive,
        stormTimerRemaining: Math.ceil(this.stormTimer),
        stormTotalDuration: this.stormDuration,
      });
    }
  }
}
