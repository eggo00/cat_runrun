// import { ASSET_PATHS } from '../utils/Constants'; // Temporarily disabled
import { AudioSettings } from '../types';

export class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private bgm: HTMLAudioElement | null = null;

  private settings: AudioSettings = {
    musicEnabled: true,
    musicVolume: 0.5,
    sfxEnabled: true,
    sfxVolume: 0.7,
  };

  private initialized: boolean = false;

  constructor() {
    this.loadSettings();
  }

  /**
   * Initialize and preload all audio files
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Temporary: Skip audio loading since audio files are not available yet
    // TODO: Add actual audio files to public/sounds/ folder
    console.log('Audio system initialized (silent mode - no audio files available)');
    this.initialized = true;
    return;

    /* Uncomment this when audio files are available:
    try {
      // Load background music
      this.bgm = await this.loadAudio(ASSET_PATHS.SOUNDS.BGM);
      this.bgm.loop = true;
      this.bgm.volume = this.settings.musicVolume;

      // Load sound effects
      await Promise.all([
        this.loadSound('jump', ASSET_PATHS.SOUNDS.JUMP),
        this.loadSound('coin', ASSET_PATHS.SOUNDS.COIN),
        this.loadSound('fish', ASSET_PATHS.SOUNDS.FISH),
        this.loadSound('hit', ASSET_PATHS.SOUNDS.HIT),
        this.loadSound('powerup', ASSET_PATHS.SOUNDS.POWERUP),
      ]);

      this.initialized = true;
      console.log('Audio system initialized');
    } catch (error) {
      console.warn('Some audio files failed to load, using silent fallback', error);
      this.initialized = true; // Continue anyway
    }
    */
  }

  /**
   * Load a single audio file
   */
  private async loadAudio(src: string): Promise<HTMLAudioElement> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load audio: ${src}`, e);
        resolve(audio); // Resolve anyway with a silent audio element
      });
      audio.src = src;
      audio.load();
    });
  }

  /**
   * Load and store a sound effect
   */
  // @ts-ignore - Temporarily disabled
  private async loadSound(name: string, src: string): Promise<void> {
    const audio = await this.loadAudio(src);
    audio.volume = this.settings.sfxVolume;
    this.sounds.set(name, audio);
  }

  /**
   * Play a sound effect
   */
  playSFX(name: string): void {
    if (!this.settings.sfxEnabled) return;

    const sound = this.sounds.get(name);
    if (sound) {
      // Clone the audio to allow overlapping sounds
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = this.settings.sfxVolume;
      clone.play().catch(e => console.warn('Failed to play sound:', name, e));
    }
  }

  /**
   * Play background music
   */
  playMusic(): void {
    if (!this.settings.musicEnabled || !this.bgm) return;

    this.bgm.currentTime = 0;
    this.bgm.play().catch(e => {
      console.warn('Failed to play music, waiting for user interaction', e);
      // Music autoplay is often blocked, will retry on user interaction
    });
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  /**
   * Pause background music
   */
  pauseMusic(): void {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  /**
   * Resume background music
   */
  resumeMusic(): void {
    if (this.settings.musicEnabled && this.bgm) {
      this.bgm.play().catch(e => console.warn('Failed to resume music', e));
    }
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.bgm) {
      this.bgm.volume = this.settings.musicVolume;
    }
    this.saveSettings();
  }

  /**
   * Set SFX volume
   */
  setSFXVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.settings.sfxVolume;
    });
    this.saveSettings();
  }

  /**
   * Toggle music on/off
   */
  toggleMusic(enabled?: boolean): void {
    this.settings.musicEnabled = enabled !== undefined ? enabled : !this.settings.musicEnabled;

    if (this.settings.musicEnabled) {
      this.playMusic();
    } else {
      this.stopMusic();
    }

    this.saveSettings();
  }

  /**
   * Toggle SFX on/off
   */
  toggleSFX(enabled?: boolean): void {
    this.settings.sfxEnabled = enabled !== undefined ? enabled : !this.settings.sfxEnabled;
    this.saveSettings();
  }

  /**
   * Get current audio settings
   */
  getSettings(): Readonly<AudioSettings> {
    return { ...this.settings };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem('cat-runrun-audio', JSON.stringify(this.settings));
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const stored = localStorage.getItem('cat-runrun-audio');
    if (stored) {
      try {
        this.settings = JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to load audio settings', e);
      }
    }
  }

  /**
   * Dispose of all audio resources
   */
  dispose(): void {
    this.stopMusic();
    this.sounds.clear();
    this.bgm = null;
  }
}
