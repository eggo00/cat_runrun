import { PowerUp, PowerUpType } from '../types';
import { GAME_CONFIG } from '../utils/Constants';

export class PowerUpSystem {
  private powerUps: Map<PowerUpType, PowerUp> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializePowerUps();
  }

  private initializePowerUps(): void {
    // Initialize all power-up types
    this.powerUps.set(PowerUpType.MAGNET, {
      type: PowerUpType.MAGNET,
      duration: GAME_CONFIG.MAGNET_DURATION,
      remainingTime: 0,
      active: false,
    });

    this.powerUps.set(PowerUpType.MULTIPLIER, {
      type: PowerUpType.MULTIPLIER,
      duration: GAME_CONFIG.MULTIPLIER_DURATION,
      remainingTime: 0,
      active: false,
    });

    this.powerUps.set(PowerUpType.SHIELD, {
      type: PowerUpType.SHIELD,
      duration: GAME_CONFIG.SHIELD_DURATION,
      remainingTime: 0,
      active: false,
    });
  }

  /**
   * Update all active power-ups
   */
  update(deltaTime: number): void {
    this.powerUps.forEach((powerUp, type) => {
      if (powerUp.active) {
        powerUp.remainingTime -= deltaTime;

        if (powerUp.remainingTime <= 0) {
          this.deactivatePowerUp(type);
        } else {
          this.emit('powerUpUpdate', type, powerUp.remainingTime);
        }
      }
    });
  }

  /**
   * Activate a power-up
   */
  activatePowerUp(type: PowerUpType): void {
    const powerUp = this.powerUps.get(type);
    if (!powerUp) return;

    // If already active, extend the duration
    if (powerUp.active) {
      powerUp.remainingTime = Math.min(
        powerUp.remainingTime + powerUp.duration,
        powerUp.duration * 2 // Cap at 2x duration
      );
    } else {
      powerUp.active = true;
      powerUp.remainingTime = powerUp.duration;
      this.emit('powerUpActivate', type);
    }
  }

  /**
   * Deactivate a power-up
   */
  private deactivatePowerUp(type: PowerUpType): void {
    const powerUp = this.powerUps.get(type);
    if (!powerUp) return;

    powerUp.active = false;
    powerUp.remainingTime = 0;
    this.emit('powerUpExpire', type);
  }

  /**
   * Check if a specific power-up is active
   */
  isActive(type: PowerUpType): boolean {
    const powerUp = this.powerUps.get(type);
    return powerUp ? powerUp.active : false;
  }

  /**
   * Get remaining time for a power-up
   */
  getRemainingTime(type: PowerUpType): number {
    const powerUp = this.powerUps.get(type);
    return powerUp ? powerUp.remainingTime : 0;
  }

  /**
   * Get all active power-ups
   */
  getActivePowerUps(): PowerUpType[] {
    const active: PowerUpType[] = [];
    this.powerUps.forEach((powerUp, type) => {
      if (powerUp.active) {
        active.push(type);
      }
    });
    return active;
  }

  /**
   * Check if player has shield (invincibility)
   */
  hasShield(): boolean {
    return this.isActive(PowerUpType.SHIELD);
  }

  /**
   * Check if magnet is active (auto-collect coins)
   */
  hasMagnet(): boolean {
    return this.isActive(PowerUpType.MAGNET);
  }

  /**
   * Check if score multiplier is active
   */
  hasMultiplier(): boolean {
    return this.isActive(PowerUpType.MULTIPLIER);
  }

  /**
   * Get current score multiplier value
   */
  getScoreMultiplier(): number {
    return this.hasMultiplier() ? 2 : 1;
  }

  /**
   * Reset all power-ups
   */
  reset(): void {
    this.powerUps.forEach(powerUp => {
      powerUp.active = false;
      powerUp.remainingTime = 0;
    });
  }

  /**
   * Event system for power-up changes
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }
}
