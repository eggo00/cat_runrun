# 🐱 Cat Run Run

A cute low-poly 3D endless runner game built with Three.js, TypeScript, and Vite. Guide an adorable cat through an infinite procedurally-generated world, dodging obstacles and collecting coins!

![Game Preview](https://via.placeholder.com/800x400/667eea/ffffff?text=Cat+Run+Run)

## ✨ Features

- **🎮 Infinite Procedural Generation**: Dynamically generated levels that never repeat
- **🐈 Cute Low-Poly Cat**: Adorable protagonist with smooth animations
- **📱 Cross-Platform**: Works on desktop and mobile browsers with touch controls
- **🎯 Multiple Obstacles**: Jump, slide, and dodge your way through challenges
- **💰 Collectibles**: Gather coins and fish for high scores
- **⚡ Power-Ups**: Magnet, Score Multiplier, and Shield power-ups
- **🎵 Audio System**: Background music and sound effects
- **🏆 Scoring System**: Track your best scores with localStorage
- **🎨 Beautiful UI**: Clean, modern interface with smooth animations
- **⚙️ Performance Optimized**: Object pooling and efficient rendering

## 🎮 How to Play

### Desktop Controls
- **Arrow Keys** or **A/D**: Switch lanes (left/right)
- **Space** or **W/↑**: Jump
- **Shift** or **S/↓**: Slide
- **Esc** or **P**: Pause

### Mobile Controls
- **Swipe Left/Right**: Switch lanes
- **Swipe Up**: Jump
- **Swipe Down**: Slide

### Objective
- Avoid obstacles by jumping, sliding, or switching lanes
- Collect coins and fish to increase your score
- Grab power-ups for temporary advantages
- Survive as long as possible and beat your high score!

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or download the repository:**
```bash
cd cat_runrun
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
   - The game will automatically open at `http://localhost:3000`
   - Or manually navigate to the URL shown in your terminal

### Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory. You can preview it with:

```bash
npm run preview
```

## 📁 Project Structure

```
cat_runrun/
├── public/                  # Static assets
│   ├── models/             # 3D models (glTF/GLB)
│   ├── textures/           # Texture files
│   ├── sounds/             # Audio files
│   └── ASSETS_README.md    # Asset guide
├── src/
│   ├── entities/           # Game entities
│   │   ├── Player.ts       # Player (cat) controller
│   │   ├── Obstacle.ts     # Obstacle entities
│   │   └── Collectible.ts  # Collectible items
│   ├── scenes/
│   │   └── GameScene.ts    # Main game scene
│   ├── systems/            # Game systems
│   │   ├── InputManager.ts # Input handling
│   │   ├── ScoreSystem.ts  # Scoring logic
│   │   ├── PowerUpSystem.ts# Power-up management
│   │   ├── AudioManager.ts # Audio system
│   │   ├── CollisionSystem.ts # Collision detection
│   │   └── LevelGenerator.ts  # Procedural generation
│   ├── ui/
│   │   └── UIManager.ts    # UI management
│   ├── utils/
│   │   ├── Constants.ts    # Game configuration
│   │   └── ObjectPool.ts   # Object pooling
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   ├── Game.ts             # Main game class
│   └── main.ts             # Entry point
├── index.html              # HTML template
├── styles.css              # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Customization

### Game Configuration

Edit `src/utils/Constants.ts` to customize:
- Lane count and width
- Player physics (jump force, gravity)
- Game speed and difficulty
- Collectible values
- Power-up durations
- And much more!

Example:
```typescript
export const GAME_CONFIG = {
  LANE_COUNT: 3,           // Number of lanes
  BASE_SPEED: 15,          // Starting speed
  JUMP_FORCE: 12,          // Jump strength
  COIN_VALUE: 10,          // Points per coin
  // ... and many more settings
};
```

### Adding Custom Assets

The game currently uses procedurally-generated placeholder models. To add custom 3D models:

1. Export your models as glTF 2.0 (.glb) format
2. Place them in `public/models/`
3. The game will automatically load them instead of placeholders

See `public/ASSETS_README.md` for detailed asset guidelines.

### Styling

Modify `styles.css` to customize the UI appearance:
- Colors and gradients
- Button styles
- Menu layouts
- Font choices

## 🛠️ Technical Details

### Technologies Used
- **Three.js**: 3D graphics and rendering
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **CSS3**: Modern styling with gradients and animations

### Performance Optimizations
- **Object Pooling**: Reuses game objects to reduce garbage collection
- **Frustum Culling**: Only renders visible objects
- **Efficient Collision Detection**: Uses AABB and sphere collision
- **Dynamic Asset Loading**: Loads assets as needed
- **Optimized Rendering**: Minimizes draw calls

### Architecture Highlights
- **Entity-Component Pattern**: Clean separation of game objects
- **System-Based Design**: Modular, reusable systems
- **Event-Driven UI**: Decoupled UI from game logic
- **State Management**: Clear game state transitions

## 🎯 Game Mechanics

### Obstacles
- **Low Obstacles**: Jump over them
- **Middle Obstacles**: Slide under them
- **High Obstacles**: Switch lanes to avoid

### Collectibles
- **Coins**: 10 points each, builds combo
- **Fish**: 50 points, counts as 5 coins

### Power-Ups
- **🧲 Magnet** (10s): Auto-collect nearby coins
- **✖️2 Multiplier** (15s): Double all points
- **🛡️ Shield** (8s): Temporary invincibility

### Difficulty Curve
- Game speed increases every 10 segments
- Obstacle density increases gradually
- Maximum speed caps at 40 units/second

## 🐛 Troubleshooting

### Game won't start
- Check browser console for errors
- Ensure all dependencies are installed: `npm install`
- Try clearing browser cache

### Audio not playing
- Check that audio settings are enabled in the UI
- Browsers may block autoplay - click the screen to enable
- Verify audio files are in `public/sounds/`

### Performance issues
- Reduce shadow quality in `src/utils/Constants.ts`
- Disable shadows: `ENABLE_SHADOWS: false`
- Lower the `MAX_POOL_SIZE` value

### Models not loading
- Verify models are in correct glTF 2.0 format
- Check file paths in browser console
- Ensure models are in `public/models/` directory

## 🔧 Development

### Running Tests
```bash
npm run lint
```

### Building
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

## 📝 Future Enhancements

Potential features to add:
- [ ] Multiple character skins (unlockable)
- [ ] Different environment themes
- [ ] Online leaderboard with backend
- [ ] More obstacle types and patterns
- [ ] Achievement system
- [ ] Daily challenges
- [ ] Mobile app version (React Native/Capacitor)
- [ ] Multiplayer race mode

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Three.js** - Amazing 3D library
- **Vite** - Lightning-fast build tool
- Free asset communities (Quaternius, Kenney, etc.)

## 📧 Contact

For questions or feedback, please open an issue on the repository.

---

**Made with ❤️ and TypeScript**

Enjoy playing Cat Run Run! 🐱✨
