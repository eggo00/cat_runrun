import { GameStats, PowerUpType, LeaderboardEntry, SkinData } from '../types';

export class UIManager {
  // Menu elements
  private mainMenu: HTMLElement;
  private tutorialMenu: HTMLElement;
  private shopMenu: HTMLElement;
  private leaderboardMenu: HTMLElement;
  private gameoverMenu: HTMLElement;
  private pauseMenu: HTMLElement;
  private loadingScreen: HTMLElement;

  // HUD elements
  private hud: HTMLElement;
  private hudScore: HTMLElement;
  private hudDistance: HTMLElement;
  private hudCoins: HTMLElement;

  // Power-up indicators
  private powerupMagnet: HTMLElement;
  private powerupMultiplier: HTMLElement;
  private powerupShield: HTMLElement;

  // Callbacks
  private callbacks: Map<string, Function> = new Map();

  constructor() {
    // Get menu elements
    this.mainMenu = this.getElement('main-menu');
    this.tutorialMenu = this.getElement('tutorial-menu');
    this.shopMenu = this.getElement('shop-menu');
    this.leaderboardMenu = this.getElement('leaderboard-menu');
    this.gameoverMenu = this.getElement('gameover-menu');
    this.pauseMenu = this.getElement('pause-menu');
    this.loadingScreen = this.getElement('loading-screen');

    // Get HUD elements
    this.hud = this.getElement('hud');
    this.hudScore = this.getElement('hud-score');
    this.hudDistance = this.getElement('hud-distance');
    this.hudCoins = this.getElement('hud-coins');

    // Get power-up indicators
    this.powerupMagnet = this.getElement('powerup-magnet');
    this.powerupMultiplier = this.getElement('powerup-multiplier');
    this.powerupShield = this.getElement('powerup-shield');

    this.setupEventListeners();
  }

  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`UI element not found: ${id}`);
    }
    return element;
  }

  /**
   * Add both click and touchstart handlers for better mobile support
   * Prevents double-firing by tracking which event fired first
   */
  private addClickHandler(elementId: string, handler: () => void): void {
    const element = this.getElement(elementId);
    let touchHandled = false;

    // Handle touch events (mobile)
    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchHandled = true;
      handler();

      // Reset flag after a short delay
      setTimeout(() => {
        touchHandled = false;
      }, 300);
    }, { passive: false });

    // Handle click events (desktop and mobile fallback)
    element.addEventListener('click', () => {
      if (!touchHandled) {
        handler();
      }
    });
  }

  private setupEventListeners(): void {
    // Main menu buttons - add both click and touchstart for better mobile support
    this.addClickHandler('btn-start', () => this.emit('startGame'));
    this.addClickHandler('btn-tutorial', () => this.showTutorial());
    this.addClickHandler('btn-leaderboard', () => this.showLeaderboard());
    this.addClickHandler('btn-shop', () => this.showShop());

    // Tutorial menu
    this.addClickHandler('btn-back-tutorial', () => this.showMainMenu());

    // Shop menu
    this.addClickHandler('btn-back-shop', () => this.showMainMenu());

    // Leaderboard menu
    this.addClickHandler('btn-back-leaderboard', () => this.showMainMenu());

    // Game over menu
    this.addClickHandler('btn-restart', () => this.emit('restart'));
    this.addClickHandler('btn-menu', () => {
      this.showMainMenu();
      this.emit('returnToMenu');
    });
    this.addClickHandler('btn-share', () => this.shareScore());

    // Pause menu
    this.addClickHandler('btn-resume', () => this.emit('resume'));
    this.addClickHandler('btn-quit', () => {
      this.showMainMenu();
      this.emit('quit');
    });

    // Audio controls
    const toggleMusic = this.getElement('toggle-music') as HTMLInputElement;
    const toggleSFX = this.getElement('toggle-sfx') as HTMLInputElement;

    toggleMusic.addEventListener('change', () => {
      this.emit('toggleMusic', toggleMusic.checked);
    });

    toggleSFX.addEventListener('change', () => {
      this.emit('toggleSFX', toggleSFX.checked);
    });
  }

  /**
   * Show main menu
   */
  showMainMenu(): void {
    this.hideAllMenus();
    this.mainMenu.classList.add('active');
    this.hud.classList.add('hidden');
  }

  /**
   * Show tutorial
   */
  showTutorial(): void {
    this.hideAllMenus();
    this.tutorialMenu.classList.add('active');
  }

  /**
   * Show shop
   */
  showShop(): void {
    this.hideAllMenus();
    this.shopMenu.classList.add('active');
    this.populateShop();
  }

  /**
   * Show leaderboard
   */
  showLeaderboard(): void {
    this.hideAllMenus();
    this.leaderboardMenu.classList.add('active');
    this.populateLeaderboard();
  }

  /**
   * Show game over screen
   */
  showGameOver(stats: GameStats, highScore: number): void {
    this.hideAllMenus();
    this.hud.classList.add('hidden');
    this.gameoverMenu.classList.add('active');

    // Update game over stats
    this.getElement('final-score').textContent = stats.score.toString();
    this.getElement('final-distance').textContent = Math.floor(stats.distance) + 'm';
    this.getElement('final-coins').textContent = stats.coins.toString();
    this.getElement('best-score').textContent = highScore.toString();
  }

  /**
   * Show pause menu
   */
  showPauseMenu(): void {
    this.pauseMenu.classList.add('active');
  }

  /**
   * Hide pause menu
   */
  hidePauseMenu(): void {
    this.pauseMenu.classList.remove('active');
  }

  /**
   * Show HUD (in-game UI)
   */
  showHUD(): void {
    this.hideAllMenus();
    this.hud.classList.remove('hidden');
  }

  /**
   * Hide all menus
   */
  private hideAllMenus(): void {
    [
      this.mainMenu,
      this.tutorialMenu,
      this.shopMenu,
      this.leaderboardMenu,
      this.gameoverMenu,
      this.pauseMenu,
    ].forEach(menu => menu.classList.remove('active'));
  }

  /**
   * Update HUD score
   */
  updateScore(score: number): void {
    this.hudScore.textContent = score.toString();
  }

  /**
   * Update HUD distance
   */
  updateDistance(distance: number): void {
    this.hudDistance.textContent = Math.floor(distance) + 'm';
  }

  /**
   * Update HUD coins
   */
  updateCoins(coins: number): void {
    this.hudCoins.textContent = coins.toString();
  }

  /**
   * Show power-up indicator
   */
  showPowerUp(type: PowerUpType, duration: number): void {
    let element: HTMLElement;
    switch (type) {
      case PowerUpType.MAGNET:
        element = this.powerupMagnet;
        break;
      case PowerUpType.MULTIPLIER:
        element = this.powerupMultiplier;
        break;
      case PowerUpType.SHIELD:
        element = this.powerupShield;
        break;
    }

    element.classList.remove('hidden');
    this.updatePowerUpTimer(type, duration);
  }

  /**
   * Hide power-up indicator
   */
  hidePowerUp(type: PowerUpType): void {
    let element: HTMLElement;
    switch (type) {
      case PowerUpType.MAGNET:
        element = this.powerupMagnet;
        break;
      case PowerUpType.MULTIPLIER:
        element = this.powerupMultiplier;
        break;
      case PowerUpType.SHIELD:
        element = this.powerupShield;
        break;
    }

    element.classList.add('hidden');
  }

  /**
   * Update power-up timer
   */
  updatePowerUpTimer(type: PowerUpType, remainingTime: number): void {
    let element: HTMLElement;
    switch (type) {
      case PowerUpType.MAGNET:
        element = this.powerupMagnet;
        break;
      case PowerUpType.MULTIPLIER:
        element = this.powerupMultiplier;
        break;
      case PowerUpType.SHIELD:
        element = this.powerupShield;
        break;
    }

    const timerElement = element.querySelector('.powerup-timer');
    if (timerElement) {
      timerElement.textContent = Math.ceil(remainingTime) + 's';
    }
  }

  /**
   * Update loading progress
   */
  updateLoadingProgress(progress: number, text?: string): void {
    const progressBar = this.getElement('loading-progress');
    progressBar.style.width = `${progress * 100}%`;

    if (text) {
      this.getElement('loading-text').textContent = text;
    }
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen(): void {
    this.loadingScreen.classList.add('hidden');
  }

  /**
   * Populate shop with skins
   */
  private populateShop(): void {
    const skinsList = this.getElement('skins-list');
    skinsList.innerHTML = '';

    // Mock skins data - would come from game data in real implementation
    const skins: SkinData[] = [
      { id: 'orange', name: 'Orange Cat', price: 0, unlocked: true, color: 0xffa500 },
      { id: 'white', name: 'White Cat', price: 100, unlocked: false, color: 0xffffff },
      { id: 'black', name: 'Black Cat', price: 200, unlocked: false, color: 0x000000 },
      { id: 'tabby', name: 'Tabby Cat', price: 300, unlocked: false, color: 0x8b4513 },
      { id: 'calico', name: 'Calico Cat', price: 500, unlocked: false, color: 0xff6347 },
      { id: 'siamese', name: 'Siamese Cat', price: 750, unlocked: false, color: 0xf5deb3 },
    ];

    skins.forEach(skin => {
      const skinElement = document.createElement('div');
      skinElement.className = 'skin-item';
      if (!skin.unlocked) skinElement.classList.add('locked');

      skinElement.innerHTML = `
        <div class="skin-preview" style="background-color: #${skin.color?.toString(16).padStart(6, '0')}"></div>
        <div class="skin-name">${skin.name}</div>
        <div class="skin-price">${skin.unlocked ? 'Owned' : skin.price + ' coins'}</div>
      `;

      skinElement.addEventListener('click', () => {
        if (skin.unlocked) {
          this.emit('selectSkin', skin.id);
        }
      });

      skinsList.appendChild(skinElement);
    });
  }

  /**
   * Populate leaderboard
   */
  private populateLeaderboard(): void {
    const leaderboardList = this.getElement('leaderboard-list');
    leaderboardList.innerHTML = '';

    // Mock leaderboard data - would come from server in real implementation
    const entries: LeaderboardEntry[] = [
      { rank: 1, playerName: 'Player 1', score: 5000, distance: 500, date: '2025-12-08' },
      { rank: 2, playerName: 'Player 2', score: 4500, distance: 450, date: '2025-12-07' },
      { rank: 3, playerName: 'Player 3', score: 4000, distance: 400, date: '2025-12-06' },
      { rank: 4, playerName: 'Player 4', score: 3500, distance: 350, date: '2025-12-05' },
      { rank: 5, playerName: 'Player 5', score: 3000, distance: 300, date: '2025-12-04' },
    ];

    entries.forEach(entry => {
      const entryElement = document.createElement('div');
      entryElement.className = 'leaderboard-item';
      if (entry.rank <= 3) entryElement.classList.add('top-3');

      entryElement.innerHTML = `
        <div class="leaderboard-rank">#${entry.rank}</div>
        <div class="leaderboard-player">${entry.playerName}</div>
        <div class="leaderboard-score">${entry.score}</div>
      `;

      leaderboardList.appendChild(entryElement);
    });
  }

  /**
   * Share score using Web Share API
   */
  private async shareScore(): Promise<void> {
    const score = this.getElement('final-score').textContent;
    const distance = this.getElement('final-distance').textContent;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cat Run Run',
          text: `I scored ${score} points and ran ${distance} in Cat Run Run!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      // Fallback - copy to clipboard
      const text = `I scored ${score} points and ran ${distance} in Cat Run Run!`;
      navigator.clipboard.writeText(text).then(() => {
        alert('Score copied to clipboard!');
      });
    }
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
