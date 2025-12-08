import * as THREE from 'three';
import { IPoolable, ObstacleType } from '../types';
import { GAME_CONFIG, COLORS } from '../utils/Constants';
import { Collidable } from '../systems/CollisionSystem';

export class Obstacle implements IPoolable, Collidable {
  mesh: THREE.Object3D;
  private type: ObstacleType;
  private lane: number = 0;
  private active: boolean = false;
  private boundingBox: THREE.Box3;
  private radius: number = 0.5;

  constructor(type: ObstacleType) {
    this.type = type;
    this.mesh = this.createObstacleMesh(type);
    this.boundingBox = new THREE.Box3();
    this.mesh.visible = false;
  }

  /**
   * Create obstacle mesh based on type
   */
  private createObstacleMesh(type: ObstacleType): THREE.Object3D {
    const material = new THREE.MeshStandardMaterial({
      color: COLORS.OBSTACLE,
      roughness: 0.7,
      metalness: 0.2,
    });

    let geometry: THREE.BufferGeometry;
    let mesh: THREE.Mesh;

    switch (type) {
      case ObstacleType.LOW:
        // Low obstacle - can jump over
        geometry = new THREE.BoxGeometry(1, 0.8, 1);
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.4;
        break;

      case ObstacleType.MIDDLE:
        // Middle obstacle - must slide under
        geometry = new THREE.BoxGeometry(1.5, 0.3, 1.5);
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 1.5;

        // Add support pillars
        const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
        const pillarMaterial = material.clone();

        const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        leftPillar.position.set(-0.6, 0.75, 0);
        mesh.add(leftPillar);

        const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        rightPillar.position.set(0.6, 0.75, 0);
        mesh.add(rightPillar);
        break;

      case ObstacleType.HIGH:
      default:
        // High obstacle - must avoid by switching lanes
        geometry = new THREE.BoxGeometry(1.2, 2, 1.2);
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 1;
        break;
    }

    // Add some visual variety with rotation
    mesh.rotation.y = Math.random() * Math.PI * 2;

    return mesh;
  }

  /**
   * Initialize obstacle at a specific position
   */
  initialize(lane: number, zPosition: number): void {
    this.lane = lane;
    this.mesh.position.x = GAME_CONFIG.LANE_POSITIONS[lane];
    this.mesh.position.z = zPosition;
    this.mesh.visible = true;
    this.setActive(true);
  }

  /**
   * Update obstacle (mainly for moving backward relative to player)
   */
  update(_deltaTime: number): void {
    if (!this.active) return;

    // Obstacles move backward (player appears to move forward)
    // This is handled by the world scrolling system
    this.boundingBox.setFromObject(this.mesh);
  }

  /**
   * Get obstacle type
   */
  getType(): ObstacleType {
    return this.type;
  }

  /**
   * Get obstacle lane
   */
  getLane(): number {
    return this.lane;
  }

  /**
   * Poolable interface methods
   */
  reset(): void {
    this.mesh.visible = false;
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
   * Dispose of obstacle resources
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
