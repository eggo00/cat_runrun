import * as THREE from 'three';

export interface Collidable {
  position: THREE.Vector3;
  getBoundingBox(): THREE.Box3;
  getRadius(): number;
}

export class CollisionSystem {
  /**
   * Check AABB (Axis-Aligned Bounding Box) collision
   */
  static checkAABBCollision(obj1: Collidable, obj2: Collidable): boolean {
    const box1 = obj1.getBoundingBox();
    const box2 = obj2.getBoundingBox();
    return box1.intersectsBox(box2);
  }

  /**
   * Check sphere collision (faster than AABB)
   */
  static checkSphereCollision(obj1: Collidable, obj2: Collidable): boolean {
    const distance = obj1.position.distanceTo(obj2.position);
    const combinedRadius = obj1.getRadius() + obj2.getRadius();
    return distance < combinedRadius;
  }

  /**
   * Check if two objects are in the same lane and close enough on Z-axis
   */
  static checkLaneCollision(
    obj1Lane: number,
    obj1Z: number,
    obj2Lane: number,
    obj2Z: number,
    threshold: number = 1.5
  ): boolean {
    if (obj1Lane !== obj2Lane) {
      return false;
    }
    return Math.abs(obj1Z - obj2Z) < threshold;
  }

  /**
   * Get all objects within a certain range
   */
  static getObjectsInRange<T extends Collidable>(
    origin: THREE.Vector3,
    objects: T[],
    range: number
  ): T[] {
    return objects.filter(obj => {
      const distance = origin.distanceTo(obj.position);
      return distance <= range;
    });
  }

  /**
   * Check ray intersection for line-of-sight or projectile collision
   */
  static raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    objects: THREE.Object3D[],
    maxDistance: number = Infinity
  ): THREE.Intersection[] {
    const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, maxDistance);
    return raycaster.intersectObjects(objects, true);
  }

  /**
   * Create a bounding box from a mesh
   */
  static createBoundingBox(mesh: THREE.Object3D): THREE.Box3 {
    const box = new THREE.Box3();
    box.setFromObject(mesh);
    return box;
  }

  /**
   * Calculate radius from bounding box
   */
  static calculateRadius(mesh: THREE.Object3D): number {
    const box = this.createBoundingBox(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    return Math.max(size.x, size.y, size.z) / 2;
  }
}
