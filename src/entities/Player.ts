import * as THREE from 'three';
import { PlayerState } from '../types';
import { GAME_CONFIG, ANIMATION_NAMES } from '../utils/Constants';
import { Collidable } from '../systems/CollisionSystem';

export class Player implements Collidable {
  mesh: THREE.Group;
  private state: PlayerState;
  private slideTimer: number = 0;
  private boundingBox: THREE.Box3;
  private radius: number;

  constructor(scene: THREE.Scene) {
    this.state = {
      lane: GAME_CONFIG.PLAYER_START_LANE,
      targetLane: GAME_CONFIG.PLAYER_START_LANE,
      position: new THREE.Vector3(
        GAME_CONFIG.LANE_POSITIONS[GAME_CONFIG.PLAYER_START_LANE],
        GAME_CONFIG.PLAYER_HEIGHT,
        0
      ),
      velocity: new THREE.Vector3(0, 0, 0),
      isJumping: false,
      isSliding: false,
      isInvincible: false,
      currentAnimation: ANIMATION_NAMES.RUN,
    };

    this.mesh = this.createPlaceholderCat();
    this.mesh.position.copy(this.state.position);
    scene.add(this.mesh);

    this.boundingBox = new THREE.Box3();
    this.radius = GAME_CONFIG.PLAYER_RADIUS;
  }

  /**
   * Create a placeholder low-poly cat mesh
   */
  private createPlaceholderCat(): THREE.Group {
    const cat = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 }); // Orange
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    cat.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.7, 0.5);
    cat.add(head);

    // Ears
    const earGeometry = new THREE.ConeGeometry(0.15, 0.3, 4);
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-0.2, 1.0, 0.5);
    cat.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(0.2, 1.0, 0.5);
    cat.add(rightEar);

    // Tail
    const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, 0.8, 6);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.5, -0.6);
    tail.rotation.x = Math.PI / 4;
    cat.add(tail);

    // Legs (simple cylinders)
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00 }); // Darker orange

    const legs = [
      [-0.3, 0, 0.4],
      [0.3, 0, 0.4],
      [-0.3, 0, -0.2],
      [0.3, 0, -0.2],
    ];

    legs.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x, y, z);
      cat.add(leg);
    });

    return cat;
  }

  /**
   * Update player state and physics
   */
  update(deltaTime: number): void {
    // Update slide timer
    if (this.state.isSliding) {
      this.slideTimer -= deltaTime;
      if (this.slideTimer <= 0) {
        this.endSlide();
      }
    }

    // Apply gravity
    if (this.state.position.y > 0 || this.state.velocity.y > 0) {
      this.state.velocity.y += GAME_CONFIG.GRAVITY * deltaTime;
      this.state.position.y += this.state.velocity.y * deltaTime;

      // Land on ground
      if (this.state.position.y <= (this.state.isSliding ? GAME_CONFIG.SLIDE_HEIGHT : GAME_CONFIG.PLAYER_HEIGHT)) {
        this.state.position.y = this.state.isSliding ? GAME_CONFIG.SLIDE_HEIGHT : GAME_CONFIG.PLAYER_HEIGHT;
        this.state.velocity.y = 0;
        this.state.isJumping = false;
      }
    }

    // Smoothly move between lanes
    const targetX = GAME_CONFIG.LANE_POSITIONS[this.state.targetLane];
    const currentX = this.state.position.x;

    if (Math.abs(targetX - currentX) > 0.01) {
      const direction = Math.sign(targetX - currentX);
      const moveAmount = GAME_CONFIG.LANE_SWITCH_SPEED * deltaTime;
      this.state.position.x += direction * Math.min(moveAmount, Math.abs(targetX - currentX));
      this.state.lane = this.state.targetLane; // Update current lane when close enough
    } else {
      this.state.position.x = targetX;
      this.state.lane = this.state.targetLane;
    }

    // Update mesh position
    this.mesh.position.copy(this.state.position);

    // Simple running animation (bob up and down)
    if (!this.state.isJumping && !this.state.isSliding) {
      const bobAmount = Math.sin(Date.now() * 0.01) * 0.05;
      this.mesh.position.y += bobAmount;
    }

    // Rotate cat to face forward
    this.mesh.rotation.y = Math.PI;

    // Update bounding box
    this.boundingBox.setFromObject(this.mesh);
  }

  /**
   * Handle jump input
   */
  jump(): boolean {
    if (!this.state.isJumping && !this.state.isSliding && this.state.position.y <= GAME_CONFIG.PLAYER_HEIGHT + 0.1) {
      this.state.velocity.y = GAME_CONFIG.JUMP_FORCE;
      this.state.isJumping = true;
      this.state.currentAnimation = ANIMATION_NAMES.JUMP;
      return true;
    }
    return false;
  }

  /**
   * Handle slide input
   */
  slide(): boolean {
    if (!this.state.isSliding && !this.state.isJumping) {
      this.state.isSliding = true;
      this.slideTimer = GAME_CONFIG.SLIDE_DURATION;
      this.state.currentAnimation = ANIMATION_NAMES.SLIDE;

      // Scale down the cat for sliding
      this.mesh.scale.y = 0.5;
      return true;
    }
    return false;
  }

  /**
   * End slide action
   */
  private endSlide(): void {
    this.state.isSliding = false;
    this.mesh.scale.y = 1;
    this.state.currentAnimation = ANIMATION_NAMES.RUN;
  }

  /**
   * Move to left lane
   */
  moveLeft(): boolean {
    if (this.state.targetLane > 0) {
      this.state.targetLane--;
      return true;
    }
    return false;
  }

  /**
   * Move to right lane
   */
  moveRight(): boolean {
    if (this.state.targetLane < GAME_CONFIG.LANE_COUNT - 1) {
      this.state.targetLane++;
      return true;
    }
    return false;
  }

  /**
   * Set invincibility state (from shield power-up)
   */
  setInvincible(invincible: boolean): void {
    this.state.isInvincible = invincible;

    // Visual feedback for invincibility
    if (invincible) {
      this.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x00ffff);
          (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
        }
      });
    } else {
      this.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
        }
      });
    }
  }

  /**
   * Play hit animation
   */
  hit(): void {
    this.state.currentAnimation = ANIMATION_NAMES.HIT;
    // Simple hit effect - flash red
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const originalColor = (child.material as THREE.MeshStandardMaterial).color.clone();
        (child.material as THREE.MeshStandardMaterial).color.set(0xff0000);
        setTimeout(() => {
          (child.material as THREE.MeshStandardMaterial).color.copy(originalColor);
        }, 200);
      }
    });
  }

  /**
   * Get current player state
   */
  getState(): Readonly<PlayerState> {
    return { ...this.state };
  }

  /**
   * Get current lane
   */
  getLane(): number {
    return this.state.lane;
  }

  /**
   * Check if player is invincible
   */
  isInvincible(): boolean {
    return this.state.isInvincible;
  }

  /**
   * Collision interface methods
   */
  get position(): THREE.Vector3 {
    return this.state.position;
  }

  getBoundingBox(): THREE.Box3 {
    return this.boundingBox;
  }

  getRadius(): number {
    return this.radius;
  }

  /**
   * Reset player to starting position
   */
  reset(): void {
    this.state.lane = GAME_CONFIG.PLAYER_START_LANE;
    this.state.targetLane = GAME_CONFIG.PLAYER_START_LANE;
    this.state.position.set(
      GAME_CONFIG.LANE_POSITIONS[GAME_CONFIG.PLAYER_START_LANE],
      GAME_CONFIG.PLAYER_HEIGHT,
      0
    );
    this.state.velocity.set(0, 0, 0);
    this.state.isJumping = false;
    this.state.isSliding = false;
    this.state.isInvincible = false;
    this.mesh.scale.set(1, 1, 1);
  }

  /**
   * Dispose of player resources
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
