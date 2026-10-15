import * as THREE from 'three';

interface SnowParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
}

export class ParticleSystem {
  // 1. Snow spray / roost particles from plow blade
  private sprayParticles: SnowParticle[] = [];
  private sprayMaxCount = 200;
  private sprayInstancedMesh!: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();

  // 2. Ambient falling snowflakes
  private ambientCount = 500;
  private ambientPoints!: THREE.Points;
  private ambientPositions!: Float32Array;
  private ambientBounds = { x: 50, y: 24, z: 50 };

  constructor(scene: THREE.Scene) {
    this.initSprayMesh(scene);
    this.initAmbientSnow(scene);
  }

  private initSprayMesh(scene: THREE.Scene) {
    const geo = new THREE.DodecahedronGeometry(0.12, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });

    this.sprayInstancedMesh = new THREE.InstancedMesh(geo, mat, this.sprayMaxCount);
    this.sprayInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.sprayInstancedMesh);

    for (let i = 0; i < this.sprayMaxCount; i++) {
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.sprayInstancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.sprayInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  private initAmbientSnow(scene: THREE.Scene) {
    const geo = new THREE.BufferGeometry();
    this.ambientPositions = new Float32Array(this.ambientCount * 3);

    for (let i = 0; i < this.ambientCount; i++) {
      this.ambientPositions[i * 3] = (Math.random() - 0.5) * this.ambientBounds.x * 2;
      this.ambientPositions[i * 3 + 1] = Math.random() * this.ambientBounds.y;
      this.ambientPositions[i * 3 + 2] = (Math.random() - 0.5) * this.ambientBounds.z * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.ambientPositions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.5, 'rgba(230, 245, 255, 0.8)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.38,
      map: texture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    this.ambientPoints = new THREE.Points(geo, mat);
    scene.add(this.ambientPoints);
  }

  public emitPlowSpray(
    originX: number,
    originY: number,
    originZ: number,
    headingAngle: number,
    speed: number,
    count = 4,
    isNitro = false
  ) {
    for (let i = 0; i < count; i++) {
      if (this.sprayParticles.length >= this.sprayMaxCount) {
        this.sprayParticles.shift();
      }

      const side = Math.random() > 0.5 ? 1 : -1;
      const angle = headingAngle + (side * (Math.PI / 3 + (Math.random() - 0.5) * 0.3));
      const sprayForce = 2.5 + speed * 0.4 + (isNitro ? 3.0 : 0);

      this.sprayParticles.push({
        pos: new THREE.Vector3(
          originX + (Math.random() - 0.5) * 0.5,
          originY + 0.2 + Math.random() * 0.3,
          originZ + (Math.random() - 0.5) * 0.5
        ),
        vel: new THREE.Vector3(
          Math.sin(angle) * sprayForce,
          1.8 + Math.random() * 2.2 + (isNitro ? 1.5 : 0),
          Math.cos(angle) * sprayForce
        ),
        life: 0,
        maxLife: 0.45 + Math.random() * 0.3,
        scale: 0.8 + Math.random() * 0.6 + (isNitro ? 0.4 : 0),
        color: isNitro ? new THREE.Color(0x38bdf8) : new THREE.Color(0xffffff),
      });
    }
  }

  public update(dt: number, cameraTarget: THREE.Vector3, isStormActive = false) {
    // 1. Update spray particles
    for (let i = this.sprayParticles.length - 1; i >= 0; i--) {
      const p = this.sprayParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.sprayParticles.splice(i, 1);
        continue;
      }

      p.vel.y -= 9.8 * dt;
      p.pos.addScaledVector(p.vel, dt);
      if (p.pos.y < 0.05) {
        p.pos.y = 0.05;
        p.vel.set(0, 0, 0);
      }
    }

    for (let i = 0; i < this.sprayMaxCount; i++) {
      if (i < this.sprayParticles.length) {
        const p = this.sprayParticles[i];
        const progress = p.life / p.maxLife;
        const s = (1 - progress) * p.scale;

        this.dummy.position.copy(p.pos);
        this.dummy.scale.set(s, s, s);
        this.dummy.updateMatrix();
        this.sprayInstancedMesh.setMatrixAt(i, this.dummy.matrix);
      } else {
        this.dummy.position.set(0, -999, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.sprayInstancedMesh.setMatrixAt(i, this.dummy.matrix);
      }
    }
    this.sprayInstancedMesh.instanceMatrix.needsUpdate = true;

    // 2. Update ambient snowfall (faster and sideways wind during snowstorm event)
    const posAttr = this.ambientPoints.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    const fallSpeedMult = isStormActive ? 2.8 : 1.0;
    const windX = isStormActive ? 8.5 : 0.6;
    const windZ = isStormActive ? 4.2 : 0.3;

    for (let i = 0; i < this.ambientCount; i++) {
      let x = array[i * 3];
      let y = array[i * 3 + 1];
      let z = array[i * 3 + 2];

      y -= (2.0 + (i % 3) * 0.8) * dt * fallSpeedMult;
      x += windX * dt;
      z += windZ * dt;

      if (y < 0 || Math.abs(x - cameraTarget.x) > this.ambientBounds.x || Math.abs(z - cameraTarget.z) > this.ambientBounds.z) {
        y = this.ambientBounds.y;
        x = cameraTarget.x + (Math.random() - 0.5) * this.ambientBounds.x * 2;
        z = cameraTarget.z + (Math.random() - 0.5) * this.ambientBounds.z * 2;
      }

      array[i * 3] = x;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = z;
    }
    posAttr.needsUpdate = true;
  }
}
