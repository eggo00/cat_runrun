# Game Assets Guide

This directory contains all game assets including 3D models, textures, and sound effects.

## Directory Structure

```
public/
├── models/           # 3D models in glTF/GLB format
├── textures/         # PNG/JPG texture files
└── sounds/           # Audio files (WAV for SFX, MP3 for BGM)
```

## Required Assets

### 3D Models (models/)

The game currently uses placeholder geometry. To replace with custom models:

1. **cat.glb** - Main character (low-poly cat)
   - Recommended: 500-2000 polygons
   - Animations: idle, run, jump, slide, hit
   - Format: glTF 2.0 (.glb)
   - Export settings: Include animations, Y-up axis

2. **Obstacle Models:**
   - **barrel.glb** - Low obstacle (can jump over)
   - **crate.glb** - Middle obstacle (must slide under)
   - **hurdle.glb** - High obstacle (must avoid)
   - Recommended: 100-500 polygons each

3. **Collectible Models:**
   - **coin.glb** - Coin collectible
   - **fish.glb** - Fish collectible (high value)
   - **magnet.glb** - Magnet power-up
   - **multiplier.glb** - Score multiplier power-up
   - **shield.glb** - Shield power-up
   - Recommended: 50-300 polygons each

### Textures (textures/)

1. **ground.png** - Ground/road texture
   - Recommended: 512x512 or 1024x1024
   - Tileable pattern

2. **sky.png** - Sky texture (optional)
   - Can use gradient or skybox

### Sounds (sounds/)

1. **Sound Effects (WAV format):**
   - **jump.wav** - Jump/lane switch sound
   - **coin.wav** - Coin collection sound
   - **fish.wav** - Fish collection sound
   - **hit.wav** - Collision/game over sound
   - **powerup.wav** - Power-up activation sound

2. **Background Music (MP3 format):**
   - **bgm.mp3** - Looping background music
   - Recommended: 1-2 minutes loop
   - Upbeat, energetic tempo

## Creating Assets

### Blender Export Settings for glTF

1. Select your model in Blender
2. File > Export > glTF 2.0 (.glb)
3. Export settings:
   - Format: glTF Binary (.glb)
   - Include: Selected Objects
   - Transform: +Y Up
   - Geometry: Apply Modifiers
   - Animation: Include animations (if any)

### Optimizing Models

- Keep polygon count low (low-poly aesthetic)
- Use simple materials (PBR recommended)
- Bake textures when possible
- Combine meshes to reduce draw calls

### Creating Sound Effects

You can use free resources from:
- **Freesound.org** - Creative Commons sounds
- **OpenGameArt.org** - Game-specific assets
- **Kenney.nl** - Free game assets

Or create your own using:
- **Audacity** - Free audio editor
- **BFXR** - 8-bit sound effect generator
- **ChipTone** - Retro sound effects

## Temporary Placeholder System

The game currently generates placeholder geometry at runtime:
- **Cat**: Orange low-poly cat made from basic Three.js shapes
- **Obstacles**: Colored boxes and cylinders
- **Collectibles**: Golden coins, pink fish, colored power-ups

These will automatically be replaced when you add the corresponding `.glb` files to the `models/` directory.

## Asset Attribution

If using third-party assets, please maintain attribution:

```
# Example attribution.txt
cat.glb - Created by [Artist Name] - License: CC-BY-4.0
sounds/bgm.mp3- "Song Title" by [Composer] - License: CC0
```

## Quick Start: Free Asset Packs

For quick testing, download free low-poly asset packs:
- **Quaternius** (quaternius.com) - Free low-poly models
- **Kenney** (kenney.nl) - Free game assets
- **Poly Pizza** (poly.pizza) - Low-poly 3D models

## Need Help?

If you encounter issues loading assets:
1. Check browser console for error messages
2. Verify file paths match the constants in `src/utils/Constants.ts`
3. Ensure files are in the correct format (glTF 2.0 for models)
4. Test with a simple placeholder first
