import { GameScene } from './scenes/GameScene';
import { InputManager } from './systems/InputManager';
import { ScoreSystem } from './systems/ScoreSystem';
import { PowerUpSystem } from './systems/PowerUpSystem';
import { HealthSystem } from './systems/HealthSystem';
import { AudioManager } from './systems/AudioManager';
import { UIManager } from './ui/UIManager';
import { GameState, PowerUpType, CollectibleType } from './types';
import { GAME_CONFIG } from './utils/Constants';
import { Obstacle } from './entities/Obstacle';
import { Collectible } from './entities/Collectible';

export class Game {
  private gameScene: GameScene;
  private inputManager: InputManager;
  private scoreSystem: ScoreSystem;
  private powerUpSystem: PowerUpSystem;
  private healthSystem: HealthSystem;
  private audioManager: AudioManager;
  private uiManager: UIManager;

  private state: GameState = GameState.LOADING;
  private lastTime: number = 0;
  private animationFrameId: number = 0;

  constructor(container: HTMLElement) {
    // Initialize systems
    this.gameScene = new GameScene(container);
    this.inputManager = new InputManager();
    this.scoreSystem = new ScoreSystem();
    this.powerUpSystem = new PowerUpSystem();
    this.healthSystem = new HealthSystem(3); // 3 hearts
    this.audioManager = new AudioManager();
    this.uiManager = new UIManager();

    // Setup callbacks
    this.setupCallbacks();

    // Load game
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Load audio
      await this.audioManager.init();
      this.uiManager.updateLoadingProgress(0.5, 'Loading audio...');

      // Load any other assets here
      this.uiManager.updateLoadingProgress(1, 'Ready!');

      // Wait a bit to show "Ready!"
      await new Promise(resolve => setTimeout(resolve, 500));

      // Hide loading screen and show main menu
      this.uiManager.hideLoadingScreen();
      this.setState(GameState.MENU);
      this.uiManager.showMainMenu();
    } catch (error) {
      console.error('Failed to initialize game:', error);
      alert('Failed to load game. Please refresh the page.');
    }
  }

  private setupCallbacks(): void {
    // UI callbacks
    this.uiManager.on('startGame', () => this.startGame());
    this.uiManager.on('restart', () => this.restartGame());
    this.uiManager.on('resume', () => this.resumeGame());
    this.uiManager.on('quit', () => this.quitToMenu());
    this.uiManager.on('returnToMenu', () => this.quitToMenu());
    this.uiManager.on('toggleMusic', (enabled: boolean) => this.audioManager.toggleMusic(enabled));
    this.uiManager.on('toggleSFX', (enabled: boolean) => this.audioManager.toggleSFX(enabled));

    // Score system callbacks
    this.scoreSystem.on('scoreChange', (score: number) => this.uiManager.updateScore(score));
    this.scoreSystem.on('distanceChange', (distance: number) => this.uiManager.updateDistance(distance));
    this.scoreSystem.on('coinCollect', (coins: number) => this.uiManager.updateCoins(coins));

    // Health system callbacks
    this.healthSystem.on('healthChange', (health: number) => {
      this.uiManager.updateHealth(health, this.healthSystem.getMaxHealth());
    });
    this.healthSystem.on('death', () => this.gameOver());

    // Power-up system callbacks
    this.powerUpSystem.on('powerUpActivate', (type: PowerUpType) => {
      this.onPowerUpActivate(type);
    });

    this.powerUpSystem.on('powerUpExpire', (type: PowerUpType) => {
      this.onPowerUpExpire(type);
    });

    this.powerUpSystem.on('powerUpUpdate', (type: PowerUpType, remainingTime: number) => {
      this.uiManager.updatePowerUpTimer(type, remainingTime);
    });

    // Scene collision callback
    this.gameScene.setCollisionCallback((type, object) => {
      this.handleCollision(type, object);
    });
  }

  private setState(newState: GameState): void {
    const oldState = this.state;
    this.state = newState;
    console.log(`Game state: ${oldState} -> ${newState}`);
  }

  /**
   * Start a new game
   */
  private startGame(): void {
    this.setState(GameState.PLAYING);
    this.uiManager.showHUD();

    // Reset everything
    this.gameScene.reset();
    this.scoreSystem.reset();
    this.powerUpSystem.reset();
    this.healthSystem.reset();
    this.inputManager.reset();

    // Enable input handling
    this.inputManager.setGamePlaying(true);

    // Load total coins from localStorage
    this.scoreSystem.loadTotalCoins();

    // Start background music
    this.audioManager.playMusic();

    // Start game loop
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Restart game after game over
   */
  private restartGame(): void {
    this.startGame();
  }

  /**
   * Resume game from pause
   */
  private resumeGame(): void {
    this.setState(GameState.PLAYING);
    this.uiManager.hidePauseMenu();
    this.audioManager.resumeMusic();

    // Re-enable input handling
    this.inputManager.setGamePlaying(true);

    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Quit to main menu
   */
  private quitToMenu(): void {
    this.setState(GameState.MENU);
    this.audioManager.stopMusic();

    // Disable input handling when in menu
    this.inputManager.setGamePlaying(false);

    cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Pause game
   */
  private pauseGame(): void {
    if (this.state !== GameState.PLAYING) return;

    this.setState(GameState.PAUSED);
    this.uiManager.showPauseMenu();
    this.audioManager.pauseMusic();

    // Disable input handling when paused
    this.inputManager.setGamePlaying(false);

    cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Game over
   */
  private gameOver(): void {
    this.setState(GameState.GAME_OVER);

    // Disable input handling when game is over
    this.inputManager.setGamePlaying(false);

    // Save high score
    const highScore = this.scoreSystem.saveHighScore();

    // Save total coins
    this.scoreSystem.saveTotalCoins();

    // Show game over UI
    this.uiManager.showGameOver(this.scoreSystem.getStats(), highScore);

    // Play hit sound
    this.audioManager.playSFX('hit');

    // Stop music
    this.audioManager.stopMusic();

    // Stop game loop
    cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Main game loop
   */
  private gameLoop = (): void => {
    if (this.state !== GameState.PLAYING) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;

    // Handle input
    this.handleInput();

    // Update game systems
    this.update(deltaTime);

    // Render
    this.gameScene.render();

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * Handle player input
   */
  private handleInput(): void {
    const input = this.inputManager.getInputState();
    const player = this.gameScene.getPlayer();

    // Lane switching
    if (input.left) {
      if (player.moveLeft()) {
        this.audioManager.playSFX('jump'); // Reuse jump sound for lane switch
      }
      this.inputManager.reset();
    } else if (input.right) {
      if (player.moveRight()) {
        this.audioManager.playSFX('jump');
      }
      this.inputManager.reset();
    }

    // Jump
    if (input.jump) {
      if (player.jump()) {
        this.audioManager.playSFX('jump');
      }
      this.inputManager.reset();
    }

    // Slide
    if (input.slide) {
      if (player.slide()) {
        this.audioManager.playSFX('jump'); // Reuse sound
      }
      this.inputManager.reset();
    }

    // Pause
    if (input.pause) {
      this.pauseGame();
      this.inputManager.reset();
    }
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    // Update scene
    this.gameScene.update(deltaTime);

    // Update score system
    this.scoreSystem.update(deltaTime);

    // Update power-up system
    this.powerUpSystem.update(deltaTime);

    // Update game speed based on progress
    this.updateGameSpeed();

    // Update player invincibility from shield
    const player = this.gameScene.getPlayer();
    player.setInvincible(this.powerUpSystem.hasShield());

    // Auto-collect coins with magnet
    if (this.powerUpSystem.hasMagnet()) {
      // This would be implemented in scene to attract nearby coins
      // For now, magnet just makes collection radius larger
    }

    // Update score multiplier
    this.scoreSystem.setMultiplier(this.powerUpSystem.getScoreMultiplier());
  }

  /**
   * Update game speed based on distance
   */
  private updateGameSpeed(): void {
    const segmentsPassed = this.scoreSystem.getStat('segmentsPassed');
    const speedIncrements = Math.floor(segmentsPassed / GAME_CONFIG.SPEED_INCREMENT_INTERVAL);
    const newSpeed = Math.min(
      GAME_CONFIG.BASE_SPEED + speedIncrements * GAME_CONFIG.SPEED_INCREMENT,
      GAME_CONFIG.MAX_SPEED
    );

    this.scoreSystem.setSpeed(newSpeed);
    this.gameScene.setSpeed(newSpeed);
  }

  /**
   * Handle collision with obstacles or collectibles
   */
  private handleCollision(type: 'obstacle' | 'collectible', object: Obstacle | Collectible): void {
    if (type === 'obstacle') {
      const player = this.gameScene.getPlayer();

      if (!player.isInvincible()) {
        // Hit obstacle - take damage
        player.hit();
        this.healthSystem.takeDamage(1);
        this.audioManager.playSFX('hit');
        // Game over is now handled by healthSystem's 'death' event
      }
    } else if (type === 'collectible') {
      const collectible = object as Collectible;

      switch (collectible.getType()) {
        case CollectibleType.COIN:
          this.scoreSystem.collectCoin();
          this.audioManager.playSFX('coin');
          break;

        case CollectibleType.FISH:
          this.scoreSystem.collectFish();
          this.audioManager.playSFX('fish');
          break;

        case CollectibleType.POWERUP_MAGNET:
          this.powerUpSystem.activatePowerUp(PowerUpType.MAGNET);
          this.audioManager.playSFX('powerup');
          break;

        case CollectibleType.POWERUP_MULTIPLIER:
          this.powerUpSystem.activatePowerUp(PowerUpType.MULTIPLIER);
          this.audioManager.playSFX('powerup');
          break;

        case CollectibleType.POWERUP_SHIELD:
          this.powerUpSystem.activatePowerUp(PowerUpType.SHIELD);
          this.audioManager.playSFX('powerup');
          break;
      }
    }
  }

  /**
   * Handle power-up activation
   */
  private onPowerUpActivate(type: PowerUpType): void {
    const duration = this.powerUpSystem.getRemainingTime(type);
    this.uiManager.showPowerUp(type, duration);
  }

  /**
   * Handle power-up expiration
   */
  private onPowerUpExpire(type: PowerUpType): void {
    this.uiManager.hidePowerUp(type);
  }

  /**
   * Dispose of game resources
   */
  dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.gameScene.dispose();
    this.inputManager.dispose();
    this.audioManager.dispose();
  }
}
