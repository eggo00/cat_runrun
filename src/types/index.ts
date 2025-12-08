import * as THREE from 'three';
import { GameState, PowerUpType, ObstacleType, CollectibleType } from '../utils/Constants';

export interface IGameEntity {
  mesh: THREE.Object3D;
  update(deltaTime: number): void;
  dispose(): void;
}

export interface IPoolable extends IGameEntity {
  reset(): void;
  isActive(): boolean;
  setActive(active: boolean): void;
}

export interface PlayerState {
  lane: number;
  targetLane: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isJumping: boolean;
  isSliding: boolean;
  isInvincible: boolean;
  currentAnimation: string;
}

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  totalCoins: number;
  multiplier: number;
  combo: number;
  speed: number;
  segmentsPassed: number;
}

export interface PowerUp {
  type: PowerUpType;
  duration: number;
  remainingTime: number;
  active: boolean;
}

export interface SegmentConfig {
  obstacles: ObstacleConfig[];
  collectibles: CollectibleConfig[];
  difficulty: number;
}

export interface ObstacleConfig {
  type: ObstacleType;
  lane: number;
  position: number; // Z position within segment
}

export interface CollectibleConfig {
  type: CollectibleType;
  lane: number;
  position: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  slide: boolean;
  pause: boolean;
}

export interface TouchState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTime: number;
  isSwiping: boolean;
}

export interface AudioSettings {
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  distance: number;
  date: string;
}

export interface SkinData {
  id: string;
  name: string;
  price: number;
  unlocked: boolean;
  color?: number;
  modelPath?: string;
}

export interface SaveData {
  highScore: number;
  totalCoins: number;
  unlockedSkins: string[];
  currentSkin: string;
  audioSettings: AudioSettings;
}

export type GameEventCallback = (...args: any[]) => void;

export interface GameEvents {
  onScoreChange?: (score: number) => void;
  onCoinCollect?: (coins: number) => void;
  onDistanceChange?: (distance: number) => void;
  onPowerUpActivate?: (type: PowerUpType) => void;
  onPowerUpExpire?: (type: PowerUpType) => void;
  onGameOver?: (stats: GameStats) => void;
  onStateChange?: (newState: GameState, oldState: GameState) => void;
}

export {
  GameState,
  PowerUpType,
  ObstacleType,
  CollectibleType,
};
