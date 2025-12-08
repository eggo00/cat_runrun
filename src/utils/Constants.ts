// Game Constants Configuration

export const GAME_CONFIG = {
  // Lane settings
  LANE_COUNT: 3,
  LANE_WIDTH: 3,
  LANE_POSITIONS: [3, 0, -3], // Left, Center, Right

  // Player settings
  PLAYER_START_LANE: 1, // Center lane
  PLAYER_HEIGHT: 1,
  PLAYER_RADIUS: 0.5,
  JUMP_FORCE: 12,
  GRAVITY: -30,
  SLIDE_DURATION: 0.6, // seconds
  SLIDE_HEIGHT: 0.5,
  LANE_SWITCH_SPEED: 15,

  // Game speed
  BASE_SPEED: 15,
  MAX_SPEED: 40,
  SPEED_INCREMENT: 0.5,
  SPEED_INCREMENT_INTERVAL: 10, // Every 10 segments

  // Level generation
  SEGMENT_LENGTH: 20,
  SEGMENTS_AHEAD: 5,
  INITIAL_SEGMENTS: 8,

  // Collectibles
  COIN_VALUE: 10,
  FISH_VALUE: 50,
  COIN_MAGNET_RANGE: 5,

  // Power-ups
  MAGNET_DURATION: 10, // seconds
  MULTIPLIER_DURATION: 15,
  SHIELD_DURATION: 8,

  // Difficulty
  OBSTACLE_BASE_PROBABILITY: 0.4,
  OBSTACLE_MAX_PROBABILITY: 0.7,
  DIFFICULTY_CURVE_RATE: 0.02,

  // Camera
  CAMERA_FOV: 60,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  CAMERA_OFFSET_Y: 3.5,
  CAMERA_OFFSET_Z: -8,
  CAMERA_LOOK_AHEAD: 5,

  // Performance
  MAX_POOL_SIZE: 50,
  SHADOW_MAP_SIZE: 1024,
  ENABLE_SHADOWS: true,

  // UI
  COMBO_TIMEOUT: 2000, // ms
  SCORE_PER_METER: 1,
};

// Use relative paths for assets in public folder (works with base path)
const BASE_PATH = '/cat_runrun';

export const ASSET_PATHS = {
  MODELS: {
    CAT: `${BASE_PATH}/models/cat.glb`,
    OBSTACLE_BARREL: `${BASE_PATH}/models/barrel.glb`,
    OBSTACLE_CRATE: `${BASE_PATH}/models/crate.glb`,
    OBSTACLE_HURDLE: `${BASE_PATH}/models/hurdle.glb`,
    COIN: `${BASE_PATH}/models/coin.glb`,
    FISH: `${BASE_PATH}/models/fish.glb`,
    POWERUP_MAGNET: `${BASE_PATH}/models/magnet.glb`,
    POWERUP_MULTIPLIER: `${BASE_PATH}/models/multiplier.glb`,
    POWERUP_SHIELD: `${BASE_PATH}/models/shield.glb`,
  },
  TEXTURES: {
    GROUND: `${BASE_PATH}/textures/ground.png`,
    SKY: `${BASE_PATH}/textures/sky.png`,
  },
  SOUNDS: {
    JUMP: `${BASE_PATH}/sounds/jump.wav`,
    COIN: `${BASE_PATH}/sounds/coin.wav`,
    FISH: `${BASE_PATH}/sounds/fish.wav`,
    HIT: `${BASE_PATH}/sounds/hit.wav`,
    POWERUP: `${BASE_PATH}/sounds/powerup.wav`,
    BGM: `${BASE_PATH}/sounds/bgm-temp.wav`,
  },
};

export const COLORS = {
  GROUND: 0x90C695,
  SKY_TOP: 0x87CEEB,
  SKY_BOTTOM: 0xE0F6FF,
  OBSTACLE: 0x8B4513,
  COIN: 0xFFD700,
  FISH: 0xFF69B4,
  POWERUP_MAGNET: 0x4169E1,
  POWERUP_MULTIPLIER: 0xFF4500,
  POWERUP_SHIELD: 0x00CED1,
};

export const ANIMATION_NAMES = {
  IDLE: 'idle',
  RUN: 'run',
  JUMP: 'jump',
  SLIDE: 'slide',
  HIT: 'hit',
};

export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver',
  LOADING = 'loading',
}

export enum PowerUpType {
  MAGNET = 'magnet',
  MULTIPLIER = 'multiplier',
  SHIELD = 'shield',
}

export enum ObstacleType {
  LOW = 'low',      // Can jump over
  MIDDLE = 'middle', // Can slide under
  HIGH = 'high',    // Must avoid by switching lanes
}

export enum CollectibleType {
  COIN = 'coin',
  FISH = 'fish',
  POWERUP_MAGNET = 'powerup_magnet',
  POWERUP_MULTIPLIER = 'powerup_multiplier',
  POWERUP_SHIELD = 'powerup_shield',
}
