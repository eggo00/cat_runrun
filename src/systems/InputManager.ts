import { InputState, TouchState } from '../types';

export class InputManager {
  private inputState: InputState = {
    left: false,
    right: false,
    jump: false,
    slide: false,
    pause: false,
  };

  private touchState: TouchState = {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    startTime: 0,
    isSwiping: false,
  };

  private readonly SWIPE_THRESHOLD = 50; // Minimum distance for a swipe
  private readonly SWIPE_MAX_TIME = 500; // Maximum time for a swipe (ms)

  private keydownHandler: (e: KeyboardEvent) => void;
  private keyupHandler: (e: KeyboardEvent) => void;
  private touchstartHandler: (e: TouchEvent) => void;
  private touchmoveHandler: (e: TouchEvent) => void;
  private touchendHandler: (e: TouchEvent) => void;

  private isGamePlaying: boolean = false;

  constructor() {
    this.keydownHandler = this.onKeyDown.bind(this);
    this.keyupHandler = this.onKeyUp.bind(this);
    this.touchstartHandler = this.onTouchStart.bind(this);
    this.touchmoveHandler = this.onTouchMove.bind(this);
    this.touchendHandler = this.onTouchEnd.bind(this);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);

    // Touch events
    window.addEventListener('touchstart', this.touchstartHandler, { passive: false });
    window.addEventListener('touchmove', this.touchmoveHandler, { passive: false });
    window.addEventListener('touchend', this.touchendHandler, { passive: false });
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.inputState.left = true;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.inputState.right = true;
        e.preventDefault();
        break;
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        this.inputState.jump = true;
        e.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'ArrowDown':
      case 'KeyS':
        this.inputState.slide = true;
        e.preventDefault();
        break;
      case 'Escape':
      case 'KeyP':
        this.inputState.pause = true;
        e.preventDefault();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.inputState.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.inputState.right = false;
        break;
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        this.inputState.jump = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'ArrowDown':
      case 'KeyS':
        this.inputState.slide = false;
        break;
      case 'Escape':
      case 'KeyP':
        this.inputState.pause = false;
        break;
    }
  }

  private onTouchStart(e: TouchEvent): void {
    // Only handle touch events when game is playing
    if (!this.isGamePlaying) return;

    e.preventDefault();
    const touch = e.touches[0];
    this.touchState.startX = touch.clientX;
    this.touchState.startY = touch.clientY;
    this.touchState.startTime = Date.now();
    this.touchState.isSwiping = true;
  }

  private onTouchMove(e: TouchEvent): void {
    // Only handle touch events when game is playing
    if (!this.isGamePlaying) return;

    e.preventDefault();
    if (!this.touchState.isSwiping) return;

    const touch = e.touches[0];
    this.touchState.endX = touch.clientX;
    this.touchState.endY = touch.clientY;
  }

  private onTouchEnd(e: TouchEvent): void {
    // Only handle touch events when game is playing
    if (!this.isGamePlaying) return;

    e.preventDefault();
    if (!this.touchState.isSwiping) return;

    const deltaX = this.touchState.endX - this.touchState.startX;
    const deltaY = this.touchState.endY - this.touchState.startY;
    const deltaTime = Date.now() - this.touchState.startTime;

    // Check if it's a valid swipe
    if (deltaTime < this.SWIPE_MAX_TIME) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > this.SWIPE_THRESHOLD || absDeltaY > this.SWIPE_THRESHOLD) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0) {
            this.triggerAction('right');
          } else {
            this.triggerAction('left');
          }
        } else {
          // Vertical swipe
          if (deltaY < 0) {
            this.triggerAction('jump');
          } else {
            this.triggerAction('slide');
          }
        }
      }
    }

    this.touchState.isSwiping = false;
  }

  private triggerAction(action: 'left' | 'right' | 'jump' | 'slide'): void {
    this.inputState[action] = true;
    // Auto-reset after a short delay to simulate button press
    setTimeout(() => {
      this.inputState[action] = false;
    }, 100);
  }

  /**
   * Get current input state
   */
  getInputState(): Readonly<InputState> {
    return this.inputState;
  }

  /**
   * Check if a specific input is active
   */
  isInputActive(input: keyof InputState): boolean {
    return this.inputState[input];
  }

  /**
   * Reset all input states
   */
  reset(): void {
    this.inputState = {
      left: false,
      right: false,
      jump: false,
      slide: false,
      pause: false,
    };
  }

  /**
   * Set whether the game is currently playing
   * This controls whether touch events should be intercepted
   */
  setGamePlaying(isPlaying: boolean): void {
    this.isGamePlaying = isPlaying;
  }

  /**
   * Clean up event listeners
   */
  dispose(): void {
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    window.removeEventListener('touchstart', this.touchstartHandler);
    window.removeEventListener('touchmove', this.touchmoveHandler);
    window.removeEventListener('touchend', this.touchendHandler);
  }
}
