import * as THREE from 'three';
import { UpgradesState, UPGRADE_CATALOG, CustomizationState } from './rules.ts';

export const VEHICLE_COLORS: Record<string, { body: number; trim: number; name: string }> = {
  'classic-yellow': { body: 0xf59e0b, trim: 0x1f2937, name: 'Highland Gold' },
  'blizzard-cyan': { body: 0x06b6d4, trim: 0x0f172a, name: 'Glacier Blue' },
  'cherry-red': { body: 0xef4444, trim: 0x18181b, name: 'Alpine Red' },
  'pine-green': { body: 0x10b981, trim: 0x064e3b, name: 'Nordic Pine' },
  'midnight-black': { body: 0x27272a, trim: 0xf59e0b, name: 'Night Sweeper' },
  'aurora-purple': { body: 0x8b5cf6, trim: 0x38bdf8, name: 'Borealis Violet' },
};

export class TownBuilder {
  private materials: { [key: string]: THREE.Material } = {};

  constructor() {
    this.initSharedMaterials();
  }

  private initSharedMaterials() {
    this.materials.wood = new THREE.MeshStandardMaterial({
      color: 0x6d4c41,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.materials.darkWood = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.9,
    });
    this.materials.snow = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.8,
      metalness: 0.02,
    });
    this.materials.roofSnow = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75,
      metalness: 0.0,
    });
    this.materials.pineNeedles = new THREE.MeshStandardMaterial({
      color: 0x1b4332,
      roughness: 0.8,
      metalness: 0.1,
    });
    this.materials.pineTrunk = new THREE.MeshStandardMaterial({
      color: 0x4a3525,
      roughness: 0.9,
    });
    this.materials.warmGlow = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });
    this.materials.iron = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.4,
      metalness: 0.8,
    });
    this.materials.steel = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.85,
    });
    this.materials.chrome = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.08,
      metalness: 0.98,
    });
    this.materials.rubber = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.95,
      metalness: 0.05,
    });
    this.materials.glass = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    this.materials.brick = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.9,
    });
    this.materials.stone = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.9,
    });
  }

  /**
   * Builds the 3–12 part composite hero Snow Plow vehicle with custom paint, decals, blade designs & decor!
   */
  public buildPlowVehicle(
    upgrades: UpgradesState,
    custom: CustomizationState
  ): {
    group: THREE.Group;
    wheels: THREE.Mesh[];
    bladeMesh: THREE.Group;
    beaconMesh: THREE.Mesh;
    headlights: THREE.SpotLight[];
    spreaderMesh: THREE.Group;
  } {
    const root = new THREE.Group();
    root.name = 'HeroSnowPlow';

    const colorConfig = VEHICLE_COLORS[custom.paintColor] || VEHICLE_COLORS['classic-yellow'];

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: colorConfig.body,
      metalness: 0.45,
      roughness: 0.3,
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: colorConfig.trim,
      metalness: 0.5,
      roughness: 0.4,
    });

    // 1. Heavy Undercarriage / Chassis
    const chassisGeo = new THREE.BoxGeometry(1.6, 0.45, 2.7);
    const chassis = new THREE.Mesh(chassisGeo, trimMaterial);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    root.add(chassis);

    // 2. Cabin Main Body
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.85, 1.3);
    const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    root.add(cabin);

    // 3. Engine Hood & Grille
    const hoodGeo = new THREE.BoxGeometry(1.3, 0.55, 1.1);
    const hood = new THREE.Mesh(hoodGeo, bodyMaterial);
    hood.position.set(0, 0.95, 0.85);
    hood.castShadow = true;
    root.add(hood);

    const grilleGeo = new THREE.BoxGeometry(1.0, 0.4, 0.08);
    const grille = new THREE.Mesh(grilleGeo, this.materials.iron);
    grille.position.set(0, 0.95, 1.42);
    root.add(grille);

    // DECAL: Custom Visual Graphics
    if (custom.decal === 'racing-stripes') {
      const stripeGeo = new THREE.BoxGeometry(0.18, 0.02, 1.08);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stripeL = new THREE.Mesh(stripeGeo, stripeMat);
      stripeL.position.set(-0.25, 1.23, 0.85);
      const stripeR = new THREE.Mesh(stripeGeo, stripeMat);
      stripeR.position.set(0.25, 1.23, 0.85);
      root.add(stripeL);
      root.add(stripeR);
    } else if (custom.decal === 'snowflake') {
      const emblemGeo = new THREE.OctahedronGeometry(0.18);
      const emblemMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.1, metalness: 0.9 });
      const emblemL = new THREE.Mesh(emblemGeo, emblemMat);
      emblemL.position.set(-0.72, 1.15, -0.2);
      const emblemR = new THREE.Mesh(emblemGeo, emblemMat);
      emblemR.position.set(0.72, 1.15, -0.2);
      root.add(emblemL);
      root.add(emblemR);
    } else if (custom.decal === 'flame-frost') {
      const flameGeo = new THREE.ConeGeometry(0.12, 0.5, 5);
      flameGeo.rotateX(Math.PI / 2);
      const flameMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });
      const flameL = new THREE.Mesh(flameGeo, flameMat);
      flameL.position.set(-0.55, 1.0, 0.95);
      const flameR = new THREE.Mesh(flameGeo, flameMat);
      flameR.position.set(0.55, 1.0, 0.95);
      root.add(flameL);
      root.add(flameR);
    } else if (custom.decal === 'crown-gold') {
      const crownGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.14, 5);
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.95 });
      const crown = new THREE.Mesh(crownGeo, goldMat);
      crown.position.set(0, 1.26, 0.85);
      root.add(crown);
    }

    // 4. Windows
    const windshieldGeo = new THREE.BoxGeometry(1.25, 0.5, 0.05);
    const windshield = new THREE.Mesh(windshieldGeo, this.materials.glass);
    windshield.position.set(0, 1.25, 0.46);
    root.add(windshield);

    const sideWindowGeo = new THREE.BoxGeometry(0.05, 0.42, 0.9);
    const leftWindow = new THREE.Mesh(sideWindowGeo, this.materials.glass);
    leftWindow.position.set(-0.71, 1.25, -0.2);
    const rightWindow = new THREE.Mesh(sideWindowGeo, this.materials.glass);
    rightWindow.position.set(0.71, 1.25, -0.2);
    root.add(leftWindow);
    root.add(rightWindow);

    // 5. Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.37, 12);
    rimGeo.rotateZ(Math.PI / 2);

    const wheels: THREE.Mesh[] = [];
    const wheelPositions = [
      { x: -0.92, y: 0.42, z: 0.85 },
      { x: 0.92, y: 0.42, z: 0.85 },
      { x: -0.92, y: 0.42, z: -0.85 },
      { x: 0.92, y: 0.42, z: -0.85 },
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, this.materials.rubber);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;

      const rim = new THREE.Mesh(rimGeo, this.materials.steel);
      wheel.add(rim);

      root.add(wheel);
      wheels.push(wheel);
    });

    // 6. Custom Plow Blade Designs
    const bladeGroup = new THREE.Group();
    bladeGroup.name = 'PlowBlade';

    const bladeTier = UPGRADE_CATALOG.bladeLevel.find((t) => t.level === upgrades.bladeLevel) || UPGRADE_CATALOG.bladeLevel[0];
    const bladeWidth = bladeTier.value;

    const bladeMat = custom.bladeStyle === 'chrome' ? this.materials.chrome : this.materials.steel;

    if (custom.bladeStyle === 'v-plow') {
      // Nordic Wedge V-Plow
      const halfW = bladeWidth / 2;
      const leftWingGeo = new THREE.BoxGeometry(halfW, 0.65, 0.12);
      const leftWing = new THREE.Mesh(leftWingGeo, bladeMat);
      leftWing.position.set(-halfW / 2 + 0.1, 0.35, -0.2);
      leftWing.rotation.y = -Math.PI / 6;

      const rightWingGeo = new THREE.BoxGeometry(halfW, 0.65, 0.12);
      const rightWing = new THREE.Mesh(rightWingGeo, bladeMat);
      rightWing.position.set(halfW / 2 - 0.1, 0.35, -0.2);
      rightWing.rotation.y = Math.PI / 6;

      bladeGroup.add(leftWing);
      bladeGroup.add(rightWing);
    } else {
      // Flat or Jagged blade
      const bladeGeo = new THREE.BoxGeometry(bladeWidth, 0.65, 0.12);
      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      bladeMesh.position.set(0, 0.35, 0);
      bladeMesh.castShadow = true;
      bladeGroup.add(bladeMesh);

      if (custom.bladeStyle === 'ice-cutter') {
        // Serrated teeth on bottom edge
        const teethCount = Math.floor(bladeWidth * 3);
        const toothGeo = new THREE.ConeGeometry(0.06, 0.15, 4);
        toothGeo.rotateX(Math.PI);
        const toothMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
        for (let t = 0; t < teethCount; t++) {
          const tooth = new THREE.Mesh(toothGeo, toothMat);
          const tx = -bladeWidth / 2 + (t + 0.5) * (bladeWidth / teethCount);
          tooth.position.set(tx, 0.05, 0.02);
          bladeGroup.add(tooth);
        }
      }
    }

    // Hydraulic Pistons
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8);
    armGeo.rotateX(Math.PI / 3);
    const leftArm = new THREE.Mesh(armGeo, this.materials.iron);
    leftArm.position.set(-0.5, 0.35, -0.3);
    const rightArm = new THREE.Mesh(armGeo, this.materials.iron);
    rightArm.position.set(0.5, 0.35, -0.3);
    bladeGroup.add(leftArm);
    bladeGroup.add(rightArm);

    bladeGroup.position.set(0, 0, 1.75);
    root.add(bladeGroup);

    // 7. Rear Salt Spreader Hopper
    const spreaderGroup = new THREE.Group();
    spreaderGroup.name = 'SaltSpreader';
    const hopperGeo = new THREE.CylinderGeometry(0.45, 0.25, 0.65, 6);
    const hopper = new THREE.Mesh(hopperGeo, upgrades.saltLevel > 0 ? bodyMaterial : this.materials.iron);
    hopper.position.set(0, 0.85, -1.35);
    spreaderGroup.add(hopper);

    const spinnerGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 8);
    const spinner = new THREE.Mesh(spinnerGeo, this.materials.steel);
    spinner.position.set(0, 0.45, -1.35);
    spreaderGroup.add(spinner);
    root.add(spreaderGroup);

    // 8. Flashing Amber Beacon
    const beaconGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.18, 8);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 1.68, -0.2);
    root.add(beaconMesh);

    // 9. ROOF & DECORATIVE ACCESSORIES
    if (custom.roofDecor === 'fairy-lights') {
      // Warm twinkling holiday string lights wrapping the cabin
      const lightColors = [0xf43f5e, 0x10b981, 0xfbbf24, 0x38bdf8];
      for (let i = 0; i < 8; i++) {
        const bulbGeo = new THREE.SphereGeometry(0.06, 6, 6);
        const bulbColor = lightColors[i % lightColors.length];
        const bulbMat = new THREE.MeshStandardMaterial({
          color: bulbColor,
          emissive: bulbColor,
          emissiveIntensity: 2.0,
        });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        const angle = (i / 8) * Math.PI * 2;
        bulb.position.set(Math.cos(angle) * 0.72, 1.6, -0.2 + Math.sin(angle) * 0.65);
        root.add(bulb);
      }
    } else if (custom.roofDecor === 'holiday-wreath') {
      // Festive pine wreath with red bow on the front grille
      const wreathGeo = new THREE.TorusGeometry(0.24, 0.08, 8, 12);
      const wreath = new THREE.Mesh(wreathGeo, this.materials.pineNeedles);
      wreath.position.set(0, 0.95, 1.46);
      const bowGeo = new THREE.SphereGeometry(0.07, 6, 6);
      const bowMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
      const bow = new THREE.Mesh(bowGeo, bowMat);
      bow.position.set(0, 1.15, 1.48);
      root.add(wreath);
      root.add(bow);
    } else if (custom.roofDecor === 'antlers') {
      // Reindeer Antlers on roof
      const antlerGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 6);
      const antlerMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      const antlerL = new THREE.Mesh(antlerGeo, antlerMat);
      antlerL.position.set(-0.55, 1.85, -0.2);
      antlerL.rotation.z = Math.PI / 4;
      const antlerR = new THREE.Mesh(antlerGeo, antlerMat);
      antlerR.position.set(0.55, 1.85, -0.2);
      antlerR.rotation.z = -Math.PI / 4;
      root.add(antlerL);
      root.add(antlerR);
    }

    // 10. Headlights
    const headlights: THREE.SpotLight[] = [];
    const lightPositions = [-0.48, 0.48];
    lightPositions.forEach((lx) => {
      const housingGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.12, 12);
      housingGeo.rotateX(Math.PI / 2);
      const housing = new THREE.Mesh(housingGeo, this.materials.steel);
      housing.position.set(lx, 0.9, 1.42);
      root.add(housing);

      const lensGeo = new THREE.CircleGeometry(0.09, 12);
      const lens = new THREE.Mesh(lensGeo, this.materials.warmGlow);
      lens.position.set(lx, 0.9, 1.48);
      root.add(lens);

      const spot = new THREE.SpotLight(0xfff1dc, 2.8, 18, Math.PI / 5, 0.45, 1.2);
      spot.position.set(lx, 0.9, 1.5);
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(lx, 0.1, 8);
      root.add(spotTarget);
      spot.target = spotTarget;
      root.add(spot);
      headlights.push(spot);
    });

    return {
      group: root,
      wheels,
      bladeMesh: bladeGroup,
      beaconMesh,
      headlights,
      spreaderMesh: spreaderGroup,
    };
  }

  public buildCozyHouse(width = 5.5, depth = 6.0, storyHeight = 3.0): THREE.Group {
    const house = new THREE.Group();

    const foundationGeo = new THREE.BoxGeometry(width + 0.4, 0.5, depth + 0.4);
    const foundation = new THREE.Mesh(foundationGeo, this.materials.stone);
    foundation.position.y = 0.25;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    house.add(foundation);

    const wallGeo = new THREE.BoxGeometry(width, storyHeight, depth);
    const walls = new THREE.Mesh(wallGeo, this.materials.wood);
    walls.position.y = 0.5 + storyHeight / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    const roofSlopeGeo = new THREE.ConeGeometry((width + 1.2) * 0.72, 2.6, 4);
    roofSlopeGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofSlopeGeo, this.materials.roofSnow);
    roof.position.y = 0.5 + storyHeight + 1.3;
    roof.scale.set(1.1, 1, (depth + 1.2) / (width + 1.2));
    roof.castShadow = true;
    house.add(roof);

    const chimneyGeo = new THREE.BoxGeometry(0.7, 2.2, 0.7);
    const chimney = new THREE.Mesh(chimneyGeo, this.materials.brick);
    chimney.position.set(width * 0.25, 0.5 + storyHeight + 1.6, depth * 0.2);
    chimney.castShadow = true;
    house.add(chimney);

    const snowCapGeo = new THREE.BoxGeometry(0.85, 0.2, 0.85);
    const snowCap = new THREE.Mesh(snowCapGeo, this.materials.snow);
    snowCap.position.set(width * 0.25, 0.5 + storyHeight + 2.75, depth * 0.2);
    house.add(snowCap);

    const windowGeo = new THREE.PlaneGeometry(0.9, 1.1);
    const win1 = new THREE.Mesh(windowGeo, this.materials.warmGlow);
    win1.position.set(-width * 0.25, 1.8, depth / 2 + 0.02);
    const win2 = new THREE.Mesh(windowGeo, this.materials.warmGlow);
    win2.position.set(width * 0.25, 1.8, depth / 2 + 0.02);
    house.add(win1);
    house.add(win2);

    const doorGeo = new THREE.PlaneGeometry(0.9, 1.8);
    const door = new THREE.Mesh(doorGeo, this.materials.darkWood);
    door.position.set(0, 1.4, depth / 2 + 0.02);
    house.add(door);

    const porchGeo = new THREE.BoxGeometry(1.6, 0.15, 1.2);
    const porch = new THREE.Mesh(porchGeo, this.materials.snow);
    porch.position.set(0, 2.4, depth / 2 + 0.6);
    porch.castShadow = true;
    house.add(porch);

    return house;
  }

  public buildPineTree(scale = 1.0): THREE.Group {
    const tree = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 1.8 * scale, 7);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.pineTrunk);
    trunk.position.y = 0.9 * scale;
    trunk.castShadow = true;
    tree.add(trunk);

    const tiers = [
      { r: 2.2, h: 2.4, y: 2.2 },
      { r: 1.7, h: 2.0, y: 3.5 },
      { r: 1.1, h: 1.7, y: 4.6 },
    ];

    tiers.forEach((t) => {
      const coneGeo = new THREE.ConeGeometry(t.r * scale, t.h * scale, 8);
      const cone = new THREE.Mesh(coneGeo, this.materials.pineNeedles);
      cone.position.y = t.y * scale;
      cone.castShadow = true;
      cone.receiveShadow = true;
      tree.add(cone);

      const snowCollarGeo = new THREE.ConeGeometry((t.r * 0.95) * scale, (t.h * 0.4) * scale, 8);
      const snowCollar = new THREE.Mesh(snowCollarGeo, this.materials.snow);
      snowCollar.position.y = (t.y + t.h * 0.22) * scale;
      snowCollar.castShadow = true;
      tree.add(snowCollar);
    });

    return tree;
  }

  public buildLamppost(): { group: THREE.Group; light: THREE.PointLight } {
    const group = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8);
    const base = new THREE.Mesh(baseGeo, this.materials.iron);
    base.position.y = 0.2;
    group.add(base);

    const postGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8);
    const post = new THREE.Mesh(postGeo, this.materials.iron);
    post.position.y = 1.8;
    post.castShadow = true;
    group.add(post);

    const lanternGeo = new THREE.CylinderGeometry(0.22, 0.14, 0.45, 6);
    const lantern = new THREE.Mesh(lanternGeo, this.materials.warmGlow);
    lantern.position.y = 3.4;
    group.add(lantern);

    const capGeo = new THREE.ConeGeometry(0.3, 0.2, 6);
    const cap = new THREE.Mesh(capGeo, this.materials.snow);
    cap.position.y = 3.7;
    group.add(cap);

    const light = new THREE.PointLight(0xfbbf24, 1.8, 12, 1.6);
    light.position.y = 3.4;
    group.add(light);

    return { group, light };
  }

  public buildSnowman(): THREE.Group {
    const snowman = new THREE.Group();

    const bottomGeo = new THREE.SphereGeometry(0.7, 12, 10);
    const bottom = new THREE.Mesh(bottomGeo, this.materials.snow);
    bottom.position.y = 0.65;
    bottom.castShadow = true;
    snowman.add(bottom);

    const midGeo = new THREE.SphereGeometry(0.5, 12, 10);
    const mid = new THREE.Mesh(midGeo, this.materials.snow);
    mid.position.y = 1.5;
    mid.castShadow = true;
    snowman.add(mid);

    const headGeo = new THREE.SphereGeometry(0.35, 12, 10);
    const head = new THREE.Mesh(headGeo, this.materials.snow);
    head.position.y = 2.15;
    head.castShadow = true;
    snowman.add(head);

    const noseGeo = new THREE.ConeGeometry(0.07, 0.35, 6);
    noseGeo.rotateX(Math.PI / 2);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.7 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 2.15, 0.45);
    snowman.add(nose);

    const brimGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.05, 10);
    const hatGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.38, 10);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const brim = new THREE.Mesh(brimGeo, hatMat);
    brim.position.y = 2.45;
    const crown = new THREE.Mesh(hatGeo, hatMat);
    crown.position.y = 2.65;
    snowman.add(brim);
    snowman.add(crown);

    return snowman;
  }

  public buildTownSquareCenter(): THREE.Group {
    const square = new THREE.Group();

    const daisGeo = new THREE.CylinderGeometry(5.2, 5.6, 0.4, 8);
    const dais = new THREE.Mesh(daisGeo, this.materials.stone);
    dais.position.y = 0.2;
    dais.receiveShadow = true;
    square.add(dais);

    const tree = this.buildPineTree(1.8);
    tree.position.y = 0.4;
    square.add(tree);

    const starGeo = new THREE.OctahedronGeometry(0.45);
    const star = new THREE.Mesh(starGeo, this.materials.warmGlow);
    star.position.set(0, 10.2, 0);
    square.add(star);

    const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
    angles.forEach((rad) => {
      const lp = this.buildLamppost();
      lp.group.position.set(Math.cos(rad) * 4.2, 0.4, Math.sin(rad) * 4.2);
      square.add(lp.group);
    });

    return square;
  }
}
