export class HealthSystem {
  private maxHealth: number;
  private currentHealth: number;
  private callbacks: Map<string, Function> = new Map();

  constructor(maxHealth: number = 3) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }

  /**
   * Get current health
   */
  getCurrentHealth(): number {
    return this.currentHealth;
  }

  /**
   * Get max health
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Take damage
   */
  takeDamage(amount: number = 1): boolean {
    if (this.currentHealth <= 0) {
      return false; // Already dead
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.emit('healthChange', this.currentHealth);

    if (this.currentHealth === 0) {
      this.emit('death');
      return true; // Died from this damage
    }

    return false;
  }

  /**
   * Heal
   */
  heal(amount: number = 1): void {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    this.emit('healthChange', this.currentHealth);
  }

  /**
   * Check if alive
   */
  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  /**
   * Reset health to max
   */
  reset(): void {
    this.currentHealth = this.maxHealth;
    this.emit('healthChange', this.currentHealth);
  }

  /**
   * Event system
   */
  on(event: string, callback: Function): void {
    this.callbacks.set(event, callback);
  }

  private emit(event: string, ...args: any[]): void {
    const callback = this.callbacks.get(event);
    if (callback) {
      callback(...args);
    }
  }
}
