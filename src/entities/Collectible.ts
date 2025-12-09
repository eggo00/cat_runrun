import * as THREE from 'three';
import { IPoolable, CollectibleType } from '../types';
import { GAME_CONFIG, COLORS } from '../utils/Constants';
import { Collidable } from '../systems/CollisionSystem';

export class Collectible implements IPoolable, Collidable {
  mesh: THREE.Object3D;
  private type: CollectibleType;
  private lane: number = 0;
  private active: boolean = false;
  private boundingBox: THREE.Box3;
  private radius: number = 0.3;
  private rotationSpeed: number;

  constructor(type: CollectibleType) {
    this.type = type;
    this.mesh = this.createCollectibleMesh(type);
    this.boundingBox = new THREE.Box3();
    this.mesh.visible = false;
    this.rotationSpeed = 2 + Math.random() * 2;
  }

  /**
   * Create collectible mesh based on type
   */
  private createCollectibleMesh(type: CollectibleType): THREE.Object3D {
    const group = new THREE.Group();

    switch (type) {
      case CollectibleType.COIN: {
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        const material = new THREE.MeshStandardMaterial({
          color: COLORS.COIN,
          emissive: COLORS.COIN,
          emissiveIntensity: 0.3,
          metalness: 0.8,
          roughness: 0.2,
        });
        const coin = new THREE.Mesh(geometry, material);
        coin.rotation.x = Math.PI / 2;
        group.add(coin);
        break;
      }

      case CollectibleType.FISH: {
        // Simple fish shape
        const bodyGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const material = new THREE.MeshStandardMaterial({
          color: COLORS.FISH,
          emissive: COLORS.FISH,
          emissiveIntensity: 0.3,
        });
        const body = new THREE.Mesh(bodyGeometry, material);
        body.scale.set(1, 0.7, 1.5);
        group.add(body);

        // Tail
        const tailGeometry = new THREE.ConeGeometry(0.3, 0.5, 4);
        const tail = new THREE.Mesh(tailGeometry, material);
        tail.rotation.z = -Math.PI / 2;
        tail.position.x = -0.6;
        group.add(tail);
        break;
      }

      case CollectibleType.HEART: {
        // Create a heart shape using spheres
        const material = new THREE.MeshStandardMaterial({
          color: COLORS.HEART,
          emissive: COLORS.HEART,
          emissiveIntensity: 0.5,
          metalness: 0.3,
          roughness: 0.4,
        });

        // Left sphere
        const leftSphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 16, 16),
          material
        );
        leftSphere.position.set(-0.15, 0.15, 0);
        group.add(leftSphere);

        // Right sphere
        const rightSphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 16, 16),
          material
        );
        rightSphere.position.set(0.15, 0.15, 0);
        group.add(rightSphere);

        // Bottom diamond
        const bottomGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.3);
        const bottom = new THREE.Mesh(bottomGeometry, material);
        bottom.position.set(0, -0.1, 0);
        bottom.rotation.z = Math.PI / 4;
        group.add(bottom);

        // Scale entire heart
        group.scale.set(1.2, 1.2, 1.2);
        break;
      }

      case CollectibleType.POWERUP_MAGNET: {
        const geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 12);
        const material = new THREE.MeshStandardMaterial({
          color: COLORS.POWERUP_MAGNET,
          emissive: COLORS.POWERUP_MAGNET,
          emissiveIntensity: 0.5,
        });
        const magnet = new THREE.Mesh(geometry, material);
        group.add(magnet);

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: COLORS.POWERUP_MAGNET,
          transparent: true,
          opacity: 0.2,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
        break;
      }

      case CollectibleType.POWERUP_MULTIPLIER: {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({
          color: COLORS.POWERUP_MULTIPLIER,
          emissive: COLORS.POWERUP_MULTIPLIER,
          emissiveIntensity: 0.5,
        });
        const box = new THREE.Mesh(geometry, material);
        group.add(box);

        // Add glow
        const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: COLORS.POWERUP_MULTIPLIER,
          transparent: true,
          opacity: 0.2,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
        break;
      }

      case CollectibleType.POWERUP_SHIELD: {
        const geometry = new THREE.OctahedronGeometry(0.4, 0);
        const material = new THREE.MeshStandardMaterial({
          color: COLORS.POWERUP_SHIELD,
          emissive: COLORS.POWERUP_SHIELD,
          emissiveIntensity: 0.5,
        });
        const shield = new THREE.Mesh(geometry, material);
        group.add(shield);

        // Add glow
        const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: COLORS.POWERUP_SHIELD,
          transparent: true,
          opacity: 0.2,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
        break;
      }
    }

    group.position.y = 1; // Hover height
    return group;
  }

  /**
   * Initialize collectible at a specific position
   */
  initialize(lane: number, zPosition: number): void {
    this.lane = lane;
    this.mesh.position.x = GAME_CONFIG.LANE_POSITIONS[lane];
    this.mesh.position.z = zPosition;
    this.mesh.visible = true;
    this.setActive(true);
  }

  /**
   * Update collectible (rotation and floating animation)
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Rotate
    this.mesh.rotation.y += this.rotationSpeed * deltaTime;

    // Float up and down
    const floatOffset = Math.sin(Date.now() * 0.003) * 0.2;
    this.mesh.position.y = 1 + floatOffset;

    this.boundingBox.setFromObject(this.mesh);
  }

  /**
   * Get collectible type
   */
  getType(): CollectibleType {
    return this.type;
  }

  /**
   * Get collectible lane
   */
  getLane(): number {
    return this.lane;
  }

  /**
   * Get value of this collectible
   */
  getValue(): number {
    switch (this.type) {
      case CollectibleType.COIN:
        return GAME_CONFIG.COIN_VALUE;
      case CollectibleType.FISH:
        return GAME_CONFIG.FISH_VALUE;
      default:
        return 0;
    }
  }

  /**
   * Check if this is a power-up
   */
  isPowerUp(): boolean {
    return (
      this.type === CollectibleType.POWERUP_MAGNET ||
      this.type === CollectibleType.POWERUP_MULTIPLIER ||
      this.type === CollectibleType.POWERUP_SHIELD
    );
  }

  /**
   * Poolable interface methods
   */
  reset(): void {
    this.mesh.visible = false;
    this.mesh.rotation.set(0, 0, 0);
    this.lane = 0;
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
    this.mesh.visible = active;
  }

  /**
   * Collidable interface methods
   */
  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  getBoundingBox(): THREE.Box3 {
    return this.boundingBox;
  }

  getRadius(): number {
    return this.radius;
  }

  /**
   * Dispose of collectible resources
   */
  dispose(): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
