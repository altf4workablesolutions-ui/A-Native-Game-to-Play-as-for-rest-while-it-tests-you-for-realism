import * as THREE from 'three';

export interface SnowTile {
  x: number; // grid coordinate
  z: number;
  worldX: number;
  worldZ: number;
  isPlowable: boolean;
  cleared: boolean;
  depth: number; // 0 to 1
  districtIndex: number;
}

export class SnowGrid {
  public readonly gridSize: number = 64;
  public readonly tileSize: number = 1.25;
  public readonly originOffset: number;
  public tiles: SnowTile[] = [];
  public totalPlowableTiles: number = 0;
  public clearedCount: number = 0;

  // Instanced mesh for snow surface tiles
  public instancedMesh!: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private baseColor = new THREE.Color(0xf1f6fb);
  private plowedColor = new THREE.Color(0x353d47); // Dark plowed road with wet sheen
  private bankColor = new THREE.Color(0xffffff);

  constructor() {
    this.originOffset = (this.gridSize * this.tileSize) / 2;
    this.initGrid();
  }

  private initGrid() {
    this.tiles = [];
    this.totalPlowableTiles = 0;
    this.clearedCount = 0;

    for (let gz = 0; gz < this.gridSize; gz++) {
      for (let gx = 0; gx < this.gridSize; gx++) {
        const worldX = gx * this.tileSize - this.originOffset;
        const worldZ = gz * this.tileSize - this.originOffset;

        // Village Road Layout:
        // Main Street (Z near center: -6 to +6)
        const isMainStreet = Math.abs(worldZ) <= 4.5 && Math.abs(worldX) <= 34;
        // North-South Avenue (X near center: -4.5 to +4.5)
        const isNorthAvenue = Math.abs(worldX) <= 4.5 && Math.abs(worldZ) <= 34;
        // Pine Hollow Loop (circular road)
        const distFromCenter = Math.hypot(worldX, worldZ);
        const isLoopRoad = distFromCenter >= 18 && distFromCenter <= 23.5;
        // Town Square Plaza in center
        const isTownSquare = distFromCenter <= 11;
        // Residential cul-de-sacs / driveways
        const isDriveway1 = Math.abs(worldX - 18) <= 2.5 && worldZ >= 4 && worldZ <= 18;
        const isDriveway2 = Math.abs(worldX + 18) <= 2.5 && worldZ >= 4 && worldZ <= 18;
        const isDriveway3 = Math.abs(worldZ + 18) <= 2.5 && worldX >= -18 && worldX <= -4;

        const isPlowable = isMainStreet || isNorthAvenue || isLoopRoad || isTownSquare || isDriveway1 || isDriveway2 || isDriveway3;

        let districtIndex = 0;
        if (isTownSquare || isMainStreet) {
          districtIndex = 1; // Main Street & Plaza
        } else if (distFromCenter > 20) {
          districtIndex = 2; // Old Mill & Outer Trails
        } else {
          districtIndex = 0; // Pine Hollow
        }

        if (isPlowable) {
          this.totalPlowableTiles++;
        }

        this.tiles.push({
          x: gx,
          z: gz,
          worldX,
          worldZ,
          isPlowable,
          cleared: false,
          depth: isPlowable ? 1.0 : 0.8,
          districtIndex,
        });
      }
    }
  }

  public createMesh(): THREE.InstancedMesh {
    const tileGeo = new THREE.BoxGeometry(this.tileSize * 0.98, 0.22, this.tileSize * 0.98);
    // Bevel ground placement
    tileGeo.translate(0, 0.11, 0);

    const tileMat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.05,
      vertexColors: false,
    });

    this.instancedMesh = new THREE.InstancedMesh(tileGeo, tileMat, this.tiles.length);
    this.instancedMesh.castShadow = false;
    this.instancedMesh.receiveShadow = true;

    // Initialize instance matrices & colors
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      this.dummy.position.set(tile.worldX, 0, tile.worldZ);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(1, tile.isPlowable ? 1.0 : 0.6, 1);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.instancedMesh.setColorAt(i, tile.isPlowable ? this.baseColor : this.bankColor);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    return this.instancedMesh;
  }

  /**
   * Clears snow along plow blade footprint and returns number of newly plowed tiles
   */
  public plowAt(
    bladeX: number,
    bladeZ: number,
    bladeAngle: number,
    bladeWidth: number,
    saltRadius: number = 0
  ): { newlyCleared: number; snowParticlesOrigin: { x: number; z: number }[] } {
    let newlyCleared = 0;
    const snowParticlesOrigin: { x: number; z: number }[] = [];

    // Check tiles in bounding box around blade
    const searchRadius = (bladeWidth / 2) + 0.8;
    const minGx = Math.max(0, Math.floor((bladeX - searchRadius + this.originOffset) / this.tileSize));
    const maxGx = Math.min(this.gridSize - 1, Math.floor((bladeX + searchRadius + this.originOffset) / this.tileSize));
    const minGz = Math.max(0, Math.floor((bladeZ - searchRadius + this.originOffset) / this.tileSize));
    const maxGz = Math.min(this.gridSize - 1, Math.floor((bladeZ + searchRadius + this.originOffset) / this.tileSize));

    // Direction vector perpendicular to blade (to check blade sweep)
    const perpX = Math.cos(bladeAngle + Math.PI / 2);
    const perpZ = Math.sin(bladeAngle + Math.PI / 2);

    let matrixNeedsUpdate = false;
    let colorNeedsUpdate = false;

    for (let gz = minGz; gz <= maxGz; gz++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        const index = gz * this.gridSize + gx;
        const tile = this.tiles[index];

        if (!tile.isPlowable || tile.cleared) continue;

        const dx = tile.worldX - bladeX;
        const dz = tile.worldZ - bladeZ;
        const dist = Math.hypot(dx, dz);

        // Check if within blade swath width
        const projPerp = Math.abs(dx * perpX + dz * perpZ);
        if (projPerp <= bladeWidth / 2 && dist <= searchRadius) {
          tile.cleared = true;
          tile.depth = 0.05;
          newlyCleared++;
          this.clearedCount++;

          snowParticlesOrigin.push({ x: tile.worldX, z: tile.worldZ });

          // Visual update of instance
          this.dummy.position.set(tile.worldX, -0.08, tile.worldZ);
          this.dummy.scale.set(1, 0.12, 1);
          this.dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(index, this.dummy.matrix);
          this.instancedMesh.setColorAt(index, this.plowedColor);

          matrixNeedsUpdate = true;
          colorNeedsUpdate = true;

          // Apply salt spreader effect to neighbors if salt upgrade is unlocked
          if (saltRadius > 0) {
            const r = Math.round(saltRadius);
            for (let sz = Math.max(0, gz - r); sz <= Math.min(this.gridSize - 1, gz + r); sz++) {
              for (let sx = Math.max(0, gx - r); sx <= Math.min(this.gridSize - 1, gx + r); sx++) {
                const sIdx = sz * this.gridSize + sx;
                const sTile = this.tiles[sIdx];
                if (sTile.isPlowable && !sTile.cleared) {
                  sTile.cleared = true;
                  sTile.depth = 0.05;
                  newlyCleared++;
                  this.clearedCount++;

                  this.dummy.position.set(sTile.worldX, -0.08, sTile.worldZ);
                  this.dummy.scale.set(1, 0.12, 1);
                  this.dummy.updateMatrix();
                  this.instancedMesh.setMatrixAt(sIdx, this.dummy.matrix);
                  this.instancedMesh.setColorAt(sIdx, this.plowedColor);
                }
              }
            }
          }
        }
      }
    }

    if (matrixNeedsUpdate) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
    if (colorNeedsUpdate && this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    return { newlyCleared, snowParticlesOrigin };
  }

  public resetPlow() {
    this.clearedCount = 0;
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      tile.cleared = false;
      tile.depth = tile.isPlowable ? 1.0 : 0.8;

      this.dummy.position.set(tile.worldX, 0, tile.worldZ);
      this.dummy.scale.set(1, tile.isPlowable ? 1.0 : 0.6, 1);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.instancedMesh.setColorAt(i, tile.isPlowable ? this.baseColor : this.bankColor);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public getDistrictPlowedPercent(districtIndex: number): number {
    let total = 0;
    let cleared = 0;
    for (const tile of this.tiles) {
      if (tile.isPlowable && tile.districtIndex === districtIndex) {
        total++;
        if (tile.cleared) cleared++;
      }
    }
    return total > 0 ? Math.round((cleared / total) * 100) : 0;
  }
}
