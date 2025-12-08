import { GameStats } from '../types';
import { GAME_CONFIG } from '../utils/Constants';

export class ScoreSystem {
  private stats: GameStats = {
    score: 0,
    distance: 0,
    coins: 0,
    totalCoins: 0,
    multiplier: 1,
    combo: 0,
    speed: GAME_CONFIG.BASE_SPEED,
    segmentsPassed: 0,
  };

  private comboTimer: number = 0;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.reset();
  }

  /**
   * Update distance and calculate score
   */
  update(deltaTime: number): void {
    // Update distance (speed * time)
    const distanceGained = (this.stats.speed * deltaTime) / 10; // Convert to meters
    this.stats.distance += distanceGained;

    // Add distance-based score
    this.stats.score += Math.floor(distanceGained * GAME_CONFIG.SCORE_PER_METER * this.stats.multiplier);

    // Update combo timer
    if (this.stats.combo > 0) {
      this.comboTimer -= deltaTime * 1000;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }

    this.emit('distanceChange', Math.floor(this.stats.distance));
    this.emit('scoreChange', this.stats.score);
  }

  /**
   * Add score from collecting items or performing actions
   */
  addScore(points: number): void {
    const finalPoints = Math.floor(points * this.stats.multiplier);
    this.stats.score += finalPoints;
    this.emit('scoreChange', this.stats.score);
  }

  /**
   * Collect a coin
   */
  collectCoin(value: number = GAME_CONFIG.COIN_VALUE): void {
    this.stats.coins++;
    this.stats.totalCoins++;
    this.addScore(value);
    this.incrementCombo();
    this.emit('coinCollect', this.stats.coins);
  }

  /**
   * Collect a fish (high-value collectible)
   */
  collectFish(value: number = GAME_CONFIG.FISH_VALUE): void {
    this.stats.coins += 5; // Fish counts as 5 coins
    this.stats.totalCoins += 5;
    this.addScore(value);
    this.incrementCombo();
    this.emit('coinCollect', this.stats.coins);
  }

  /**
   * Increment combo counter
   */
  private incrementCombo(): void {
    this.stats.combo++;
    this.comboTimer = GAME_CONFIG.COMBO_TIMEOUT;

    // Bonus score for combos
    if (this.stats.combo > 5) {
      const comboBonus = Math.floor(this.stats.combo / 5) * 10;
      this.addScore(comboBonus);
    }
  }

  /**
   * Reset combo counter
   */
  private resetCombo(): void {
    this.stats.combo = 0;
    this.comboTimer = 0;
  }

  /**
   * Set score multiplier (from power-ups)
   */
  setMultiplier(multiplier: number): void {
    this.stats.multiplier = multiplier;
  }

  /**
   * Set current game speed
   */
  setSpeed(speed: number): void {
    this.stats.speed = speed;
  }

  /**
   * Increment segments passed counter
   */
  incrementSegments(): void {
    this.stats.segmentsPassed++;
  }

  /**
   * Get current game statistics
   */
  getStats(): Readonly<GameStats> {
    return { ...this.stats };
  }

  /**
   * Get specific stat value
   */
  getStat(key: keyof GameStats): number {
    return this.stats[key];
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    const totalCoins = this.stats.totalCoins; // Preserve total coins across games
    this.stats = {
      score: 0,
      distance: 0,
      coins: 0,
      totalCoins: totalCoins,
      multiplier: 1,
      combo: 0,
      speed: GAME_CONFIG.BASE_SPEED,
      segmentsPassed: 0,
    };
    this.comboTimer = 0;
  }

  /**
   * Event system for score changes
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

  /**
   * Save high score to localStorage
   */
  saveHighScore(): number {
    const currentHigh = this.getHighScore();
    if (this.stats.score > currentHigh) {
      localStorage.setItem('cat-runrun-highscore', this.stats.score.toString());
      return this.stats.score;
    }
    return currentHigh;
  }

  /**
   * Get high score from localStorage
   */
  getHighScore(): number {
    const stored = localStorage.getItem('cat-runrun-highscore');
    return stored ? parseInt(stored, 10) : 0;
  }

  /**
   * Save total coins to localStorage
   */
  saveTotalCoins(): void {
    localStorage.setItem('cat-runrun-totalcoins', this.stats.totalCoins.toString());
  }

  /**
   * Load total coins from localStorage
   */
  loadTotalCoins(): void {
    const stored = localStorage.getItem('cat-runrun-totalcoins');
    this.stats.totalCoins = stored ? parseInt(stored, 10) : 0;
  }
}
