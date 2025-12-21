import { SegmentConfig, ObstacleType, CollectibleType } from '../types';
import { GAME_CONFIG } from '../utils/Constants';

export class LevelGenerator {
  private segmentCounter: number = 0;
  private difficulty: number = 0;

  /**
   * Generate a new level segment
   */
  generateSegment(): SegmentConfig {
    const config: SegmentConfig = {
      obstacles: [],
      collectibles: [],
      difficulty: this.difficulty,
    };

    // Calculate current difficulty based on segments passed
    this.difficulty = Math.min(
      GAME_CONFIG.OBSTACLE_BASE_PROBABILITY +
        this.segmentCounter * GAME_CONFIG.DIFFICULTY_CURVE_RATE,
      GAME_CONFIG.OBSTACLE_MAX_PROBABILITY
    );

    // Generate obstacles
    this.generateObstacles(config);

    // Generate collectibles (coins, fish)
    this.generateCollectibles(config);

    // Occasionally add power-ups (less frequent than collectibles)
    if (Math.random() < 0.15) {
      this.generatePowerUp(config);
    }

    // Rarely add hearts for healing (very rare - 8% chance)
    if (Math.random() < 0.08) {
      this.generateHeart(config);
      console.log('💗 Heart generated at segment', this.segmentCounter);
    }

    this.segmentCounter++;
    return config;
  }

  /**
   * Generate obstacles for a segment
   */
  private generateObstacles(config: SegmentConfig): void {
    const numObstacles = Math.random() < this.difficulty ? this.getObstacleCount() : 0;

    if (numObstacles === 0) {
      return;
    }

    const usedPositions: Set<string> = new Set();

    for (let i = 0; i < numObstacles; i++) {
      const obstacleType = this.randomObstacleType();
      const lane = this.randomLane();
      const position = this.randomPositionInSegment();

      // Ensure we don't overlap obstacles at the same position
      const key = `${lane}-${Math.floor(position)}`;
      if (usedPositions.has(key)) {
        continue;
      }
      usedPositions.add(key);

      config.obstacles.push({
        type: obstacleType,
        lane,
        position,
      });
    }

    // Ensure at least one lane is clear (solvability check)
    this.ensureSolvable(config);
  }

  /**
   * Ensure the segment is solvable (at least one lane is clear)
   */
  private ensureSolvable(config: SegmentConfig): void {
    const lanes = [0, 1, 2];
    const clearedLanes = lanes.filter(lane => {
      return !config.obstacles.some(obs => obs.lane === lane);
    });

    // If no lane is clear, remove obstacles from a random lane
    if (clearedLanes.length === 0) {
      const laneToClear = this.randomLane();
      config.obstacles = config.obstacles.filter(obs => obs.lane !== laneToClear);
    }
  }

  /**
   * Generate collectibles (coins and fish)
   */
  private generateCollectibles(config: SegmentConfig): void {
    // Determine collectible pattern
    const pattern = Math.random();

    if (pattern < 0.3) {
      // Single lane of coins
      this.generateCoinLine(config, this.randomLane());
    } else if (pattern < 0.5) {
      // Scattered coins
      this.generateScatteredCoins(config);
    } else if (pattern < 0.7) {
      // Zig-zag pattern
      this.generateZigZagCoins(config);
    } else if (pattern < 0.85) {
      // All lanes with coins
      this.generateMultiLaneCoins(config);
    } else {
      // Special: Fish bonus
      this.generateFish(config);
    }
  }

  /**
   * Generate a line of coins in a single lane
   */
  private generateCoinLine(config: SegmentConfig, lane: number): void {
    const coinCount = 5 + Math.floor(Math.random() * 5);
    const spacing = GAME_CONFIG.SEGMENT_LENGTH / (coinCount + 1);

    for (let i = 0; i < coinCount; i++) {
      const position = spacing * (i + 1);
      if (!this.isObstacleAt(config, lane, position)) {
        config.collectibles.push({
          type: CollectibleType.COIN,
          lane,
          position,
        });
      }
    }
  }

  /**
   * Generate scattered coins across lanes
   */
  private generateScatteredCoins(config: SegmentConfig): void {
    const coinCount = 3 + Math.floor(Math.random() * 5);

    for (let i = 0; i < coinCount; i++) {
      const lane = this.randomLane();
      const position = this.randomPositionInSegment();

      if (!this.isObstacleAt(config, lane, position)) {
        config.collectibles.push({
          type: CollectibleType.COIN,
          lane,
          position,
        });
      }
    }
  }

  /**
   * Generate zig-zag pattern of coins
   */
  private generateZigZagCoins(config: SegmentConfig): void {
    const segments = 3;
    let currentLane = this.randomLane();

    for (let i = 0; i < segments; i++) {
      const position = (GAME_CONFIG.SEGMENT_LENGTH / segments) * i + 3;
      config.collectibles.push({
        type: CollectibleType.COIN,
        lane: currentLane,
        position,
      });

      // Switch lane
      currentLane = (currentLane + (Math.random() < 0.5 ? 1 : -1) + 3) % 3;
    }
  }

  /**
   * Generate coins in multiple lanes
   */
  private generateMultiLaneCoins(config: SegmentConfig): void {
    for (let lane = 0; lane < GAME_CONFIG.LANE_COUNT; lane++) {
      const position = this.randomPositionInSegment();
      if (!this.isObstacleAt(config, lane, position)) {
        config.collectibles.push({
          type: CollectibleType.COIN,
          lane,
          position,
        });
      }
    }
  }

  /**
   * Generate a fish (high-value collectible)
   */
  private generateFish(config: SegmentConfig): void {
    const lane = this.randomLane();
    const position = GAME_CONFIG.SEGMENT_LENGTH / 2;

    if (!this.isObstacleAt(config, lane, position)) {
      config.collectibles.push({
        type: CollectibleType.FISH,
        lane,
        position,
      });
    }
  }

  /**
   * Generate a power-up
   */
  private generatePowerUp(config: SegmentConfig): void {
    const powerUpTypes = [
      CollectibleType.POWERUP_MAGNET,
      CollectibleType.POWERUP_MULTIPLIER,
      CollectibleType.POWERUP_SHIELD,
    ];

    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const lane = this.randomLane();
    const position = this.randomPositionInSegment();

    if (!this.isObstacleAt(config, lane, position)) {
      config.collectibles.push({
        type,
        lane,
        position,
      });
    }
  }

  /**
   * Generate a heart for healing
   */
  private generateHeart(config: SegmentConfig): void {
    const lane = this.randomLane();
    const position = this.randomPositionInSegment();

    if (!this.isObstacleAt(config, lane, position)) {
      config.collectibles.push({
        type: CollectibleType.HEART,
        lane,
        position,
      });
    }
  }

  /**
   * Check if there's an obstacle at a specific position
   */
  private isObstacleAt(config: SegmentConfig, lane: number, position: number): boolean {
    return config.obstacles.some(obs => {
      return obs.lane === lane && Math.abs(obs.position - position) < 2;
    });
  }

  /**
   * Get number of obstacles based on difficulty
   */
  private getObstacleCount(): number {
    const rand = Math.random();
    if (this.difficulty < 0.3) {
      return 1;
    } else if (this.difficulty < 0.5) {
      return rand < 0.7 ? 1 : 2;
    } else {
      return rand < 0.5 ? 2 : 3;
    }
  }

  /**
   * Get a random obstacle type
   */
  private randomObstacleType(): ObstacleType {
    const types = [ObstacleType.LOW, ObstacleType.MIDDLE, ObstacleType.HIGH];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Get a random lane index
   */
  private randomLane(): number {
    return Math.floor(Math.random() * GAME_CONFIG.LANE_COUNT);
  }

  /**
   * Get a random position within a segment
   */
  private randomPositionInSegment(): number {
    return 3 + Math.random() * (GAME_CONFIG.SEGMENT_LENGTH - 6);
  }

  /**
   * Reset the generator
   */
  reset(): void {
    this.segmentCounter = 0;
    this.difficulty = 0;
  }

  /**
   * Get current difficulty
   */
  getDifficulty(): number {
    return this.difficulty;
  }

  /**
   * Get segment counter
   */
  getSegmentCount(): number {
    return this.segmentCounter;
  }
}
