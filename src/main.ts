import { Game } from './Game';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');

  if (!container) {
    console.error('Game container not found!');
    return;
  }

  // Create and start the game
  const game = new Game(container);

  // Handle page visibility (pause when tab is hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Game will handle pausing internally
      console.log('Page hidden');
    } else {
      console.log('Page visible');
    }
  });

  // Expose game instance for debugging (optional)
  (window as any).game = game;

  console.log('Cat Run Run initialized!');
});
