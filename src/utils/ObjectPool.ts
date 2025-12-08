import { IPoolable } from '../types';

/**
 * Generic Object Pool for reusing game objects
 * Reduces garbage collection by recycling objects
 */
export class ObjectPool<T extends IPoolable> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private maxSize: number;

  constructor(factory: () => T, initialSize: number = 10, maxSize: number = 50) {
    this.factory = factory;
    this.maxSize = maxSize;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.setActive(false);
      this.pool.push(obj);
    }
  }

  /**
   * Get an object from the pool or create a new one
   */
  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.factory();
    }

    obj.reset();
    obj.setActive(true);
    this.active.add(obj);
    return obj;
  }

  /**
   * Return an object to the pool
   */
  release(obj: T): void {
    if (!this.active.has(obj)) {
      return;
    }

    obj.setActive(false);
    this.active.delete(obj);

    // Only keep objects if pool isn't full
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    } else {
      obj.dispose();
    }
  }

  /**
   * Release all active objects
   */
  releaseAll(): void {
    const activeArray = Array.from(this.active);
    activeArray.forEach(obj => this.release(obj));
  }

  /**
   * Update all active objects
   */
  updateActive(deltaTime: number): void {
    this.active.forEach(obj => {
      if (obj.isActive()) {
        obj.update(deltaTime);
      }
    });
  }

  /**
   * Get all active objects
   */
  getActive(): T[] {
    return Array.from(this.active);
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      pooled: this.pool.length,
      active: this.active.size,
      total: this.pool.length + this.active.size,
    };
  }

  /**
   * Clear and dispose all objects
   */
  dispose(): void {
    this.releaseAll();
    this.pool.forEach(obj => obj.dispose());
    this.pool = [];
    this.active.clear();
  }
}
